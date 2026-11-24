import type { IncomingMessage, ServerResponse } from "node:http";

const SOURCE = "https://raw.githubusercontent.com/orbs-network/spot/master/config.json";
const MAX_BYTES = 512 * 1024;
const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const address = (value: unknown) => typeof value === "string" && /^0x[0-9a-fA-F]{40}$/.test(value) && !/^0x0{40}$/i.test(value);

/** Extract public DEX keys only; a key match does not establish ownership or activation. */
export function spotConfigDexKeys(data: unknown): string[] {
  if (!isRecord(data) || !isRecord(data["*"])) throw new Error("Invalid Spot config");
  const keys = new Set<string>();
  for (const [chain, value] of Object.entries(data)) {
    if (chain !== "*" && !/^[1-9]\d*$/.test(chain)) continue;
    if (!isRecord(value)) throw new Error("Invalid Spot config");
    if (value.dex === undefined) continue;
    if (!isRecord(value.dex)) throw new Error("Invalid Spot DEX entries");
    for (const [key, entry] of Object.entries(value.dex)) {
      if (!isRecord(entry) || typeof entry.type !== "string" || !entry.type || !address(entry.adapter) || !address(entry.fee))
        throw new Error("Invalid Spot DEX entry");
      keys.add(key);
    }
  }
  return [...keys];
}

export async function fetchSpotConfigDexKeys(): Promise<string[]> {
    const upstream = await fetch(SOURCE, { headers: { Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (!upstream.ok || !upstream.body) throw new Error("Config unavailable");
    const reader = upstream.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) { await reader.cancel(); throw new Error("Config too large"); }
      chunks.push(value);
    }
    return spotConfigDexKeys(JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown);
}

export async function spotConfigStatusHandler(request: IncomingMessage, response: ServerResponse) {
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  if (request.method !== "GET") { response.setHeader("Allow", "GET"); response.writeHead(405).end(); return; }
  try {
    const keys = await fetchSpotConfigDexKeys();
    response.writeHead(200).end(JSON.stringify({ keys }));
  } catch {
    response.writeHead(502).end(JSON.stringify({ error: "Spot configuration is temporarily unavailable." }));
  }
}
