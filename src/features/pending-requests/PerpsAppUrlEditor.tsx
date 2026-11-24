import { useRef, useState } from "react";
import { LoaderCircle, Pencil } from "lucide-react";
import { useConfig, useSignMessage } from "wagmi";
import { getAccount } from "wagmi/actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import { MAX_DEX_URL_LENGTH, validateDexUrl } from "@/lib/dex-url";
import { useMountedRef } from "@/hooks/useMountedRef";
import { appUrlMessage } from "./app-url-proof";
import { useWalletRequests } from "./wallet-requests-context";
import type { PerpsRequest } from "./request-record";

export function PerpsAppUrlEditor({ request, disabled, onBusyChange }: { request: PerpsRequest; disabled: boolean; onBusyChange: (busy: boolean) => void }) {
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState(request.appUrl ?? "");
  const [attempted, setAttempted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const mounted = useMountedRef();
  const config = useConfig();
  const { signMessageAsync } = useSignMessage();
  const { refresh } = useWalletRequests();
  const validation = !url.trim() ? "Enter your app URL." : validateDexUrl(url)?.replaceAll("DEX URL", "app URL");
  async function save() {
    if (inFlight.current) return;
    setAttempted(true);
    if (validation) { requestAnimationFrame(() => document.getElementById("perps-app-url")?.focus()); return; }
    const account = getAccount(config);
    if (!account.isConnected || !account.address) { setError("Connect the submitting wallet to update your app URL."); return; }
    const address = account.address;
    const current = () => { const live = getAccount(config); return live.isConnected && live.address?.toLowerCase() === address.toLowerCase(); };
    inFlight.current = true; setBusy(true); onBusyChange(true); setError("");
    try {
      const details = { address, origin: window.location.origin, issuedAt: new Date().toISOString(), nonce: crypto.randomUUID(), requestId: request.id, appUrl: url.trim(), version: request.appUrlVersion ?? 0 };
      const signature = await signMessageAsync({ account: address, message: appUrlMessage(details) });
      if (!mounted.current || !current()) throw new Error("Your wallet changed. Try again.");
      const response = await fetch("/api/perps-app-url", { method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(15_000), body: JSON.stringify({ ...details, signature }) });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body && typeof body === "object" && "error" in body && typeof body.error === "string" ? body.error : "Couldn’t save the app URL. Try again.");
      if (!current()) throw new Error("Your wallet changed. Reconnect to check your setup.");
      if (!mounted.current) return;
      refresh(); setEditing(false); setAttempted(false);
      toast.success("App URL saved");
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error && !/reject|denied|cancel/i.test(cause.message) ? cause.message.split("\n")[0] : "Signature cancelled. Your app URL was not changed.");
    } finally { inFlight.current = false; onBusyChange(false); if (mounted.current) setBusy(false); }
  }
  return <section className="mt-4 rounded-2xl border border-(--edge) bg-(--surface) p-4" aria-labelledby="perps-app-url-heading">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 id="perps-app-url-heading" className="text-sm font-semibold">App URL</h3>
      {!editing ? <Button type="button" variant="ghost" size="sm" className="min-h-11 text-xs text-(--link)" disabled={disabled} onClick={() => { setUrl(request.appUrl ?? ""); setEditing(true); setError(""); }}><Pencil size={14} aria-hidden="true" />{request.appUrl ? "Edit" : "Add URL"}</Button> : null}</div>
    {!editing ? <><p className="text-sm leading-relaxed wrap-anywhere text-(--secondary-text)">{request.appUrl || "Not added yet"}</p><p className="mt-2 text-xs leading-relaxed text-(--muted)">Your app URL must be configured for your app to work. Saving it here does not configure Perps automatically.</p></> : <form className="mt-3" onSubmit={event => { event.preventDefault(); void save(); }}>
      <Label htmlFor="perps-app-url" className="sr-only">App URL</Label><Input id="perps-app-url" type="url" inputMode="url" autoComplete="url" maxLength={MAX_DEX_URL_LENGTH + 1} placeholder="https://your-app.com" value={url} onChange={event => setUrl(event.target.value)} disabled={busy} aria-invalid={attempted && !!validation} aria-describedby={attempted && validation ? "perps-app-url-error" : undefined} />
      <FieldError id="perps-app-url-error" message={attempted ? validation : undefined} />
      <p className="mt-2 text-xs leading-relaxed text-(--muted)">Sign a message to verify your wallet and save this URL to your setup.</p>
      {error ? <p role="alert" className="mt-2 text-xs text-(--danger)">{error}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2"><Button type="submit" size="sm" disabled={busy} aria-busy={busy}>{busy ? <><LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" />Saving…</> : "Save URL"}</Button><Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => { setEditing(false); setAttempted(false); setUrl(request.appUrl ?? ""); setError(""); }}>Cancel</Button></div>
    </form>}
  </section>;
}
