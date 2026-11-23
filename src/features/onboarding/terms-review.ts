import type { OnboardingDraft } from "./state/types";
import { isCurrentTermsSignature, TERMS_VERSION } from "./terms";

type TermsEvidence = Pick<OnboardingDraft, "chainIds" | "termsSignatures">;

/** Read existing signed acceptance; new setups use the Review checkbox. */
export function getTermsConfirmationError(draft: TermsEvidence): string | undefined {
  if (
    !draft.chainIds.length ||
    draft.chainIds.some(
      (id) => !isCurrentTermsSignature(draft.termsSignatures[id], id),
    )
  )
    return "Confirm the terms with your wallet to continue.";
  const signers = new Set(
    draft.chainIds.map((id) => draft.termsSignatures[id].address.toLowerCase()),
  );
  if (signers.size !== 1)
    return "Use the same wallet to confirm the terms for all your networks.";
}

/** Current checkbox acceptance is sufficient; retain existing accepted evidence. */
export function hasAcceptedTerms(
  draft: TermsEvidence & Pick<OnboardingDraft, "termsAcceptedVersion">,
): boolean {
  return (
    draft.termsAcceptedVersion === TERMS_VERSION ||
    !getTermsConfirmationError(draft)
  );
}
