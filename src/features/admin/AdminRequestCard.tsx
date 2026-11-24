import { Check, Clock3, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { chainById } from "@/config/chains";
import type { PendingRequest } from "../pending-requests";

const dates = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

export function AdminRequestCard({ request, approvedAt, onApprove, busy, approving, ownerWallet, contact, partnerId }: {
  request: PendingRequest;
  approvedAt?: string;
  onApprove?: () => void;
  busy?: boolean;
  approving?: boolean;
  ownerWallet?: string;
  contact?: string;
  partnerId?: string;
}) {
  const rows = request.kind === "spot"
    ? [...(partnerId ? [{ label: "Partner ID", value: partnerId }] : []), { label: "Fees wallet", value: request.feesWallet }, ...(request.dexUrl ? [{ label: "DEX URL", value: request.dexUrl }] : [])]
    : [{ label: "Partner ID", value: request.partnerId }, { label: "Network", value: request.chainIds.map(id => chainById(id)?.name ?? `Chain ${id}`).join(", ") },
      { label: "Revenue wallet", value: request.revenueWallet }, ...(request.extraFeePercent === undefined ? [] : [{ label: "Extra trading fee", value: `${request.extraFeePercent}%` }])];
  return (
    <article className="rounded-2xl border border-(--edge) bg-(--surface) p-5 max-[480px]:p-4" aria-label={`${request.appName} ${request.kind} request`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0"><p className="text-xs font-medium uppercase tracking-wide text-(--muted)">{request.kind === "spot" ? "Spot" : "Perps"}</p><h2 className="mt-1 text-lg font-semibold [overflow-wrap:anywhere]">{request.appName}</h2><p className="mt-1 text-xs text-(--muted)">Submitted {dates.format(new Date(request.savedAt))}</p></div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-(--primary-soft) px-3 py-1.5 text-xs font-medium text-(--link)">{approvedAt ? <Check size={14} aria-hidden="true" /> : <Clock3 size={14} aria-hidden="true" />}{approvedAt ? "Approved" : "Pending"}</span>
      </div>
      <dl className="mt-4 grid gap-3 border-t border-(--edge) pt-4 sm:grid-cols-2">
        {[...rows, ...(request.ownerWallets?.length ? [{ label: "Owner wallets (unverified)", value: request.ownerWallets.join(", ") }] : ownerWallet ? [{ label: "Owner wallet (unverified)", value: ownerWallet }] : []), ...(contact ? [{ label: "Contact", value: contact }] : [])].map(row => <div key={row.label} className="min-w-0"><dt className="text-xs text-(--muted)">{row.label}</dt><dd className="m-0 mt-1 text-sm [overflow-wrap:anywhere]" translate="no">{row.value}</dd></div>)}
      </dl>
      {onApprove ? <Button type="button" disabled={busy} aria-busy={approving} className="mt-5 min-h-11 w-full sm:w-auto" onClick={onApprove}>{approving ? <><LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />Approving…</> : "Approve request"}</Button> : <p className="mt-5 text-xs text-(--muted)">Approved {approvedAt ? dates.format(new Date(approvedAt)) : ""}</p>}
    </article>
  );
}
