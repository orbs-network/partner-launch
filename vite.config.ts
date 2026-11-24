import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";
import { apiRoutesPlugin } from "./server/api-routes-plugin";
import { spotSubmitPlugin } from "./server/spot-submit-plugin";

export default defineConfig({
  plugins: [react(), tailwindcss(), apiRoutesPlugin(), spotSubmitPlugin()],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  build: { chunkSizeWarningLimit: 1200 },
});
