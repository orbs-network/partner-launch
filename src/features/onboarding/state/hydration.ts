import { normalizeOrigin } from "../../../lib/website-origin";
import { MAX_CONTACT_LENGTH } from "../../../lib/contact";
import { restoreOwnerWallets } from "../owner-wallets";
import { FUNDING_STEP, onboardingStepOrder, TERMS_STEP } from "../onboarding-steps";
import { FUNDING_AMOUNT, FUNDING_CHAIN_ID } from "../../../config/funding";
import { getStepId, restoreStep, type OnboardingStepId } from "./step-position";
import {
  getStepError,
  validateDepositAmount,
} from "../validation";
import { isCurrentTermsSignature, TERMS_VERSION } from "../terms";
import { getFundingConfirmations } from "../funding-history";
import { isSetupSubmission } from "../setup-submission";
import { isSavedSetupRequestReceipt } from "../setup-request-receipt";
import { sanitizeDepositStepConfirmations } from "../deposit-step";
import { validateFeeCapBps } from "../revenue-settings";
import { DEFAULT_BRAND_COLOR, MAX_RETAINED_DISPLAY_NAME_LENGTH, validateBrandColor, validateLogoDataUrl } from "../dex-identity";
import { DEFAULT_CREATOR_SHARE_BPS, validateCreatorShareBps } from "../creator-revenue";
import { validateBuilderFee } from "../builder-fee";
import {
  emptyChainFunding,
  getPendingDeposit,
  initialDraft,
  isSupported,
  normalizeChainIds,
} from "./draft";
import type {
  ChainFunding,
  Deposit,
  OnboardingDraft,
  TermsSignature,
} from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isAddress(value: unknown): value is `0x${string}` {
  return typeof value === "string" && /^0x[a-fA-F0-9]{40}$/.test(value);
}

function sanitizeDeposit(value: unknown, chainId: number): Deposit | null {
  if (
    !isRecord(value) ||
    typeof value.hash !== "string" ||
    !/^0x[a-fA-F0-9]{64}$/.test(value.hash) ||
    !isAddress(value.payer) ||
    value.chainId !== chainId ||
    typeof value.amount !== "string" ||
    validateDepositAmount(value.amount) ||
    !["pending", "confirmed", "failed"].includes(String(value.status))
  )
    return null;
  return {
    hash: value.hash as `0x${string}`,
    payer: value.payer,
    chainId,
    amount: value.amount,
    status: value.status as Deposit["status"],
    ...(typeof value.partnerId === "string"
      ? { partnerId: value.partnerId.slice(0, 200) }
      : {}),
    ...(typeof value.targetFingerprint === "string"
      ? { targetFingerprint: value.targetFingerprint.slice(0, 500) }
      : {}),
    ...(typeof value.createdAt === "string" &&
    Number.isFinite(Date.parse(value.createdAt))
      ? { createdAt: value.createdAt }
      : {}),
  };
}

function sanitizeFunding(value: unknown, chainId: number): ChainFunding {
  if (!isRecord(value))
    return {
      ...emptyChainFunding,
      depositAmount: chainId === FUNDING_CHAIN_ID ? FUNDING_AMOUNT : "",
    };
  const deposit = sanitizeDeposit(value.deposit, chainId);
  return {
    depositAmount:
      chainId === FUNDING_CHAIN_ID
        ? FUNDING_AMOUNT
        : typeof value.depositAmount === "string"
          ? value.depositAmount.slice(0, 100)
          : "",
    deposit,
    // Keep the legacy field for saved-draft compatibility; funding is required.
    fundingDeferred: false,
  };
}

type SavedDraft = OnboardingDraft & { stepId: OnboardingStepId };

/** Accept older drafts without dropping existing wallet confirmations or receipts. */
export function sanitizeDraft(value: unknown): SavedDraft {
  if (!isRecord(value))
    return selectDraft({
      ...initialDraft,
      chainIds: [],
      fundingByChain: {},
      termsSignatures: {},
      origins: [],
    });
  const legacy = !Array.isArray(value.chainIds);
  const chainIds = normalizeChainIds(
    legacy ? [value.chainId] : (value.chainIds as unknown[]),
  );
  const fundingByChain: Record<number, ChainFunding> = {};
  if (isRecord(value.fundingByChain)) {
    for (const [key, funding] of Object.entries(value.fundingByChain)) {
      const id = Number(key);
      if (isSupported(id)) fundingByChain[id] = sanitizeFunding(funding, id);
    }
  }
  if (legacy && isSupported(value.chainId))
    fundingByChain[value.chainId] = sanitizeFunding(value, value.chainId);
  // Payment networks are independent from selected trading networks. Keep their
  // receipts without silently adding them to the user's trading selections.
  const termsSignatures: Record<number, TermsSignature> = {};
  for (const id of chainIds) {
    const signature: unknown =
      legacy && id === value.chainId
        ? value.termsSignature
        : isRecord(value.termsSignatures)
          ? value.termsSignatures[id]
          : undefined;
    if (isCurrentTermsSignature(signature, id)) termsSignatures[id] = signature;
  }
  const draft: OnboardingDraft = {
    step: restoreStep(value),
    launchPath: value.launchPath === "creator" || value.launchPath === "api" ? value.launchPath : null,
    integrationMode: value.integrationMode === "ui" || value.integrationMode === "api" ? value.integrationMode : value.integrationMode === null ? null : undefined,
    chainIds: normalizeChainIds(chainIds),
    chainId:
      isSupported(value.chainId) && chainIds.includes(value.chainId)
        ? value.chainId
        : (chainIds[0] ?? null),
    displayName:
      typeof value.displayName === "string"
        ? value.displayName.slice(0, MAX_RETAINED_DISPLAY_NAME_LENGTH)
        : legacy && typeof value.partnerName === "string"
          ? value.partnerName.slice(0, MAX_RETAINED_DISPLAY_NAME_LENGTH)
          : "",
    appUrl: typeof value.appUrl === "string" ? value.appUrl.slice(0, 2049) : "",
    contact: typeof value.contact === "string" ? value.contact.slice(0, MAX_CONTACT_LENGTH + 1) : "",
    ownerWallets: restoreOwnerWallets(value.ownerWallets),
    partnerName:
      typeof value.partnerName === "string"
        ? value.partnerName.slice(0, 200)
        : "",
    brandColor: typeof value.brandColor === "string" && !validateBrandColor(value.brandColor)
      ? value.brandColor : DEFAULT_BRAND_COLOR,
    logoDataUrl: typeof value.logoDataUrl === "string" && !validateLogoDataUrl(value.logoDataUrl)
      ? value.logoDataUrl : "",
    revenueWallet:
      typeof value.revenueWallet === "string"
        ? value.revenueWallet.trim().slice(0, 200)
        : "",
    feeCapBps: !Object.hasOwn(value, "feeCapBps")
      ? 0
      : typeof value.feeCapBps === "number" && !validateFeeCapBps(value.feeCapBps)
        ? value.feeCapBps
        : null,
    requestedCreatorShareBps: !Object.hasOwn(value, "requestedCreatorShareBps")
      ? DEFAULT_CREATOR_SHARE_BPS
      : typeof value.requestedCreatorShareBps === "number" && !validateCreatorShareBps(value.requestedCreatorShareBps)
        ? value.requestedCreatorShareBps : null,
    fundingByChain,
    ...(Object.hasOwn(value, "builderFeeTenthsBps") ? { builderFeeTenthsBps: typeof value.builderFeeTenthsBps === "number" && !validateBuilderFee(value.builderFeeTenthsBps) ? value.builderFeeTenthsBps : null } : {}),
    fundingConfirmation: null,
    fundingConfirmations: [],
    termsAcceptedVersion:
      value.termsAcceptedVersion === TERMS_VERSION ? TERMS_VERSION : null,
    termsSignatures,
    origins: Array.isArray(value.origins)
      ? value.origins
          .filter((origin): origin is string => typeof origin === "string")
          .slice(0, 10)
          .map((origin) => normalizeOrigin(origin.slice(0, 2048)))
      : [],
    integrationAcknowledged: value.integrationAcknowledged === true,
    completed: false,
  };
  draft.fundingConfirmations = getFundingConfirmations({
    partnerName: draft.partnerName,
    fundingConfirmation: value.fundingConfirmation,
    fundingConfirmations: value.fundingConfirmations,
  });
  draft.fundingConfirmation = draft.fundingConfirmations.at(-1) ?? null;
  if (isSetupSubmission(value.setupSubmission, draft)) draft.setupSubmission = value.setupSubmission;
  const depositStepConfirmations = sanitizeDepositStepConfirmations(value.depositStepConfirmations);
  if (depositStepConfirmations) draft.depositStepConfirmations = depositStepConfirmations;
  for (const step of onboardingStepOrder.slice(0, onboardingStepOrder.indexOf(draft.step))) {
    if (getStepError(step, draft)) {
      draft.step = step;
      break;
    }
  }
  if (onboardingStepOrder.slice(0, onboardingStepOrder.indexOf(TERMS_STEP)).some((step) => getStepError(step, draft))) {
    draft.termsAcceptedVersion = null;
    draft.termsSignatures = {};
  }
  if (isSavedSetupRequestReceipt(value.setupRequestReceipt, draft)) draft.setupRequestReceipt = value.setupRequestReceipt;
  draft.completed =
    value.completed === true &&
    !(value.setupSubmission && !draft.setupSubmission) &&
    !onboardingStepOrder.some((step) => getStepError(step, draft));
  if (value.completed === true && !draft.completed) {
    const invalidStep = onboardingStepOrder.find((step) => !!getStepError(step, draft));
    draft.step = invalidStep ?? TERMS_STEP;
  }
  const pending = getPendingDeposit(draft);
  if (pending && !draft.setupSubmission) {
    draft.chainId = pending.chainId;
    draft.step = FUNDING_STEP;
    draft.completed = false;
  }
  return selectDraft(draft);
}

export function selectDraft(state: OnboardingDraft): SavedDraft {
  const depositStepConfirmations = sanitizeDepositStepConfirmations(state.depositStepConfirmations);
  return {
    ...(state.setupSubmission ? { setupSubmission: state.setupSubmission } : {}),
    ...(state.setupRequestReceipt ? { setupRequestReceipt: state.setupRequestReceipt } : {}),
    ...(depositStepConfirmations ? { depositStepConfirmations } : {}),
    step: state.step,
    stepId: getStepId(state.step),
    launchPath: state.launchPath,
    integrationMode: state.integrationMode,
    chainIds: state.chainIds,
    chainId: state.chainId,
    displayName: state.displayName,
    appUrl: state.appUrl ?? "",
    contact: state.contact ?? "",
    ownerWallets: state.ownerWallets ?? [],
    partnerName: state.partnerName,
    brandColor: state.brandColor,
    logoDataUrl: state.logoDataUrl,
    revenueWallet: state.revenueWallet,
    feeCapBps: state.feeCapBps,
    requestedCreatorShareBps: state.requestedCreatorShareBps,
    ...(state.builderFeeTenthsBps !== undefined ? { builderFeeTenthsBps: state.builderFeeTenthsBps } : {}),
    fundingByChain: state.fundingByChain,
    fundingConfirmation: state.fundingConfirmation,
    fundingConfirmations: state.fundingConfirmations,
    termsAcceptedVersion: state.termsAcceptedVersion,
    termsSignatures: state.termsSignatures,
    origins: state.origins,
    integrationAcknowledged: state.integrationAcknowledged,
    completed: state.completed,
  };
}
