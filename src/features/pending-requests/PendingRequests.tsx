import { ArrowUpRight, Inbox, X } from "lucide-react";
import { useRef, useState, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SPOT_DOCS_URL } from "@/config/links";
import { useIsMobile } from "@/hooks/useIsMobile";
import { usePendingRequests } from "./store";
import { RequestCard } from "./RequestCard";
import { CancelSpotRequest } from "./CancelSpotRequest";

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

export function PendingRequests({ open, onOpenChange, onOpen, id, triggerRef }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpen: () => void;
  id: string;
  triggerRef: RefObject<HTMLButtonElement | null>;
}) {
  const mobile = useIsMobile();
  const { requests, error } = usePendingRequests();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const selected = requests.find(request => request.id === selectedId) ?? requests[0];
  const headingRef = useRef<HTMLHeadingElement>(null);
  return (<>
    <span hidden data-pending-requests-space={requests.length > 0 || !!error} />
    {!mobile && (requests.length > 0 || error) ? (
      <button ref={triggerRef} type="button" data-dismissible="false" onClick={onOpen} aria-haspopup="dialog" aria-controls={id} aria-expanded={open} hidden={open}
        className={`fixed top-[calc(var(--app-header-height)+12px)] right-6 z-40 min-h-[76px] w-[356px] items-center gap-3 rounded-2xl border border-(--panel-border) bg-(--surface) px-4 py-3 text-left text-(--text) shadow-[0_10px_30px_rgb(20_30_60/0.14)] hover:bg-(--control-hover) focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-(--focus-ring) max-[600px]:right-4 max-[600px]:left-4 max-[600px]:w-auto ${open ? "hidden" : "flex"}`}>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-(--primary-soft) text-(--link)"><Inbox size={20} aria-hidden="true" /></span>
        <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">Pending requests{requests.length ? ` (${requests.length})` : ""}</span><span className="mt-1 block text-xs text-(--muted)">{error ? "Open to check saved requests" : "View your Spot and Perps setups"}</span></span>
        <ArrowUpRight size={17} className="shrink-0 text-(--link)" aria-hidden="true" />
      </button>
    ) : null}
    <Dialog open={open} dismissible={!cancelling} onOpenChange={next => { if (!cancelling) onOpenChange(next); }}>
      <DialogContent id={id} showCloseButton={false} className="flex max-h-[calc(100dvh-32px)] w-[560px] flex-col gap-0 overflow-hidden p-5 max-[480px]:px-4 max-[480px]:py-5"
        onOpenAutoFocus={event => { event.preventDefault(); headingRef.current?.focus({ preventScroll: true }); }}
        onCloseAutoFocus={event => { event.preventDefault(); (triggerRef.current ?? document.querySelector<HTMLElement>("main h1"))?.focus({ preventScroll: true }); }}>
        <DialogClose asChild><Button variant="ghost" size="icon" className="absolute right-3 top-3 size-11 max-[720px]:size-11" aria-label="Close pending requests" disabled={cancelling}><X size={19} aria-hidden="true" /></Button></DialogClose>
        <DialogTitle ref={headingRef} tabIndex={-1} className="pr-10 text-[22px] leading-tight tracking-[-0.7px] focus:outline-none max-[480px]:text-xl">Pending requests</DialogTitle>
        <DialogDescription className="mt-2 text-[13px]">Your setups awaiting team approval.{selected?.kind === "spot" && selected.notification === "telegram" ? <><br />Partner approval can take up to 48 hours.</> : null}</DialogDescription>
        {error ? <p role="alert" className="mt-4 rounded-xl border border-(--warning-border) bg-(--warning-bg) p-3 text-sm text-(--warning-text)">{error}</p> : null}
        {requests.length > 1 ? <div className="mt-4 shrink-0">
          <Select value={selected?.id} onValueChange={setSelectedId} disabled={cancelling}>
            <SelectTrigger aria-label="Pending request" className="w-full bg-(--control-bg)">
              <SelectValue>{selected ? `${selected.appName} · ${selected.kind === "spot" ? "Spot" : "Perps"}` : "Choose a request"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {requests.map(request => <SelectItem key={request.id} value={request.id} textValue={`${request.appName} ${request.kind}`}>
                <span className="block min-w-0 py-0.5"><span className="block font-medium">{request.appName}</span><span className="mt-0.5 block text-[11px] text-(--muted)">{request.kind === "spot" ? "Spot" : "Perps"} · {dateFormat.format(new Date(request.savedAt))}</span></span>
              </SelectItem>)}
            </SelectContent>
          </Select>
        </div> : null}
        <div className="mt-4 min-h-0 overflow-y-auto overscroll-contain rounded-[22px]">
          {selected ? <RequestCard request={selected} /> : <div className="px-3 py-10 text-center"><Inbox size={26} className="mx-auto text-(--muted)" aria-hidden="true" /><p className="mt-3 text-sm text-(--muted)">No pending requests yet.</p></div>}
        </div>
        {selected?.kind === "spot" ? <footer className="mt-3 flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-(--edge) pt-2" aria-label="Spot request actions">
          <a href={SPOT_DOCS_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 rounded-md text-xs font-medium text-(--link) hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)">Spot integration docs<ArrowUpRight size={14} aria-hidden="true" /></a>
          <CancelSpotRequest key={selected.id} request={selected} onBusyChange={setCancelling} onCancelled={remaining => {
            if (!remaining) onOpenChange(false);
            else requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true }));
          }} />
        </footer> : null}
      </DialogContent>
    </Dialog>
    </>
  );
}
