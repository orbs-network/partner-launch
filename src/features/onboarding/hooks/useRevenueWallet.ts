import { useOnboardingStore } from "../store";
import { useWalletAddress } from "./useWalletAddress";

export function useRevenueWallet(onBusyChange?: (busy: boolean) => void) {
  return useWalletAddress({
    getTarget: () => {
      const draft = useOnboardingStore.getState();
      return { scope: JSON.stringify([draft.revision, draft.step, draft.partnerName]), value: draft.revenueWallet };
    },
    onAddress: (address) => useOnboardingStore.getState().setRevenueWallet(address),
    onBusyChange,
  });
}
