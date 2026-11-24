import { generateSpotAppId } from "./app-id";

export async function spotAppIdExists(name: string): Promise<boolean> {
  const response = await fetch(`/api/spot-app-id-status?${new URLSearchParams({ name })}`, { cache: "no-store", signal: AbortSignal.timeout(12_000) });
  if (!response.ok) throw new Error("Spot App ID availability is unavailable.");
  const data: unknown = await response.json();
  if (!data || typeof data !== "object" || !("appId" in data) || data.appId !== generateSpotAppId(name) ||
    !("exists" in data) || typeof data.exists !== "boolean") throw new Error("Invalid Spot availability response.");
  return data.exists;
}
