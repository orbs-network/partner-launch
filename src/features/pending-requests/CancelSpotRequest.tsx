import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMountedRef } from "@/hooks/useMountedRef";
import { cancelSpotRequest } from "./cancel-spot";
import { removeCancelledSpotRequest } from "./store";
import type { SpotRequest } from "./request-record";

export function CancelSpotRequest({ request, onBusyChange, onCancelled }: {
  request: SpotRequest;
  onBusyChange: (busy: boolean) => void;
  onCancelled: (remaining: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const delivered = useRef<string | null>(null);
  const keepRef = useRef<HTMLButtonElement>(null);
  const mounted = useMountedRef();
  useEffect(() => () => onBusyChange(false), [onBusyChange]);
  async function cancel() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    onBusyChange(true);
    setError("");
    const target = { ...request };
    const fingerprint = JSON.stringify(target);
    try {
      if (delivered.current !== fingerprint) {
        await cancelSpotRequest(target);
        if (!mounted.current) return;
        delivered.current = fingerprint;
      }
      const remaining = removeCancelledSpotRequest(target);
      toast.success("Cancellation sent to the team");
      onCancelled(remaining);
      if (mounted.current) setOpen(false);
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : "We couldn’t cancel this request. Please try again.");
    } finally {
      inFlight.current = false;
      onBusyChange(false);
      if (mounted.current) setBusy(false);
    }
  }
  return (
    <Dialog open={open} dismissible={!busy} onOpenChange={next => { if (!inFlight.current) { setOpen(next); setError(""); } }}>
      <DialogTrigger asChild><Button type="button" variant="ghost" size="sm" className="h-11 rounded-xl px-3 text-xs text-(--danger) hover:text-(--danger)">Cancel request</Button></DialogTrigger>
      <DialogContent showCloseButton={false} onOpenAutoFocus={event => { event.preventDefault(); keepRef.current?.focus({ preventScroll: true }); }}
        onEscapeKeyDown={event => { if (inFlight.current) event.preventDefault(); }} onPointerDownOutside={event => { if (inFlight.current) event.preventDefault(); }}>
        <DialogTitle>Cancel this Spot request?</DialogTitle>
        <DialogDescription>Send a cancellation request for <strong className="font-medium text-(--text) [overflow-wrap:anywhere]">{request.appName}</strong> to the team in Telegram and remove it from this browser. The team will handle the cancellation.</DialogDescription>
        {error ? <p role="alert" className="mt-4 rounded-xl border border-(--warning-border) bg-(--warning-bg) p-3 text-[13px] leading-relaxed text-(--warning-text)">{error}</p> : null}
        <DialogFooter className="mt-6 [&_button]:min-h-11 [&_button]:min-w-0 [&_button]:whitespace-normal [&_button]:text-[13px] max-[480px]:[&_button]:flex-1">
          <Button ref={keepRef} type="button" variant="secondary" disabled={busy} onClick={() => setOpen(false)}>Keep request</Button>
          <Button type="button" variant="destructive" disabled={busy} onClick={() => void cancel()}>{busy ? "Sending cancellation…" : "Cancel request"}</Button>
        </DialogFooter>
        <span role="status" className="sr-only">{busy ? "Sending cancellation to the team." : ""}</span>
      </DialogContent>
    </Dialog>
  );
}
