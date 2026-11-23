import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccountEffect, useConfig } from "wagmi";
import { getAccount } from "wagmi/actions";

export function useLoginConnection({
  operationInFlightRef,
  onLogin,
  onError,
}: {
  operationInFlightRef: RefObject<boolean>;
  onLogin: () => void;
  onError: (message: string) => void;
}) {
  const config = useConfig();
  const { openConnectModal, connectModalOpen } = useConnectModal();
  const [requested, setRequested] = useState(false);
  const intentRef = useRef<{ seen: boolean } | null>(null);
  useEffect(() => () => { intentRef.current = null; }, []);
  useAccountEffect({
    onConnect() {
      if (!intentRef.current) return;
      intentRef.current = null;
      setRequested(false);
      if (getAccount(config).status !== "connected") {
        operationInFlightRef.current = false;
        onError("Your wallet is still connecting. Please try again in a moment.");
        return;
      }
      onLogin();
    },
  });
  const cancelRequest = useCallback(() => {
    intentRef.current = null;
    operationInFlightRef.current = false;
    setRequested(false);
  }, [operationInFlightRef]);
  useEffect(() => {
    const intent = intentRef.current;
    if (!intent) return;
    if (connectModalOpen) intent.seen = true;
    else if (intent.seen && !getAccount(config).isConnected) cancelRequest();
  }, [connectModalOpen, config, cancelRequest]);

  function requestLogin() {
    const account = getAccount(config);
    if (account.status === "connecting" || account.status === "reconnecting") {
      operationInFlightRef.current = false;
      onError("Your wallet is still connecting. Please try again in a moment.");
      return;
    }
    if (account.status === "connected") {
      onLogin();
      return;
    }
    if (!openConnectModal) {
      operationInFlightRef.current = false;
      onError("Your wallet connection isn’t ready. Please try again.");
      return;
    }
    intentRef.current = { seen: false };
    setRequested(true);
    openConnectModal();
  }
  return { requestLogin, cancelLogin: cancelRequest, awaitingConnection: requested && connectModalOpen };
}
