import { defineConfig } from "vitest/config";
import { coverageConfig } from "../../vitest.shared.ts";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    testTimeout: 30_000,
    coverage: {
      ...coverageConfig,
      thresholds: {
        ...coverageConfig.thresholds,
        lines: 99,
        statements: 99,
        branches: 97,
      },
    },
  },
});
