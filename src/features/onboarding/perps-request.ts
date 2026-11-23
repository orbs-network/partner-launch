import { chainById } from "../../config/supported-chains.js";
import { validateDexName, validatePartnerName } from "./dex-identity.js";
import { validateRevenueWallet } from "./revenue-settings.js";
import { validateBuilderFee } from "./builder-fee.js";
import { isRecord, TERMS_VERSION } from "./terms-policy.js";

/** Public request details only; this notification grants no wallet or trading authority. */
export function preparePerpsRequest(body: unknown) {
  if (!isRecord(body) || typeof body.appName !== "string" || typeof body.partnerId !== "string" ||
    typeof body.revenueWallet !== "string" || body.policyAccepted !== true || body.policyVersion !== TERMS_VERSION ||
    (body.launchPath !== "creator" && body.launchPath !== "api") ||
    !Array.isArray(body.chainIds) || body.chainIds.length !== 1 || !Number.isSafeInteger(body.chainIds[0]) ||
    !chainById(body.chainIds[0]) || typeof body.builderFeeTenthsBps !== "number")
    throw new Error("Check your Perps details and accept the current policy.");
  const nameError = body.launchPath === "creator" ? validateDexName(body.appName)
    : !body.appName.trim() || body.appName.length > 80 || [...body.appName].some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)
      ? "Check your app name." : undefined;
  const error = nameError ?? validatePartnerName(body.partnerId) ?? validateRevenueWallet(body.revenueWallet)
    ?? validateBuilderFee(body.builderFeeTenthsBps);
  if (error) throw new Error(error);
  return { appName: body.appName.trim(), partnerId: body.partnerId, chainIds: [body.chainIds[0] as number],
    revenueWallet: body.revenueWallet, builderFeeTenthsBps: body.builderFeeTenthsBps,
    launchPath: body.launchPath, policyAccepted: true, policyVersion: TERMS_VERSION };
}
