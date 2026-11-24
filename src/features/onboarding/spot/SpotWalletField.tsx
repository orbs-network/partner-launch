import type { CSSProperties } from "react";
import { validateRevenueWallet } from "../revenue-settings";
import { formatSpotFeePercent, parseSpotFeePercent } from "./spot-fee";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldHelp } from "@/components/FieldHelp";
import { UseMyWalletButton } from "../components/UseMyWalletButton";
import { useWalletAddress } from "../hooks/useWalletAddress";
import type { SpotDraft } from "./spot-setup";

export function SpotWalletField({ draft, error, update, fillWallet, onBusyChange }: {
  draft: SpotDraft;
  error?: string;
  update: (field: "feesWallet" | "tradingFeePercent", value: string) => void;
  fillWallet: (address: string, scope: string) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const wallet = useWalletAddress({
    getTarget: () => ({ scope: JSON.stringify(draft), value: draft.feesWallet }),
    onAddress: (address, target) => fillWallet(address, target.scope),
    onBusyChange,
  });
  const walletError = error ? validateRevenueWallet(draft.feesWallet) : undefined;
  const fee = parseSpotFeePercent(draft.tradingFeePercent);
  const feeError = error && fee === null ? "Enter a trading fee from 0% to 1%, in 0.001% increments." : undefined;
  return (
    <div className="space-y-5">
    <div>
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1"><Label htmlFor="spot-wallet" className="text-sm font-medium text-(--secondary-text)">Fees wallet</Label><FieldHelp label="Fees wallet">Enter the EVM wallet address where you want to receive Spot fees. The team confirms the configuration during activation.</FieldHelp></div>
        <UseMyWalletButton value={draft.feesWallet} busy={wallet.busy} disabled={wallet.busy} onClick={wallet.useMyWallet} />
      </div>
      <Input id="spot-wallet" name="feesWallet" enterKeyHint="next" autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="0x…" maxLength={100} value={draft.feesWallet} onChange={(event) => { wallet.clearError(); update("feesWallet", event.target.value); }} disabled={wallet.busy} aria-invalid={!!walletError} aria-describedby={walletError ? "spot-wallet-hint spot-error" : "spot-wallet-hint"} className="font-mono text-sm" />
      <FieldError id="spot-error" message={walletError} />
      <p id="spot-wallet-hint" className="sr-only">Where you want to receive Spot fees.</p>
    </div>
    <section className="rounded-3xl border border-(--edge) bg-(--control-bg) p-5 max-[480px]:p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1"><Label htmlFor="spot-fee" className="text-sm font-medium">Trading fee</Label><FieldHelp label="Trading fee">Request a Spot trading fee between 0% and 1%, in 0.001% increments. The team confirms the configuration during activation.</FieldHelp></div>
        <div className="relative w-[124px] shrink-0"><Input id="spot-fee" name="tradingFeePercent" type="text" inputMode="decimal" autoComplete="off" maxLength={20} value={draft.tradingFeePercent} disabled={wallet.busy} aria-invalid={!!feeError} aria-describedby={feeError ? "spot-fee-error" : undefined} className="h-14 bg-(--surface) pl-3 pr-8 text-right text-[22px] font-semibold tabular-nums" onChange={event => update("tradingFeePercent", event.target.value)} /><span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-(--muted)" aria-hidden="true">%</span></div>
      </div>
      <Label htmlFor="spot-fee-slider" className="sr-only">Trading fee slider</Label>
      <input id="spot-fee-slider" type="range" min={0} max={1000} step={1} value={fee ?? 0} disabled={wallet.busy} aria-valuetext={fee === null ? "Choose a valid trading fee" : `${formatSpotFeePercent(fee)} percent`} className="fee-share-slider mt-2 block h-11 w-full cursor-pointer disabled:opacity-50" style={{ "--slider-progress": `${(fee ?? 0) / 10}%` } as CSSProperties} onChange={event => update("tradingFeePercent", formatSpotFeePercent(Number(event.target.value)))} />
      <div className="flex justify-between text-xs text-(--muted)" aria-hidden="true"><span>0%</span><span>1%</span></div>
      <FieldError id="spot-fee-error" message={feeError} />
    </section>
    </div>
  );
}
