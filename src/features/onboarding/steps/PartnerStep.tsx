import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOnboardingStore } from "../store";

export function PartnerStep({ error = "" }: { error?: string }) {
  const displayName = useOnboardingStore((state) => state.displayName);
  const partnerName = useOnboardingStore((state) => state.partnerName);
  const launchPath = useOnboardingStore((state) => state.launchPath);
  const setDexName = useOnboardingStore((state) => state.setDexName);
  const setPartnerName = useOnboardingStore((state) => state.setPartnerName);
  const api = launchPath === "api";
  return (
    <div>
      <Label htmlFor={api ? "app-id" : "partner-name"} className="mb-2.5 block text-sm font-medium text-(--secondary-text)">
        {api ? "Partner ID" : "App name"}
      </Label>
      <Input
        id={api ? "app-id" : "partner-name"}
        name={api ? "partnerName" : "displayName"}
        placeholder={api ? "my-trading-app" : "Your app name"}
        autoComplete="off"
        autoCapitalize={api ? "none" : "words"}
        enterKeyHint="next"
        autoCorrect="off"
        spellCheck={false}
        value={api ? partnerName : displayName || partnerName}
        minLength={3}
        maxLength={api ? 40 : 80}
        onChange={(event) => api ? setPartnerName(event.target.value) : setDexName(event.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? "partner-error" : undefined}
        className={api ? "font-mono text-sm" : undefined}
      />
      <FieldError id="partner-error" message={error} />
    </div>
  );
}
