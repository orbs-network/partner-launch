import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAccount, useConfig, useSignMessage } from "wagmi";
import { getAccount } from "wagmi/actions";
import { toast } from "sonner";
import { verifyMessage } from "viem";
import { useOnboardingStore } from "../store";
import { isSetupSubmission, setupHash } from "../setup-submission";
import { submitPerps } from "../submit-perps";
import { mockDeposit, mockSetupRequest } from "../local-mock-submission";
import { TERMS_VERSION } from "../terms-policy";
import { FUNDING_STEP, onboardingSteps } from "../onboarding-steps";
import { getStepError } from "../validation";
import type { FundingIntent } from "../funding-execution";
import { useFundingConnection } from "./useFundingConnection";
import { useMountedRef } from "./useMountedRef";
import { useStepBusy } from "./useStepBusy";
import { fundingError } from "../funding";
import { hasSetupRequestReceipt } from "../setup-request-receipt";

export function useSetupSubmission({ onBusyChange, onComplete }: { onBusyChange: (busy: boolean) => void; onComplete: () => void }) {
  const config = useConfig();
  const wallet = useAccount();
  const { signMessageAsync } = useSignMessage();
  const mounted = useMountedRef();
  const [phase, setPhase] = useState<"signing" | "sending" | null>(null);
  const inFlight = useRef(false);
  const delivered = useRef<{ scope: string; submittedAt: string } | null>(null);
  const toastPrefix = useId();
  const attempt = useRef({ sequence: 0, id: undefined as string | undefined, succeeded: false, hash: "" });
  useEffect(() => () => {
    if (attempt.current.id && !attempt.current.succeeded) toast.dismiss(attempt.current.id);
  }, []);
  const reportError = useCallback((cause: unknown) => {
    if (!mounted.current) return;
    const message = fundingError(cause);
    toast.error(/reject|denied|cancelled|canceled/i.test(message) ? "You cancelled the confirmation. You can try again." : message.length > 220 ? "We couldn’t save your setup. Please try again." : message, { id: attempt.current.id });
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
          live.status !== "connected" || live.address?.toLowerCase() !== address.toLowerCase())
          throw new Error("Your wallet or setup changed. Check your details and try again.");
      };
      assertCurrent();
      if (draft.chainIds.length !== 1) throw new Error("Choose one network for this setup.");
      const invalid = onboardingSteps.slice(0, FUNDING_STEP).map((_, step) => getStepError(step, draft)).find(Boolean);
      if (invalid) throw new Error(invalid);
      if (draft.termsAcceptedVersion !== TERMS_VERSION) throw new Error("Accept the terms before saving your setup.");
      const retained = draft.setupSubmission;
      const reusable = isSetupSubmission(retained, draft) && retained.includesDepositConfirmation === true &&
        retained.address.toLowerCase() === address.toLowerCase() &&
        await verifyMessage({ address, message: retained.message, signature: retained.signature });
      assertCurrent();
      if (!reusable) {
        setPhase("signing");
        toast.loading("Sign the deposit confirmation in your wallet…", { id: attempt.current.id });
        const submission = await mockDeposit(draft, address, message => signMessageAsync({ account: address, message }));
        assertCurrent();
        useOnboardingStore.getState().setSetupSubmission(submission);
      }
      const signedDraft = useOnboardingStore.getState();
      setPhase("sending");
      toast.loading("Sending your setup to the team…", { id: attempt.current.id });
      const receipt = hasSetupRequestReceipt(signedDraft) ? signedDraft.setupRequestReceipt! : await mockSetupRequest(signedDraft);
      assertCurrent();
      const scope = `${expectedHash}:${address.toLowerCase()}`;
      const delivery = delivered.current?.scope === scope ? delivered.current : await submitPerps(signedDraft);
      delivered.current = { scope, submittedAt: delivery.submittedAt };
      assertCurrent();
      useOnboardingStore.getState().setSetupRequestReceipt({ ...receipt, setupHash: expectedHash,
        receivedAt: delivery.submittedAt, notification: "telegram" });
      assertCurrent();
    },
    onSuccess: () => {
      if (!mounted.current) { if (attempt.current.id) toast.dismiss(attempt.current.id); return; }
      onComplete();
      if (useOnboardingStore.getState().completed) {
        attempt.current.succeeded = true;
        toast.success("Setup submitted", { id: attempt.current.id });
      } else if (attempt.current.id) toast.dismiss(attempt.current.id);
    },
    onError: reportError,
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
