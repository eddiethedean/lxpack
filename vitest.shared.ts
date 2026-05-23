import { defineConfig } from "vitest/config";

export const coverageConfig = {
  provider: "v8" as const,
  reporter: ["text", "json-summary", "html"],
  include: ["src/**/*.ts"],
  exclude: [
    "src/**/*.test.ts",
    "src/types.ts",
    "src/index.ts",
  ],
  thresholds: {
    lines: 100,
    functions: 100,
    branches: 100,
    statements: 100,
  },
};

export function packageVitestConfig(
  overrides: Parameters<typeof defineConfig>[0] = {},
) {
  return defineConfig({
    ...overrides,
    test: {
      ...(typeof overrides === "object" && overrides && "test" in overrides
        ? overrides.test
        : {}),
      coverage: coverageConfig,
    },
  });
}
