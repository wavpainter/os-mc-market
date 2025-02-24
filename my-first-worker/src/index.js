/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

let clearCache = false;

export default {
	async fetch(request, env, ctx) {
		const cache = caches.default;

		const cacheKey = new Request(request.url,request);

		if(clearCache) {
			await cache.delete(cacheKey);
			return new Response("Cleared cache");
		}else {
			let response = await cache.match(cacheKey,request);

			if (!response) {
				response = new Response(Math.random());
	
				response.headers.set('Cache-Control','s-maxage=5');
	
				ctx.waitUntil(cache.put(cacheKey,response.clone()));
			}
			return response;
		}

	},
};
