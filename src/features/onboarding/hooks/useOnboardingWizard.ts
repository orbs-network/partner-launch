import { useCallback, useEffect, useRef, useState } from "react";
import { useConfig } from "wagmi";
import { getAccount } from "wagmi/actions";
import { useOnboardingStore } from "../store";
import { useValidationToast } from "@/hooks/useValidationToast";
import { useChainCollateral } from "./useChainCollateral";
import { useStepHistory } from "@/hooks/useStepHistory";
import { focusStepStart } from "@/lib/step-focus";
import { clearPerpsRoute, perpsStepUrl } from "../perps-route";
import { getStepError } from "../validation";
import { validateRevenueWallet } from "../revenue-settings";
import { getSetupCompletionError } from "../completion-validation";
import { launchProgress, nextLaunchStep, previousLaunchStep } from "../launch-flow";
import { rememberCompletedSetup } from "../saved-setups";
import { selectablePerpsChains } from "@/config/chains";
import { fetchPartnerRegistryStatus } from "../registry-status";
import { useMountedRef } from "@/hooks/useMountedRef";
import {
  FUNDING_STEP,
  NETWORKS_STEP,
  PARTNER_STEP,
  TERMS_STEP,
  WELCOME_STEP,
  onboardingStepOrder as stepOrder,
  onboardingSteps as steps,
} from "../onboarding-steps";

export function useOnboardingWizard(externalBusy = false) {
  const draft = useOnboardingStore();
  useChainCollateral(!draft.completed && draft.chainIds.length === 1 ? draft.chainIds[0] : null);
  const config = useConfig();
  const { error: showActionError, dismiss: dismissActionError } = useValidationToast();
  const [resetOpen, setResetOpen] = useState(false);
  // Keep fields neutral until the user attempts to continue.
  const [submitted, setSubmitted] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [checkingPartner, setCheckingPartner] = useState(false);
  const [partnerCheck, setPartnerCheck] = useState<{ id: string; kind: "taken" | "unavailable" } | null>(null);
  const partnerCheckInFlight = useRef(false);
  const checkedPartnerRef = useRef<{ id: string; revision: number } | null>(null);
  const mounted = useMountedRef();
  const [showCompletion, setShowCompletion] = useState(draft.completed);
  // Set by Review's Edit links so Next (or a network choice) returns straight to Review.
  const [returnToReview, setReturnToReview] = useState(false);
  // Field to focus after an Edit link opens a step whose first field is a different one.
  const editFocusRef = useRef<string | null>(null);
  const returning = returnToReview && draft.step !== TERMS_STEP && draft.step !== FUNDING_STEP;
  const busy = actionBusy || externalBusy || checkingPartner;
  const activeStep = steps[draft.step] ?? steps[0];
  const stepError = submitted
    ? draft.step === NETWORKS_STEP && draft.chainIds.length !== 1
      ? "Choose one network for this setup."
      : getStepError(draft.step, draft) ?? (draft.step === PARTNER_STEP && partnerCheck?.id === draft.partnerName && partnerCheck.kind === "taken"
        ? draft.launchPath === "api" ? "This Partner ID already exists. Choose another one." : "An app with this name already exists. Choose another app name." : "")
    : "";
  const continueLabel =
    activeStep.id === "welcome"
      ? "Get started"
      : activeStep.id === "funding"
        ? "Submit setup"
        : returning ? "Save changes" : "Next step";
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousStepRef = useRef(draft.step);
  const resetButtonRef = useRef<HTMLButtonElement>(null);
  const onBusyChange = useCallback(
    (value: boolean) => setActionBusy(value),
    [],
  );
  useEffect(() => {
    if (previousStepRef.current !== draft.step) {
      const heading = headingRef.current ?? document.querySelector<HTMLElement>("main h1");
      const editField = editFocusRef.current ? document.getElementById(editFocusRef.current) : null;
      editFocusRef.current = null;
      focusStepStart(editField ?? document.querySelector<HTMLElement>("#onboarding-step input:not([type='hidden']):not([type='radio']):not([type='range'])"), heading);
      window.scrollTo({ top: 0, behavior: "instant" });
    }
    previousStepRef.current = draft.step;
  }, [draft.step]);
  useEffect(() => {
    if (draft.step === WELCOME_STEP) document.querySelector<HTMLElement>("main h1")?.focus({ preventScroll: true });
  }, [draft.launchPath, draft.step]);
  useEffect(dismissActionError, [draft.revision, dismissActionError]);
  function navigate(step: number) {
    if (busy || partnerCheckInFlight.current || !stepOrder.includes(step)) return;
    const current = useOnboardingStore.getState();
    if (current.step === PARTNER_STEP && stepOrder.indexOf(step) > stepOrder.indexOf(PARTNER_STEP) &&
      (checkedPartnerRef.current?.id !== current.partnerName || checkedPartnerRef.current.revision !== current.revision)) {
      void checkPartnerAndContinue(current.partnerName, current.revision, current.contact ?? "", step);
      return;
    }
    if (stepOrder.indexOf(step) > stepOrder.indexOf(NETWORKS_STEP) && current.chainIds.length !== 1) {
      current.setStep(NETWORKS_STEP);
      setSubmitted(true);
      return;
    }
    dismissActionError();
    setSubmitted(false);
    if (step === TERMS_STEP || step === WELCOME_STEP) setReturnToReview(false);
    current.setStep(step);
    setShowCompletion(false);
  }
  // Browser Back/Forward between steps; completion has no step to return to.
  useStepHistory("perps", showCompletion ? null : draft.step, (target) => {
    if (busy || showCompletion || !stepOrder.includes(target)) return false;
    const current = useOnboardingStore.getState();
    if (current.step === PARTNER_STEP && stepOrder.indexOf(target) > stepOrder.indexOf(PARTNER_STEP) &&
      (checkedPartnerRef.current?.id !== current.partnerName || checkedPartnerRef.current.revision !== current.revision)) return false;
    const reachable = target === WELCOME_STEP
      || launchProgress(current, false).some((item) => item.target === target && !item.disabled);
    if (!reachable) return false;
    navigate(target);
    return true;
  }, perpsStepUrl);
  function selectNetwork(chainId: number) {
    const current = useOnboardingStore.getState();
    if (busy || current.step !== NETWORKS_STEP || !selectablePerpsChains.some(chain => chain.id === chainId)) return;
    current.setChainIds([chainId]);
    navigate(reviewTarget() ?? nextLaunchStep(NETWORKS_STEP));
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
      rememberCompletedSetup({ ...currentDraft, completed: true });
    } catch (cause) {
      showActionError(cause instanceof Error ? cause.message : "We couldn’t save your pending request. Please try again.");
      return;
    }
    currentDraft.complete();
    clearPerpsRoute();
    setShowCompletion(true);
    dismissActionError();
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function next() {
    if (busy || partnerCheckInFlight.current) return;
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
    if (currentDraft.step === PARTNER_STEP) {
      void checkPartnerAndContinue(currentDraft.partnerName, currentDraft.revision, currentDraft.contact ?? "", reviewTarget() ?? nextLaunchStep(PARTNER_STEP));
    } else if (currentDraft.step === FUNDING_STEP) finish();
    else {
      navigate(reviewTarget() ?? nextLaunchStep(currentDraft.step));
    }
  }
  async function checkPartnerAndContinue(id: string, revision: number, contact: string, target: number) {
    partnerCheckInFlight.current = true;
    setCheckingPartner(true);
    setPartnerCheck(null);
    try {
      const result = await fetchPartnerRegistryStatus(id, AbortSignal.timeout(8000), true);
      const current = useOnboardingStore.getState();
      if (!mounted.current || current.step !== PARTNER_STEP || current.partnerName !== id || current.revision !== revision || (current.contact ?? "") !== contact) return;
      if (result.exists) {
        setSubmitted(true);
        setPartnerCheck({ id, kind: "taken" });
        requestAnimationFrame(() => document.getElementById(current.launchPath === "api" ? "app-id" : "partner-name")?.focus());
      } else {
        checkedPartnerRef.current = { id, revision };
        partnerCheckInFlight.current = false;
        navigate(target);
      }
    } catch {
      const current = useOnboardingStore.getState();
      if (mounted.current && current.step === PARTNER_STEP && current.partnerName === id && current.revision === revision)
        setPartnerCheck({ id, kind: "unavailable" });
    } finally {
      partnerCheckInFlight.current = false;
      if (mounted.current) setCheckingPartner(false);
    }
  }
  /** Review, when an Edit link opened this step and every detail before Review is valid. */
  function reviewTarget() {
    if (!returnToReview) return undefined;
    const current = useOnboardingStore.getState();
    const beforeReview = stepOrder.slice(1, stepOrder.indexOf(TERMS_STEP));
    if (current.chainIds.length !== 1 || beforeReview.some((step) => getStepError(step, current))) return undefined;
    return TERMS_STEP;
  }
  function editFromReview(step: number, field?: string) {
    if (busy) return;
    editFocusRef.current = field ?? null;
    setReturnToReview(true);
    navigate(step);
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
    setReturnToReview(false);
    setShowCompletion(false);
    setResetOpen(false);
  }
  const progress = launchProgress(draft, busy).map(item => draft.step === PARTNER_STEP &&
    item.target !== undefined && stepOrder.indexOf(item.target) > stepOrder.indexOf(PARTNER_STEP)
      ? { ...item, disabled: true } : item);
  return {
    step: draft.step,
    activeStep,
    launchPath: draft.launchPath,
    progress,
    busy,
    canContinue: !busy,
    continueLabel,
    checkingPartner,
    stepError,
    partnerCheckUnavailable: draft.step === PARTNER_STEP && partnerCheck?.id === draft.partnerName && partnerCheck.kind === "unavailable",
    showCompletion,
    resetOpen,
    headingRef,
    resetButtonRef,
    onBusyChange,
    navigate,
    choosePath,
    selectNetwork,
    // While editing from Review, Back returns there once the details are valid again.
    back: () => navigate((returning ? reviewTarget() : undefined) ?? previousLaunchStep(draft.step)),
    next,
    onFundingConfirmed: finish,
    editFromReview,
    reset,
    openReset,
    closeReset: () => setResetOpen(false),
  };
}
