import { isLocalTestPartner } from "../local-test-partner";
import { generateSpotAppId } from "./app-id";

export async function spotAppIdExists(name: string): Promise<boolean> {
  if (isLocalTestPartner(name)) return false;
  const response = await fetch(`/api/spot-app-id-status?${new URLSearchParams({ name })}`, { cache: "no-store", signal: AbortSignal.timeout(12_000) });
  if (!response.ok) throw new Error("Spot Partner ID availability is unavailable.");
  const data: unknown = await response.json();
  if (!data || typeof data !== "object" || !("appId" in data) || data.appId !== generateSpotAppId(name) ||
    !("exists" in data) || typeof data.exists !== "boolean") throw new Error("Invalid Spot availability response.");
  return data.exists;
}
