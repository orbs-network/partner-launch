import { CircleAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import { MAX_DEX_URL_LENGTH } from "@/lib/dex-url";
import { useOnboardingStore } from "../store";

export function AppUrlStep({ error, disabled }: { error: string; disabled: boolean }) {
  const url = useOnboardingStore(state => state.appUrl ?? "");
  const setUrl = useOnboardingStore(state => state.setAppUrl);
  return <>
    <Label htmlFor="app-url" className="text-sm font-medium text-(--secondary-text)">App URL</Label>
    <Input id="app-url" name="appUrl" type="url" inputMode="url" autoComplete="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="https://your-app.com" maxLength={MAX_DEX_URL_LENGTH + 1} value={url} onChange={event => setUrl(event.target.value)} disabled={disabled} aria-invalid={!!error} aria-describedby={error ? "app-url-help app-url-error" : "app-url-help"} className="mt-2.5" />
    <FieldError id="app-url-error" message={error} />
    <div id="app-url-help" className="mt-4 flex items-start gap-3 rounded-2xl border border-(--edge) bg-(--primary-soft) p-4 text-(--text)">
      <CircleAlert size={19} className="mt-0.5 shrink-0 text-(--link)" aria-hidden="true" />
      <div className="min-w-0"><p className="text-sm font-semibold">Required before your app can work</p><p className="mt-1 text-[13px] leading-[1.65] text-(--secondary-text)">If you skip this step, add your app URL in My setups after creating your app.</p></div>
    </div>
  </>;
}
