import { resolve } from "node:path";
import { defineConfig } from "vite";

const validatorsBrowser = resolve(
  __dirname,
  "../validators/src/browser.ts",
);

export default defineConfig({
  resolve: {
    alias: {
      "@lxpack/validators": validatorsBrowser,
    },
  },
  define: {
    // Vitest sets VITEST at test time; production client builds must not ship `process`.
    "process.env.VITEST": JSON.stringify(process.env.VITEST ?? ""),
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/client.ts"),
      formats: ["es"],
      fileName: () => "client.js",
    },
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
