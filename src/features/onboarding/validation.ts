import { chainById, supportedChains } from "../../config/chains";
import {
  FUNDING_CHAIN_ID,
  FUNDING_TOKEN_ADDRESS,
  FUNDING_TOKEN_DECIMALS,
} from "../../config/funding";
import type { OnboardingDraft } from "./store";
import { fundingFingerprint, parseFundingTargets } from "./funding";
import { hasAcceptedTerms } from "./terms-review";
import { validateContact } from "../../lib/contact";
export { getTermsConfirmationError } from "./terms-review";
import { isFundingStepComplete } from "./placeholder-funding";
import { isSetupSubmission } from "./setup-submission";
import { hasSetupRequestReceipt } from "./setup-request-receipt";
import { validateFeeCapBps, validateRevenueWallet } from "./revenue-settings";
import { reservedPartnerNames, validateDexName, validatePartnerName } from "./dex-identity";
import { validateCreatorShareBps } from "./creator-revenue";
import { validateBuilderFee } from "./builder-fee";
export { reservedPartnerNames, validatePartnerName } from "./dex-identity";
import { validateDexUrl } from "../../lib/dex-url";
import { APP_URL_STEP, INTEGRATION_CHOICE_STEP, FUNDING_STEP, NETWORKS_STEP, PARTNER_STEP, REVENUE_STEP, TERMS_STEP, WEBSITES_STEP, WELCOME_STEP } from "./onboarding-steps";

export function validateDepositAmount(value: string): string | undefined {
  const amount = value.trim();
  if (!/^\d+(?:\.\d{1,6})?$/.test(amount) || amount.length > 40) {
    return "Enter an amount greater than zero, with up to 6 decimal places.";
  }
  const [whole, fraction = ""] = amount.split(".");
  const units = BigInt(`${whole}${fraction.padEnd(18, "0")}`);
  if (units === 0n) return "Enter an amount greater than zero.";
  if (units > 2n ** 256n - 1n)
    return "This amount is too large. Enter a smaller amount.";
}

export function isChainFunded(
  draft: OnboardingDraft,
  chainId: number,
): boolean {
  const deposit = draft.fundingByChain[chainId]?.deposit;
  if (
    deposit?.status !== "confirmed" ||
    deposit.chainId !== chainId ||
    deposit.partnerId !== draft.partnerName
  )
    return false;
  const target = parseFundingTargets(
    process.env.VITE_FUNDING_TARGETS,
  ).targets.find(
    (item) => item.chainId === chainId && item.partnerId === draft.partnerName,
  );
  return (
    !!target &&
    (chainId !== FUNDING_CHAIN_ID ||
      (target.token.toLowerCase() === FUNDING_TOKEN_ADDRESS.toLowerCase() &&
        target.decimals === FUNDING_TOKEN_DECIMALS)) &&
    deposit.targetFingerprint === fundingFingerprint(target)
  );
}

export function getChainFundingError(
  draft: OnboardingDraft,
  chainId: number,
): string | undefined {
  const name = chainById(chainId)?.name ?? "this network";
  const funding = draft.fundingByChain[chainId];
  if (funding?.deposit?.status === "pending")
    return `Your deposit on ${name} is still confirming.`;
  if (isChainFunded(draft, chainId)) return;
  if (funding?.deposit?.status === "confirmed")
    return `Your account details on ${name} changed. Review your payment before continuing.`;
  return `Add funds on ${name} to continue.`;
}

export function getStepError(
  step: number,
  draft: OnboardingDraft,
): string | undefined {
  switch (step) {
    case WELCOME_STEP:
      break;
    case INTEGRATION_CHOICE_STEP:
      if (draft.integrationMode === null) return "Choose how you want to add Perps.";
      break;
    case APP_URL_STEP:
      return validateDexUrl(draft.appUrl ?? "")?.replaceAll("DEX URL", "app URL");
    case NETWORKS_STEP:
      if (
        !draft.chainIds.length ||
        draft.chainIds.some(
          (id) => !supportedChains.some((chain) => chain.id === id),
        )
      )
        return "Choose at least one network to continue.";
      break;
    case PARTNER_STEP: {
      if (draft.launchPath === "api") return validatePartnerName(draft.partnerName) ?? validateContact(draft.contact ?? "");
      // Check the name the user typed first, so an empty field reads "Enter a name…".
      const nameError = validateDexName(draft.displayName || draft.partnerName);
      if (nameError) return nameError;
      const idError = validatePartnerName(draft.partnerName);
      if (idError && draft.partnerName.length < 3)
        return "Use a longer app name with letters or numbers.";
      if (idError && reservedPartnerNames.has(draft.partnerName))
        return "This name is reserved. Choose another app name.";
      return idError ?? validateContact(draft.contact ?? "");
    }
    case WEBSITES_STEP: // Reserved historical position; no current input or validation.
      break;
    case REVENUE_STEP:
      return validateRevenueWallet(draft.revenueWallet)
        ?? (draft.builderFeeTenthsBps !== undefined || (!draft.setupSubmission && !draft.fundingConfirmation && !draft.completed)
          ? validateBuilderFee(draft.builderFeeTenthsBps)
          : validateFeeCapBps(draft.feeCapBps) ?? (draft.launchPath !== null ? validateCreatorShareBps(draft.requestedCreatorShareBps) : undefined));
    case TERMS_STEP:
      if (!hasAcceptedTerms(draft)) return "Accept the terms before continuing.";
      break;
    case FUNDING_STEP: {
      if (!draft.chainIds.length) return "Choose your networks first.";
      if (!hasAcceptedTerms(draft)) return "Accept the terms before continuing.";
      if (!hasSetupRequestReceipt(draft) && !isSetupSubmission(draft.setupSubmission, draft) && !isFundingStepComplete(draft))
        return "Confirm your setup with your wallet to finish.";
      break;
    }
    default:
      return "This step is unavailable. Go back to the start.";
  }
}
