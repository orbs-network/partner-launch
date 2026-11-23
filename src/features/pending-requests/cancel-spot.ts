import type { SpotRequest } from "./request-record";

/** Notify the team only; the browser record is removed separately after acknowledgement. */
export async function cancelSpotRequest(request: SpotRequest): Promise<void> {
  let response: Response;
  try {
    response = await fetch("/api/spot-cancel", {
      method: "POST", headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(15_000),
      body: JSON.stringify({ appName: request.appName, feesWallet: request.feesWallet, dexUrl: request.dexUrl }),
    });
  } catch {
    throw new Error("We couldn’t confirm the cancellation reached the team. Your request is still here. Try again; a retry may send another message.");
  }
  const result: unknown = await response.json().catch(() => null);
  const record = result && typeof result === "object" ? result as Record<string, unknown> : null;
  if (!response.ok) throw new Error(typeof record?.error === "string" ? record.error : "We couldn’t send the cancellation. Please try again.");
  if (record?.delivered !== true || typeof record.submittedAt !== "string" || !Number.isFinite(Date.parse(record.submittedAt)))
    throw new Error("We couldn’t confirm the cancellation reached the team. Your request is still here. Please try again.");
}
