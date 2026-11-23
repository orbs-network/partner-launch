import { FUNDING_AMOUNT, FUNDING_TOKEN_SYMBOL } from "@/config/funding";
import { chainById, chainLogo } from "@/config/chains";

export function DepositSummary({ chainId }: { chainId: number | null }) {
  const chain = chainById(chainId);
  return (
    <>
      <section className="overflow-hidden rounded-[22px] border border-(--panel-border) bg-(--control-bg)" aria-labelledby="required-deposit-title">
        <div className="p-5 max-[720px]:p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 id="required-deposit-title" className="text-[13px] font-medium text-(--secondary-text)">Trading deposit</h2>
            <span className="text-[11px] text-(--muted)">One-time</span>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <img src="/usdc.svg" alt="" width={44} height={44} className="size-11 shrink-0" />
            <p className="flex min-w-0 items-baseline gap-2.5">
              <strong className="text-[48px] leading-none font-semibold tracking-[-1.8px] text-(--text) tabular-nums max-[370px]:text-[44px]">{FUNDING_AMOUNT}</strong>{" "}
              <span className="text-lg font-medium text-(--muted)">{FUNDING_TOKEN_SYMBOL}</span>
            </p>
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
      <p className="mt-3 text-[13px] leading-[1.7] text-(--muted)">Your deposit will be available for leveraged trading.</p>
    </>
  );
}
