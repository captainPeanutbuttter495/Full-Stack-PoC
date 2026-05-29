import { defineConfig } from "vitest/config";

export default defineConfig({
  // Resolve the `@/*` alias from tsconfig.json natively (Vite 7 / Vitest 4),
  // so test imports line up with app imports.
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    // API route handlers run in Node — no jsdom needed.
    environment: "node",
    // Only pick up Vitest API tests. The Playwright specs in `e2e/`
    // import `@playwright/test` and must NOT be run by Vitest.
    include: ["tests/**/*.test.ts"],
    exclude: ["e2e/**", "node_modules/**", "lib/generated/**"],
  },
});
