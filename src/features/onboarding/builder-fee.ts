/** Builder order parameter f: 1 = 0.1 basis points = 0.001%. */
export const MAX_BUILDER_FEE_TENTHS_BPS = 100;
export const DEFAULT_BUILDER_FEE_TENTHS_BPS = 0;

export function validateBuilderFee(value: number | null | undefined): string | undefined {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > MAX_BUILDER_FEE_TENTHS_BPS)
    return "Choose a platform fee from 0% to 0.1%, in 0.001% steps.";
}

/** Parse without rounding or clamping; reject precision finer than f supports. */
export function parseBuilderFeePercent(value: string): number | null {
  if (!/^\d+(?:\.\d{1,3})?$/.test(value.trim())) return null;
  const [whole, fraction = ""] = value.trim().split(".");
  const fee = Number(whole) * 1000 + Number(fraction.padEnd(3, "0"));
  return validateBuilderFee(fee) ? null : fee;
}

export function formatBuilderFeePercent(value: number | null | undefined): string {
  if (validateBuilderFee(value) || typeof value !== "number") return "";
  return `0.${String(value).padStart(3, "0")}`;
}
