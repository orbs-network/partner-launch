import type { Deposit } from "../../store";
import { useDepositReceipt } from "../../hooks/useDepositReceipt";

export function DepositReceipt({ deposit }: { deposit: Deposit }) {
  const trackingError = useDepositReceipt(deposit);
  return trackingError ? (
    <p className="mt-3 px-0.5 text-[13px] leading-[1.65] wrap-anywhere text-(--danger)" role="alert">
      We’re still checking your payment. It’s saved, so you don’t need to send
      it again.
    </p>
  ) : null;
}
