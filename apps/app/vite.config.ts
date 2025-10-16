import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import devServer from "@hono/vite-dev-server";
import build from "@hono/vite-build/cloudflare-workers";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    cloudflare(),
    build({
      entry: "_index.tsx",
    }),
    devServer({
      entry: "_index.tsx",
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
