import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: {
        runtime: resolve(__dirname, "src/runtime.ts"),
        scorm12: resolve(__dirname, "src/scorm12.ts"),
        scorm2004: resolve(__dirname, "src/scorm2004.ts"),
      },
      formats: ["es"],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    outDir: "dist",
    emptyOutDir: false,
    rollupOptions: {
      output: {
        entryFileNames: "[name].js",
      },
    },
  },
});
