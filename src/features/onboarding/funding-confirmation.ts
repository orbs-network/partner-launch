import { isAddress, zeroAddress } from "viem";
import { parseFixedFundingAmount } from "./funding-amount";
import { isPartnerIdFormat } from "./dex-identity";

export interface FundingConfirmation {
  mode: "signature-placeholder";
  partnerId: string;
  amount: string;
  address: `0x${string}`;
  signature: `0x${string}`;
  message: string;
  signedAt: string;
}

type FundingMessageDetails = Pick<
  FundingConfirmation,
  "partnerId" | "amount" | "signedAt"
>;

/** This signature acknowledges the funding step; it grants no payment permission. */
export function createFundingMessage({
  partnerId,
  amount,
  signedAt,
}: FundingMessageDetails): string {
  return [
    "Perpetual Hub onboarding — funding confirmation (v2)",
    "",
    `Partner: ${partnerId}`,
    `Amount: ${amount} USDC`,
    `Created at: ${signedAt}`,
    "",
    "I confirm the one-time onboarding funding step.",
    "No funds are transferred and no token spending is approved.",
  ].join("\n");
}

/** Wording signed before v2; saved confirmations with it stay valid. */
function createLegacyFundingMessage({
  partnerId,
  amount,
  signedAt,
}: FundingMessageDetails): string {
  return [
    "Perpetual Hub onboarding — funding placeholder (v1)",
    "",
    `Partner: ${partnerId}`,
    `Demo amount: ${amount} USDC`,
    `Created at: ${signedAt}`,
    "",
    "I confirm this demo onboarding step only.",
    "No funds are transferred and no token spending is approved.",
  ].join("\n");
}

/** Signature recovery happens in the wallet hook before the record is saved. */
export function isFundingConfirmation(
  value: unknown,
): value is FundingConfirmation {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    return false;
  const item = value as Record<string, unknown>;
  if (
    item.mode !== "signature-placeholder" ||
    typeof item.partnerId !== "string" ||
    item.partnerId.length < 3 ||
    item.partnerId.length > 40 ||
    !isPartnerIdFormat(item.partnerId) ||
    typeof item.amount !== "string" ||
    item.amount !== item.amount.trim() ||
    typeof item.address !== "string" ||
    !isAddress(item.address) ||
    item.address.toLowerCase() === zeroAddress ||
    typeof item.signature !== "string" ||
    !/^0x(?:[a-fA-F0-9]{128}|[a-fA-F0-9]{130})$/.test(item.signature) ||
    typeof item.signedAt !== "string" ||
    typeof item.message !== "string"
  )
    return false;
  const details = {
    partnerId: item.partnerId,
    amount: item.amount,
    signedAt: item.signedAt,
  };
  try {
    parseFixedFundingAmount(item.amount);
    const time = Date.parse(item.signedAt);
    return (
      Number.isFinite(time) &&
      new Date(time).toISOString() === item.signedAt &&
      time <= Date.now() + 300_000 &&
      [createFundingMessage, createLegacyFundingMessage].some(
        (create) => item.message === create(details),
      )
    );
  } catch {
    return false;
  }
}
