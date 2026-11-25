import { Button } from "@/components/ui/button";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ChevronDown, Wallet } from "lucide-react";
import { useAccount } from "wagmi";
import { cn } from "@/lib/utils";

/**
 * "Connect wallet" is how visitors reach Your workspaces, so it always shows once the wallet state is known.
 * With hideWhileConnecting, a returning wallet's reconnect does not flash "Connect wallet" first.
 */
export function WalletButton({ hideWhileConnecting = false }: { hideWhileConnecting?: boolean }) {
  const { status } = useAccount();
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const connected = mounted && account && chain;
        if (!connected && hideWhileConnecting && (status === "connecting" || status === "reconnecting")) return null;
        return (
          <Button
            variant="ghost"
            className={cn("min-h-11 max-w-[190px] gap-[9px] rounded-[17px] border-0 bg-(--surface) px-[17px] py-2.5 text-[13px] font-medium text-(--secondary-text) enabled:hover:bg-(--primary-soft) max-[720px]:min-h-11 max-[720px]:max-w-[153px] max-[720px]:rounded-[15px] max-[720px]:px-[13px] max-[720px]:py-2.5 max-[720px]:text-xs max-[370px]:max-w-[110px] max-[370px]:px-[9px] max-[370px]:py-[9px] max-[370px]:text-[12px]", connected && "bg-(--primary-soft) text-(--link) max-[720px]:group-data-[has-login=true]/header:w-11 max-[720px]:group-data-[has-login=true]/header:max-w-11 max-[720px]:group-data-[has-login=true]/header:p-0")}
            type="button"
            aria-label={!connected ? "Connect wallet" : chain.unsupported ? "Switch network" : account.displayName}
            onClick={
              !connected
                ? openConnectModal
                : chain.unsupported
                  ? openChainModal
                  : openAccountModal
            }
          >
            <Wallet size={15} className={cn("max-[720px]:hidden", connected && "max-[720px]:group-data-[has-login=true]/header:block")} aria-hidden="true" />
            {/* Phones collapse a connected wallet to its icon; "Connect wallet" keeps its label. */}
            <span className={cn("min-w-0 truncate", connected && "max-[720px]:group-data-[has-login=true]/header:hidden")}>
              {!connected
                ? "Connect wallet"
                : chain.unsupported
                  ? "Switch network"
                  : account.displayName}
            </span>
            {connected ? <ChevronDown size={13} className="max-[720px]:group-data-[has-login=true]/header:hidden" aria-hidden="true" /> : null}
          </Button>
        );
      }}
    </ConnectButton.Custom>
  );
}
