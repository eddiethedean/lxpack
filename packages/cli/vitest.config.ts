import { defineConfig } from "vitest/config";
import { coverageConfig } from "../../vitest.shared.ts";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    testTimeout: 30_000,
    coverage: {
      ...coverageConfig,
      thresholds: {
        lines: 98,
        functions: 100,
        branches: 94,
        statements: 98,
      },
    },
  },
});
