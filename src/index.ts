/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
export interface Env {
	practica6: D1Database;
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const data = await this.queryDatabase(env.practica6)
		return Response.json({ message: "Hello World", dbData: data});
	},

	async queryDatabase(db: D1Database) {
		const { results } = await db.prepare("SELECT * FROM users").all();
		return results;
	}
} satisfies ExportedHandler<Env>;
