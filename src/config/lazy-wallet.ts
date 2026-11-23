import type { WalletList } from "@rainbow-me/rainbowkit";

type CreateWalletFn = WalletList[number]["wallets"][number];

/** True when this browser has a wagmi or WalletConnect session that should be restored on load. */
export function hasStoredWalletConnection(): boolean {
  try {
    if (localStorage.getItem("wagmi.recentConnectorId")) return true;
    for (let index = 0; index < localStorage.length; index += 1) {
      if (localStorage.key(index)?.startsWith("wc@2")) return true;
    }
  } catch {
    // Storage blocked: nothing to restore.
  }
  return false;
}

/**
 * wagmi runs every connector's setup() when the config is created. For the MetaMask and
 * WalletConnect connectors that downloads ~1.5 MB of SDK code and starts WalletConnect
 * network calls before anyone taps sign-in. A first-time visitor has no session to
 * restore, so skip setup (Providers also skips reconnect-on-mount); connect() still loads the
 * provider when a wallet is chosen.
 */
export function deferWalletSetup(create: CreateWalletFn, restoreSession: boolean): CreateWalletFn {
  if (restoreSession) return create;
  return (params) => {
    const wallet = create(params);
    return {
      ...wallet,
      createConnector: (details) => {
        const connectorFn = wallet.createConnector(details);
        return (config) => ({ ...connectorFn(config), setup: undefined });
      },
    };
  };
}
