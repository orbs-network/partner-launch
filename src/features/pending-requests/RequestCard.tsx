import { formatSpotFeePercent } from "../onboarding/spot/spot-fee";
import { ArrowLeftRight, CircleAlert, CircleCheck, LoaderCircle, Rocket } from "lucide-react";
import { chainById } from "@/config/chains";
import { WalletExplorerLink } from "./WalletExplorerLink";
import type { PendingRequest } from "./request-record";
import { SpotContactGuidance } from "../onboarding/spot/SpotContactGuidance";

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

export function RequestCard({ request, registryStatus, tradingEnabled = false }: { request: PendingRequest; registryStatus: "checking" | "pending" | "approved" | "ready" | "error"; tradingEnabled?: boolean }) {
  const status = registryStatus;
  const StatusIcon = status === "ready" || status === "approved" ? CircleCheck : status === "error" ? CircleAlert : LoaderCircle;
  const statusLabel = status === "approved" ? "Approved" : status === "ready" ? request.kind === "spot" ? "Configuration found" : "Trading enabled" : status === "error" ? "Status unavailable" : status === "checking" ? "Checking status" : "Approval pending";
  const Icon = request.kind === "spot" ? ArrowLeftRight : Rocket;
  const label = request.kind === "spot" ? "Fees wallet" : "Revenue wallet";
  const rows = request.kind === "spot" ? [...(request.partnerId ? [{ label: "Partner ID", value: request.partnerId }] : []), ...(request.dexUrl ? [{ label: "DEX URL", value: request.dexUrl }] : []), ...(request.tradingFeeTenthsBps === undefined ? [] : [{ label: "Trading fee", value: `${formatSpotFeePercent(request.tradingFeeTenthsBps)}%` }])] : [
    { label: "Partner ID", value: request.partnerId },
    { label: "Networks", value: request.chainIds.map(id => chainById(id)?.name ?? `Chain ${id}`).join(", ") },
    ...(request.extraFeePercent === undefined ? [] : [{ label: "Additional fees", value: `${request.extraFeePercent}%` }]),
  ];
  return (
    <article aria-label={`${request.appName} ${request.kind === "spot" ? "Spot" : "Perps"} request`} className="overflow-hidden rounded-[22px] border border-(--edge) bg-(--control-bg)">
      <div className="grid grid-cols-[44px_minmax(0,1fr)] items-center gap-x-3.5 gap-y-1 border-b border-(--edge) bg-(--surface) p-4 max-[480px]:p-3.5">
        <span className="row-span-3 flex size-11 shrink-0 items-center justify-center rounded-2xl bg-(--primary-soft) text-(--link)"><Icon size={21} aria-hidden="true" /></span>
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.09em] text-(--muted)">{request.kind === "spot" ? "Spot" : "Perps"}</p>
          <span role="status" className="ml-auto inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-(--primary-soft) px-2.5 py-1.5 text-[11px] font-medium text-(--link) max-[480px]:gap-1 max-[480px]:px-2 max-[480px]:text-[10px]"><StatusIcon size={13} className={`shrink-0${status === "checking" || status === "pending" ? " animate-spin motion-reduce:animate-none" : ""}`} aria-hidden="true" />{statusLabel}</span>
        </div>
        <h3 className="col-start-2 text-[19px] leading-snug font-semibold tracking-[-0.4px] [overflow-wrap:anywhere] max-[480px]:text-lg">{request.appName}</h3>
        <time dateTime={request.savedAt} className="col-start-2 text-[11px] tabular-nums text-(--muted)">{dateFormat.format(new Date(request.savedAt))}</time>
      </div>
      {request.kind === "perps" && status === "ready" ? <p className="px-4 pt-3 text-xs text-(--muted)">The registry shows enabled trading on your requested networks.</p> : null}
      {request.kind === "spot" && status === "ready" ? <p className="px-4 pt-3 text-xs text-(--muted)"><SpotContactGuidance /></p> : null}
      {status === "approved" ? <p className="px-4 pt-3 text-xs text-(--muted)">{tradingEnabled && request.kind === "perps"
        ? "Your setup is approved and trading is enabled. You can now start trading in your app!"
        : "Your setup is approved! You can start trading in your app once trading is enabled."}</p> : null}
      <dl className="divide-y divide-(--edge) px-4 max-[480px]:px-3.5">
        {rows.map(row => <div key={row.label} className="grid grid-cols-[120px_minmax(0,1fr)] items-baseline gap-x-4 gap-y-1 py-2.5 max-[480px]:grid-cols-1">
          <dt className="text-xs text-(--muted)">{row.label}</dt>
          <dd className="m-0 select-text text-sm leading-relaxed [overflow-wrap:anywhere]" translate="no">{row.value}</dd>
        </div>)}
        {request.ownerWallets?.length ? <div className="py-3"><dt className="text-xs text-(--muted)">App owner wallets</dt>
          {request.ownerWallets.map(address => <dd key={address} className="m-0 min-w-0"><WalletExplorerLink label="App owner wallet" address={address} chainIds={request.kind === "perps" ? request.chainIds : undefined} /></dd>)}</div> : null}
        <div className="py-3">
          <dt className="text-xs text-(--muted)">{label}</dt>
          <dd className="m-0 min-w-0"><WalletExplorerLink label={label} address={request.kind === "spot" ? request.feesWallet : request.revenueWallet} chainIds={request.kind === "perps" ? request.chainIds : undefined} /></dd>
        </div>
      </dl>
    </article>
  );
}
