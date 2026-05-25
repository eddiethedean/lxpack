import { defineConfig } from "vitest/config";
import { coverageConfig } from "../../vitest.shared.ts";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    coverage: {
      ...coverageConfig,
      thresholds: {
        lines: 97,
        functions: 100,
        branches: 92,
        statements: 97,
      },
    },
  },
});
