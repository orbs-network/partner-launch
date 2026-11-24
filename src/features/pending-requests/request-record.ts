import { isSpotFee } from "../onboarding/spot/spot-fee";
import { isAddress, zeroAddress } from "viem";
import { validateDexUrl } from "../../lib/dex-url";

interface RequestBase {
  id: string;
  savedAt: string;
  appName: string;
  status: "pending" | "ready" | "approved";
  ownerWallets?: string[];
}
export interface SpotRequest extends RequestBase {
  kind: "spot";
  integrationMode?: "ui" | "existing";
  partnerId?: string;
  feesWallet: string;
  tradingFeeTenthsBps?: number;
  dexUrl?: string;
  notification?: "telegram";
}
export interface PerpsRequest extends RequestBase {
  kind: "perps";
  partnerId: string;
  integrationMode?: "ui" | "api";
  appUrl?: string;
  appUrlVersion?: number;
  chainIds: number[];
  revenueWallet: string;
  extraFeePercent?: string;
  notification?: "telegram";
}
export type PendingRequest = SpotRequest | PerpsRequest;

const text = (value: unknown, max: number): value is string => typeof value === "string" && value.trim().length > 0 && value.length <= max;
const wallet = (value: unknown): value is string => typeof value === "string" && isAddress(value) && value.toLowerCase() !== zeroAddress;

/** Rebuild display-only records from allowed fields; never hydrate proofs or permissions. */
export function readRequest(value: unknown): PendingRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (!text(row.id, 220) || !text(row.appName, 80) || !text(row.savedAt, 30) ||
    !Number.isFinite(Date.parse(row.savedAt)) || (row.status !== "pending" && row.status !== "ready" && row.status !== "approved") ||
    (row.status === "ready" && (row.kind !== "perps" || row.notification !== "telegram"))) return null;
  if (row.ownerWallets !== undefined && (!Array.isArray(row.ownerWallets) || row.ownerWallets.length > 11 || !row.ownerWallets.every(wallet))) return null;
  const base: RequestBase = { id: row.id, appName: row.appName, savedAt: row.savedAt, status: row.status,
    ...(Array.isArray(row.ownerWallets) ? { ownerWallets: row.ownerWallets as string[] } : {}) };
  if (row.kind === "spot" && wallet(row.feesWallet) &&
    (row.integrationMode === undefined || row.integrationMode === "ui" || row.integrationMode === "existing") &&
    (row.partnerId === undefined || text(row.partnerId, 80)) &&
    (row.tradingFeeTenthsBps === undefined || isSpotFee(row.tradingFeeTenthsBps)) &&
    (row.dexUrl === undefined || (typeof row.dexUrl === "string" && !validateDexUrl(row.dexUrl)))) return { ...base, kind: "spot", feesWallet: row.feesWallet,
    ...(row.integrationMode === "ui" || row.integrationMode === "existing" ? { integrationMode: row.integrationMode } : {}),
    ...(isSpotFee(row.tradingFeeTenthsBps) ? { tradingFeeTenthsBps: row.tradingFeeTenthsBps } : {}),
    ...(typeof row.partnerId === "string" ? { partnerId: row.partnerId } : {}),
    ...(typeof row.dexUrl === "string" && row.dexUrl.trim() ? { dexUrl: row.dexUrl.trim() } : {}),
    ...(row.notification === "telegram" ? { notification: "telegram" as const } : {}) };
  if (row.kind !== "perps" || !text(row.partnerId, 80) || !wallet(row.revenueWallet) ||
    !Array.isArray(row.chainIds) || !row.chainIds.length || row.chainIds.length > 30 ||
    !row.chainIds.every(id => Number.isSafeInteger(id) && id > 0) ||
    (row.integrationMode !== undefined && row.integrationMode !== "ui" && row.integrationMode !== "api") ||
    (row.appUrl !== undefined && (typeof row.appUrl !== "string" || !row.appUrl.trim() || !!validateDexUrl(row.appUrl))) ||
    (row.appUrlVersion !== undefined && (!Number.isSafeInteger(row.appUrlVersion) || (row.appUrlVersion as number) < 0)) ||
    (row.extraFeePercent !== undefined && (typeof row.extraFeePercent !== "string" || !/^0\.(?:0\d{2}|100)$/.test(row.extraFeePercent)))) return null;
  return { ...base, kind: "perps", ...(typeof row.appUrlVersion === "number" ? { appUrlVersion: row.appUrlVersion } : {}), ...(typeof row.appUrl === "string" ? { appUrl: row.appUrl } : {}), ...(row.integrationMode === "ui" || row.integrationMode === "api" ? { integrationMode: row.integrationMode } : {}), partnerId: row.partnerId, chainIds: [...new Set(row.chainIds as number[])], revenueWallet: row.revenueWallet,
    ...(row.notification === "telegram" ? { notification: "telegram" as const } : {}),
    ...(row.extraFeePercent === undefined ? {} : { extraFeePercent: row.extraFeePercent as string }) };
}

export function readRequests(raw: string | null): PendingRequest[] {
  if (raw === null) return [];
  const data: unknown = JSON.parse(raw);
  if (!data || typeof data !== "object" || !("version" in data) || data.version !== 1 ||
    !("requests" in data) || !Array.isArray(data.requests)) throw new Error("Your saved requests could not be read. Keep this tab open and try again after restoring browser storage.");
  const result = data.requests.map(readRequest);
  if (result.some(row => row === null)) throw new Error("Your saved requests could not be read. Keep this tab open and try again after restoring browser storage.");
  return [...new Map(result.map(row => [row!.id, row!])).values()].sort((a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt));
}
