import { FUNDING_CHAIN_ID } from "../../config/funding";
import { getFundingConfirmations, getFundingTotal } from "./funding-history";
import type { OnboardingDraft } from "./state/types";
import { hasSetupRequestReceipt } from "./setup-request-receipt";
import { sanitizeDepositStepConfirmations } from "./deposit-step";

/** Keep the version-two download separate from server activation and real payments. */
export function createSetupExport(
  draft: OnboardingDraft,
  exportedAt = new Date().toISOString(),
) {
  const depositStepConfirmations = sanitizeDepositStepConfirmations(draft.depositStepConfirmations);
  const localRequest = hasSetupRequestReceipt(draft) && draft.setupRequestReceipt?.transport === "local";
  const unsignedRequest = hasSetupRequestReceipt(draft) && draft.setupRequestReceipt?.verification === "unsigned";
  return {
    version: 2 as const,
    exportedAt,
    launchPath: draft.launchPath,
    displayName: draft.displayName,
    ...(draft.appUrl ? { appUrl: draft.appUrl } : {}),
    platformName: draft.partnerName,
    partnerId: draft.partnerName,
    branding: { brandColor: draft.brandColor, logoDataUrl: draft.logoDataUrl },
    revenueWallet: draft.revenueWallet,
    ...(draft.builderFeeTenthsBps === undefined ? {
      requestedFeeCapBps: draft.feeCapBps, requestedCreatorShareBps: draft.requestedCreatorShareBps,
      feeModel: "share-of-trading-fees-request" as const,
    } : { builderFeeTenthsBps: draft.builderFeeTenthsBps, feeModel: "per-order-builder-fee" as const }),
    chainIds: draft.chainIds,
    fundingChainId: draft.setupSubmission ? (draft.chainIds.length === 1 ? draft.chainIds[0] : null) : FUNDING_CHAIN_ID,
    fundingMode: draft.setupSubmission ? "not-started" as const : "signature-placeholder" as const,
    fundingConfirmation: draft.fundingConfirmation,
    fundingConfirmations: getFundingConfirmations(draft),
    demoFundingTotal: getFundingTotal(draft),
    fundingByChain: draft.fundingByChain,
    origins: draft.origins,
    integrationAcknowledged: draft.integrationAcknowledged,
    termsAcceptedVersion: draft.termsAcceptedVersion,
    termsSignatures: draft.termsSignatures,
    setupSubmission: draft.setupSubmission,
    setupRequestReceipt: draft.setupRequestReceipt,
    ...(depositStepConfirmations ? { depositStepConfirmations } : {}),
    submissionStatus: localRequest ? "local-mock" as const : hasSetupRequestReceipt(draft) ? "sent-to-mock-api" as const : "saved-locally" as const,
    paymentStatus: "not-collected" as const,
    tradingDeposit: { amount: "100", ...(unsignedRequest ? {} : { token: draft.setupSubmission?.collateral?.symbol ?? "USDC" }), chainId: draft.chainIds.length === 1 ? draft.chainIds[0] : null, mode: unsignedRequest || !draft.setupSubmission ? "not-collected" as const : "mock-signature" as const },
    provisioningStatus: "pending-team-activation" as const,
  };
}
