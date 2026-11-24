import type { Address } from "viem";
import type { OnboardingDraft } from "./state/types";
import { preparePerpsRequest } from "./perps-request";
import { isRecord, TERMS_VERSION } from "./terms-policy";

export async function submitPerps(draft: OnboardingDraft, ownerWallet: Address, assertCurrent: () => void, attempt: { requestId: string; accessToken: string }): Promise<{ submittedAt: string }> {
  assertCurrent();
  const details = preparePerpsRequest({ appName: draft.displayName || draft.partnerName, partnerId: draft.partnerName,
    ownerWallet, chainIds: draft.chainIds, revenueWallet: draft.revenueWallet, builderFeeTenthsBps: draft.builderFeeTenthsBps,
    launchPath: draft.launchPath, contact: draft.contact ?? "", policyAccepted: draft.termsAcceptedVersion === TERMS_VERSION, policyVersion: draft.termsAcceptedVersion });
  let response: Response;
  try {
    response = await fetch("/api/perps-submit", {
      method: "POST", headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(15_000), body: JSON.stringify({ ...details, ...attempt }),
    });
  } catch {
    throw new Error("We couldn’t confirm delivery to the team. Check your connection and try again. A retry may send another message.");
  }
  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(isRecord(result) && typeof result.error === "string"
    ? result.error : "We couldn’t submit your Perps setup. Please try again.");
  if (!isRecord(result) || result.delivered !== true || typeof result.submittedAt !== "string" ||
    !Number.isFinite(Date.parse(result.submittedAt))) throw new Error("We couldn’t confirm delivery to the team. Please try again.");
  return { submittedAt: result.submittedAt };
}
