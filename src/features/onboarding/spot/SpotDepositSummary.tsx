import { FUNDING_AMOUNT } from "@/config/funding";

/** The requirement is informational until real deposit collection is connected. */
export function SpotDepositSummary() {
  return <>
    <section className="overflow-hidden rounded-[22px] border border-(--panel-border) bg-(--control-bg)" aria-labelledby="spot-deposit-title">
      <div className="p-5 max-[720px]:p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 id="spot-deposit-title" className="text-[13px] font-medium text-(--secondary-text)">Deposit amount</h2>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <img src="/usdc.svg" alt="" width={44} height={44} className="size-11 shrink-0" />
          <div className="flex min-w-0 items-baseline gap-2.5">
            <strong className="text-[48px] leading-none font-semibold tracking-[-1.8px] text-(--text) tabular-nums max-[370px]:text-[44px]">{FUNDING_AMOUNT}</strong>
            <span className="text-lg font-medium text-(--muted)">USDC</span>
          </div>
        </div>
      </div>
    </section>
    <p className="mt-3 text-[13px] leading-[1.7] text-(--muted)">A one-time deposit is required before activation. Submitting this request does not collect the deposit; the team will review your setup first.</p>
  </>;
}
