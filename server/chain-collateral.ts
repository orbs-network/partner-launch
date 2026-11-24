import type { IncomingMessage, ServerResponse } from "node:http";
import { createPublicClient, fallback, getAddress, http, isAddress, zeroAddress } from "viem";
import { chainById, rpcUrls } from "../src/config/chains";
import { registryLanes } from "./partner-registry";

const tokenAbi = [
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
] as const;

export async function chainCollateralHandler(request: IncomingMessage, response: ServerResponse) {
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  if (request.method !== "GET") { response.setHeader("Allow", "GET"); response.writeHead(405).end(); return; }
  const values = new URL(request.url ?? "/", "http://localhost").searchParams.getAll("chainId");
  const id = values.length === 1 && /^[1-9]\d*$/.test(values[0]) ? Number(values[0]) : 0;
  const chain = chainById(id);
  if (!chain || !Number.isSafeInteger(id)) { response.writeHead(400).end(JSON.stringify({ error: "Invalid network." })); return; }
  try {
    const lanes = await registryLanes(undefined, id);
    const candidates = lanes.filter((lane): lane is Record<string, unknown> => !!lane && typeof lane === "object" && !Array.isArray(lane) &&
      (lane as Record<string, unknown>).chainId === String(id) && (lane as Record<string, unknown>).status === "enabled");
    if (!candidates.length || candidates.some(lane => typeof lane.collateralAddress !== "string" || !isAddress(lane.collateralAddress) ||
      lane.collateralAddress.toLowerCase() === zeroAddress || !Number.isInteger(lane.collateralDecimals))) throw new Error("No valid collateral");
    const address = getAddress(candidates[0].collateralAddress as string);
    const decimals = candidates[0].collateralDecimals as number;
    if (candidates.some(lane => (lane.collateralAddress as string).toLowerCase() !== address.toLowerCase() || lane.collateralDecimals !== decimals)) throw new Error("Conflicting collateral");
    const client = createPublicClient({ chain, transport: fallback((rpcUrls[id] ?? []).map(url => http(url, { timeout: 4000, retryCount: 0 })), { retryCount: 0 }) });
    if (await client.getChainId() !== id) throw new Error("Wrong RPC network");
    const [symbol, actualDecimals] = await Promise.all([
      client.readContract({ address, abi: tokenAbi, functionName: "symbol" }),
      client.readContract({ address, abi: tokenAbi, functionName: "decimals" }),
    ]);
    if ((symbol !== "USDC" && symbol !== "USDT") || decimals !== actualDecimals) throw new Error("Unknown collateral");
    response.writeHead(200).end(JSON.stringify({ chainId: id, symbol, address, decimals }));
  } catch {
    response.writeHead(503).end(JSON.stringify({ error: "Collateral is unavailable for this network. Please try again." }));
  }
}
