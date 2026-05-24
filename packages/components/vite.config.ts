import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/bundle.ts"),
      formats: ["es"],
      fileName: () => "bundle.js",
    },
    outDir: "dist",
    emptyOutDir: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
