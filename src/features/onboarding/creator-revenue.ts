/** A requested share of collected trading fees, never a fee rate on notional. */
export const DEFAULT_CREATOR_SHARE_BPS = 5000;
export const MAX_CREATOR_SHARE_BPS = 10_000;

export function validateCreatorShareBps(value: number | null): string | undefined {
  if (value === null || !Number.isInteger(value) || value < 0 || value > MAX_CREATOR_SHARE_BPS)
    return "Choose a requested revenue share from 0% to 100%, in 0.01% steps.";
}

/** Parse the request exactly; never round or clamp an invalid percentage. */
export function parseCreatorSharePercent(value: string): number | null {
  const percent = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(percent)) return null;
  const [whole, fraction = ""] = percent.split(".");
  const bps = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return validateCreatorShareBps(bps) ? null : bps;
}

export function formatCreatorSharePercent(value: number | null): string {
  if (validateCreatorShareBps(value) || value === null) return "";
  return `${Math.trunc(value / 100)}.${String(value % 100).padStart(2, "0")}`;
}
