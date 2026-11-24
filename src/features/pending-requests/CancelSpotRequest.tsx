import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LoaderCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMountedRef } from "@/hooks/useMountedRef";
import { useConfig, useSignMessage } from "wagmi";
import { getAccount } from "wagmi/actions";
import { spotCancelMessage } from "./spot-cancel-proof";
import { cancelSpotRequest } from "./cancel-spot";
import { useWalletRequests } from "./wallet-requests-context";
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
  const loadingToast = useRef<string | number | null>(null);
  const { refresh, requests } = useWalletRequests();
  const config = useConfig();
  const { signMessageAsync } = useSignMessage();
  useEffect(() => () => onBusyChange(false), [onBusyChange]);
  useEffect(() => () => { if (loadingToast.current !== null) toast.dismiss(loadingToast.current); }, []);
  async function cancel() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    onBusyChange(true);
    setError("");
    const toastId = toast.loading("Confirm cancellation in your wallet…", { duration: Infinity, dismissible: false, closeButton: false });
    loadingToast.current = toastId;
    const target = { ...request };
    const fingerprint = JSON.stringify(target);
    try {
      if (delivered.current !== fingerprint) {
        const account = getAccount(config);
        if (!account.isConnected || !account.address) throw new Error("Connect the submitting wallet to cancel this request.");
        const address = account.address;
        const current = () => getAccount(config).address?.toLowerCase() === address.toLowerCase() && getAccount(config).isConnected;
        const details = { address, origin: window.location.origin, issuedAt: new Date().toISOString(), nonce: crypto.randomUUID(), requestId: target.id };
        const signature = await signMessageAsync({ account: address, message: spotCancelMessage(details) });
        if (!mounted.current || !current()) throw new Error("Your wallet changed. Please try again.");
        const proof = { ...details, signature };
        toast.loading("Sending cancellation to the team…", { id: toastId });
        await cancelSpotRequest(target, proof);
        if (!current()) throw new Error("Your wallet changed. Reconnect to check the request status.");
        if (!mounted.current) return;
        delivered.current = fingerprint;
      }
      refresh();
      const remaining = requests.length - 1;
      toast.success("Cancellation sent to the team", { id: toastId, duration: 4000, dismissible: true, closeButton: true });
      loadingToast.current = null;
      onCancelled(remaining);
      if (mounted.current) setOpen(false);
    } catch (cause) {
      if (mounted.current) {
        const message = cause instanceof Error ? cause.message : "We couldn’t cancel this request. Please try again.";
        setError(message);
        toast.error(message, { id: toastId, duration: 6000, dismissible: true, closeButton: true });
        loadingToast.current = null;
      }
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
        <DialogDescription>Send a cancellation request for <strong className="font-medium text-(--text) [overflow-wrap:anywhere]">{request.appName}</strong> to the team. Sign a message to verify the submitting wallet.</DialogDescription>
        {error ? <p role="alert" className="mt-4 rounded-xl border border-(--warning-border) bg-(--warning-bg) p-3 text-[13px] leading-relaxed text-(--warning-text)">{error}</p> : null}
        <DialogFooter className="mt-6 [&_button]:min-h-11 [&_button]:min-w-0 [&_button]:whitespace-normal [&_button]:text-[13px] max-[480px]:[&_button]:flex-1">
          <Button ref={keepRef} type="button" variant="secondary" disabled={busy} onClick={() => setOpen(false)}>Keep request</Button>
          <Button type="button" variant="destructive" disabled={busy} aria-busy={busy} onClick={() => void cancel()}>{busy ? <><LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />Cancelling…</> : "Cancel request"}</Button>
        </DialogFooter>
        <span role="status" className="sr-only">{busy ? "Sending cancellation to the team." : ""}</span>
      </DialogContent>
    </Dialog>
  );
}
