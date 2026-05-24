import { packageVitestConfig } from "../../vitest.shared.js";

export default packageVitestConfig({
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.ts"],
  },
});
