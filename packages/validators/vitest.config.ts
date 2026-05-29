import { defineConfig } from "vitest/config";
import { coverageConfig } from "../../vitest.shared.ts";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    coverage: {
      ...coverageConfig,
      thresholds: {
        lines: 89,
        functions: 88,
        branches: 90,
        statements: 89,
      },
    },
  },
});
