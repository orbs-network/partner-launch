import { parseSpotFeePercent } from "./spot-fee";
import { normalizeContact } from "@/lib/contact";
import { isRecord } from "../terms-policy";
import type { SpotDraft, SpotSetupSnapshot } from "./spot-setup";

export class SpotAppIdTakenError extends Error {}

export async function submitSpot(draft: SpotDraft, ownerWallet: string, attempt: { requestId: string; accessToken: string }): Promise<SpotSetupSnapshot> {
  let response: Response;
  try {
    response = await fetch("/api/spot-submit", {
      method: "POST", headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(15_000),
      body: JSON.stringify({ integrationMode: draft.integrationMode, appName: draft.appName, contact: draft.contact, dexUrl: draft.integrationMode === "ui" ? "" : draft.dexUrl, feesWallet: draft.feesWallet, tradingFeePercent: draft.tradingFeePercent,
        policyAccepted: draft.policyAccepted, policyVersion: draft.policyVersion, ownerWallet, ...attempt }),
    });
  } catch {
    throw new Error("We couldn’t confirm delivery to the team. Check your connection and try again. A retry may send another message.");
  }
  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = isRecord(result) && typeof result.error === "string" ? result.error : "We couldn’t submit your Spot setup. Please try again.";
    if (response.status === 409 && isRecord(result) && result.code === "spot_app_id_taken") throw new SpotAppIdTakenError(message);
    throw new Error(message);
  }
  if (!isRecord(result) || result.delivered !== true || typeof result.submittedAt !== "string" ||
    !Number.isFinite(Date.parse(result.submittedAt))) throw new Error("We couldn’t confirm delivery to the team. Please try again.");
  return { kind: "spot", ...(draft.integrationMode ? { integrationMode: draft.integrationMode } : {}), appName: draft.appName.trim(), feesWallet: draft.feesWallet.trim(), tradingFeeTenthsBps: parseSpotFeePercent(draft.tradingFeePercent)!, ownerWallets: [],
    ...(draft.contact.trim() ? { contact: normalizeContact(draft.contact) } : {}),
    ...(draft.integrationMode !== "ui" && draft.dexUrl.trim() ? { dexUrl: draft.dexUrl.trim() } : {}),
    policy: { version: draft.policyVersion, acceptedAt: result.submittedAt }, transport: "telegram" };
}
