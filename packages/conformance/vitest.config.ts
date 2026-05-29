import { defineConfig } from "vitest/config";
import { coverageConfig } from "../../vitest.shared.ts";

export default defineConfig({
  test: {
    testTimeout: 120_000,
    coverage: {
      ...coverageConfig,
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 45,
        statements: 80,
      },
    },
  },
});
