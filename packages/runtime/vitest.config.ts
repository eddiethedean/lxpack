import { defineConfig } from "vitest/config";
import { coverageConfig } from "../../vitest.shared.ts";

export default defineConfig({
  test: {
    environment: "happy-dom",
    setupFiles: ["./test/setup.ts"],
    include: ["src/**/*.test.ts"],
    coverage: coverageConfig,
  },
});
