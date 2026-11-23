import { verifyMessage, type Address } from "viem";
import { depositStepConfirmation, isDepositStepConfirmation, type DepositStepConfirmation } from "./deposit-step";
import { loadSavedSetups } from "./saved-setups";
import type { OnboardingDraft } from "./state/types";

/** A verified mock confirmation is not evidence that funds were transferred. */
export async function findConfirmedDepositStep(draft: OnboardingDraft, address: Address): Promise<DepositStepConfirmation | undefined> {
  if (draft.chainIds.length !== 1 || !draft.partnerName) return;
  const seen = new Set<string>();
  async function find(candidates: unknown[]) {
    for (const candidate of candidates) {
      if (!isDepositStepConfirmation(candidate) || candidate.partnerId !== draft.partnerName ||
        candidate.chainId !== draft.chainIds[0] || candidate.submission.address.toLowerCase() !== address.toLowerCase()) continue;
      const evidence = `${candidate.submission.signature}:${candidate.submission.message}`;
      if (seen.has(evidence)) continue;
      seen.add(evidence);
      try {
        if (await verifyMessage({ address, message: candidate.submission.message, signature: candidate.submission.signature })) return candidate;
      } catch { /* Invalid evidence cannot suppress the first confirmation. */ }
    }
  }
  const current = await find([depositStepConfirmation(draft), ...(draft.depositStepConfirmations ?? [])]);
  if (current) return current;
  // Verify earlier current-page submissions against their own signed data.
  let saved;
  try { saved = loadSavedSetups(address); }
  catch { throw new Error("We couldn’t check your previous deposit confirmation. Try again."); }
  return find(saved.flatMap(({ draft: snapshot }) => [depositStepConfirmation(snapshot), ...(snapshot.depositStepConfirmations ?? [])]));
}
