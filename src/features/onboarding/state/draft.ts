import { supportedChains } from "../../../config/chains";
import { DEFAULT_BRAND_COLOR } from "../dex-identity";
import { DEFAULT_CREATOR_SHARE_BPS } from "../creator-revenue";
import { DEFAULT_BUILDER_FEE_TENTHS_BPS } from "../builder-fee";
import type { ChainFunding, Deposit, OnboardingDraft } from "./types";

export const emptyChainFunding: ChainFunding = {
  depositAmount: "",
  deposit: null,
  fundingDeferred: false,
};

export const initialDraft: OnboardingDraft = {
  step: 0,
  launchPath: null,
  integrationMode: null,
  chainIds: [],
  chainId: null,
  displayName: "",
  appUrl: "",
  contact: "",
  ownerWallets: [],
  partnerName: "",
  brandColor: DEFAULT_BRAND_COLOR,
  logoDataUrl: "",
  revenueWallet: "",
  feeCapBps: 0,
  requestedCreatorShareBps: DEFAULT_CREATOR_SHARE_BPS,
  builderFeeTenthsBps: DEFAULT_BUILDER_FEE_TENTHS_BPS,
  fundingByChain: {},
  fundingConfirmation: null,
  fundingConfirmations: [],
  termsAcceptedVersion: null,
  termsSignatures: {},
  origins: [],
  integrationAcknowledged: false,
  completed: false,
};

export function getChainFunding(
  draft: Pick<OnboardingDraft, "fundingByChain">,
  chainId: number | null,
): ChainFunding {
  return chainId === null
    ? emptyChainFunding
    : (draft.fundingByChain[chainId] ?? emptyChainFunding);
}

export function getPendingDeposit(
  draft: Pick<OnboardingDraft, "fundingByChain">,
): Deposit | undefined {
  return (
    Object.values(draft.fundingByChain).find(
      (funding) => funding.deposit?.status === "pending",
    )?.deposit ?? undefined
  );
}

export const isSupported = (id: unknown): id is number =>
  supportedChains.some((chain) => chain.id === id);
export const normalizeChainIds = (ids: unknown[]): number[] =>
  supportedChains.map((chain) => chain.id).filter((id) => ids.includes(id));
