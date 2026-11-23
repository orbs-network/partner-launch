import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { MAX_DEX_URL_LENGTH } from "@/lib/dex-url";
import type { SpotDraft, SpotStep } from "./spot-setup";
import { SpotSummary } from "./SpotSummary";
import { SpotWalletField } from "./SpotWalletField";

export function SpotFields({ draft, error, update, acceptPolicy, edit, fillWallet, onWalletBusyChange }: {
  draft: SpotDraft;
  error?: string;
  update: (field: "appName" | "dexUrl" | "feesWallet", value: string) => void;
  acceptPolicy: (value: boolean) => void;
  edit: (step: SpotStep) => void;
  fillWallet: (address: string, scope: string) => void;
  onWalletBusyChange: (busy: boolean) => void;
}) {
  if (draft.step === "review") return (
    <>
      <SpotSummary appName={draft.appName} dexUrl={draft.dexUrl} feesWallet={draft.feesWallet} onEdit={edit} />
      <p className="mt-4 text-sm leading-[1.7] text-(--muted)">No deposit is required for this setup.</p>
      <Label htmlFor="spot-review" className={`mt-5 flex cursor-pointer items-start gap-3 rounded-[14px] border bg-(--control-bg) px-4 py-3.5 text-[13px] leading-[1.75] font-normal text-(--secondary-text) ${error ? "border-(--status-danger)" : "border-(--edge)"}`}>
        <Checkbox id="spot-review" name="policyAccepted" className="mt-[3px] size-[18px] shrink-0" checked={draft.policyAccepted} onCheckedChange={(value) => acceptPolicy(value === true)} aria-invalid={!!error} aria-describedby={error ? "spot-error" : undefined} />
        <span>I agree to the <a className="text-(--link) underline underline-offset-3" href="https://perps.orbs.network/terms" target="_blank" rel="noreferrer">Terms of Use</a> and have read and accept the <a className="text-(--link) underline underline-offset-3" href="https://perps.orbs.network/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.</span>
      </Label>
      <FieldError id="spot-error" message={error} />
    </>
  );
  if (draft.step === "wallet") return <SpotWalletField draft={draft} error={error} update={update} fillWallet={fillWallet} onBusyChange={onWalletBusyChange} />;
  if (draft.step === "url") return (
    <>
      <Label htmlFor="spot-url" className="mb-2.5 block text-sm font-medium text-(--secondary-text)">DEX URL <span className="font-normal text-(--muted)">(optional)</span></Label>
      <Input id="spot-url" name="dexUrl" type="url" enterKeyHint="next" inputMode="url" autoComplete="url" autoCapitalize="none" autoCorrect="off" spellCheck={false}
        placeholder="https://your-dex.com…" maxLength={MAX_DEX_URL_LENGTH} value={draft.dexUrl} onChange={(event) => update("dexUrl", event.target.value)}
        aria-invalid={!!error} aria-describedby={error ? "spot-url-hint spot-error" : "spot-url-hint"} />
      <FieldError id="spot-error" message={error} />
      <p id="spot-url-hint" className="mt-2 text-xs leading-[1.7] text-(--muted)">Leave blank if your DEX isn’t live yet.</p>
    </>
  );
  const fields = {
    app: { name: "appName", label: "App name", placeholder: "Your Spot app name…", maxLength: 80 },
  } as const;
  const field = fields[draft.step];
  return (
    <>
      <Label htmlFor={`spot-${draft.step}`} className="mb-2.5 block text-sm font-medium text-(--secondary-text)">{field.label}</Label>
      <Input id={`spot-${draft.step}`} name={field.name} enterKeyHint="next" autoComplete="off" autoCapitalize="words" autoCorrect="off" spellCheck={false} placeholder={field.placeholder} maxLength={field.maxLength} value={draft[field.name]} onChange={(event) => update(field.name, event.target.value)} aria-invalid={!!error} aria-describedby={error ? "spot-error" : undefined} />
      <FieldError id="spot-error" message={error} />
    </>
  );
}
