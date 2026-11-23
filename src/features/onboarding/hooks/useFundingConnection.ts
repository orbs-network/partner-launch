import { useEffect, useRef, useState, type RefObject } from "react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccountEffect, useConfig } from "wagmi";
import { getAccount } from "wagmi/actions";
import type { FundingIntent } from "../funding-execution";
import { useOnboardingStore } from "../store";

interface FundingConnectionOptions {
  operationInFlightRef: RefObject<boolean>;
  onFunding: (intent: FundingIntent) => void;
  onError: (message: string) => void;
}

/** Continue only the confirmation requested before opening the wallet picker. */
export function useFundingConnection({
  operationInFlightRef,
  onFunding,
  onError,
}: FundingConnectionOptions) {
  const config = useConfig();
  const { openConnectModal, connectModalOpen } = useConnectModal();
  const [connectionRequested, setConnectionRequested] = useState(false);
  const connectionIntent = useRef<FundingIntent | null>(null);
  useEffect(
    () => () => {
      connectionIntent.current = null;
    },
    [],
  );
  useAccountEffect({
    onConnect() {
      const intent = connectionIntent.current;
      if (!intent) return;
      connectionIntent.current = null;
      setConnectionRequested(false);
      if (useOnboardingStore.getState().revision !== intent.revision) {
        operationInFlightRef.current = false;
        onError("Your setup changed. Review your details and try again.");
        return;
      }
      onFunding(intent);
    },
  });
  useEffect(() => {
    const intent = connectionIntent.current;
    if (!intent) return;
    if (connectModalOpen) intent.modalSeen = true;
    else if (intent.modalSeen && !getAccount(config).isConnected) {
      // Closing the picker cancels this intent; header connection cannot revive it.
      connectionIntent.current = null;
      operationInFlightRef.current = false;
      setConnectionRequested(false);
      onError("You cancelled the wallet connection. You can try again.");
    }
  }, [connectModalOpen, config, operationInFlightRef, onError]);

  function requestFunding(intent: FundingIntent) {
    const account = getAccount(config);
    if (account.status === "connecting" || account.status === "reconnecting") {
      operationInFlightRef.current = false;
      onError("Your wallet is still connecting. Please try again in a moment.");
      return;
    }
    if (account.status !== "connected") {
      if (!openConnectModal) {
        operationInFlightRef.current = false;
        onError("Your wallet connection isn’t ready. Please try again.");
        return;
      }
      connectionIntent.current = intent;
      setConnectionRequested(true);
      openConnectModal();
      return;
    }
    onFunding(intent);
  }
  return {
    awaitingConnection: connectionRequested && connectModalOpen,
    requestFunding,
  };
}
