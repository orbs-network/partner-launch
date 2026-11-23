import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  coinbaseWallet,
  injectedWallet,
  metaMaskWallet,
  rainbowWallet,
  trustWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig } from "wagmi";
import { getTransport, walletChains } from "./chains";
import { deferWalletSetup, hasStoredWalletConnection } from "./lazy-wallet";

// "Browser Wallet" only works with an injected provider; on mobile Safari/Chrome it does nothing.
const hasInjectedProvider =
  typeof window !== "undefined" &&
  typeof (window as Window & { ethereum?: unknown }).ethereum !== "undefined";

export const restoreWalletSession = typeof window !== "undefined" && hasStoredWalletConnection();

const connectors = connectorsForWallets(
  [
    {
      groupName: "Connect your wallet",
      wallets: [
        metaMaskWallet,
        coinbaseWallet,
        rainbowWallet,
        trustWallet,
        walletConnectWallet,
        ...(hasInjectedProvider ? [injectedWallet] : []),
      ].map((wallet) => deferWalletSetup(wallet, restoreWalletSession)),
    },
  ],
  {
    appName: "dPERPS Creator Studio",
    projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
  },
);
export const wagmiConfig = createConfig({
  chains: walletChains,
  connectors,
  transports: Object.fromEntries(
    walletChains.map((chain) => [chain.id, getTransport(chain)]),
  ) as Record<
    (typeof walletChains)[number]["id"],
    ReturnType<typeof getTransport>
  >,
});
