import type { FundingConfirmation } from "../funding-confirmation";
import type { SetupSubmission } from "../setup-submission";
import type { SavedSetupRequestReceipt } from "../setup-request-receipt";
import type { DepositStepConfirmation } from "../deposit-step";

export interface Deposit {
  hash: `0x${string}`;
  status: "pending" | "confirmed" | "failed";
  payer: `0x${string}`;
  chainId: number;
  amount: string;
  partnerId?: string;
  targetFingerprint?: string;
  createdAt?: string;
}

export interface TermsSignature {
  signature: `0x${string}`;
  address: `0x${string}`;
  message: string;
  signedAt: string;
}

export interface ChainFunding {
  depositAmount: string;
  deposit: Deposit | null;
  fundingDeferred: boolean;
}

export interface OnboardingDraft {
  setupSubmission?: SetupSubmission;
  setupRequestReceipt?: SavedSetupRequestReceipt;
  /** Retained network-scoped mock deposit-step consent; this never records payment. */
  depositStepConfirmations?: DepositStepConfirmation[];
  step: number;
  launchPath: "creator" | "api" | null;
  chainIds: number[];
  /** The network currently being viewed in the funding step. */
  chainId: number | null;
  /** Human-facing DEX name; existing saved account IDs remain independent. */
  displayName: string;
  /** Optional email/Telegram for the team. Not part of the signed setup hash, exports or Pending requests. */
  contact?: string;
  ownerWallets?: string[];
  /** The partner name used by setup, funding targets, and exported configuration. */
  partnerName: string;
  brandColor: string;
  logoDataUrl: string;
  /** Requested payout wallet; the team activates it after reviewing setup. */
  revenueWallet: string;
  /** Requested maximum trading fee, in whole basis points (0–1000). */
  feeCapBps: number | null;
  /** Requested share of collected trading fees; pending team activation only. */
  requestedCreatorShareBps: number | null;
  /** Per-order extra fee: f=1 means 0.001%; absent on historical share-model proofs. */
  builderFeeTenthsBps?: number | null;
  fundingByChain: Record<number, ChainFunding>;
  fundingConfirmation: FundingConfirmation | null;
  fundingConfirmations: FundingConfirmation[];
  /** Local review checkbox; wallet confirmation is required separately at funding. */
  termsAcceptedVersion: string | null;
  termsSignatures: Record<number, TermsSignature>;
  origins: string[];
  /** Legacy saved/export field; post-setup app resources require no confirmation. */
  integrationAcknowledged: boolean;
  completed: boolean;
}

export interface OnboardingActions {
  setSetupSubmission: (submission: SetupSubmission) => void;
  setSetupRequestReceipt: (receipt: SavedSetupRequestReceipt) => void;
  rememberDepositStepConfirmation: (confirmation: DepositStepConfirmation) => void;
  revision: number;
  setLaunchPath: (path: OnboardingDraft["launchPath"]) => void;
  toggleChain: (chainId: number) => void;
  setChainIds: (chainIds: number[]) => void;
  setActiveChainId: (chainId: number) => void;
  /** @deprecated Retained for compatibility with older draft consumers. */
  setDisplayName: (name: string) => void;
  setDexName: (name: string) => void;
  setContact: (contact: string) => void;
  setBranding: (branding: { brandColor?: string; logoDataUrl?: string }) => void;
  setStep: (step: number) => void;
  setPartnerName: (partnerName: string) => void;
  setRevenueWallet: (revenueWallet: string) => void;
  setFeeCapBps: (feeCapBps: number | null) => void;
  setRequestedCreatorShareBps: (requestedCreatorShareBps: number | null) => void;
  setBuilderFeeTenthsBps: (fee: number | null) => void;
  setDepositAmount: (amount: string, chainId?: number) => void;
  setDeposit: (deposit: Deposit | null, chainId?: number) => void;
  setFundingConfirmation: (confirmation: FundingConfirmation | null) => void;
  /** @deprecated Retained for older draft consumers; no longer used by the wizard. */
  setIntegrationAcknowledged: (acknowledged: boolean) => void;
  setTermsAccepted: (accepted: boolean) => void;
  setTermsSignature: (
    signature: TermsSignature | null,
    chainId?: number,
  ) => void;
  complete: () => void;
  reset: () => void;
}

export interface OnboardingState extends OnboardingDraft, OnboardingActions {}
