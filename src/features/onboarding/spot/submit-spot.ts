import { isRecord } from "../terms-policy";
import type { SpotDraft, SpotSetupSnapshot } from "./spot-setup";

export async function submitSpot(draft: SpotDraft): Promise<SpotSetupSnapshot> {
  let response: Response;
  try {
    response = await fetch("/api/spot-submit", {
      method: "POST", headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(15_000),
      body: JSON.stringify({ appName: draft.appName, dexUrl: draft.dexUrl, feesWallet: draft.feesWallet,
        policyAccepted: draft.policyAccepted, policyVersion: draft.policyVersion }),
    });
  } catch {
    throw new Error("We couldn’t confirm delivery to the team. Check your connection and try again. A retry may send another message.");
  }
  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(isRecord(result) && typeof result.error === "string"
    ? result.error : "We couldn’t submit your Spot setup. Please try again.");
  if (!isRecord(result) || result.delivered !== true || typeof result.submittedAt !== "string" ||
    !Number.isFinite(Date.parse(result.submittedAt))) throw new Error("We couldn’t confirm delivery to the team. Please try again.");
  return { kind: "spot", appName: draft.appName.trim(), feesWallet: draft.feesWallet.trim(),
    ...(draft.dexUrl.trim() ? { dexUrl: draft.dexUrl.trim() } : {}),
    policy: { version: draft.policyVersion, acceptedAt: result.submittedAt }, transport: "telegram" };
}
