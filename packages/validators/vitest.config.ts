import { defineConfig } from "vitest/config";
import { coverageConfig } from "../../vitest.shared.ts";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    coverage: coverageConfig,
  },
});
