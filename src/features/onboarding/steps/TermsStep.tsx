import { FieldError } from "@/components/ui/field-error";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useRef, useState, type ReactNode, type RefObject } from "react";
import { useOnboardingStore } from "../store";
import { hasAcceptedTerms } from "../terms-review";

export function TermsStep({ error: submittedError, disabled, actionLabel = "Next", onFinish, onBack, actionRef, children }: {
  error?: string;
  disabled: boolean;
  actionLabel?: ReactNode;
  onFinish: () => void;
  /** Back sits beside confirmation, in the same place as on every other step. */
  onBack?: () => void;
  actionRef?: RefObject<HTMLButtonElement | null>;
  children?: ReactNode;
}) {
  const draft = useOnboardingStore();
  const accepted = hasAcceptedTerms(draft);
  const acceptance = useRef<HTMLButtonElement>(null);
  const [tried, setTried] = useState(false);
  const error = (tried || submittedError) && !accepted ? "Accept the terms before continuing." : undefined;
  function continueToDeposit() {
    if (disabled) return;
    if (!accepted) {
      setTried(true);
      acceptance.current?.focus();
      return;
    }
    // Continuing records an already checked historical acceptance for the current terms.
    draft.setTermsAccepted(true);
    onFinish();
  }
  return (
    <div className="mt-5">
      <Label className={`flex cursor-pointer items-start gap-3 rounded-[14px] border bg-(--control-bg) px-4 py-3.5 text-[13px] leading-[1.75] font-normal text-(--secondary-text) max-[720px]:px-3.5 ${error ? "border-(--status-danger)" : "border-(--edge)"}`} htmlFor="terms-accepted">
        <Checkbox
          id="terms-accepted"
          className="mt-[3px] size-[18px] shrink-0"
          ref={acceptance}
          checked={accepted}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? "terms-error" : undefined}
          onCheckedChange={(checked) => { draft.setTermsAccepted(checked === true); }}
        />
        <span>
          I agree to the{" "}
          <a
            className="text-(--link) underline underline-offset-[3px]"
            href="https://perps.orbs.network/terms"
            target="_blank"
            rel="noreferrer"
          >
            dPERPS Terms of Use
          </a>{" "}
          and have read the{" "}
          <a
            className="text-(--link) underline underline-offset-[3px]"
            href="https://perps.orbs.network/privacy"
            target="_blank"
            rel="noreferrer"
          >
            Privacy Policy
          </a>
          .
        </span>
      </Label>
      <FieldError id="terms-error" message={error} />
      {children}
      <div className="mt-5 flex items-center gap-3 max-[720px]:gap-2.5">
        {onBack ? (
          <Button
            variant="ghost"
            className="min-w-[85px] bg-transparent text-[13px] text-(--muted) hover:enabled:bg-(--control-hover) hover:enabled:text-(--link) disabled:text-(--disabled-text) max-[720px]:min-w-[77px] max-[720px]:text-[12px]"
            type="button"
            onClick={onBack}
            disabled={disabled}
          >
            <ArrowLeft size={18} aria-hidden="true" />
            Back
          </Button>
        ) : null}
        <Button
          ref={actionRef}
          type="button"
          className="min-w-0 flex-1 whitespace-normal max-[720px]:px-3 max-[720px]:text-[13px]"
          onClick={continueToDeposit}
          disabled={disabled}
          aria-busy={disabled}
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}
