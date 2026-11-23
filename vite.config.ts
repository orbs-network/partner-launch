import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";
import { analyticsPlugin } from "./server/analytics-plugin";
import { spotSubmitPlugin } from "./server/spot-submit-plugin";

export default defineConfig({
  plugins: [react(), tailwindcss(), analyticsPlugin(), spotSubmitPlugin()],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  build: { chunkSizeWarningLimit: 1200 },
});
