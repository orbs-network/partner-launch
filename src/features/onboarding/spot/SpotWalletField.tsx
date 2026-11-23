import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UseMyWalletButton } from "../components/UseMyWalletButton";
import { useWalletAddress } from "../hooks/useWalletAddress";
import type { SpotDraft } from "./spot-setup";

export function SpotWalletField({ draft, error, update, fillWallet, onBusyChange }: {
  draft: SpotDraft;
  error?: string;
  update: (field: "feesWallet", value: string) => void;
  fillWallet: (address: string, scope: string) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const wallet = useWalletAddress({
    getTarget: () => ({ scope: JSON.stringify(draft), value: draft.feesWallet }),
    onAddress: (address, target) => fillWallet(address, target.scope),
    onBusyChange,
  });
  return (
    <div>
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor="spot-wallet" className="text-sm font-medium text-(--secondary-text)">Fees wallet</Label>
        <UseMyWalletButton value={draft.feesWallet} busy={wallet.busy} disabled={wallet.busy} onClick={wallet.useMyWallet} />
      </div>
      <Input id="spot-wallet" name="feesWallet" enterKeyHint="next" autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="0x…" maxLength={100} value={draft.feesWallet} onChange={(event) => { wallet.clearError(); update("feesWallet", event.target.value); }} disabled={wallet.busy} aria-invalid={!!error} aria-describedby={error ? "spot-wallet-hint spot-error" : "spot-wallet-hint"} className="font-mono text-sm" />
      <FieldError id="spot-error" message={error} />
      <p id="spot-wallet-hint" className="mt-2 text-xs leading-[1.7] text-(--muted)">Where you want to receive Spot fees.</p>
    </div>
  );
}
