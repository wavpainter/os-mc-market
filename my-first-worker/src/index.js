/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

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

let routeHandlers = {
	'/market_data': async (request,env,ctx) => {
		try {
			let response = await fetch("https://micro.os-mc.net/market/mall_shops", {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				}
			});
			const mallData = await response.json();
			const mallShops = mallData['shops'];

			response = await fetch("https://storage.googleapis.com/os-mc-market/locations.json");
			const locations = await response.json();

			response = await fetch("https://storage.googleapis.com/os-mc-market/items.json");
			const items = await response.json();

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

				let item_name = items_nameLookup[mallShop['materialID']];

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
						"location": location,
						"stock": mallShop['availableStock']
					})
				})
			}

			marketData["orders"] = orders;

			return new Response(JSON.stringify(marketData));
		}catch(err) {
			console.log(err);
			return new Response(null,{ status: 500})
		}
	}
};

let cacheControls = {
	'/market_data': 'public, max-age=300'
}

export default {
	async fetch(request, env, ctx) {
		let response

		if(request.method === "OPTIONS") {
			response = handleOptions(request);
		}else {
			const cache = caches.default;

			const requestUrl = new URL(request.url);
			const cacheKey = new Request(request.url,request);
	
			response = await cache.match(cacheKey,request);
	
			if (!response) {
				let handler = routeHandlers[requestUrl.pathname];
				if (handler != undefined) {
					response = await handler(request,env,ctx);
					let cacheControl = cacheControls[requestUrl.pathname];
					if(cacheControl != undefined) {
						response.headers.set('Cache-Control',cacheControl);
					}
					response.headers.set("Access-Control-Allow-Origin", "*");
					response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
	
					ctx.waitUntil(cache.put(cacheKey,response.clone()));
				} else {
					response = new Response(null,{status:404});
					response.headers.set("Access-Control-Allow-Origin", "*");
					response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
				}
				console.log("Generated");
			} else {
				console.log("Served from cache");
			}


		}


		return response;
	},
};
