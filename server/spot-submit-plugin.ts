import type { Plugin, PreviewServer, ViteDevServer } from "vite";
import { loadEnv } from "vite";
import { spotCancelHandler, spotSubmitHandler } from "./spot-submit";
import { perpsSubmitHandler } from "./perps-submit";

export function spotSubmitPlugin(): Plugin {
  function install(server: ViteDevServer | PreviewServer) {
    server.middlewares.use((request, response, next) => {
      const path = new URL(request.url ?? "/", "http://localhost").pathname;
      const handler = path === "/api/spot-submit" ? spotSubmitHandler : path === "/api/spot-cancel" ? spotCancelHandler
        : path === "/api/perps-submit" ? perpsSubmitHandler : undefined;
      if (handler) void handler(request, response);
      else next();
    });
  }
  return {
    name: "setup-notifications-api",
    configResolved(config) {
      const env = loadEnv(config.mode, config.envDir, "SPOT_TELEGRAM_");
      for (const key of ["SPOT_TELEGRAM_BOT_TOKEN", "SPOT_TELEGRAM_CHAT_ID"]) {
        if (process.env[key] === undefined && env[key] !== undefined) process.env[key] = env[key];
      }
    },
    configureServer: install, configurePreviewServer: install,
  };
}
