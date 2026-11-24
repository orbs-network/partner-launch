import { FieldError } from "@/components/ui/field-error";
import { Button } from "@/components/ui/button";
import { useState, type CSSProperties } from "react";
import { Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldHelp } from "@/components/FieldHelp";
import { useOnboardingStore } from "../store";
import { REVENUE_STEP } from "../onboarding-steps";
import { formatBuilderFeePercent, parseBuilderFeePercent, validateBuilderFee } from "../builder-fee";
import { DEFAULT_FEE_CAP_BPS, validateFeeCapBps, validateRevenueWallet } from "../revenue-settings";
import { useRevenueWallet } from "../hooks/useRevenueWallet";
import { UseMyWalletButton } from "../components/UseMyWalletButton";

/** Reveal field errors after an attempted Next, then update them as values change. */
export function RevenueStep({ error = "", disabled = false, onBusyChange }: { error?: string; disabled?: boolean; onBusyChange?: (busy: boolean) => void }) {
  const revenueWallet = useOnboardingStore((state) => state.revenueWallet);
  const setRevenueWallet = useOnboardingStore((state) => state.setRevenueWallet);
  const fee = useOnboardingStore((state) => state.builderFeeTenthsBps);
  const feeCapBps = useOnboardingStore((state) => state.feeCapBps);
  const revision = useOnboardingStore((state) => state.revision);
  const setFee = useOnboardingStore((state) => state.setBuilderFeeTenthsBps);
  const wallet = useRevenueWallet(onBusyChange);
  const controlsDisabled = disabled || wallet.busy;
  const [feeInput, setFeeInput] = useState(() => formatBuilderFeePercent(fee));
  const walletError = error ? validateRevenueWallet(revenueWallet) : undefined;
  const feeNeedsReset = !!error && fee === undefined && !!validateFeeCapBps(feeCapBps);
  const feeError = error ? (feeNeedsReset ? "Restore the default trading fee to continue." : validateBuilderFee(fee)) : undefined;
  function restoreDefaultFee() {
    const current = useOnboardingStore.getState();
    if (!controlsDisabled && current.step === REVENUE_STEP && current.revision === revision) current.setFeeCapBps(DEFAULT_FEE_CAP_BPS);
  }
  function chooseFee(value: number) {
    setFee(value);
    setFeeInput(formatBuilderFeePercent(value));
  }

  return (
    <div className="grid gap-6">
      <section aria-labelledby="revenue-wallet-label">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1"><Label id="revenue-wallet-label" htmlFor="revenue-wallet" className="text-sm font-semibold text-(--text)">Revenue wallet</Label><FieldHelp label="Revenue wallet">Enter the EVM wallet address where you want to receive Perps earnings. The team confirms it during activation.</FieldHelp></div>
          <UseMyWalletButton value={revenueWallet} busy={wallet.busy} disabled={controlsDisabled} onClick={wallet.useMyWallet} />
        </div>
        <div className="relative">
          <Wallet className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-(--icon-muted)" size={17} aria-hidden="true" />
          <Input
            id="revenue-wallet"
            name="revenueWallet"
            type="text"
            className="pl-[43px] font-mono text-base"
            placeholder="0x…"
            autoComplete="off"
            autoCapitalize="none"
            enterKeyHint="next"
            autoCorrect="off"
            spellCheck={false}
            maxLength={64}
            value={revenueWallet}
            disabled={controlsDisabled}
            onChange={(event) => { wallet.clearError(); setRevenueWallet(event.target.value); }}
            aria-invalid={!!walletError}
            aria-describedby={walletError ? "revenue-wallet-hint revenue-wallet-error" : "revenue-wallet-hint"}
          />
        </div>
        <FieldError id="revenue-wallet-error" message={walletError} />
        <p id="revenue-wallet-hint" className="sr-only">Where you want to receive earnings. Confirmed at activation.</p>
      </section>
      <section className="rounded-3xl border border-(--edge) bg-(--control-bg) p-5 max-[480px]:p-4" aria-labelledby="builder-fee-label">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1"><Label id="builder-fee-label" htmlFor="builder-fee-percent" className="text-sm font-medium">Extra trading fee</Label><FieldHelp label="Extra trading fee">Choose a fee from 0% to 0.1%, in 0.001% increments. This requests an extra fee on each filled trade, on top of the protocol fee, after activation.</FieldHelp></div>
          </div>
          <div className="relative w-[124px] shrink-0">
            <Input id="builder-fee-percent" name="builderFeePercent" inputMode="decimal" type="text" autoComplete="off" aria-label="Extra trading fee percentage" value={feeInput} maxLength={8} disabled={controlsDisabled} aria-invalid={!!feeError} aria-describedby={feeError ? "builder-fee-hint builder-fee-error" : "builder-fee-hint"} className="h-14 bg-(--surface) pl-3 pr-8 text-right text-[22px] font-semibold tracking-tight tabular-nums" onChange={event => { setFeeInput(event.target.value); setFee(parseBuilderFeePercent(event.target.value)); }} onBlur={() => { if (!validateBuilderFee(fee)) setFeeInput(formatBuilderFeePercent(fee)); }} />
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-(--muted)" aria-hidden="true">%</span>
          </div>
        </div>
        <Label htmlFor="builder-fee-slider" className="sr-only">Extra trading fee slider</Label>
        <input id="builder-fee-slider" type="range" min={0} max={100} step={1} value={fee ?? 0} disabled={controlsDisabled} aria-valuetext={validateBuilderFee(fee) ? "Choose a valid extra fee" : `${formatBuilderFeePercent(fee)} percent extra trading fee`} className="fee-share-slider mt-2 block h-11 w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-50" style={{ "--slider-progress": `${fee ?? 0}%` } as CSSProperties} onChange={event => chooseFee(Number(event.target.value))} onKeyDown={event => { if (event.key === "Home" || event.key === "End") { event.preventDefault(); chooseFee(event.key === "Home" ? 0 : 100); } }} />
        <div className="flex justify-between text-[11px] text-(--muted)" aria-hidden="true"><span>0%</span><span>0.1%</span></div>
        <FieldError id="builder-fee-error" message={feeError} />
        {feeNeedsReset && <Button type="button" variant="ghost" className="mt-2" disabled={controlsDisabled} onClick={restoreDefaultFee}>Use default fee</Button>}
        <p id="builder-fee-hint" className="sr-only">Added on top of the protocol fee after activation.</p>
      </section>
    </div>
  );
}
