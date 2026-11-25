import { FUNDING_AMOUNT } from "@/config/funding";
import { Skeleton } from "@/components/ui/skeleton";
import type { Collateral } from "../collateral";
import { chainById, chainLogo } from "@/config/chains";

export function DepositSummary({ chainId, collateral, loading, error, onRetry }: { chainId: number | null; collateral?: Collateral; loading: boolean; error: boolean; onRetry: () => void }) {
  const chain = chainById(chainId);
  return (
    <>
      <section className="overflow-hidden rounded-[22px] border border-(--panel-border) bg-(--control-bg)" aria-labelledby="required-deposit-title">
        <div className="p-5 max-[720px]:p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 id="required-deposit-title" className="text-[13px] font-medium text-(--secondary-text)">Trading deposit</h2>
            <span className="rounded-full bg-(--soft) px-2.5 py-1 text-xs font-medium text-(--muted)">Not collected yet</span>
          </div>
          <div className="mt-4 flex items-center gap-3">
            {collateral?.symbol === "USDC" ? <img src="/usdc.svg" alt="" width={44} height={44} className="size-11 shrink-0" /> : collateral ? <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-emerald-600 text-lg font-bold text-white">₮</span> : loading ? <Skeleton className="size-11 shrink-0 rounded-full" /> : <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-(--soft) text-lg text-(--muted)">?</span>}
            <div className="flex min-w-0 items-baseline gap-2.5">
              <strong className="text-[48px] leading-none font-semibold tracking-[-1.8px] text-(--text) tabular-nums max-[370px]:text-[44px]">{FUNDING_AMOUNT}</strong>{" "}
              {collateral ? <span className="text-lg font-medium text-(--muted)">{collateral.symbol}</span> : loading ? <div aria-label="Checking collateral"><Skeleton className="h-6 w-16" /></div> : <span className="text-sm text-(--muted)">Unavailable</span>}
            </div>
          </div>
        </div>
        <dl className="m-0 flex items-center justify-between gap-4 border-t border-(--edge) bg-(--surface) px-5 py-3.5 max-[720px]:px-4">
          <dt className="shrink-0 text-xs text-(--muted)">Network</dt>
          <dd className="m-0 flex min-w-0 items-center justify-end gap-2 text-right text-[13px] font-medium text-(--secondary-text)">
            {chain ? <img src={chainLogo(chain.id)} alt="" width={20} height={20} className="size-5 shrink-0 rounded-full bg-white object-contain" /> : null}
            <span className="min-w-0 wrap-anywhere">{chain?.name ?? "Your chosen network"}</span>
          </dd>
        </dl>
      </section>
      {error ? <p role="alert" className="mt-3 text-[13px] text-(--danger)">We couldn’t load the deposit token for this network. <button type="button" onClick={onRetry} className="min-h-11 underline">Try again</button></p> : null}
      <p className="mt-3 text-[13px] leading-[1.7] text-(--muted)">Submitting moves no funds. This one-time deposit is required before trading is activated, and the team reviews your setup first.</p>
    </>
  );
}
