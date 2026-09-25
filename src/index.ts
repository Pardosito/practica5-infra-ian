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
import { validateUser } from "./validator";

export interface Env {
	practica6: D1Database;
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const { pathname } = new URL(request.url);
		if (pathname !== "/api/users") {
			return Response.json({ error: "Not found" }, { status: 404 });
		}
		if (request.method === "POST") {
			return this.createUser(request, env.practica6);
		}
		if (request.method !== "GET") {
			return Response.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "GET, POST" } });
		}
		const data = await this.queryDatabase(env.practica6);
		return Response.json({ message: "Hello World", dbData: data });
	},

	async queryDatabase(db: D1Database) {
		const { results } = await db.prepare("SELECT * FROM users").all();
		return results;
	},

	async createUser(request: Request, db: D1Database): Promise<Response> {
		let body: { name?: unknown; email?: unknown };
		try {
			body = await request.json<{ name?: unknown; email?: unknown }>();
		} catch {
			return Response.json({ error: "Request body must be valid JSON" }, { status: 400 });
		}
		if (typeof body !== "object" || body === null) {
			return Response.json({ error: "Request body must be a JSON object" }, { status: 400 });
		}

		const { valid, errors } = validateUser(body.name, body.email);
		if (!valid) {
			return Response.json({ error: "Validation failed", details: errors }, { status: 400 });
		}

		const name = (body.name as string).trim();
		const email = (body.email as string).trim().toLowerCase();
		try {
			const user = await db
				.prepare("INSERT INTO users (name, email) VALUES (?, ?) RETURNING *")
				.bind(name, email)
				.first();
			return Response.json({ message: "User created", user }, { status: 201 });
		} catch (err) {
			if (err instanceof Error && err.message.includes("UNIQUE constraint failed")) {
				return Response.json({ error: "Email already registered" }, { status: 409 });
			}
			throw err;
		}
	},
} satisfies ExportedHandler<Env> & {
	queryDatabase(db: D1Database): Promise<unknown[]>;
	createUser(request: Request, db: D1Database): Promise<Response>;
};
