import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: {
        client: resolve(__dirname, "src/client.ts"),
        runtime: resolve(__dirname, "src/runtime.ts"),
      },
      formats: ["es"],
    },
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: "[name].js",
      },
    },
  },
});
