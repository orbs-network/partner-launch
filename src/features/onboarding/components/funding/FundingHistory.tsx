import { FUNDING_TOKEN_SYMBOL } from "../../../../config/funding";
import type { FundingConfirmation } from "../../placeholder-funding";

const confirmationTime = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function FundingHistory({
  confirmations,
}: {
  confirmations: FundingConfirmation[];
}) {
  if (!confirmations.length) return null;
  return (
    <section
      className="mt-6 border-t border-(--edge) pt-5"
      aria-labelledby="funding-history-title"
    >
      <h2 id="funding-history-title" className="text-[15px] leading-normal font-medium text-pretty text-(--text) max-[720px]:text-[13px]">
        Your setup confirmation
      </h2>
      <ol
        className="m-0 mt-3.5 grid list-none gap-2.5 p-0"
        aria-label="Setup confirmation history"
      >
        {[...confirmations].reverse().map((confirmation) => (
          <li className="min-w-0 rounded-[14px] border border-(--edge) bg-(--soft) px-[15px] py-[13px]" key={confirmation.signature}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1.5 leading-normal">
              <strong className="text-sm font-medium wrap-anywhere text-(--text) tabular-nums">
                {confirmation.amount} {FUNDING_TOKEN_SYMBOL} · not paid
              </strong>
              <time className="text-[11px] text-(--muted)" dateTime={confirmation.signedAt}>
                {confirmationTime.format(new Date(confirmation.signedAt))}
              </time>
            </div>
            <p className="mt-[7px] font-mono text-[11px] leading-[1.7] wrap-anywhere text-(--muted) max-[720px]:text-[10px]">
              {confirmation.address}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
