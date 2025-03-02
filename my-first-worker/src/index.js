/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import deltas from "./deltas";

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
	"Access-Control-Max-Age": "86400",
};

function handleOptions (request) {
	// Make sure the necessary headers are present
	// for this to be a valid pre-flight request
	let headers = request.headers
	if (
			headers.get("Origin") !== null &&
			headers.get("Access-Control-Request-Method") !== null &&
			headers.get("Access-Control-Request-Headers") !== null
	) {
			// Handle CORS pre-flight request.
			// If you want to check or reject the requested method + headers
			// you can do that here.
			let respHeaders = {
					...corsHeaders,
					// Allow all future content Request headers to go back to browser
					// such as Authorization (Bearer) or X-Client-Name-Version
					"Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers"),
			}
			return new Response(null, {
					headers: respHeaders,
			})
	}
	else {
			// Handle standard OPTIONS request.
			// If you want to allow other HTTP Methods, you can do that here.
			return new Response(null, {
					headers: {
							Allow: "GET, HEAD, POST, OPTIONS",
					},
			})
	}
}

// Get the location the item is being sold e.g. ['Mall',"Foo's Store"]
function find_location(x,y,z,locations) {
	let location_arr = [];
	for (const location_name in locations) {
		let location = locations[location_name];
		let in_bounds = false;
		for(const bound_name in location["bounds"]) {
			let bound = location["bounds"][bound_name];
			let lower = bound[0];
			let upper = bound[1];
			if(x >= lower[0] && x <= upper[0] &&
				y >= lower[1] && y <= upper[1] &&
				z >= lower[2] && z <= upper[2]
			) {
				in_bounds = true;
				break;
			}
		}
		if(in_bounds) {
			location_arr.push(location_name);
			let sublocations = location["sublocations"];
			if(sublocations != undefined) {
				let sublocation_arr = find_location(x,y,z,sublocations);
				location_arr.push(...sublocation_arr);
			}
		}
	}

	return location_arr;
}

function mapValues(data) {
	const values = data
		.map((row) => {
		return (
			"(" +
			Object.values(row)
			.map((val) => {
				if (val === null || val === "") {
				return "NULL";
				}
				return `'${String(val).replace(/'/g, "").replace(/"/g, "'")}'`;
			})
			.join(",") +
			")"
		);
		})
		.join(",");
	return values;
}

async function handleCron(event,env,ctx) {
	let qres;

	try{
		// Get mall data
		let response = await fetch("https://micro.os-mc.net/market/mall_shops", {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			}
		});
		const mallData = await response.json();

		// New data
		let newTimestamp = mallData['lastModified'];

		// Push market data to bucket
		let marketData = await mallToMarketData(env.BUCKET,mallData);
		env.BUCKET.put("market_data.json",JSON.stringify(marketData));

		// Create shops that don't exist already
		let mappedShops = marketData['orders'].map(order => {
			return [order['player_name'],order['x'],order['y'],order['z'],order['order_type'],order['itemID']];
		})
		if(mappedShops.length > 0) {
			qres = await env.DB.prepare(
				"INSERT OR IGNORE INTO shop (player,x,y,z,order_type,item_id) VALUES " + mapValues(mappedShops)
			)
			.all();
		}

		// Get all shops
		qres = await env.DB.prepare(
			`SELECT s.*, ss.timestamp,ss.prev_timestamp,ss.quantity,ss.price,ss.stock
			FROM shop s
			LEFT JOIN
				(SELECT A.* 
				FROM shop_stock A 
				INNER JOIN 
					(SELECT shop_id, MAX(timestamp) AS timestamp 
					FROM shop_stock 
					GROUP BY shop_id) B 
				ON A.shop_id = B.shop_id AND A.timestamp = B.timestamp) ss
			ON s.id = ss.shop_id`
		)
		.all();
		let allShops = qres.results;

		let shopIdLookup = {};
		allShops.forEach(shop => {
			shopIdLookup[shop.id] = {
				playerName: shop.player,
				x: shop.x,
				y: shop.x,
				z: shop.z,
				orderType: shop.order_type,
				itemId: shop.item_id
			}
		});

		let uniqueShopLookup = {};
		allShops.forEach(shop => {
			let key = `${shop.player}:${shop.x}:${shop.y}:${shop.z}:${shop.order_type}:${shop.item_id}`;
			uniqueShopLookup[key] = shop;
		})

		// Add orders for shops
		let mappedOrders = []
		for(let i = 0; i < marketData['orders'].length; i++) {
			let order = marketData['orders'][i];
			let key = `${order.player_name}:${order.x}:${order.y}:${order.z}:${order.order_type}:${order.itemID}`;

			let dbShop = uniqueShopLookup[key];
			if(dbShop == undefined) continue;

			let dbShopTimestamp = dbShop.timestamp;

			if(new Date(dbShopTimestamp).getTime() == new Date(newTimestamp).getTime()) continue; // Stock has already been recorded

			mappedOrders.push([dbShop.id,newTimestamp,dbShopTimestamp,order.quantity,order.price,order.stock]);
		}

		if(mappedOrders.length > 0) {
			qres = await env.DB.prepare(
				"INSERT INTO shop_stock (shop_id,timestamp,prev_timestamp,quantity,price,stock) VALUES " + mapValues(mappedOrders)
			)
			.all();
		}

		qres = await env.DB.prepare(
			"SELECT MIN(timestamp) AS min_timestamp FROM shop_stock"
		)
		.all();
		
		let minTimestamp = qres.results[0].min_timestamp;
		if(minTimestamp == null) return;

		let timestamp7d = new Date(new Date().getTime() - (7 * 24 * 60 * 60 * 1000)).toISOString();

		qres = await env.DB.prepare(
			`SELECT A.shop_id, A.timestamp, A.quantity, A.price, A.stock,B.shop_id AS prev_shop_id, B.quantity AS prev_quantity, B.price AS prev_price, B.stock AS prev_stock
		FROM shop_stock A 
		LEFT JOIN shop_stock B
		ON (A.shop_id,A.prev_timestamp) = (B.shop_id,B.timestamp)
		WHERE datetime(A.timestamp) > datetime(?) AND datetime(A.timestamp) <> datetime(?)`
		)
		.bind(timestamp7d,minTimestamp)
		.all();

		let logs = await deltas.getCronDeltas(qres.results,shopIdLookup);

		await env.BUCKET.put("recent.json",JSON.stringify(logs));

		console.log("Finished handling cron");
	} catch (e) {
		console.error("Error handling cron: ",e)
	}
}

let superTypeItems = new Set(['6','17','18','35','44','263','351']);
async function mallToMarketData(bucket,mallData) {
	const mallShops = mallData['shops'];
	let res;

	res = await bucket.get("locations.json");
	const locations = await res.json();

	res = await bucket.get("items.json");
	const items = await res.json();

	const items_nameLookup = {};
	Object.keys(items).forEach(item_name => {
		items_nameLookup[items[item_name]['id']] = item_name;
	})

	let marketData = {
		"timestamp": mallData['lastModified']
	}

	let signIndex = new Set();

	let orders = [];
	for(let i = 0; i < mallShops.length; i++) {
		let mallShop = mallShops[i];

		let loc = mallShop["location"];
		let location = find_location(loc['x'],loc['y'],loc['z'],locations);

		let order_types_isbuy = []
		if(mallShop['canBuy']) order_types_isbuy.push(true);
		if(mallShop['canSell']) order_types_isbuy.push(false);

		let itemId = `${mallShop['materialID']}`;
		if(superTypeItems.has(itemId)) {
			itemId = itemId + ':' + mallShop['durability'];
		}

		let item_name = items_nameLookup[itemId];

		let signKey = mallShop['owner'] + ":" + item_name + ":" + loc['x'] + ":" + loc['y'] + ":" + loc['z'];
		if(signIndex.has(signKey)) {
			continue;
		}

		signIndex.add(signKey);

		order_types_isbuy.forEach(order_type_isbuy => {
			let price = order_type_isbuy ? mallShop['buyPrice'] : mallShop['sellPrice'];
			orders.push({
				"x": loc['x'],
				"y": loc['y'],
				"z": loc['z'],
				"player_name": mallShop['owner'],
				"quantity": mallShop['unit'],
				"order_type": order_type_isbuy ? 'Sell' : 'Buy',
				"price": price,
				"unit_price": price / mallShop['unit'],
				"item": item_name != undefined ? item_name : "undef",
				"itemID": itemId,
				"location": location,
				"stock": mallShop['availableStock']
			})
		})
	}

	marketData["orders"] = orders;

	return marketData;
}


export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		const key = url.pathname.slice(1);
		const cache = caches.default;
		let response;
	
		switch (request.method) {
			case "OPTIONS":
				response = handleOptions(request);
				break;
			case "GET":
				response = await cache.match(request);
				if(!response) {
					const object = await env.BUCKET.get(key);
		
					if (object === null) {
					  return new Response("Object Not Found", { status: 404 });
					}
			
					const headers = new Headers();
					object.writeHttpMetadata(headers);
					headers.set("etag", object.httpEtag);
			
					response = new Response(object.body, {
					  headers,
					});
					response.headers.set('cache-control','public, max-age=60');
					response.headers.set("Access-Control-Allow-Origin", "*");
					response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

					ctx.waitUntil(cache.put(request,response.clone()));
				}else {
					response = new Response(response.body,response);
					response.headers.set('cache-control','public, max-age=60');
					response.headers.set("Access-Control-Allow-Origin", "*");
					response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
				}
				break;
			default:
				response = new Response("Method Not Allowed", {
					status: 405,
					headers: {
					Allow: "GET",
					},
				});
				break;
		}
		
		return response;
	},
	async scheduled(event, env, ctx) {
		ctx.waitUntil(handleCron(event,env,ctx));
	}
};
