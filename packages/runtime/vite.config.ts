import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/client.ts"),
      formats: ["es"],
      fileName: () => "client.js",
    },
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      external: ["@lxpack/validators"],
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
