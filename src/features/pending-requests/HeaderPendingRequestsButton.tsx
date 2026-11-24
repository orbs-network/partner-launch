import { ArrowLeftRight, CircleCheck, Inbox, LoaderCircle, Rocket } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSetupCounts } from "./useSetupCounts";
import { useWalletRequests } from "./wallet-requests-context";

// The header is remounted when opening the dashboard. Keep the preview closed
// until the pointer leaves, even if the new header appears under the cursor.
let suppressPreview = false;

/**
 * The single entry point to the My setups page: a header pill matching the wallet chip, shown once a wallet is
 * connected. The badge shows the total number of saved setups; phones show the icon with the badge.
 */
export function HeaderPendingRequestsButton({ active, onOpen }: { active: boolean; onOpen: () => void }) {
  const [dismissed, setDismissed] = useState(() => suppressPreview);
  const { requests, error, statusOf, pendingCount, approvedCount } = useSetupCounts();
  const { address, loading } = useWalletRequests();
  useEffect(() => {
    function releasePreview(event: PointerEvent) {
      if (event.pointerType !== "mouse" || !suppressPreview) return;
      const target = document.elementFromPoint(event.clientX, event.clientY);
      if (!target?.closest("[data-setups-preview]")) suppressPreview = false;
    }
    window.addEventListener("pointermove", releasePreview);
    return () => window.removeEventListener("pointermove", releasePreview);
  }, []);
  // Visitors connect with the header's Connect wallet button first; My setups appears once connected.
  if (!address) return null;
  return (
    <div data-setups-preview className="group/setups relative" onPointerEnter={event => { if (event.pointerType === "mouse" && !suppressPreview) setDismissed(false); }} onFocus={() => { if (!suppressPreview) setDismissed(false); }} onKeyDown={event => { if (event.key === "Escape") setDismissed(true); }}>
    <Button asChild variant="ghost"
      className="relative min-h-11 gap-2 rounded-[17px] border-0 bg-(--surface) px-[15px] py-2.5 text-[13px] font-medium text-(--secondary-text) hover:bg-(--primary-soft) hover:text-(--link) aria-[current=page]:bg-(--primary-soft) aria-[current=page]:text-(--link) max-[767px]:size-11 max-[767px]:min-h-11 max-[767px]:rounded-[15px] max-[767px]:p-0 max-[720px]:min-h-11 max-[720px]:p-0">
      <a href="/setups" onClick={event => { if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); suppressPreview = event.detail !== 0; setDismissed(true); onOpen(); }} aria-current={active ? "page" : undefined}
      aria-label={error ? "My setups: check saved requests" : `My setups, ${pendingCount} pending, ${approvedCount} approved`}
      >
      <Inbox size={16} aria-hidden="true" />
      <span className="max-[767px]:sr-only">My setups</span>
      {requests.length ? <span aria-hidden="true" className="flex h-5 min-w-5 items-center justify-center rounded-full bg-(--link) px-1.5 text-[11px] leading-none font-semibold text-(--surface) tabular-nums max-[767px]:absolute max-[767px]:-top-1 max-[767px]:-right-1 max-[767px]:h-[18px] max-[767px]:min-w-[18px] max-[767px]:px-1">{requests.length}</span> : null}
      {error ? <span aria-hidden="true" className="size-2 rounded-full bg-(--status-danger) max-[767px]:absolute max-[767px]:top-1.5 max-[767px]:right-1.5" /> : null}
      </a>
    </Button>
    <div className={`absolute top-full right-0 z-50 hidden w-80 max-w-[calc(100vw-32px)] pt-2 ${dismissed ? "" : "md:group-hover/setups:block md:group-focus-within/setups:block"}`}>
      <div className="overflow-hidden rounded-2xl border border-(--edge) bg-(--surface) shadow-[0_12px_35px_var(--dialog-shadow)]">
        <div className="flex items-center justify-between border-b border-(--edge) px-4 py-3">
          <p className="text-sm font-semibold text-(--text)">Your setups</p>
          {!loading && !error ? <span className="text-xs tabular-nums text-(--muted)">{requests.length} {requests.length === 1 ? "setup" : "setups"}</span> : null}
        </div>
        {loading ? <div role="status" aria-label="Loading setups" aria-busy="true" className="grid gap-3 px-2 py-3"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" /></div>
          : error ? <p className="px-2 py-3 text-sm text-(--warning-text)">Setups are temporarily unavailable.</p>
          : requests.length === 0 ? <p className="px-2 py-3 text-sm text-(--muted)">No setups yet.</p>
          : <ul className="m-0 max-h-72 list-none divide-y divide-(--edge) overflow-y-auto px-4">
            {requests.map(request => {
              const pending = statusOf(request) === "pending";
              const ProductIcon = request.kind === "spot" ? ArrowLeftRight : Rocket;
              return <li key={request.id} className="flex min-w-0 items-center gap-3 py-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-(--primary-soft) text-(--link)"><ProductIcon size={16} aria-hidden="true" /></span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-(--text)">{request.appName}</span><span className="mt-0.5 block text-xs text-(--muted)">{request.kind === "spot" ? "Spot" : "Perps"}</span></span>
                <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-(--link)">{pending ? <LoaderCircle size={14} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <CircleCheck size={14} aria-hidden="true" />}{pending ? "Pending" : "Approved"}</span>
              </li>;
            })}
          </ul>}
      </div>
    </div>
    </div>
  );
}
