import type { Plugin, PreviewServer, ViteDevServer } from "vite";
import { analyticsAccessHandler, analyticsStatsHandler } from "./analytics";

function installAnalytics(server: ViteDevServer | PreviewServer) {
  server.middlewares.use((request, response, next) => {
    const path = new URL(request.url ?? "/", "http://localhost").pathname;
    if (path === "/api/analytics-access") void analyticsAccessHandler(request, response);
    else if (path === "/api/analytics-stats") void analyticsStatsHandler(request, response);
    else next();
  });
}

export function analyticsPlugin(): Plugin {
  return { name: "partner-analytics-api", configureServer: installAnalytics, configurePreviewServer: installAnalytics };
}
