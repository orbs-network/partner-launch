/** Terms policy version shared with the trading app's acceptance record. */
export const TERMS_VERSION = "2026-05-27";

export const TERMS_DOMAIN_NAME = "PerpetualHubSignTransaction";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** The signed time must be a positive uint64 that matches the saved signedAt. */
export function isConsistentTime(time: unknown, signedAt: string) {
  if (typeof time !== "string" || !/^[1-9]\d*$/.test(time)) return false;
  const timestamp = Number(time);
  return (
    Number.isSafeInteger(timestamp) &&
    BigInt(time) < 2n ** 64n &&
    Number.isFinite(Date.parse(signedAt)) &&
    Date.parse(signedAt) === timestamp
  );
}

/** Serialize typed data for storage, writing bigint values as decimal strings. */
export function serializeTypedData(typed: object) {
  return JSON.stringify(typed, (_key, value: unknown) =>
    typeof value === "bigint" ? value.toString() : value,
  );
}
