import { trackStory } from "@/lib/telemetry/analytics";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccount, useConfig } from "wagmi";
import { getAccount } from "wagmi/actions";
import { toast } from "sonner";
import { chainById } from "@/config/chains";
import { perpsStoryDetails } from "../story-details";
import { useOnboardingStore } from "../store";
import { setupHash } from "../setup-submission";
import { submitPerps } from "../submit-perps";
import { createRequestAttempt } from "../request-attempt";
import { TERMS_VERSION } from "../terms-policy";
import { FUNDING_STEP, onboardingSteps } from "../onboarding-steps";
import { getStepError } from "../validation";
import type { FundingIntent } from "../funding-execution";
import { useFundingConnection } from "./useFundingConnection";
import { useMountedRef } from "./useMountedRef";
import { useStepBusy } from "./useStepBusy";
import { fundingError } from "../funding";

export function useSetupSubmission({ onBusyChange, onComplete }: { onBusyChange: (busy: boolean) => void; onComplete: () => void }) {
  const config = useConfig();
  const queryClient = useQueryClient();
  const wallet = useAccount();
  const mounted = useMountedRef();
  const [phase, setPhase] = useState<"sending" | null>(null);
  const inFlight = useRef(false);
  const requestAttempt = useRef(createRequestAttempt());
  const delivered = useRef<{ scope: string; submittedAt: string } | null>(null);
  const toastPrefix = useId();
  const attempt = useRef({ sequence: 0, id: undefined as string | undefined, succeeded: false, hash: "" });
  useEffect(() => () => {
    if (attempt.current.id && !attempt.current.succeeded) toast.dismiss(attempt.current.id);
  }, []);
  const reportError = useCallback((cause: unknown) => {
    if (!mounted.current) return;
    const message = fundingError(cause);
    // Closing the wallet picker or rejecting the signature is a choice, not a failure: reset quietly.
    if (!message.startsWith("Network switch cancelled.") && /reject|denied|cancelled|canceled/i.test(message)) {
      if (attempt.current.id) toast.dismiss(attempt.current.id);
      return;
    }
    toast.error(message.length > 220 ? "We couldn’t submit your setup. Please try again." : message, { id: attempt.current.id });
  }, [mounted]);
  const mutation = useMutation({
    retry: false,
    mutationFn: async (intent: FundingIntent) => {
      const draft = useOnboardingStore.getState();
      const account = getAccount(config);
      if (account.status !== "connected" || !account.address) throw new Error("Connect your wallet to continue.");
      const address = account.address;
      const expectedHash = attempt.current.hash;
      const assertCurrent = () => {
        const current = useOnboardingStore.getState();
        const live = getAccount(config);
        if (!mounted.current || current.revision !== intent.revision || current.partnerName !== intent.partnerId || setupHash(current) !== expectedHash ||
          live.status !== "connected" || live.address?.toLowerCase() !== address.toLowerCase() || live.connector?.uid !== account.connector.uid)
          throw new Error("Your wallet or setup changed. Check your details and try again.");
      };
      assertCurrent();
      if (draft.chainIds.length !== 1) throw new Error("Choose one network for this setup.");
      const selectedChain = chainById(draft.chainIds[0]);
      if (!selectedChain) throw new Error("Choose a supported network for this setup.");
      const invalid = onboardingSteps.slice(0, FUNDING_STEP).map((_, step) => getStepError(step, draft)).find(Boolean);
      if (invalid) throw new Error(invalid);
      if (draft.termsAcceptedVersion !== TERMS_VERSION) throw new Error("Accept the terms before saving your setup.");
      const scope = `${expectedHash}:${address.toLowerCase()}:${draft.contact ?? ""}`;
      const storageRetry = delivered.current?.scope === scope;
      void trackStory("submission-request", { product: "perps", retry: storageRetry, ...perpsStoryDetails(draft), walletAddress: address });
      setPhase("sending");
      toast.loading("Sending your setup to the team…", { id: attempt.current.id });
      const delivery = delivered.current?.scope === scope ? delivered.current : await submitPerps(draft, address, assertCurrent, requestAttempt.current(scope));
      if (!storageRetry) void trackStory("delivery-success", { product: "perps", ...perpsStoryDetails(draft), walletAddress: address });
      delivered.current = { scope, submittedAt: delivery.submittedAt };
      void queryClient.invalidateQueries({ queryKey: ["wallet-requests"] });
      assertCurrent();
      useOnboardingStore.getState().setSetupRequestReceipt({
        requestId: crypto.randomUUID(), partnerId: draft.partnerName, status: "pending-review", mock: true,
        transport: "local", setupHash: expectedHash, receivedAt: delivery.submittedAt,
        notification: "telegram", verification: "unsigned", ownerWallet: address,
      });
      assertCurrent();
    },
    onSuccess: async () => {
      if (!mounted.current) { if (attempt.current.id) toast.dismiss(attempt.current.id); return; }
      onComplete();
      const currentDraft = useOnboardingStore.getState();
      const account = getAccount(config);
      void trackStory(currentDraft.completed ? "submission-success" : "submission-failed", {
        product: "perps", ...perpsStoryDetails(currentDraft), ...(account.address ? { walletAddress: account.address } : {}),
      });
      if (currentDraft.completed) {
        attempt.current.succeeded = true;
        toast.success("Setup submitted", { id: attempt.current.id });
      } else if (attempt.current.id) toast.dismiss(attempt.current.id);
    },
    onError: async (cause) => {
      if (mounted.current) void trackStory("submission-failed", { product: "perps", ...perpsStoryDetails(useOnboardingStore.getState()) });
      reportError(cause);
    },
    onSettled: () => { inFlight.current = false; if (mounted.current) setPhase(null); },
  });
  const { awaitingConnection, requestFunding } = useFundingConnection({ operationInFlightRef: inFlight, onFunding: mutation.mutate, onError: reportError });
  const busy = mutation.isPending || awaitingConnection || wallet.status === "connecting" || wallet.status === "reconnecting";
  useStepBusy(busy, onBusyChange);
  return {
    busy,
    phase: awaitingConnection || wallet.status === "connecting" || wallet.status === "reconnecting" ? "connecting" as const : phase,
    save: () => {
      if (inFlight.current) return;
      const draft = useOnboardingStore.getState();
      if (attempt.current.id) toast.dismiss(attempt.current.id);
      attempt.current = { id: `deposit-save-${toastPrefix}-${attempt.current.sequence + 1}`, sequence: attempt.current.sequence + 1, succeeded: false, hash: setupHash(draft) };
      inFlight.current = true;
      if (getAccount(config).status !== "connected") toast.loading("Connect your wallet to continue…", { id: attempt.current.id });
      requestFunding({ revision: draft.revision, partnerId: draft.partnerName, amount: "0", modalSeen: false });
    },
  };
}
