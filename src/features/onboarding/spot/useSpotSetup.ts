import { trackStory } from "@/lib/telemetry/analytics";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useMountedRef } from "@/hooks/useMountedRef";
import { useStepHistory } from "@/hooks/useStepHistory";
import { focusStepStart } from "@/lib/step-focus";
import { spotStoryDetails } from "../story-details";
import { safeStorage } from "../state/storage";
import { emptySpotDraft, restoreSpotDraft, SPOT_DRAFT_KEY, spotStepError, spotStepsForMode } from "./spot-setup";
import { SpotAppIdTakenError, submitSpot } from "./submit-spot";
import { spotAppIdExists } from "./spot-app-id-availability";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useConfig } from "wagmi";
import { getAccount } from "wagmi/actions";
import { createRequestAttempt } from "../request-attempt";
import { useQueryClient } from "@tanstack/react-query";
import type { SpotDraft, SpotSetupSnapshot, SpotStep } from "./spot-setup";

function readDraft(): SpotDraft {
  try {
    const saved = safeStorage.getItem(SPOT_DRAFT_KEY);
    return restoreSpotDraft(typeof saved === "string" ? JSON.parse(saved) : null);
  } catch { return emptySpotDraft(); }
}

export function useSpotSetup(disabled: boolean) {
  const config = useConfig();
  const queryClient = useQueryClient();
  const { openConnectModal } = useConnectModal();
  const requestAttempt = useRef(createRequestAttempt());
  const [draft, setDraft] = useState(readDraft);
  const [saved, setSaved] = useState<SpotSetupSnapshot | null>(null);
  const [tried, setTried] = useState(false);
  const [walletBusy, setWalletBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkingAppId, setCheckingAppId] = useState(false);
  const [appIdCheck, setAppIdCheck] = useState<{ name: string; kind: "taken" | "unavailable" } | null>(null);
  // Set by Review's Edit links so Next returns straight to Review instead of walking every step.
  const [returnToReview, setReturnToReview] = useState(false);
  // Field to focus after an Edit link opens a step whose first field is a different one.
  const editFocus = useRef<string | null>(null);
  const inFlight = useRef(false);
  const delivered = useRef<{ scope: string; snapshot: SpotSetupSnapshot } | null>(null);
  const mounted = useMountedRef();
  const submissionToast = useRef<{ id: string | number; succeeded: boolean } | null>(null);
  const busy = disabled || walletBusy || submitting || checkingAppId;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const spotSteps = spotStepsForMode(draft.integrationMode);
  const index = spotSteps.findIndex((step) => step.id === draft.step);
  const step = spotSteps[index];
  const error = tried ? spotStepError(draft.step, draft) ?? (draft.step === "app" && appIdCheck?.name === draft.appName && appIdCheck.kind === "taken"
    ? "An app with this name already exists. Choose another app name." : undefined) : undefined;
  useEffect(() => () => {
    const current = submissionToast.current;
    if (current && !current.succeeded) toast.dismiss(current.id);
  }, []);
  function dismissSaveError() {
    const current = submissionToast.current;
    if (current && !current.succeeded) {
      toast.dismiss(current.id);
      submissionToast.current = null;
    }
  }
  useEffect(() => {
    if (saved) safeStorage.removeItem(SPOT_DRAFT_KEY);
    else safeStorage.setItem(SPOT_DRAFT_KEY, JSON.stringify(draft));
  }, [draft, saved]);
  useEffect(() => {
    const field = editFocus.current ?? `spot-${draft.step}`;
    editFocus.current = null;
    focusStepStart(saved || draft.step === "review" ? null : document.getElementById(field), headingRef.current);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [draft.step, saved]);
  function update(field: "appName" | "contact" | "dexUrl" | "feesWallet" | "tradingFeePercent", value: string) {
    if (busy || saved || inFlight.current) return;
    dismissSaveError();
    // Contact only reaches the team's message, so editing it keeps the policy acceptance.
    setDraft((current) => ({ ...current, [field]: value, policyAccepted: field === "contact" ? current.policyAccepted : false }));
  }
  function selectIntegration(mode: "ui" | "existing") {
    if (busy || saved || inFlight.current) return;
    setDraft(current => ({ ...current, integrationMode: mode, policyAccepted: false }));
  }
  function navigate(target: number) {
    if (busy || saved || inFlight.current || !spotSteps[target]) return;
    const invalid = spotSteps.slice(0, target).find((item) => spotStepError(item.id, draft));
    if (target > index && invalid) return;
    setDraft((current) => ({ ...current, step: spotSteps[target].id }));
    if (spotSteps[target].id === "review") setReturnToReview(false);
    setTried(false);
    dismissSaveError();
  }
  // Browser Back/Forward between Spot steps; a submitted setup has no step to return to.
  useStepHistory("spot", saved ? null : draft.step, (target) => {
    const position = spotSteps.findIndex((item) => item.id === target);
    if (busy || saved || inFlight.current || position < 0) return false;
    if (position > index && spotSteps.slice(0, position).some((item) => spotStepError(item.id, draft))) return false;
    navigate(position);
    return true;
  });
  async function next() {
    if (busy || saved || inFlight.current) return;
    const invalid = spotSteps.slice(0, index + 1)
      .map((item) => ({ id: item.id, error: spotStepError(item.id, draft) }))
      .find((item) => item.error);
    if (invalid?.error) {
      setTried(true);
      setDraft((current) => ({ ...current, step: invalid.id }));
      requestAnimationFrame(() => (document.querySelector<HTMLElement>('main [aria-invalid="true"]') ?? document.getElementById(`spot-${invalid.id}`))?.focus());
      return;
    }
    if (draft.step !== "deposit") {
      const review = spotSteps.findIndex((item) => item.id === "review");
      const canReturn = returnToReview && !spotSteps.slice(0, review).some((item) => spotStepError(item.id, draft));
      if (draft.step === "app") {
        inFlight.current = true;
        setCheckingAppId(true);
        setAppIdCheck(null);
        try {
          const exists = await spotAppIdExists(draft.appName);
          if (!mounted.current) return;
          if (exists) {
            setTried(true);
            setAppIdCheck({ name: draft.appName, kind: "taken" });
            requestAnimationFrame(() => document.getElementById("spot-app")?.focus());
          } else {
            inFlight.current = false;
            navigate(canReturn ? review : index + 1);
          }
        } catch {
          if (mounted.current) setAppIdCheck({ name: draft.appName, kind: "unavailable" });
        } finally { inFlight.current = false; if (mounted.current) setCheckingAppId(false); }
        return;
      }
      navigate(canReturn ? review : index + 1); return;
    }
    const account = getAccount(config);
    if (!account.isConnected || !account.address) {
      if (openConnectModal) { toast.info("Connect your owner wallet, then submit your setup."); openConnectModal(); }
      else toast.error("Connect your owner wallet to submit your setup.");
      return;
    }
    inFlight.current = true;
    setSubmitting(true);
    dismissSaveError();
    const scope = `${JSON.stringify(draft)}:${account.address.toLowerCase()}`;
    void trackStory("submission-request", { product: "spot", retry: delivered.current?.scope === scope, ...spotStoryDetails(draft) });
    const attempt = { id: toast.loading("Submitting your Spot setup…", { duration: Infinity, dismissible: false, closeButton: false }), succeeded: false };
    submissionToast.current = attempt;
    try {
      // A storage-only retry in this mounted form must not send the message again.
      const snapshot = delivered.current?.scope === scope ? delivered.current.snapshot : await submitSpot(draft, account.address, requestAttempt.current(scope));
      if (!mounted.current) return;
      if (delivered.current?.scope !== scope) void trackStory("delivery-success", { product: "spot", ...spotStoryDetails(draft) });
      delivered.current = { scope, snapshot };
      void queryClient.invalidateQueries({ queryKey: ["wallet-requests"] });
      void trackStory("submission-success", { product: "spot", ...spotStoryDetails(draft) });
      setSaved(snapshot);
      const url = new URL(window.location.href);
      url.searchParams.delete("setup");
      window.history.replaceState(null, "", url);
      attempt.succeeded = true;
      toast.success("Spot setup submitted", { id: attempt.id, duration: 4000, dismissible: true, closeButton: true });
    } catch (cause) {
      if (mounted.current) void trackStory("submission-failed", { product: "spot", ...spotStoryDetails(draft) });
      if (mounted.current && cause instanceof SpotAppIdTakenError) {
        toast.dismiss(attempt.id);
        submissionToast.current = null;
        setAppIdCheck({ name: draft.appName, kind: "taken" });
        setTried(true);
        setReturnToReview(true);
        setDraft(current => ({ ...current, step: "app" }));
        requestAnimationFrame(() => document.getElementById("spot-app")?.focus());
      } else if (mounted.current) toast.error(cause instanceof Error ? cause.message : "We couldn’t submit your Spot setup. Please try again.",
        { id: attempt.id, duration: 6000, dismissible: true, closeButton: true });
    } finally {
      inFlight.current = false;
      if (mounted.current) setSubmitting(false);
    }
  }
  function acceptPolicy(accepted: boolean) {
    if (busy || saved || inFlight.current) return;
    setDraft((current) => ({ ...current, policyAccepted: accepted }));
  }
  function reset() {
    if (busy || inFlight.current) return false;
    // Start over can unmount Spot before its persistence effect runs.
    safeStorage.removeItem(SPOT_DRAFT_KEY);
    setSaved(null);
    delivered.current = null;
    setDraft(emptySpotDraft());
    setTried(false);
    setReturnToReview(false);
    dismissSaveError();
    const url = new URL(window.location.href);
    url.searchParams.set("setup", "spot");
    window.history.replaceState(null, "", url);
    return true;
  }
  const progress = spotSteps.map((item, position) => ({
    name: item.name, target: position, active: position === index,
    done: position < index && !spotStepError(item.id, draft),
    disabled: busy || position > index,
  }));
  function fillWallet(address: string, scope: string) {
    if (inFlight.current) return;
    setDraft((current) => current.step === "wallet" && JSON.stringify(current) === scope
      ? { ...current, feesWallet: address, policyAccepted: false } : current);
  }
  return { draft, saved, step, index, error, headingRef, progress, update, selectIntegration, navigate, next, acceptPolicy, reset, busy, submitting, checkingAppId,
    appIdUnavailable: draft.step === "app" && appIdCheck?.name === draft.appName && appIdCheck.kind === "unavailable",
    fillWallet, onWalletBusyChange: setWalletBusy, returnToReview: returnToReview && draft.step !== "review",
    // While editing from Review, Back returns there once the edited step is valid again.
    back: () => {
      const review = spotSteps.findIndex((item) => item.id === "review");
      if (returnToReview && draft.step !== "review" && !spotSteps.slice(0, review).some((item) => spotStepError(item.id, draft))) navigate(review);
      else if (index > 0) navigate(index - 1);
      else return false;
      return true;
    },
    edit: (id: SpotStep, field?: string) => {
      if (busy || saved || inFlight.current) return;
      editFocus.current = field ?? null;
      setReturnToReview(true);
      navigate(spotSteps.findIndex((item) => item.id === id));
    } };
}
