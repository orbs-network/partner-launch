import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createOnboardingState } from "./state/actions";
import { sanitizeDraft, selectDraft } from "./state/hydration";
import { safeStorage } from "./state/storage";
import { createActiveDraftStorage } from "./state/active-draft-storage";
import type { OnboardingDraft, OnboardingState } from "./state/types";

export type {
  Deposit,
  TermsSignature,
  ChainFunding,
  OnboardingDraft,
} from "./state/types";
export type { FundingConfirmation } from "./placeholder-funding";
export {
  initialDraft,
  emptyChainFunding,
  getChainFunding,
  getPendingDeposit,
} from "./state/draft";
export { getStorageAvailable } from "./state/storage";

export const useOnboardingStore = create<OnboardingState>()(
  persist<OnboardingState, [], [], OnboardingDraft>(createOnboardingState, {
    name: "perpetual-hub-onboarding",
    version: 2,
    storage: createActiveDraftStorage(createJSONStorage<OnboardingDraft>(() => safeStorage)),
    partialize: selectDraft,
    migrate: (persisted) => sanitizeDraft(persisted),
    merge: (persisted, current) => ({
      ...current,
      ...sanitizeDraft(persisted),
    }),
  }),
);
