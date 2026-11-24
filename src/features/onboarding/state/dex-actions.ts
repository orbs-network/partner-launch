import type { StoreApi } from "zustand";
import { generateAccountId, validateBrandColor, validateLogoDataUrl } from "../dex-identity";
import { validateCreatorShareBps } from "../creator-revenue";
import { DEFAULT_FEE_CAP_BPS } from "../revenue-settings";
import { retainDepositStepConfirmations } from "../deposit-step";
import { getPendingDeposit } from "./draft";
import type { OnboardingActions, OnboardingState } from "./types";

/** Creator preferences share the same identity and confirmation rules as setup. */
export function createDexActions(
  set: StoreApi<OnboardingState>["setState"],
  get: StoreApi<OnboardingState>["getState"],
): Pick<OnboardingActions, "setLaunchPath" | "setDexName" | "setBranding" | "setRequestedCreatorShareBps"> {
  return {
    setLaunchPath(launchPath) {
      if (launchPath !== null && launchPath !== "creator" && launchPath !== "api") return;
      const current = get();
      if (launchPath === current.launchPath) return;
      const useSetupDefaults = launchPath !== null && current.launchPath === null &&
        current.chainIds.length === 0 && !current.partnerName &&
        !current.displayName && !current.revenueWallet;
      set({
        launchPath,
        setupSubmission: undefined,
        setupRequestReceipt: undefined,
        depositStepConfirmations: retainDepositStepConfirmations(current),
        completed: false,
        ...(useSetupDefaults && current.feeCapBps === 0
          ? { feeCapBps: DEFAULT_FEE_CAP_BPS } : {}),
      });
    },
    setDexName(displayName) {
      const current = get();
      const partnerName = displayName === "QuickSwap1" ? "QuickSwap1" : generateAccountId(displayName);
      const identityChanged = partnerName !== current.partnerName;
      if (
        (displayName === current.displayName && !identityChanged) ||
        (identityChanged && getPendingDeposit(current))
      ) return;
      set({
        displayName,
        partnerName,
        ...(identityChanged ? { fundingConfirmation: null, fundingConfirmations: [] } : {}),
        termsAcceptedVersion: null,
        setupSubmission: undefined,
        setupRequestReceipt: undefined,
        depositStepConfirmations: retainDepositStepConfirmations(current),
        termsSignatures: {},
        completed: false,
        revision: current.revision + 1,
      });
    },
    setBranding(branding) {
      const current = get();
      const brandColor = typeof branding.brandColor === "string" && !validateBrandColor(branding.brandColor)
        ? branding.brandColor : current.brandColor;
      const logoDataUrl = typeof branding.logoDataUrl === "string" && !validateLogoDataUrl(branding.logoDataUrl)
        ? branding.logoDataUrl : current.logoDataUrl;
      if (brandColor === current.brandColor && logoDataUrl === current.logoDataUrl) return;
      set({
        brandColor,
        logoDataUrl,
        termsAcceptedVersion: null,
        setupSubmission: undefined,
        setupRequestReceipt: undefined,
        depositStepConfirmations: retainDepositStepConfirmations(current),
        termsSignatures: {},
        completed: false,
        revision: current.revision + 1,
      });
    },
    setRequestedCreatorShareBps(value) {
      const requestedCreatorShareBps = validateCreatorShareBps(value) ? null : value;
      const current = get();
      if (requestedCreatorShareBps === current.requestedCreatorShareBps) return;
      set({
        requestedCreatorShareBps,
        termsAcceptedVersion: null,
        setupSubmission: undefined,
        setupRequestReceipt: undefined,
        depositStepConfirmations: retainDepositStepConfirmations(current),
        termsSignatures: {},
        completed: false,
        revision: current.revision + 1,
      });
    },
  };
}
