import { useRef, useState, type CSSProperties } from "react";
import { CircleAlert, LoaderCircle, Pencil, Wallet } from "lucide-react";
import { useAccount, useConfig, useSignMessage } from "wagmi";
import { getAccount } from "wagmi/actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError } from "@/components/ui/field-error";
import { validateContact, normalizeContact, MAX_CONTACT_LENGTH } from "@/lib/contact";
import { validateDexUrl } from "@/lib/dex-url";
import { validateDexName, isPartnerIdFormat } from "../onboarding/dex-identity";
import { validateRevenueWallet } from "../onboarding/revenue-settings";
import { Label } from "@/components/ui/label";
import { FieldHelp } from "@/components/FieldHelp";
import { UseMyWalletButton } from "../onboarding/components/UseMyWalletButton";
import { chainLogo } from "@/config/chains";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { selectablePerpsChains, chainById } from "@/config/supported-chains";
import { useMountedRef } from "@/hooks/useMountedRef";
import { parseBuilderFeePercent } from "../onboarding/builder-fee";
import { formatSpotFeePercent, parseSpotFeePercent } from "../onboarding/spot/spot-fee";
import { workspacePartnerId } from "./workspace-location";
import { normalizeWorkspaceEdit, type WorkspaceEdit } from "./workspace-edit";
import { useWalletRequests } from "./wallet-requests-context";
import { postAsWallet } from "./workspace-auth";
import type { PendingRequest } from "./request-record";

type Draft = { appName: string; partnerId: string; integrationMode: string; url: string; wallet: string; fee: string; chainId: string; contact: string };
function draftFor(request: PendingRequest): Draft {
  if (request.pendingEdit) { const edit = request.pendingEdit; return { ...edit, partnerId: workspacePartnerId(request), contact: "", fee: edit.product === "spot" ? formatSpotFeePercent(edit.fee) : (edit.fee / 1000).toFixed(3), chainId: String(edit.chainId ?? "") }; }
  return { appName: request.appName, contact: "", partnerId: workspacePartnerId(request), integrationMode: request.integrationMode ?? (request.kind === "spot" ? "existing" : "ui"),
    url: request.kind === "spot" ? request.dexUrl ?? "" : request.appUrl ?? "", wallet: request.kind === "spot" ? request.feesWallet : request.revenueWallet,
    fee: request.kind === "spot" ? request.tradingFeeTenthsBps === undefined ? "" : formatSpotFeePercent(request.tradingFeeTenthsBps) : request.extraFeePercent ?? "",
    chainId: request.kind === "perps" && request.chainIds.length === 1 ? String(request.chainIds[0]) : "" };
}

export function WorkspaceEditDialog({ request, disabled, onBusyChange }: { request: PendingRequest; disabled: boolean; onBusyChange: (value: boolean) => void }) {
  const [open, setOpen] = useState(false); const [draft, setDraft] = useState(() => draftFor(request));
  const [busy, setBusy] = useState(false); const [attempted, setAttempted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const { signMessageAsync } = useSignMessage();
  const [initialDraft, setInitialDraft] = useState(() => draftFor(request));
  const inFlight = useRef(false); const mounted = useMountedRef(); const config = useConfig();
  const account = useAccount(); const { refresh } = useWalletRequests();
  const set = (key: keyof Draft, value: string) => setDraft(current => ({ ...current, [key]: value }));
  const fee = request.kind === "spot" ? parseSpotFeePercent(draft.fee) : parseBuilderFeePercent(draft.fee);
  const initialFee = request.kind === "spot" ? parseSpotFeePercent(initialDraft.fee) : parseBuilderFeePercent(initialDraft.fee);
  const changed = !!request.pendingEdit || draft.appName !== initialDraft.appName || draft.url !== initialDraft.url ||
    draft.wallet.toLowerCase() !== initialDraft.wallet.toLowerCase() || draft.chainId !== initialDraft.chainId ||
    normalizeContact(draft.contact) !== normalizeContact(initialDraft.contact) ||
    (fee === null || initialFee === null ? draft.fee !== initialDraft.fee : fee !== initialFee);
  const errors: Partial<Record<keyof Draft, string>> = {
    appName: validateDexName(draft.appName), contact: validateContact(draft.contact),
    partnerId: draft.partnerId !== draft.partnerId.trim() || (request.kind === "spot" ? !/^[\p{L}\p{M}\p{N}]{3,80}$/u.test(draft.partnerId) : draft.partnerId.length < 3 || draft.partnerId.length > 40 || !isPartnerIdFormat(draft.partnerId)) ? "Enter a valid Partner ID." : undefined,
    url: draft.url !== draft.url.trim() ? "Remove spaces around the URL." : validateDexUrl(draft.url),
    wallet: validateRevenueWallet(draft.wallet), fee: fee === null ? (request.kind === "spot" ? "Choose a fee from 0% to 1%, in 0.001% steps." : "Choose a platform fee from 0% to 0.1%, in 0.001% steps.") : undefined,
    chainId: request.kind === "perps" && !chainById(Number(draft.chainId)) ? "Choose a supported network." : undefined,
  };
  async function submit() {
    if (inFlight.current || !changed) return;
    setAttempted(true);
    const fields: (keyof Draft)[] = ["appName", "contact", "url", "chainId", "wallet", "fee"];
    const firstError = fields.find(key => errors[key]);
    if (firstError) {
      const id = firstError === "appName" ? "app-name" : firstError === "chainId" ? "network" : firstError;
      requestAnimationFrame(() => document.getElementById(`edit-${id}`)?.focus());
      return;
    }
    let edit: WorkspaceEdit;
    try {
      edit = normalizeWorkspaceEdit({ product: request.kind, ...draft, fee, ...(request.kind === "perps" ? { chainId: Number(draft.chainId) } : {}) });
    } catch (cause) { setSubmitError(cause instanceof Error ? cause.message : "Check your workspace details."); return; }
    const account = getAccount(config);
    if (!account.isConnected || !account.address) { setSubmitError("Connect the wallet that owns this workspace to save changes."); return; }
    const address = account.address;
    const assertCurrent = () => { const wallet = getAccount(config); if (!mounted.current || !wallet.isConnected || wallet.address?.toLowerCase() !== address.toLowerCase()) throw new Error("Your wallet changed. Reconnect to check your workspace."); };
    inFlight.current = true; setBusy(true); onBusyChange(true); setSubmitError("");
    try {
      const response = await postAsWallet("/api/workspace-edit", { requestId: request.id, version: request.workspaceVersion ?? 0, edit }, address, signMessageAsync, assertCurrent);
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result && typeof result === "object" && "error" in result && typeof result.error === "string" ? result.error : "Couldn’t submit your changes. Try again.");
      assertCurrent();
      refresh(); setOpen(false); toast.success("Workspace updated", { description: "The team has your changes." });
    } catch (cause) {
      if (mounted.current) setSubmitError(cause instanceof Error && !/reject|denied|cancel/i.test(cause.message) ? cause.message.split("\n")[0] : "Signature cancelled. Your workspace was not changed.");
    }
    finally { inFlight.current = false; onBusyChange(false); if (mounted.current) setBusy(false); }
  }
  const chains = [...selectablePerpsChains];
  const historicalChain = chainById(Number(draft.chainId));
  if (historicalChain && !chains.some(chain => chain.id === historicalChain.id)) chains.push(historicalChain as typeof chains[number]);
  return <Dialog open={open} dismissible={!busy} onOpenChange={next => { if (!inFlight.current) { setOpen(next); if (next) { const initial = draftFor(request); setInitialDraft(initial); setDraft(initial); setAttempted(false); setSubmitError(""); } } }}>
    <DialogTrigger asChild><Button type="button" variant="secondary" size="sm" disabled={disabled} className="h-9 gap-1.5 rounded-lg px-3 text-xs max-[767px]:h-11"><Pencil size={14} aria-hidden="true" />Edit workspace</Button></DialogTrigger>
    <DialogContent className="md:w-[640px] md:overflow-hidden md:p-0">
      <div className="px-1 pt-2 md:mx-2 md:my-2 md:max-h-[calc(100dvh-50px)] md:overflow-y-auto md:px-[21px] md:py-[21px]">
        <p className="mb-2 text-sm font-medium text-(--link)">{request.kind === "spot" ? "Spot" : "Perps"}</p>
        <DialogTitle className="text-[27px] font-semibold tracking-tight">Edit workspace</DialogTitle>
        <DialogDescription className="mt-2 text-sm leading-relaxed">Changes are saved to your workspace and sent to the team. Your live trading configuration changes only after the team applies them.</DialogDescription>
        <form className="mt-6 grid gap-4" noValidate onSubmit={event => { event.preventDefault(); void submit(); }}>
            <Field label="App name" id="edit-app-name" error={attempted ? errors.appName : undefined} value={draft.appName} onChange={value => set("appName", value)} disabled={busy} maxLength={80} placeholder="Your app name" />
            <Field label="Contact (optional)" id="edit-contact" error={attempted ? errors.contact : undefined} value={draft.contact} onChange={value => set("contact", value)} disabled={busy} maxLength={MAX_CONTACT_LENGTH} placeholder="you@example.com or @telegram" />
            <Field label="App URL" id="edit-url" error={attempted ? errors.url : undefined} value={draft.url} onChange={value => set("url", value)} disabled={busy} placeholder="https://your-app.com" maxLength={2048} />
            {request.kind === "perps" ? <fieldset aria-describedby={attempted && errors.chainId ? "edit-network-error" : undefined} className="m-0 grid grid-cols-2 gap-2.5 border-0 p-0 max-[370px]:grid-cols-1"><legend className="sr-only">Choose your network</legend>{chains.map(chain => <Label key={chain.id} className={`relative flex min-h-[72px] cursor-pointer items-center gap-[11px] rounded-[20px] border px-[15px] py-3.5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-(--focus-ring) ${draft.chainId === String(chain.id) ? "border-(--selected-border) bg-(--selected-bg)" : "border-(--panel-border) bg-(--surface) hover:bg-(--control-hover)"}`}><img className="size-[34px] rounded-full bg-(--soft) object-contain p-1" src={chainLogo(chain.id)} width={34} height={34} alt="" /><span className="text-sm font-medium">{chain.name}</span><input id={chain.id === chains[0]?.id ? "edit-network" : undefined} type="radio" name="edit-network" aria-invalid={attempted && !!errors.chainId} value={chain.id} checked={draft.chainId === String(chain.id)} disabled={busy} onChange={() => set("chainId", String(chain.id))} className="sr-only" /></Label>)}<FieldError id="edit-network-error" message={attempted ? errors.chainId : undefined} /></fieldset> : null}
            <div><div className="mb-2.5 flex items-center justify-between gap-2"><div className="flex items-center gap-1"><Label htmlFor="edit-wallet">Revenue wallet</Label><FieldHelp label="Wallet">Enter the EVM wallet where you want to receive fees.</FieldHelp></div><UseMyWalletButton value={draft.wallet} busy={false} disabled={busy || !account.address} onClick={() => { if (account.address) set("wallet", account.address); }} /></div><div className="relative">{request.kind === "perps" ? <Wallet className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-(--icon-muted)" size={17} aria-hidden="true" /> : null}<Input id="edit-wallet" value={draft.wallet} onChange={event => set("wallet", event.target.value)} disabled={busy} maxLength={100} placeholder="0x…" className={request.kind === "perps" ? "pl-[43px] font-mono text-base" : "font-mono text-sm"} aria-invalid={attempted && !!errors.wallet} aria-describedby={attempted && errors.wallet ? "edit-wallet-error" : undefined} /></div><FieldError id="edit-wallet-error" message={attempted ? errors.wallet : undefined} /></div>
            <section className="rounded-3xl border border-(--edge) bg-(--control-bg) p-5 max-[480px]:p-4"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-1"><Label htmlFor="edit-fee">Platform fee</Label><FieldHelp label="Platform fee">Choose a fee in 0.001% increments. The team confirms the configuration.</FieldHelp></div><div className="relative w-[124px] shrink-0"><Input id="edit-fee" inputMode="decimal" value={draft.fee} onChange={event => set("fee", event.target.value)} disabled={busy} maxLength={20} aria-invalid={attempted && !!errors.fee} aria-describedby={attempted && errors.fee ? "edit-fee-error" : undefined} className="h-14 bg-(--surface) pl-3 pr-8 text-right text-[22px] font-semibold tabular-nums" /><span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-(--muted)" aria-hidden="true">%</span></div></div><Label htmlFor="edit-fee-slider" className="sr-only">Platform fee slider</Label><input id="edit-fee-slider" type="range" min={0} max={request.kind === "spot" ? 1000 : 100} step={1} value={fee ?? 0} disabled={busy} aria-valuetext={fee === null ? "Choose a valid platform fee" : `${draft.fee} percent`} className="fee-share-slider mt-2 block h-11 w-full cursor-pointer disabled:opacity-50" style={{ "--slider-progress": `${(fee ?? 0) / (request.kind === "spot" ? 10 : 1)}%` } as CSSProperties} onChange={event => set("fee", formatSpotFeePercent(Number(event.target.value)))} /><div className="flex justify-between text-xs text-(--muted)" aria-hidden="true"><span>0%</span><span>{request.kind === "spot" ? "1%" : "0.1%"}</span></div><FieldError id="edit-fee-error" message={attempted ? errors.fee : undefined} /></section>
          {request.kind === "perps" && (draft.wallet.toLowerCase() !== initialDraft.wallet.toLowerCase() || draft.chainId !== initialDraft.chainId)
            ? <p className="flex items-start gap-2 rounded-xl bg-(--warning-bg) px-3 py-2.5 text-xs leading-relaxed text-(--warning-text)"><CircleAlert size={15} className="mt-px shrink-0" aria-hidden="true" />Until the team applies this change, earnings keep going to your current revenue wallet on your current network.</p> : null}
          {submitError ? <p role="alert" className="text-sm text-(--danger)">{submitError}</p> : null}
          <DialogFooter className="mt-3 flex-row gap-3"><Button type="button" variant="secondary" disabled={busy} onClick={() => setOpen(false)} className="min-h-11">Cancel</Button><Button type="submit" disabled={busy || !changed} aria-busy={busy} className="min-h-11">{busy ? <LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}{busy ? "Saving…" : "Submit changes"}</Button></DialogFooter>
        </form>
      </div>
    </DialogContent>
  </Dialog>;
}

function Field({ label, id, value, onChange, disabled, maxLength, placeholder, error }: { label: string; id: string; value: string; onChange: (value: string) => void; disabled: boolean; maxLength: number; placeholder?: string; error?: string }) {
  return <div className="grid gap-2"><div className="flex items-center gap-1"><Label htmlFor={id} className="text-sm font-medium text-(--secondary-text)">{label}</Label><FieldHelp label={label}>{label === "App name" ? "Choose your app’s name. Your Partner ID stays the same." : label.startsWith("Contact") ? "Sent to the team with this update only, never stored in your workspace. Leave blank to keep your earlier contact." : "Provide the URL of your app, or leave it blank."}</FieldHelp></div><Input id={id} value={value} onChange={event => onChange(event.target.value)} disabled={disabled} maxLength={maxLength} placeholder={placeholder} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} /><FieldError id={`${id}-error`} message={error} /></div>;
}
