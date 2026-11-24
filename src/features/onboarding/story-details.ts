import type { StoryFields } from "@/lib/telemetry/analytics";
import { validateDexUrl } from "@/lib/dex-url";
import { validateBuilderFee, formatBuilderFeePercent } from "./builder-fee";
import { isPartnerIdFormat, validateDexName } from "./dex-identity";
import { TERMS_VERSION } from "./terms-policy";
import { validateRevenueWallet } from "./revenue-settings";
import { generateSpotAppId } from "./spot/app-id";
import type { SpotDraft } from "./spot/spot-setup";
import type { OnboardingDraft } from "./state/types";

/** Select only valid user-entered values; do not serialize the draft or any proof. */
export function spotStoryDetails(draft: SpotDraft): StoryFields {
  const validName = !validateDexName(draft.appName);
  const validUrl = !validateDexUrl(draft.dexUrl);
  return {
    ...(validName ? { appName: draft.appName, partnerId: generateSpotAppId(draft.appName) } : {}),
    ...(validUrl ? { hasDexUrl: !!draft.dexUrl.trim(), ...(draft.dexUrl.trim() ? { dexUrl: draft.dexUrl.trim() } : {}) } : {}),
    ...(!validateRevenueWallet(draft.feesWallet) ? { feesWallet: draft.feesWallet } : {}),
    policyAccepted: draft.policyAccepted,
  };
}

export function perpsStoryDetails(draft: OnboardingDraft): StoryFields {
  const fee = draft.builderFeeTenthsBps;
  return {
    ...(draft.launchPath === "creator" && !validateDexName(draft.displayName) ? { appName: draft.displayName } : {}),
    ...(isPartnerIdFormat(draft.partnerName) && draft.partnerName.length <= 40 ? { partnerId: draft.partnerName } : {}),
    ...(draft.chainIds.length === 1 ? { chainId: draft.chainIds[0] } : {}),
    ...(!validateRevenueWallet(draft.revenueWallet) ? { revenueWallet: draft.revenueWallet } : {}),
    ...(typeof fee === "number" && !validateBuilderFee(fee) ? { builderFeeTenthsBps: fee, extraTradingFeePercent: formatBuilderFeePercent(fee) } : {}),
    policyAccepted: draft.termsAcceptedVersion === TERMS_VERSION,
  };
}
