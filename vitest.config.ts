import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.test.ts"],
    coverage: {
      // Enforced floors, set just under the current measured coverage so any
      // regression fails CI. Statement coverage is dominated by untested React
      // pages; domain logic in src/lib sits far above these floors. Raise the
      // floors as component/E2E coverage lands — never lower them.
      thresholds: {
        statements: 40,
        branches: 75,
        functions: 80,
        lines: 40,
      },
    },
  },
});
