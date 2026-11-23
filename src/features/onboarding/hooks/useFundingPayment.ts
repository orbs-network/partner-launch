import { toast } from "sonner";
import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAccount, useConfig, useSignMessage } from "wagmi";
import { getAccount } from "wagmi/actions";
import { FUNDING_AMOUNT, FUNDING_CHAIN_ID } from "../../../config/funding";
import { fundingError } from "../funding";
import { confirmFundingSetup, type ConfirmationPhase } from "../funding-placeholder-execution";
import type { FundingIntent } from "../funding-execution";
import {
  getPendingDeposit,
  useOnboardingStore,
} from "../store";
import { useFundingConnection } from "./useFundingConnection";
import { useFundingState } from "./useFundingState";
import { useMountedRef } from "./useMountedRef";
import { useStepBusy } from "./useStepBusy";

/** Temporary demo flow: request a message signature, never a transaction. */
export function useFundingPayment({ onBusyChange, onComplete }: {
  onBusyChange?: (busy: boolean) => void;
  onComplete: () => void;
}) {
  const state = useFundingState();
  const config = useConfig();
  const { status: walletStatus } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const mounted = useMountedRef();
  const operationInFlightRef = useRef(false);
  const [signingPhase, setSigningPhase] = useState<ConfirmationPhase>("signature");
  const [actionError, setActionError] = useState("");
  const funding = useMutation({
    mutationKey: ["onboarding", "funding-placeholder"],
    retry: false,
    mutationFn: async (intent: FundingIntent) => {
      await confirmFundingSetup(intent, {
        getDraft: useOnboardingStore.getState,
        getWallet: () => getAccount(config),
        isMounted: () => mounted.current,
        signFunding: (message, signer) => signMessageAsync({ account: signer, message }),
        setPhase: setSigningPhase,
      });
    },
    onSuccess: () => {
      if (!mounted.current) return;
      onComplete();
      toast.success("Setup confirmed", {
        id: "funding",
        description: "Your confirmation is saved. No funds moved.",
      });
    },
    onError: (error) => {
      if (!mounted.current) return;
      const message = fundingError(error);
      setActionError(
        /reject|denied|cancelled|canceled/i.test(message)
          ? "You cancelled the wallet request. You can try again."
          : message.length > 220
            ? "We couldn’t confirm your signature. Check your wallet and try again."
            : message,
      );
    },
    onSettled: () => {
      operationInFlightRef.current = false;
    },
  });
  const { awaitingConnection, requestFunding } = useFundingConnection({
    operationInFlightRef,
    onFunding: funding.mutate,
    onError: setActionError,
  });
  const busy = funding.isPending || awaitingConnection;
  useStepBusy(busy, onBusyChange);

  function confirmDeposit() {
    const current = useOnboardingStore.getState();
    if (
      operationInFlightRef.current ||
      getPendingDeposit(current)
    )
      return;
    if (["connecting", "reconnecting"].includes(getAccount(config).status)) {
      setActionError("Your wallet is still connecting. Please try again in a moment.");
      return;
    }
    setActionError("");
    setSigningPhase("signature");
    current.setDepositAmount(FUNDING_AMOUNT, FUNDING_CHAIN_ID);
    const snapshot = useOnboardingStore.getState();
    const intent: FundingIntent = {
      revision: snapshot.revision,
      amount: FUNDING_AMOUNT,
      partnerId: snapshot.partnerName,
      modalSeen: false,
    };
    operationInFlightRef.current = true;
    requestFunding(intent);
  }
  return {
    ...state,
    walletConnected: walletStatus === "connected",
    busy,
    signingPhase,
    walletConnecting: walletStatus === "connecting" || walletStatus === "reconnecting",
    phase: funding.isPending
      ? signingPhase === "verification" ? "Checking your confirmation…" : "Confirm the deposit reference in your wallet…"
      : "",
    actionError,
    awaitingConnection,
    confirmDeposit,
    clearError: () => setActionError(""),
  };
}
