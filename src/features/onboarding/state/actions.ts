import type { StateCreator } from "zustand";
import { FUNDING_AMOUNT, FUNDING_CHAIN_ID } from "../../../config/funding";
import { getStepError } from "../validation";
import { appendFundingConfirmation } from "../funding-history";
import { onboardingSteps, onboardingStepOrder } from "../onboarding-steps";
import { validateFeeCapBps } from "../revenue-settings";
import { validateBuilderFee } from "../builder-fee";
import { TERMS_VERSION } from "../terms";
import { isSetupSubmission } from "../setup-submission";
import { isSavedSetupRequestReceipt } from "../setup-request-receipt";
import { isDepositStepConfirmation, retainDepositStepConfirmations } from "../deposit-step";
import { createDexActions } from "./dex-actions";
import {
  getChainFunding,
  getPendingDeposit,
  initialDraft,
  isSupported,
  normalizeChainIds,
} from "./draft";
import type { OnboardingState } from "./types";

export const createOnboardingState: StateCreator<OnboardingState> = (
  set,
  get,
) => ({
  ...initialDraft,
  revision: 0,
  ...createDexActions(set, get),
  setSetupSubmission(setupSubmission) {
    const current = get();
    if (current.termsAcceptedVersion === TERMS_VERSION && isSetupSubmission(setupSubmission, current)) {
      const depositStepConfirmations = retainDepositStepConfirmations(current);
      set({ setupSubmission, setupRequestReceipt: undefined, completed: false,
        depositStepConfirmations: retainDepositStepConfirmations({ ...current, setupSubmission, depositStepConfirmations }),
      });
    }
  },
  setSetupRequestReceipt(setupRequestReceipt) {
    if (isSavedSetupRequestReceipt(setupRequestReceipt, get())) set({ setupRequestReceipt });
  },
  rememberDepositStepConfirmation(confirmation) {
    if (!isDepositStepConfirmation(confirmation)) return;
    const current = get();
    set({ depositStepConfirmations: retainDepositStepConfirmations({ ...current, depositStepConfirmations: [...(current.depositStepConfirmations ?? []), confirmation] }) });
  },
  toggleChain(chainId) {
    if (!isSupported(chainId)) return;
    get().setChainIds([chainId]);
  },
  setChainIds(ids) {
    const chainIds = normalizeChainIds(ids);
    const current = get();
    if (JSON.stringify(chainIds) === JSON.stringify(current.chainIds)) return;
    set({
      chainIds,
      chainId:
        current.chainId !== null && chainIds.includes(current.chainId)
          ? current.chainId
          : (chainIds[0] ?? null),
      termsAcceptedVersion: null,
      setupSubmission: undefined,
      setupRequestReceipt: undefined,
      depositStepConfirmations: retainDepositStepConfirmations(current),
      termsSignatures: {},
      completed: false,
      revision: current.revision + 1,
    });
  },
  setActiveChainId(chainId) {
    if (get().chainIds.includes(chainId)) set({ chainId });
  },
  setDisplayName(displayName) {
    const current = get();
    if (displayName !== current.displayName)
      set({
        displayName,
        termsAcceptedVersion: null,
        setupSubmission: undefined,
        setupRequestReceipt: undefined,
        depositStepConfirmations: retainDepositStepConfirmations(current),
        termsSignatures: {},
        completed: false,
        revision: current.revision + 1,
      });
  },
  setContact(contact) {
    // Contact is not signed setup data, so editing it keeps terms and proofs.
    if (contact !== (get().contact ?? "")) set({ contact });
  },
  setStep(step) {
    const target = Math.max(0, Math.min(onboardingSteps.length - 1, Math.trunc(step)));
    if (!Number.isFinite(target) || !onboardingStepOrder.includes(target)) return;
    const current = get();
    const position = onboardingStepOrder.indexOf(target);
    if (position > onboardingStepOrder.indexOf(current.step))
      for (const previous of onboardingStepOrder.slice(0, position))
        if (getStepError(previous, current)) return;
    set({ step: target, completed: false });
  },
  setPartnerName(partnerName) {
    const current = get();
    if (partnerName === current.partnerName || getPendingDeposit(current))
      return;
    set({
      partnerName,
      fundingConfirmation: null,
      fundingConfirmations: [],
      termsAcceptedVersion: null,
      setupSubmission: undefined,
      setupRequestReceipt: undefined,
      depositStepConfirmations: retainDepositStepConfirmations(current),
      termsSignatures: {},
      completed: false,
      revision: current.revision + 1,
    });
  },
  setRevenueWallet(value) {
    const revenueWallet = value.trim();
    const current = get();
    if (revenueWallet === current.revenueWallet) return;
    set({
      revenueWallet,
      termsAcceptedVersion: null,
      setupSubmission: undefined,
      setupRequestReceipt: undefined,
      depositStepConfirmations: retainDepositStepConfirmations(current),
      termsSignatures: {},
      completed: false,
      revision: current.revision + 1,
    });
  },
  setBuilderFeeTenthsBps(value) {
    const builderFeeTenthsBps = validateBuilderFee(value) ? null : value;
    const current = get();
    if (builderFeeTenthsBps === current.builderFeeTenthsBps) return;
    set({ builderFeeTenthsBps, termsAcceptedVersion: null, setupSubmission: undefined,
      setupRequestReceipt: undefined, termsSignatures: {}, completed: false,
      depositStepConfirmations: retainDepositStepConfirmations(current), revision: current.revision + 1 });
  },
  setFeeCapBps(value) {
    const feeCapBps = validateFeeCapBps(value) ? null : value;
    const current = get();
    if (feeCapBps === current.feeCapBps) return;
    set({
      feeCapBps,
      termsAcceptedVersion: null,
      setupSubmission: undefined,
      setupRequestReceipt: undefined,
      depositStepConfirmations: retainDepositStepConfirmations(current),
      termsSignatures: {},
      completed: false,
      revision: current.revision + 1,
    });
  },
  setDepositAmount(depositAmount, id) {
    const current = get();
    const chainId = id ?? FUNDING_CHAIN_ID;
    if (chainId === null || !isSupported(chainId)) return;
    if (chainId === FUNDING_CHAIN_ID) depositAmount = FUNDING_AMOUNT;
    const funding = getChainFunding(current, chainId);
    if (
      funding.deposit?.status === "pending" ||
      funding.depositAmount === depositAmount
    )
      return;
    set({
      fundingByChain: {
        ...current.fundingByChain,
        [chainId]: { ...funding, depositAmount },
      },
      completed: current.setupSubmission ? current.completed : false,
      revision: current.revision + 1,
    });
  },
  setDeposit(deposit, id) {
    const current = get();
    const chainId = id ?? deposit?.chainId ?? FUNDING_CHAIN_ID;
    if (
      chainId === null ||
      !isSupported(chainId) ||
      (deposit && deposit.chainId !== chainId)
    )
      return;
    const funding = getChainFunding(current, chainId);
    if (!deposit && funding.deposit?.status === "pending") return;
    set({
      fundingByChain: {
        ...current.fundingByChain,
        [chainId]: { ...funding, deposit, fundingDeferred: false },
      },
      completed: current.setupSubmission ? current.completed : false,
    });
  },
  setFundingConfirmation(fundingConfirmation) {
    const current = get();
    if (!fundingConfirmation) {
      set({
        fundingConfirmation: null,
        fundingConfirmations: [],
        completed: current.setupSubmission ? current.completed : false,
      });
      return;
    }
    const history = appendFundingConfirmation(current, fundingConfirmation);
    if (!history) return;
    set({
      fundingConfirmation,
      fundingConfirmations: history,
      completed: current.setupSubmission ? current.completed : false,
    });
  },
  setIntegrationAcknowledged(integrationAcknowledged) {
    const current = get();
    if (integrationAcknowledged !== current.integrationAcknowledged)
      set({
        integrationAcknowledged,
        termsAcceptedVersion: null,
        setupSubmission: undefined,
        setupRequestReceipt: undefined,
        depositStepConfirmations: retainDepositStepConfirmations(current),
        termsSignatures: {},
        completed: false,
        revision: current.revision + 1,
      });
  },
  setTermsAccepted(accepted) {
    const current = get();
    const termsAcceptedVersion = accepted ? TERMS_VERSION : null;
    if (
      current.termsAcceptedVersion === termsAcceptedVersion &&
      (accepted || Object.keys(current.termsSignatures).length === 0)
    )
      return;
    set({
      termsAcceptedVersion,
      depositStepConfirmations: retainDepositStepConfirmations(current),
      ...(!accepted ? { termsSignatures: {}, setupSubmission: undefined, setupRequestReceipt: undefined } : {}),
      completed: false,
      revision: current.revision + 1,
    });
  },
  setTermsSignature(signature, id) {
    const current = get();
    const chainId = id ?? current.chainId;
    if (chainId === null || !current.chainIds.includes(chainId)) return;
    const termsSignatures = { ...current.termsSignatures };
    if (signature) termsSignatures[chainId] = signature;
    else delete termsSignatures[chainId];
    set({ termsSignatures, completed: false });
  },
  complete() {
    if (!onboardingSteps.some((_, step) => getStepError(step, get())))
      set({ completed: true });
  },
  reset() {
    set({
      ...initialDraft,
      chainIds: [],
      fundingByChain: {},
      fundingConfirmations: [],
      termsAcceptedVersion: null,
      setupSubmission: undefined,
      setupRequestReceipt: undefined,
      depositStepConfirmations: undefined,
      termsSignatures: {},
      origins: [],
      revision: get().revision + 1,
    });
  },
});
