/** Spot trading fee, expressed as tenths of a basis point (0.001%). */
export const MAX_SPOT_FEE_TENTHS_BPS = 1000;

export function parseSpotFeePercent(value: string): number | null {
  if (!/^\d+(?:\.\d{1,3})?$/.test(value.trim())) return null;
  const [whole, fraction = ""] = value.trim().split(".");
  const result = Number(whole) * 1000 + Number(fraction.padEnd(3, "0"));
  return isSpotFee(result) ? result : null;
}

export function isSpotFee(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= MAX_SPOT_FEE_TENTHS_BPS;
}

export function formatSpotFeePercent(value: number): string {
  return (value / 1000).toFixed(3).replace(/\.?0+$/, "") || "0";
}
