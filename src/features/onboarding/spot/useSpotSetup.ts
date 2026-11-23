import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useMountedRef } from "@/hooks/useMountedRef";
import { useStepHistory } from "@/hooks/useStepHistory";
import { rememberPendingRequest } from "../../pending-requests";
import { safeStorage } from "../state/storage";
import { emptySpotDraft, restoreSpotDraft, SPOT_DRAFT_KEY, spotStepError, spotSteps } from "./spot-setup";
import { submitSpot } from "./submit-spot";
import type { SpotDraft, SpotSetupSnapshot, SpotStep } from "./spot-setup";

function readDraft(): SpotDraft {
  try {
    const saved = safeStorage.getItem(SPOT_DRAFT_KEY);
    return restoreSpotDraft(typeof saved === "string" ? JSON.parse(saved) : null);
  } catch { return emptySpotDraft(); }
}

export function useSpotSetup(disabled: boolean) {
  const [draft, setDraft] = useState(readDraft);
  const [saved, setSaved] = useState<SpotSetupSnapshot | null>(null);
  const [tried, setTried] = useState(false);
  const [walletBusy, setWalletBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inFlight = useRef(false);
  const delivered = useRef<{ scope: string; snapshot: SpotSetupSnapshot } | null>(null);
  const mounted = useMountedRef();
  const submissionToast = useRef<{ id: string | number; succeeded: boolean } | null>(null);
  const busy = disabled || walletBusy || submitting;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const index = spotSteps.findIndex((step) => step.id === draft.step);
  const step = spotSteps[index];
  const error = tried ? spotStepError(draft.step, draft) : undefined;
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
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [draft.step, saved]);
  function update(field: "appName" | "dexUrl" | "feesWallet", value: string) {
    if (busy || saved || inFlight.current) return;
    dismissSaveError();
    setDraft((current) => ({ ...current, [field]: value, policyAccepted: false }));
  }
  function navigate(target: number) {
    if (busy || saved || inFlight.current || !spotSteps[target]) return;
    const invalid = spotSteps.slice(0, target).find((item) => spotStepError(item.id, draft));
    if (target > index && invalid) return;
    setDraft((current) => ({ ...current, step: spotSteps[target].id }));
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
      requestAnimationFrame(() => document.getElementById(`spot-${invalid.id}`)?.focus());
      return;
    }
    if (draft.step !== "review") { navigate(index + 1); return; }
    inFlight.current = true;
    setSubmitting(true);
    dismissSaveError();
    const scope = JSON.stringify(draft);
    const attempt = { id: toast.loading("Submitting your Spot setup…", { duration: Infinity, dismissible: false, closeButton: false }), succeeded: false };
    submissionToast.current = attempt;
    try {
      // A storage-only retry in this mounted form must not send the message again.
      const snapshot = delivered.current?.scope === scope ? delivered.current.snapshot : await submitSpot(draft);
      if (!mounted.current) return;
      delivered.current = { scope, snapshot };
      rememberPendingRequest({ id: `spot:${snapshot.appName}:${snapshot.feesWallet.toLowerCase()}`, kind: "spot", status: "pending",
        appName: snapshot.appName, feesWallet: snapshot.feesWallet, dexUrl: snapshot.dexUrl,
        savedAt: snapshot.policy.acceptedAt, notification: "telegram" });
      setSaved(snapshot);
      const url = new URL(window.location.href);
      url.searchParams.delete("setup");
      window.history.replaceState(null, "", url);
      attempt.succeeded = true;
      toast.success("Spot setup submitted", { id: attempt.id, duration: 4000, dismissible: true, closeButton: true });
    } catch (cause) {
      if (mounted.current) toast.error(cause instanceof Error ? cause.message : "We couldn’t submit your Spot setup. Please try again.",
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
  return { draft, saved, step, index, error, headingRef, progress, update, navigate, next, acceptPolicy, reset, busy, submitting,
    fillWallet, onWalletBusyChange: setWalletBusy,
    edit: (id: SpotStep) => navigate(spotSteps.findIndex((item) => item.id === id)) };
}
