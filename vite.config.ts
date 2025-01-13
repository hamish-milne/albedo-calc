import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import path from "path";
import { viteSingleFile } from "vite-plugin-singlefile";
// import { analyzer } from "vite-bundle-analyzer";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    preact({
      devToolsEnabled: true,
    }),
    viteSingleFile({
      removeViteModuleLoader: true,
      // deleteInlinedFiles: false,
    }),
    // analyzer(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: "./",
  build: {
    outDir: "docs",
    emptyOutDir: true,
  },
});
