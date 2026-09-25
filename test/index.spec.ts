import { env, createExecutionContext, waitOnExecutionContext, SELF } from "cloudflare:test";
import { describe, it, expect, beforeEach } from "vitest";
import worker from "../src/index";

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

function postUser(body: unknown) {
	return SELF.fetch("https://example.com/api/users", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: typeof body === "string" ? body : JSON.stringify(body),
	});
}

beforeEach(async () => {
	await env.practica6.exec(
		"CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE)",
	);
	await env.practica6.exec("DELETE FROM users");
});

describe("GET /api/users", () => {
	it("responds with message and db data (unit style)", async () => {
		const request = new IncomingRequest("http://example.com/api/users");
		// Create an empty context to pass to `worker.fetch()`.
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		// Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
		await waitOnExecutionContext(ctx);
		expect(await response.json()).toEqual({ message: "Hello World", dbData: [] });
	});

	it("lists inserted users (integration style)", async () => {
		await postUser({ name: "Ian", email: "ian@example.com" });
		const response = await SELF.fetch("https://example.com/api/users");
		const body = await response.json<{ dbData: unknown[] }>();
		expect(body.dbData).toEqual([{ id: expect.any(Number), name: "Ian", email: "ian@example.com" }]);
	});
});

describe("POST /api/users", () => {
	it("inserts a valid user, normalizing name and email", async () => {
		const response = await postUser({ name: "  Ian Rodríguez ", email: " Ian@Example.COM " });
		expect(response.status).toBe(201);
		expect(await response.json()).toEqual({
			message: "User created",
			user: { id: expect.any(Number), name: "Ian Rodríguez", email: "ian@example.com" },
		});

		const row = await env.practica6.prepare("SELECT name, email FROM users").first();
		expect(row).toEqual({ name: "Ian Rodríguez", email: "ian@example.com" });
	});

	it("rejects an invalid email and does not insert", async () => {
		const response = await postUser({ name: "Ian", email: "not-an-email" });
		expect(response.status).toBe(400);
		const body = await response.json<{ error: string; details: string[] }>();
		expect(body.error).toBe("Validation failed");
		expect(body.details).toHaveLength(1);

		const { results } = await env.practica6.prepare("SELECT * FROM users").all();
		expect(results).toHaveLength(0);
	});

	it("rejects an invalid name and does not insert", async () => {
		const response = await postUser({ name: "1", email: "ian@example.com" });
		expect(response.status).toBe(400);
		const { results } = await env.practica6.prepare("SELECT * FROM users").all();
		expect(results).toHaveLength(0);
	});

	it("rejects missing fields", async () => {
		const response = await postUser({});
		expect(response.status).toBe(400);
		const body = await response.json<{ details: string[] }>();
		expect(body.details).toHaveLength(2);
	});

	it("rejects malformed JSON", async () => {
		const response = await postUser("{not json");
		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: "Request body must be valid JSON" });
	});

	it("rejects a non-object JSON body", async () => {
		const response = await postUser(null);
		expect(response.status).toBe(400);
	});

	it("returns 409 when the email is already registered (case-insensitive)", async () => {
		await postUser({ name: "Ian", email: "ian@example.com" });
		const response = await postUser({ name: "Other", email: "IAN@example.com" });
		expect(response.status).toBe(409);
		const { results } = await env.practica6.prepare("SELECT * FROM users").all();
		expect(results).toHaveLength(1);
	});
});

describe("DELETE /api/users/:id", () => {
	it("deletes an existing user and returns it", async () => {
		const created = await postUser({ name: "Ian", email: "ian@example.com" });
		const { user } = await created.json<{ user: { id: number } }>();

		const response = await SELF.fetch(`https://example.com/api/users/${user.id}`, { method: "DELETE" });
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			message: "User deleted",
			user: { id: user.id, name: "Ian", email: "ian@example.com" },
		});

		const { results } = await env.practica6.prepare("SELECT * FROM users").all();
		expect(results).toHaveLength(0);
	});

	it("only deletes the requested user", async () => {
		const created = await postUser({ name: "Ian", email: "ian@example.com" });
		await postUser({ name: "Ana", email: "ana@example.com" });
		const { user } = await created.json<{ user: { id: number } }>();

		await SELF.fetch(`https://example.com/api/users/${user.id}`, { method: "DELETE" });

		const { results } = await env.practica6.prepare("SELECT email FROM users").all();
		expect(results).toEqual([{ email: "ana@example.com" }]);
	});

	it("returns 404 when the user does not exist", async () => {
		const response = await SELF.fetch("https://example.com/api/users/999999", { method: "DELETE" });
		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({ error: "User not found" });
	});

	it.each(["abc", "0", "-1", "1.5", "1e3"])("returns 400 for invalid id %s", async (id) => {
		const response = await SELF.fetch(`https://example.com/api/users/${id}`, { method: "DELETE" });
		expect(response.status).toBe(400);
	});

	it("returns 405 for other methods on a user id", async () => {
		const response = await SELF.fetch("https://example.com/api/users/1");
		expect(response.status).toBe(405);
		expect(response.headers.get("Allow")).toBe("DELETE");
	});
});

describe("other routes", () => {
	it("returns 404 for unknown API paths", async () => {
		const response = await SELF.fetch("https://example.com/api/unknown");
		expect(response.status).toBe(404);
	});
});

describe("other methods", () => {
	it("returns 405 for unsupported methods", async () => {
		const response = await SELF.fetch("https://example.com/api/users", { method: "DELETE" });
		expect(response.status).toBe(405);
		expect(response.headers.get("Allow")).toBe("GET, POST");
	});
});
