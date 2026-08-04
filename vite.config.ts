import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

export default defineConfig({
  root: ".",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@shared": resolve(__dirname, "src/shared"),
      "@engine": resolve(__dirname, "src/engine"),
      "@client": resolve(__dirname, "src/client"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
