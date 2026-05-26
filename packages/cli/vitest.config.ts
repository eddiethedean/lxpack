import { defineConfig } from "vitest/config";
import { coverageConfig } from "../../vitest.shared.ts";

export default defineConfig({
  // Use projects instead of deprecated environmentMatchGlobs.
  test: {
    coverage: {
      ...coverageConfig,
      thresholds: {
        lines: 98,
        functions: 100,
        branches: 93,
        statements: 98,
      },
    },
    projects: [
      {
        test: {
          name: "node",
          include: ["src/**/*.test.ts"],
          exclude: ["src/examples.walkthrough.test.ts"],
          setupFiles: ["./test/setup-dom.ts"],
          testTimeout: 60_000,
        },
      },
      {
        test: {
          name: "happy-dom",
          include: ["src/examples.walkthrough.test.ts"],
          environment: "happy-dom",
          setupFiles: ["./test/setup-dom.ts"],
          testTimeout: 60_000,
        },
      },
    ],
  },
});
