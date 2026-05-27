import { defineConfig } from "vitest/config";
import { coverageConfig } from "../../vitest.shared.ts";

export default defineConfig({
  test: {
    environment: "happy-dom",
    setupFiles: ["./test/setup.ts"],
    include: ["src/**/*.test.ts"],
    testTimeout: 30_000,
    coverage: {
      ...coverageConfig,
      thresholds: {
        lines: 94,
        functions: 91,
        branches: 92.5,
        statements: 94,
      },
    },
  },
});
