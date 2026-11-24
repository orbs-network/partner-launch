import { loadEnv, type Plugin, type PreviewServer, type ViteDevServer } from "vite";
import { spotConfigStatusHandler } from "./spot-config-status";
import { chainCollateralHandler } from "./chain-collateral";
import { partnerRegistryStatusHandler } from "./partner-registry-status";
import { analyticsAccessHandler, analyticsStatsHandler } from "./analytics";
import { adminRequestsHandler } from "./admin-requests";
import { requestStatusHandler } from "./request-status";
import { walletRequestsHandler } from "./wallet-requests";
import { spotAppIdStatusHandler } from "./spot-app-id-status";

function installApiRoutes(server: ViteDevServer | PreviewServer) {
  server.middlewares.use((request, response, next) => {
    const path = new URL(request.url ?? "/", "http://localhost").pathname;
    if (path === "/api/spot-config-status") void spotConfigStatusHandler(request, response);
    else if (path === "/api/spot-app-id-status") void spotAppIdStatusHandler(request, response);
    else if (path === "/api/chain-collateral") void chainCollateralHandler(request, response);
    else if (path === "/api/partner-registry-status") void partnerRegistryStatusHandler(request, response);
    else if (path === "/api/analytics-access") void analyticsAccessHandler(request, response);
    else if (path === "/api/analytics-stats") void analyticsStatsHandler(request, response);
    else if (path === "/api/admin-requests") void adminRequestsHandler(request, response);
    else if (path === "/api/request-status") void requestStatusHandler(request, response);
    else if (path === "/api/wallet-requests") void walletRequestsHandler(request, response);
    else next();
  });
}

export function apiRoutesPlugin(): Plugin {
  return {
    name: "partner-api-routes",
    configResolved(config) {
      const env = loadEnv(config.mode, config.envDir, "PORTAL_");
      for (const key of ["PORTAL_DATABASE_URL", "PORTAL_ADMIN_WALLETS"]) {
        if (process.env[key] === undefined && env[key] !== undefined) process.env[key] = env[key];
      }
    },
    configureServer: installApiRoutes, configurePreviewServer: installApiRoutes,
  };
}
