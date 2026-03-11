import { fileURLToPath, URL } from "node:url";

import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import { VueUseComponentsResolver } from "unplugin-vue-components/resolvers";
import Components from "unplugin-vue-components/vite";

import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // Auto import Vue APIs
    AutoImport({
      imports: ["vue", "vue-router"], // auto import for vue and vue-router
      dts: "src/auto-imports.d.ts", // generate TypeScript declaration
    }),
    // Auto import components
    Components({
      resolvers: [VueUseComponentsResolver()], // auto import component libraries
      dts: "src/components.d.ts", // generate TypeScript declaration
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
        ws: true,
      },
    },
  },
});
