import { useState, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RainbowKitProvider,
  lightTheme,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { useTheme } from "./theme-context";
import { restoreWalletSession, wagmiConfig } from "../config/wagmi";
import "@rainbow-me/rainbowkit/styles.css";

const walletThemeOptions = {
  accentColor: "#3346f2",
  accentColorForeground: "#ffffff",
  borderRadius: "large" as const,
  fontStack: "system" as const,
};
// The wallet sheet keeps the narrower system font: Montserrat makes wallet names overlap on phones.
const walletLightTheme = lightTheme(walletThemeOptions);
const walletDarkTheme = darkTheme({ ...walletThemeOptions, accentColor: "#5364eb" });

function WalletThemeProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  return (
    <RainbowKitProvider
      modalSize="compact"
      theme={resolvedTheme === "dark" ? walletDarkTheme : walletLightTheme}
    >
      {children}
    </RainbowKitProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
          mutations: { retry: false },
        },
      }),
  );
  // reconnect() loads every wallet SDK; only run it when there is a session to restore.
  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount={restoreWalletSession}>
      <QueryClientProvider client={queryClient}>
        <WalletThemeProvider>{children}</WalletThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
