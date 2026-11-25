import { ArrowLeftRight, CircleCheck, Inbox, LoaderCircle, Rocket } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSetupCounts } from "./useSetupCounts";
import { useWalletRequests } from "./wallet-requests-context";
import { navigateWithinApp } from "@/hooks/useSearchLocation";
import { workspaceHref } from "./workspace-location";

// The header is remounted when opening the dashboard. Keep the preview closed
// until the pointer leaves, even if the new header appears under the cursor.
let suppressPreview = false;

/**
 * The single entry point to the My workspaces page: a header pill matching the wallet chip, shown once a wallet is
 * connected. The badge shows the total number of saved setups; phones show the icon with the badge.
 */
export function HeaderPendingRequestsButton({ active, onOpen, disabled = false }: { active: boolean; onOpen: () => void; disabled?: boolean }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const root = useRef<HTMLDivElement>(null);
  function cancelClose() { if (closeTimer.current !== null) { clearTimeout(closeTimer.current); closeTimer.current = null; } }
  function closePreview() { cancelClose(); setPreviewOpen(false); }
  useEffect(() => () => cancelClose(), []);
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
  // Visitors connect with the header's Connect wallet button first; My workspaces appears once connected.
  if (!address) return null;
  return (
    <div ref={root} data-setups-preview className="relative" onPointerEnter={event => { if (event.pointerType === "mouse") { cancelClose(); if (!suppressPreview) setPreviewOpen(true); } }} onPointerLeave={event => { if (event.pointerType === "mouse") { cancelClose(); closeTimer.current = setTimeout(() => { closeTimer.current = null; if (!root.current?.contains(document.activeElement)) setPreviewOpen(false); }, 150); } }} onFocus={() => { cancelClose(); if (!suppressPreview) setPreviewOpen(true); }} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) closePreview(); }} onKeyDown={event => { if (event.key === "Escape") closePreview(); }}>
    <Button asChild
      className="relative min-h-11 gap-2 rounded-[17px] border-0 px-[15px] py-2.5 text-[13px] font-medium max-[767px]:size-11 max-[767px]:min-h-11 max-[767px]:rounded-[15px] max-[767px]:p-0 max-[720px]:min-h-11 max-[720px]:p-0">
      <a href="/setups" onClick={event => { if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); if (disabled) return; suppressPreview = event.detail !== 0; closePreview(); onOpen(); }} aria-current={active ? "page" : undefined}
      aria-disabled={disabled || undefined}
      aria-label={error ? "My workspaces: check saved requests" : `My workspaces, ${pendingCount} pending, ${approvedCount} approved`}
      >
      <Inbox size={16} aria-hidden="true" />
      <span className="max-[767px]:sr-only">My workspaces</span>
      {requests.length ? <span aria-hidden="true" className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[11px] leading-none font-semibold text-primary tabular-nums max-[767px]:absolute max-[767px]:-top-1 max-[767px]:-right-1 max-[767px]:h-[18px] max-[767px]:min-w-[18px] max-[767px]:px-1">{requests.length}</span> : null}
      {error ? <span aria-hidden="true" className="size-2 rounded-full bg-(--status-danger) ring-1 ring-white max-[767px]:absolute max-[767px]:top-1.5 max-[767px]:right-1.5" /> : null}
      </a>
    </Button>
    <div className={`absolute top-full right-0 z-50 hidden w-80 max-w-[calc(100vw-32px)] pt-2 ${previewOpen ? "md:block" : ""}`}>
      <div className="overflow-hidden rounded-2xl border border-(--edge) bg-(--surface) shadow-[0_12px_35px_var(--dialog-shadow)]">
        <div className="flex items-center justify-between border-b border-(--edge) px-4 py-3">
          <p className="text-sm font-semibold text-(--text)">Your workspaces</p>
          {!loading && !error ? <span className="text-xs tabular-nums text-(--muted)">{requests.length} {requests.length === 1 ? "workspace" : "workspaces"}</span> : null}
        </div>
        {loading ? <div role="status" aria-label="Loading workspaces" aria-busy="true" className="grid gap-3 px-2 py-3"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" /></div>
          : error ? <p className="px-2 py-3 text-sm text-(--warning-text)">Workspaces are temporarily unavailable.</p>
          : requests.length === 0 ? <p className="px-2 py-3 text-sm text-(--muted)">No workspaces yet.</p>
          : <ul className="m-0 grid max-h-72 list-none overflow-y-auto p-2">
            {requests.map(request => {
              const pending = statusOf(request) === "pending";
              const ProductIcon = request.kind === "spot" ? ArrowLeftRight : Rocket;
              return <li key={request.id}>
                <a href={workspaceHref(request)} aria-disabled={disabled || undefined} onClick={event => {
                  if (disabled) { event.preventDefault(); return; }
                  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                  suppressPreview = event.detail !== 0; closePreview(); navigateWithinApp(event);
                }} className="flex min-h-11 min-w-0 items-center gap-3 rounded-[10px] px-3 py-2.5 hover:bg-(--control-hover) focus-visible:bg-(--control-hover) [&>*]:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-(--focus-ring) aria-disabled:opacity-50">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-(--primary-soft) text-(--link)"><ProductIcon size={16} aria-hidden="true" /></span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-(--text)">{request.appName}</span><span className="mt-0.5 block text-xs text-(--muted)">{request.kind === "spot" ? "Spot" : "Perps"}</span></span>
                <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-(--link)">{pending ? <LoaderCircle size={14} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <CircleCheck size={14} aria-hidden="true" />}{pending ? "Pending" : "Approved"}</span>
                </a>
              </li>;
            })}
          </ul>}
      </div>
    </div>
    </div>
  );
}
