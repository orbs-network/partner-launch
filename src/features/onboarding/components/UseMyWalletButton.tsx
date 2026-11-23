import { LoaderCircle } from "lucide-react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function UseMyWalletButton({ value, busy, disabled, onClick }: {
  value: string;
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const account = useAccount();
  const matchesConnectedWallet = account.status === "connected" && account.address?.toLowerCase() === value.trim().toLowerCase();
  return (
    <Button type="button" variant="ghost" size="sm" className={cn("h-11 gap-1.5 border-0 bg-transparent px-0 py-1 text-xs text-(--link) hover:enabled:bg-transparent hover:enabled:text-(--link-hover) has-[>svg]:px-0", matchesConnectedWallet && "invisible pointer-events-none")} onClick={onClick} disabled={matchesConnectedWallet || disabled || busy} aria-busy={busy} aria-hidden={matchesConnectedWallet || undefined} tabIndex={matchesConnectedWallet ? -1 : undefined}>
      {busy ? <LoaderCircle size={14} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}
      {busy ? "Connecting…" : "Use my wallet"}
    </Button>
  );
}
