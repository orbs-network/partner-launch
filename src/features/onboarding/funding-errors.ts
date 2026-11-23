import { fundingError } from "./funding";

export const fundingNotReady =
  "Your account isn’t ready to receive funds yet. Contact our team to continue.";

export function paymentError(error: unknown): string {
  const message = fundingError(error);
  if (/reject|denied|cancelled|canceled/i.test(message)) {
    return "You cancelled the wallet request. You can try again.";
  }
  if (
    /not active|do not match|collateral|funding configuration/i.test(message)
  ) {
    return fundingNotReady;
  }
  if (/fetch|timeout|timed out|http request|rpc request/i.test(message)) {
    return "We couldn’t connect just now. Check your connection and try again.";
  }
  return message.length > 220
    ? "We couldn’t complete your payment. Check your wallet and try again."
    : message;
}
