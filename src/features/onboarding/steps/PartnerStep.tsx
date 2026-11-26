import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldHelp } from "@/components/FieldHelp";
import { MAX_CONTACT_LENGTH, validateContact } from "@/lib/contact";
import { useOnboardingStore } from "../store";

export function PartnerStep({ error = "", unavailable = false, disabled = false }: { error?: string; unavailable?: boolean; disabled?: boolean }) {
  const displayName = useOnboardingStore((state) => state.displayName);
  const partnerName = useOnboardingStore((state) => state.partnerName);
  const launchPath = useOnboardingStore((state) => state.launchPath);
  const setDexName = useOnboardingStore((state) => state.setDexName);
  const setPartnerName = useOnboardingStore((state) => state.setPartnerName);
  const contact = useOnboardingStore((state) => state.contact ?? "");
  const setContact = useOnboardingStore((state) => state.setContact);
  const api = launchPath === "api";
  // Two fields share this step's error; after an attempt, show each field's own message.
  const contactError = error ? validateContact(contact) : undefined;
  const nameError = error && error !== contactError ? error : "";
  return (
    <div>
      <div className="mb-2.5 flex items-center gap-1">
        <Label htmlFor={api ? "app-id" : "partner-name"} className="text-sm font-medium text-(--secondary-text)">{api ? "Partner ID" : "DEX name"}</Label>
        <FieldHelp label={api ? "Partner ID" : "DEX name"}>{api ? "Choose a unique Partner ID for your integration. Its availability is checked before you continue." : "We’ll use this name to generate your unique Partner ID. You can change the DEX name later."}</FieldHelp>
      </div>
      <Input
        id={api ? "app-id" : "partner-name"}
        name={api ? "partnerName" : "displayName"}
        placeholder={api ? "my-trading-dex" : "Your DEX name"}
        autoComplete="off"
        autoCapitalize={api ? "none" : "words"}
        enterKeyHint="next"
        autoCorrect="off"
        spellCheck={false}
        value={api ? partnerName : displayName || partnerName}
        minLength={3}
        maxLength={api ? 40 : 80}
        disabled={disabled}
        onChange={(event) => api ? setPartnerName(event.target.value) : setDexName(event.target.value)}
        aria-invalid={!!nameError}
        aria-describedby={nameError ? "partner-error" : undefined}
        className={api ? "font-mono text-sm" : undefined}
      />
      <FieldError id="partner-error" message={nameError} />
      <div className="mt-5 mb-2.5 flex items-center gap-1">
        <Label htmlFor="partner-contact" className="text-sm font-medium text-(--secondary-text)">Contact <span className="font-normal text-(--muted)">(optional)</span></Label>
        <FieldHelp label="Contact">Provide an email address or Telegram contact so the team can follow up about your request. It is shared only with the Orbs team.</FieldHelp>
      </div>
      <Input
        id="partner-contact"
        name="contact"
        type="text"
        placeholder="you@example.com or @telegram"
        autoComplete="email"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="next"
        maxLength={MAX_CONTACT_LENGTH}
        disabled={disabled}
        value={contact}
        onChange={(event) => setContact(event.target.value)}
        aria-invalid={!!contactError}
        aria-describedby={contactError ? "partner-contact-hint partner-contact-error" : "partner-contact-hint"}
      />
      <FieldError id="partner-contact-error" message={contactError} />
      <p id="partner-contact-hint" className="sr-only">Email or Telegram, so our team can reach you about this request. Shared only with the Orbs team.</p>
      {unavailable ? <p role="alert" className="mt-4 rounded-xl border border-(--warning-border) bg-(--warning-bg) p-3 text-sm text-(--warning-text)">We couldn’t check Partner ID availability. Please try again.</p> : null}
    </div>
  );
}
