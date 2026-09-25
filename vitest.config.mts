import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [
		cloudflareTest({
			wrangler: { configPath: "./wrangler.jsonc" },
		}),
	],
	test: {
		coverage: {
			// V8 coverage isn't available inside workerd, so the Workers pool needs istanbul.
			provider: "istanbul",
			include: ["src/**/*.ts"],
			// json-summary and json feed the coverage report in the GitHub Actions job summary.
			reporter: ["text", "html", "json-summary", "json"],
			reportOnFailure: true,
		},
	},
});
