import { validateDexUrl } from "../../lib/dex-url.js";
import { chainById } from "../../config/supported-chains.js";
import { validateDexName, validatePartnerName } from "./dex-identity.js";
import { validateRevenueWallet } from "./revenue-settings.js";
import { validateBuilderFee } from "./builder-fee.js";
import { isRecord, TERMS_VERSION } from "./terms-policy.js";
import { normalizeContact, validateContact } from "../../lib/contact.js";
import { normalizeOwnerWallets, validateOwnerWallets } from "./owner-wallets.js";

/** Public request details only; this notification grants no wallet or trading authority. */
export function preparePerpsRequest(body: unknown) {
  if (!isRecord(body) || typeof body.appName !== "string" || typeof body.partnerId !== "string" ||
    typeof body.revenueWallet !== "string" || typeof body.ownerWallet !== "string" || body.policyAccepted !== true || body.policyVersion !== TERMS_VERSION ||
    (body.launchPath !== "creator" && body.launchPath !== "api") ||
    (body.integrationMode !== undefined && body.integrationMode !== "ui" && body.integrationMode !== "api") ||
    !Array.isArray(body.chainIds) || body.chainIds.length !== 1 || !Number.isSafeInteger(body.chainIds[0]) ||
    !chainById(body.chainIds[0]) || typeof body.builderFeeTenthsBps !== "number" ||
    (body.contact !== undefined && typeof body.contact !== "string") ||
    (body.appUrl !== undefined && typeof body.appUrl !== "string") ||
    (body.ownerWallets !== undefined && !Array.isArray(body.ownerWallets)))
    throw new Error("Check your Perps details and accept the current policy.");
  const nameError = body.launchPath === "creator" ? validateDexName(body.appName)
    : !body.appName.trim() || body.appName.length > 80 || [...body.appName].some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)
      ? "Check your DEX name." : undefined;
  const ownerError = validateRevenueWallet(body.ownerWallet) ? "Enter a valid, non-zero owner wallet address." : undefined;
  const error = (typeof body.appUrl === "string" ? validateDexUrl(body.appUrl) : undefined) ?? nameError ?? validatePartnerName(body.partnerId) ?? ownerError ?? validateRevenueWallet(body.revenueWallet)
    ?? validateBuilderFee(body.builderFeeTenthsBps) ?? (typeof body.contact === "string" ? validateContact(body.contact) : undefined)
    ?? validateOwnerWallets(body.ownerWallets ?? []);
  if (error) throw new Error(error);
  return { appName: body.appName.trim(), partnerId: body.partnerId, chainIds: [body.chainIds[0] as number],
    ownerWallet: body.ownerWallet, ownerWallets: normalizeOwnerWallets((body.ownerWallets ?? []) as string[]), revenueWallet: body.revenueWallet, builderFeeTenthsBps: body.builderFeeTenthsBps,
    launchPath: body.launchPath, ...(typeof body.appUrl === "string" && body.appUrl.trim() ? { appUrl: body.appUrl.trim() } : {}), ...(body.integrationMode ? { integrationMode: body.integrationMode } : {}), policyAccepted: true, policyVersion: TERMS_VERSION,
    ...(typeof body.contact === "string" && body.contact.trim() ? { contact: normalizeContact(body.contact) } : {}) };
}
