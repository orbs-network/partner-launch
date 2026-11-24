import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldHelp } from "@/components/FieldHelp";
import { Checkbox } from "@/components/ui/checkbox";
import { MAX_DEX_URL_LENGTH } from "@/lib/dex-url";
import { MAX_CONTACT_LENGTH, validateContact } from "@/lib/contact";
import type { SpotDraft, SpotStep } from "./spot-setup";
import { SpotSummary } from "./SpotSummary";
import { SpotWalletField } from "./SpotWalletField";

export function SpotFields({ draft, error, appIdUnavailable, update, acceptPolicy, edit, fillWallet, onWalletBusyChange }: {
  draft: SpotDraft;
  error?: string;
  appIdUnavailable?: boolean;
  update: (field: "appName" | "contact" | "dexUrl" | "feesWallet", value: string) => void;
  acceptPolicy: (value: boolean) => void;
  edit: (step: SpotStep, field?: string) => void;
  fillWallet: (address: string, scope: string) => void;
  onWalletBusyChange: (busy: boolean) => void;
}) {
  if (draft.step === "review") return (
    <>
      <SpotSummary appName={draft.appName} contact={draft.contact} dexUrl={draft.dexUrl} feesWallet={draft.feesWallet} onEdit={edit} />
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
      <div className="mb-2.5 flex items-center gap-1"><Label htmlFor="spot-url" className="text-sm font-medium text-(--secondary-text)">DEX URL <span className="font-normal text-(--muted)">(optional)</span></Label><FieldHelp label="DEX URL">Share your DEX website if it is available, or leave this blank if it isn’t live yet. This is for context and does not register or whitelist the website.</FieldHelp></div>
      <Input id="spot-url" name="dexUrl" type="url" enterKeyHint="next" inputMode="url" autoComplete="url" autoCapitalize="none" autoCorrect="off" spellCheck={false}
        placeholder="https://your-dex.com…" maxLength={MAX_DEX_URL_LENGTH} value={draft.dexUrl} onChange={(event) => update("dexUrl", event.target.value)}
        aria-invalid={!!error} aria-describedby={error ? "spot-url-hint spot-error" : "spot-url-hint"} />
      <FieldError id="spot-error" message={error} />
      <p id="spot-url-hint" className="sr-only">Leave blank if your DEX isn’t live yet.</p>
    </>
  );
  // The App name step holds two fields; after an attempt, show each field's own error.
  const contactError = error ? validateContact(draft.contact) : undefined;
  const nameError = error && error !== contactError ? error : undefined;
  return (
    <>
      <div className="mb-2.5 flex items-center gap-1"><Label htmlFor="spot-app" className="text-sm font-medium text-(--secondary-text)">App name</Label><FieldHelp label="App name">Choose your app’s name. We use it to suggest a Partner ID, which must be unique; the team confirms its assignment.</FieldHelp></div>
      <Input id="spot-app" name="appName" enterKeyHint="next" autoComplete="off" autoCapitalize="words" autoCorrect="off" spellCheck={false} placeholder="Your Spot app name…" maxLength={80} value={draft.appName} onChange={(event) => update("appName", event.target.value)} aria-invalid={!!nameError} aria-describedby={nameError ? "spot-error" : undefined} />
      <FieldError id="spot-error" message={nameError} />
      <div className="mt-5 mb-2.5 flex items-center gap-1"><Label htmlFor="spot-contact" className="text-sm font-medium text-(--secondary-text)">Contact <span className="font-normal text-(--muted)">(optional)</span></Label><FieldHelp label="Contact">Provide an email address or Telegram contact so the team can follow up about your request. It is shared only with the Orbs team.</FieldHelp></div>
      <Input id="spot-contact" name="contact" type="text" enterKeyHint="next" autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="you@example.com or @telegram" maxLength={MAX_CONTACT_LENGTH} value={draft.contact} onChange={(event) => update("contact", event.target.value)} aria-invalid={!!contactError} aria-describedby={contactError ? "spot-contact-hint spot-contact-error" : "spot-contact-hint"} />
      <FieldError id="spot-contact-error" message={contactError} />
      <p id="spot-contact-hint" className="sr-only">Email or Telegram, so our team can reach you about this request. Shared only with the Orbs team.</p>
      {appIdUnavailable ? <p role="alert" className="mt-4 rounded-xl border border-(--warning-border) bg-(--warning-bg) p-3 text-sm text-(--warning-text)">We couldn’t check Spot Partner ID availability. Please try again.</p> : null}
    </>
  );
}
