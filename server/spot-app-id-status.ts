import type { IncomingMessage, ServerResponse } from "node:http";
import { validateDexName } from "../src/features/onboarding/dex-identity.js";
import { generateSpotAppId } from "../src/features/onboarding/spot/app-id.js";
import { requestDatabase } from "./request-database.js";
import { fetchSpotConfigDexKeys } from "./spot-config-status.js";
import { partnerIdExists } from "./request-repository.js";

export async function spotAppIdStatusHandler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  if (request.method !== "GET") { response.setHeader("Allow", "GET"); response.writeHead(405).end(); return; }
  const names = new URL(request.url ?? "/", "http://localhost").searchParams.getAll("name");
  if (names.length !== 1 || validateDexName(names[0])) { response.writeHead(400).end(JSON.stringify({ error: "Enter a valid app name." })); return; }
  const appId = generateSpotAppId(names[0]);
  try {
    const exists = await partnerIdExists(requestDatabase(), appId) || (await fetchSpotConfigDexKeys()).some(key => key.toLowerCase() === appId.toLowerCase());
    response.writeHead(200).end(JSON.stringify({ appId, exists }));
  } catch { response.writeHead(503).end(JSON.stringify({ error: "Spot App ID availability is temporarily unavailable." })); }
}
