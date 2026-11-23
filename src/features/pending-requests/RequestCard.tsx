import { ArrowLeftRight, LoaderCircle, Rocket } from "lucide-react";
import { chainById } from "@/config/chains";
import { WalletExplorerLink } from "./WalletExplorerLink";
import type { PendingRequest } from "./request-record";

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

export function RequestCard({ request }: { request: PendingRequest }) {
  const Icon = request.kind === "spot" ? ArrowLeftRight : Rocket;
  const label = request.kind === "spot" ? "Fees wallet" : "Revenue wallet";
  const rows = request.kind === "spot" ? (request.dexUrl ? [{ label: "DEX URL", value: request.dexUrl }] : []) : [
    { label: "Partner ID", value: request.partnerId },
    { label: "Networks", value: request.chainIds.map(id => chainById(id)?.name ?? `Chain ${id}`).join(", ") },
    ...(request.extraFeePercent === undefined ? [] : [{ label: "Extra trading fee", value: `${request.extraFeePercent}%` }]),
  ];
  return (
    <article aria-label={`${request.appName} ${request.kind === "spot" ? "Spot" : "Perps"} request`} className="overflow-hidden rounded-[22px] border border-(--edge) bg-(--control-bg)">
      <div className="grid grid-cols-[44px_minmax(0,1fr)] items-center gap-x-3.5 gap-y-1 border-b border-(--edge) bg-(--surface) p-4 max-[480px]:p-3.5">
        <span className="row-span-3 flex size-11 shrink-0 items-center justify-center rounded-2xl bg-(--primary-soft) text-(--link)"><Icon size={21} aria-hidden="true" /></span>
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.09em] text-(--muted)">{request.kind === "spot" ? "Spot" : "Perps"}</p>
          <span className="ml-auto inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-(--primary-soft) px-2.5 py-1.5 text-[11px] font-medium text-(--link) max-[480px]:gap-1 max-[480px]:px-2 max-[480px]:text-[10px]"><LoaderCircle size={13} className="shrink-0 animate-spin motion-reduce:animate-none" aria-hidden="true" />Approval pending</span>
        </div>
        <h3 className="col-start-2 text-[19px] leading-snug font-semibold tracking-[-0.4px] [overflow-wrap:anywhere] max-[480px]:text-lg">{request.appName}</h3>
        <time dateTime={request.savedAt} className="col-start-2 text-[11px] tabular-nums text-(--muted)">{dateFormat.format(new Date(request.savedAt))}</time>
      </div>
      <dl className="divide-y divide-(--edge) px-4 max-[480px]:px-3.5">
        {rows.map(row => <div key={row.label} className="grid grid-cols-[120px_minmax(0,1fr)] items-baseline gap-x-4 gap-y-1 py-2.5 max-[480px]:grid-cols-1">
          <dt className="text-xs text-(--muted)">{row.label}</dt>
          <dd className="m-0 select-text text-sm leading-relaxed [overflow-wrap:anywhere]" translate="no">{row.value}</dd>
        </div>)}
        <div className="py-3">
          <dt className="text-xs text-(--muted)">{label}</dt>
          <dd className="m-0 min-w-0"><WalletExplorerLink label={label} address={request.kind === "spot" ? request.feesWallet : request.revenueWallet} chainIds={request.kind === "perps" ? request.chainIds : undefined} /></dd>
        </div>
      </dl>
    </article>
  );
}
