import type { IncomingMessage, ServerResponse } from "node:http";
import type { Pool } from "pg";
import { registryLanes } from "./partner-registry.js";
import { partnerIdExists } from "./request-repository.js";
import { requestDatabase } from "./request-database.js";

/** Registry status includes disabled lanes; it does not reserve the ID. */
export async function registryPartnerStatus(partnerId: string) {
  const lanes = await registryLanes(partnerId.toLowerCase());
  const enabledChainIds: number[] = [];
  let exists = false;
  for (const lane of lanes) {
    if (!lane || typeof lane !== "object" || Array.isArray(lane)) throw new Error("Invalid lane");
    const item = lane as Record<string, unknown>;
    if (typeof item.partnerId !== "string" || typeof item.chainId !== "string" ||
        !/^[1-9]\d*$/.test(item.chainId) || !Number.isSafeInteger(Number(item.chainId)) ||
        (item.status !== "enabled" && item.status !== "disabled")) throw new Error("Invalid lane");
    if (item.partnerId.toLowerCase() !== partnerId.toLowerCase()) continue;
    exists = true;
    if (item.status === "enabled") enabledChainIds.push(Number(item.chainId));
  }
  return { partnerId, exists, enabledChainIds: [...new Set(enabledChainIds)] };
}

export async function partnerRegistryStatusHandler(request: IncomingMessage, response: ServerResponse, database?: Pool) {
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    response.writeHead(405).end(JSON.stringify({ error: "Use GET." }));
    return;
  }
  const url = new URL(request.url ?? "/", "http://localhost");
  const values = url.searchParams.getAll("partner");
  const partnerId = values[0];
  if (values.length !== 1 || !partnerId || (partnerId !== "QuickSwap1" && !/^[a-z0-9-]{1,64}$/.test(partnerId))) {
    response.writeHead(400).end(JSON.stringify({ error: "Invalid partner ID." }));
    return;
  }
  try {
    const result = url.searchParams.get("availability") === "1"
      ? { partnerId, exists: await partnerIdExists(database ?? requestDatabase(), partnerId, "perps"), enabledChainIds: [] }
      : await registryPartnerStatus(partnerId);
    response.writeHead(200).end(JSON.stringify(result));
  } catch {
    const availability = url.searchParams.get("availability") === "1";
    response.writeHead(availability ? 503 : 502).end(JSON.stringify({ error: availability ? "Partner ID availability is temporarily unavailable." : "Partner registry is temporarily unavailable." }));
  }
}
