import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccountEffect, useConfig } from "wagmi";
import { getAccount } from "wagmi/actions";
import { useMountedRef } from "./useMountedRef";
import { useStepBusy } from "./useStepBusy";
import { useValidationToast } from "@/hooks/useValidationToast";

export interface WalletAddressTarget {
  scope: string;
  value: string;
}
interface WalletAddressOptions {
  getTarget: () => WalletAddressTarget;
  onAddress: (address: string, target: WalletAddressTarget) => void;
  onBusyChange?: (busy: boolean) => void;
}

/** An explicit field-fill intent; connecting never signs, logs in or changes networks. */
export function useWalletAddress(options: WalletAddressOptions) {
  const config = useConfig();
  const { openConnectModal, connectModalOpen } = useConnectModal();
  const mounted = useMountedRef();
  const source = useRef(options);
  useLayoutEffect(() => { source.current = options; }, [options]);
  const intent = useRef<{ target: WalletAddressTarget; modalSeen: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const { error: showError, dismiss: clearError } = useValidationToast();
  useStepBusy(busy, options.onBusyChange);
  useEffect(() => () => { intent.current = null; }, []);
  useAccountEffect({
    onConnect({ address }) {
      const pending = intent.current;
      if (!pending || !mounted.current) return;
      intent.current = null;
      setBusy(false);
      const target = source.current.getTarget();
      const account = getAccount(config);
      if (target.scope !== pending.target.scope || target.value !== pending.target.value ||
        account.status !== "connected" || account.address?.toLowerCase() !== address.toLowerCase()) {
        showError("Your setup changed. Choose Use my wallet again to fill this address.");
        return;
      }
      source.current.onAddress(address, target);
    },
  });
  useEffect(() => {
    const pending = intent.current;
    if (!pending) return;
    if (connectModalOpen) pending.modalSeen = true;
    else if (pending.modalSeen && !getAccount(config).isConnected) {
      intent.current = null;
      setBusy(false);
      showError("Wallet connection cancelled. You can enter an address or try again.");
    }
  }, [connectModalOpen, config, showError]);
  function useMyWallet() {
    if (intent.current) return;
    clearError();
    const account = getAccount(config);
    if (account.status === "connected" && account.address) {
      source.current.onAddress(account.address, source.current.getTarget());
      return;
    }
    if (account.status === "connecting" || account.status === "reconnecting") {
      showError("Your wallet is still connecting. Try again in a moment.");
      return;
    }
    if (!openConnectModal) {
      showError("Wallet connection is not ready. Enter an address or try again.");
      return;
    }
    intent.current = { target: source.current.getTarget(), modalSeen: false };
    setBusy(true);
    try { openConnectModal(); }
    catch {
      intent.current = null;
      setBusy(false);
      showError("Wallet connection is not ready. Enter an address or try again.");
    }
  }
  return { busy, useMyWallet, clearError };
}
