import { isAddress, zeroAddress } from "viem";
import { validateDexName, isPartnerIdFormat } from "../onboarding/dex-identity.js";
import { isSpotFee } from "../onboarding/spot/spot-fee.js";
import { validateBuilderFee } from "../onboarding/builder-fee.js";
import { chainById } from "../../config/supported-chains.js";
import { validateContact, normalizeContact } from "../../lib/contact.js";
import { validateDexUrl } from "../../lib/dex-url.js";

export type WorkspaceEdit = {
  product: "spot" | "perps"; appName: string; partnerId: string; integrationMode: "ui" | "existing" | "api";
  url: string; wallet: string; fee: number; chainId?: number; contact?: string;
};
/** Canonical field order is shared by the wallet message, server validation and storage. */
export function normalizeWorkspaceEdit(value: unknown): WorkspaceEdit {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Check your workspace details.");
  const data = value as Record<string, unknown>;
  if ((data.product !== "spot" && data.product !== "perps") || typeof data.appName !== "string" || typeof data.partnerId !== "string" ||
    typeof data.url !== "string" || typeof data.wallet !== "string" || typeof data.fee !== "number" || (data.contact !== undefined && typeof data.contact !== "string") ||
    (data.integrationMode !== "ui" && data.integrationMode !== (data.product === "spot" ? "existing" : "api"))) throw new Error("Check your workspace details.");
  if (typeof data.contact === "string" && validateContact(data.contact)) throw new Error(validateContact(data.contact));
  const nameError = validateDexName(data.appName);
  if (nameError) throw new Error(nameError);
  const id = data.partnerId;
  if (id !== id.trim() || (data.product === "spot" ? !/^[\p{L}\p{M}\p{N}]{3,80}$/u.test(id) : id.length < 3 || id.length > 40 || !isPartnerIdFormat(id))) throw new Error("Enter a valid Partner ID.");
  if (data.url !== data.url.trim() || validateDexUrl(data.url)) throw new Error("Enter a valid app URL.");
  if (data.wallet !== data.wallet.trim() || !isAddress(data.wallet) || data.wallet.toLowerCase() === zeroAddress) throw new Error("Enter a valid non-zero fees wallet.");
  if (data.product === "spot" ? !isSpotFee(data.fee) : !!validateBuilderFee(data.fee)) throw new Error(data.product === "spot" ? "Choose a fee from 0% to 1%." : "Choose a platform fee from 0% to 0.1%.");
  if (data.product === "perps" && (typeof data.chainId !== "number" || !Number.isSafeInteger(data.chainId) || !chainById(data.chainId))) throw new Error("Choose a supported network.");
  return { product: data.product, appName: data.appName, partnerId: id, integrationMode: data.integrationMode as WorkspaceEdit["integrationMode"], url: data.url, wallet: data.wallet, fee: data.fee,
    ...(data.product === "perps" ? { chainId: data.chainId as number } : {}), ...(typeof data.contact === "string" && data.contact.trim() ? { contact: normalizeContact(data.contact) } : {}) };
}

