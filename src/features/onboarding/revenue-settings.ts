import { isAddress, zeroAddress } from "viem";

/** The requested cap uses whole basis points: 1 bps = 0.01%. */
export const MAX_FEE_CAP_BPS = 1000;
export const DEFAULT_FEE_CAP_BPS = 5;

export function validateRevenueWallet(value: string): string | undefined {
  if (!value.trim()) return "Enter a revenue wallet address to continue.";
  if (!isAddress(value)) return "Enter a valid EVM revenue wallet address.";
  if (value.toLowerCase() === zeroAddress)
    return "Use a non-zero revenue wallet address.";
}

export function validateFeeCapBps(value: number | null): string | undefined {
  if (
    value === null ||
    !Number.isInteger(value) ||
    value < 0 ||
    value > MAX_FEE_CAP_BPS
  )
    return "Choose a fee cap from 0% to 10%, in 0.01% steps.";
}

/** Parse decimal percentages exactly without floating-point rounding or clamping. */
export function parseFeeCapPercent(value: string): number | null {
  const percent = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(percent)) return null;
  const [whole, fraction = ""] = percent.split(".");
  const bps = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return validateFeeCapBps(bps) ? null : bps;
}

export function formatFeeCapPercent(value: number | null): string {
  if (validateFeeCapBps(value) || value === null) return "";
  return `${Math.trunc(value / 100)}.${String(value % 100).padStart(2, "0")}`;
}
