import { ExternalLink, Info, LoaderCircle } from "lucide-react";
import { chainById } from "../../../../config/chains";
import type { Deposit } from "../../store";
import { cn } from "@/lib/utils";

/** Keep real transaction history distinct from the signature-only placeholder. */
export function PreviousPayment({ deposit }: { deposit: Deposit }) {
  const explorer = chainById(deposit.chainId)?.blockExplorers?.default.url;
  return (
    <div
      className={cn(
        "my-4 flex items-start gap-[13px] rounded-[19px] border p-5 max-[720px]:gap-[11px] max-[720px]:p-[17px]",
        deposit.status === "failed"
          ? "border-[var(--error-border,#f3e5eb)] bg-[var(--error-bg,#fff8fa)] text-[var(--status-danger,#b33c54)]"
          : "border-(--panel-border) bg-[var(--tint-bg,#f5f8ff)] text-(--link)",
      )}
      role="status"
    >
      <span className={cn(
        "flex size-[39px] shrink-0 items-center justify-center rounded-full max-[720px]:size-[34px]",
        deposit.status === "failed"
          ? "bg-[var(--error-icon-bg,#f9eaf0)] text-[var(--error-icon,#cb94a3)]"
          : "bg-[var(--tint-bg,#eaf0fe)] text-(--icon-accent)",
      )}>
        {deposit.status === "pending" ? (
          <LoaderCircle size={23} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
        ) : (
          <Info size={23} aria-hidden="true" />
        )}
      </span>
      <div>
        <strong className="text-[15px] font-medium max-[720px]:text-sm">Earlier payment {deposit.status}</strong>
        <p className={cn(
          "mt-[7px] text-[13px] leading-[1.8] max-[720px]:text-xs",
          deposit.status === "failed" ? "text-[var(--error-text,#8c4153)]" : "text-(--secondary-text)",
        )}>This is an existing transaction from the earlier funding flow.</p>
        {explorer ? (
          <a
            className="mt-3 inline-flex items-center gap-1.5 text-xs leading-[1.7] text-(--link) hover:text-(--link-hover) hover:underline hover:underline-offset-4"
            href={`${explorer}/tx/${deposit.hash}`}
            target="_blank"
            rel="noreferrer"
          >
            View previous payment <ExternalLink size={13} aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </div>
  );
}
