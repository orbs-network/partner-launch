import { useCallback, useEffect, useRef, useState } from "react";
import { useConfig } from "wagmi";
import { getAccount } from "wagmi/actions";
import { useOnboardingStore } from "../store";
import { useValidationToast } from "@/hooks/useValidationToast";
import { useStepHistory } from "@/hooks/useStepHistory";
import { getStepError } from "../validation";
import { validateRevenueWallet } from "../revenue-settings";
import { getSetupCompletionError } from "../completion-validation";
import { launchProgress, nextLaunchStep, previousLaunchStep } from "../launch-flow";
import { rememberCompletedSetup } from "../saved-setups";
import { rememberPendingRequest } from "../../pending-requests";
import { setupHash } from "../setup-submission";
import { formatBuilderFeePercent } from "../builder-fee";
import { isSupported } from "../state/draft";
import {
  FUNDING_STEP,
  NETWORKS_STEP,
  PARTNER_STEP,
  WELCOME_STEP,
  onboardingStepOrder as stepOrder,
  onboardingSteps as steps,
} from "../onboarding-steps";

export function useOnboardingWizard(externalBusy = false) {
  const draft = useOnboardingStore();
  const config = useConfig();
  const { error: showActionError, dismiss: dismissActionError } = useValidationToast();
  const [resetOpen, setResetOpen] = useState(false);
  // Keep fields neutral until the user attempts to continue.
  const [submitted, setSubmitted] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [showCompletion, setShowCompletion] = useState(draft.completed);
  const busy = actionBusy || externalBusy;
  const activeStep = steps[draft.step] ?? steps[0];
  const stepError = submitted
    ? draft.step === NETWORKS_STEP && draft.chainIds.length !== 1
      ? "Choose one network for this setup."
      : getStepError(draft.step, draft) ?? ""
    : "";
  const continueLabel =
    activeStep.id === "welcome"
      ? "Get started"
      : activeStep.id === "funding"
        ? "Sign Deposit & Submit"
        : "Next step";
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousStepRef = useRef(draft.step);
  const resetButtonRef = useRef<HTMLButtonElement>(null);
  const onBusyChange = useCallback(
    (value: boolean) => setActionBusy(value),
    [],
  );
  useEffect(() => {
    if (previousStepRef.current !== draft.step) {
      (headingRef.current ?? document.querySelector<HTMLElement>("main h1"))?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "instant" });
    }
    previousStepRef.current = draft.step;
  }, [draft.step]);
  useEffect(() => {
    if (draft.step === WELCOME_STEP) document.querySelector<HTMLElement>("main h1")?.focus({ preventScroll: true });
  }, [draft.launchPath, draft.step]);
  useEffect(dismissActionError, [draft.revision, dismissActionError]);
  function navigate(step: number) {
    if (busy || !stepOrder.includes(step)) return;
    const current = useOnboardingStore.getState();
    if (stepOrder.indexOf(step) > stepOrder.indexOf(NETWORKS_STEP) && current.chainIds.length !== 1) {
      current.setStep(NETWORKS_STEP);
      setSubmitted(true);
      return;
    }
    dismissActionError();
    setSubmitted(false);
    current.setStep(step);
    setShowCompletion(false);
  }
  // Browser Back/Forward between steps; completion has no step to return to.
  useStepHistory("perps", showCompletion ? null : draft.step, (target) => {
    if (busy || showCompletion || !stepOrder.includes(target)) return false;
    const current = useOnboardingStore.getState();
    const reachable = target === WELCOME_STEP
      || launchProgress(current, false).some((item) => item.target === target && !item.disabled);
    if (!reachable) return false;
    navigate(target);
    return true;
  });
  function selectNetwork(chainId: number) {
    const current = useOnboardingStore.getState();
    if (busy || current.step !== NETWORKS_STEP || !isSupported(chainId)) return;
    current.setChainIds([chainId]);
    navigate(nextLaunchStep(NETWORKS_STEP));
  }
  function choosePath(path: "creator" | null) {
    if (busy) return;
    draft.setLaunchPath(path);
    navigate(path === null ? WELCOME_STEP : PARTNER_STEP);
  }
  function finish() {
    const currentDraft = useOnboardingStore.getState();
    const invalidStep = stepOrder.find(step => step !== FUNDING_STEP && getStepError(step, currentDraft));
    if (invalidStep !== undefined) {
      currentDraft.setStep(invalidStep);
      setSubmitted(true);
      return;
    }
    const account = getAccount(config);
    const invalid = getSetupCompletionError(currentDraft, account);
    if (invalid) {
      showActionError(invalid);
      return;
    }
    try {
      rememberPendingRequest({ id: `perps:${setupHash(currentDraft)}`, kind: "perps", status: "pending",
        appName: currentDraft.displayName || currentDraft.partnerName, partnerId: currentDraft.partnerName,
        chainIds: currentDraft.chainIds, revenueWallet: currentDraft.revenueWallet,
        savedAt: currentDraft.setupRequestReceipt!.receivedAt, notification: "telegram",
        ...(currentDraft.builderFeeTenthsBps == null ? {} : { extraFeePercent: formatBuilderFeePercent(currentDraft.builderFeeTenthsBps) }) });
      rememberCompletedSetup({ ...currentDraft, completed: true });
    } catch (cause) {
      showActionError(cause instanceof Error ? cause.message : "We couldn’t save your pending request. Please try again.");
      return;
    }
    currentDraft.complete();
    setShowCompletion(true);
    dismissActionError();
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function next() {
    if (busy) return;
    const currentDraft = useOnboardingStore.getState();
    const invalid = currentDraft.step === NETWORKS_STEP && currentDraft.chainIds.length !== 1
      ? "Choose one network for this setup." : getStepError(currentDraft.step, currentDraft);
    if (invalid) {
      setSubmitted(true);
      requestAnimationFrame(() => {
        const field =
          (activeStep.id === "revenue" && validateRevenueWallet(currentDraft.revenueWallet)
            ? document.getElementById("revenue-wallet")
            : null) ??
          document.querySelector<HTMLElement>('main [aria-invalid="true"]') ??
          document.querySelector<HTMLElement>(
            'main form [role="checkbox"], main form input:not([type="hidden"])',
          );
        (field ?? headingRef.current)?.focus();
      });
      return;
    }
    if (currentDraft.step === FUNDING_STEP) finish();
    else navigate(nextLaunchStep(currentDraft.step));
  }
  function openReset() {
    if (busy) return;
    setResetOpen(true);
  }
  function reset() {
    if (busy) return;
    useOnboardingStore.getState().reset();
    dismissActionError();
    setSubmitted(false);
    setShowCompletion(false);
    setResetOpen(false);
  }
  const progress = launchProgress(draft, busy);
  return {
    step: draft.step,
    activeStep,
    launchPath: draft.launchPath,
    progress,
    busy,
    canContinue: !busy,
    continueLabel,
    stepError,
    showCompletion,
    resetOpen,
    headingRef,
    resetButtonRef,
    onBusyChange,
    navigate,
    choosePath,
    selectNetwork,
    back: () => navigate(previousLaunchStep(draft.step)),
    next,
    onFundingConfirmed: finish,
    reset,
    openReset,
    closeReset: () => setResetOpen(false),
  };
}
