import { parseSpotFeePercent } from "./spot-fee.js";
import { isAddress, zeroAddress } from "viem";
import { validateDexName } from "../dex-identity.js";
import { isRecord, TERMS_VERSION } from "../terms-policy.js";
import { MAX_DEX_URL_LENGTH, validateDexUrl } from "../../../lib/dex-url.js";
import { MAX_CONTACT_LENGTH, normalizeContact, validateContact } from "../../../lib/contact.js";
import { normalizeOwnerWallets, restoreOwnerWallets } from "../owner-wallets.js";

export const SPOT_DRAFT_KEY = "partner-portal-spot-draft-v1";
export const spotSteps = [
  { id: "integration", name: "Integration", title: "How would you like to add spot trading?", intro: "Choose a ready-made trading interface or add Spot to your existing DEX." },
  { id: "app", name: "DEX name", title: "Name your DEX", intro: "Choose the name people will see in your DEX, and how our team can reach you." },
  { id: "wallet", name: "Platform fee", title: "Set your platform fee", intro: "Choose where to receive your revenue and set the platform fee for Spot trades." },
  { id: "build", name: "Build your DEX", title: "Build your DEX", intro: "Use AI to customize your trading platform. No coding required." },
  { id: "url", name: "DEX URL", title: "Add your DEX URL", intro: "Enter your published DEX address, or skip this step if it isn’t ready yet." },
  { id: "review", name: "Review", title: "Review your Spot setup", intro: "Check your details and accept the policy before continuing." },
  { id: "deposit", name: "Activation deposit", title: "One-time activation deposit", intro: "Deposit 100 USDC to activate your DEX." },
] as const;
export type SpotStep = (typeof spotSteps)[number]["id"];

/** Existing integrations skip the ready-made UI build; stable IDs preserve restored drafts. */
export function spotStepsForMode(mode: SpotDraft["integrationMode"], recoverUrl = false) {
  return mode === "existing" ? spotSteps.filter(step => step.id !== "url" || recoverUrl).map(step => step.id === "build"
    ? { ...step, name: "Integration prompt", title: "Your Spot integration prompt", intro: "Use this prompt to add Spot trading to your existing DEX." } : step) : spotSteps;
}
export interface SpotDraft {
  step: SpotStep;
  integrationMode: "ui" | "existing" | null;
  appName: string;
  localTestPartnerId?: string;
  /** Optional email or Telegram username for the team; never stored in Pending requests. */
  contact: string;
  dexUrl: string;
  feesWallet: string;
  tradingFeePercent: string;
  ownerWallets: string[];
  policyAccepted: boolean;
  policyVersion: string;
}
export interface SpotSetupSnapshot {
  kind: "spot";
  partnerId?: string;
  integrationMode?: "ui" | "existing";
  appName: string;
  contact?: string;
  dexUrl?: string;
  feesWallet: string;
  tradingFeeTenthsBps: number;
  ownerWallets: string[];
  policy: { version: string; acceptedAt: string };
  transport: "telegram";
}
export function emptySpotDraft(): SpotDraft {
  return { step: "integration", integrationMode: null, appName: "", contact: "", dexUrl: "", feesWallet: "", tradingFeePercent: "0", ownerWallets: [], policyAccepted: false, policyVersion: TERMS_VERSION };
}
export function spotStepError(step: SpotStep, draft: SpotDraft): string | undefined {
  if (step === "integration" && draft.integrationMode === null) return "Choose how you want to add Spot.";
  if (step === "app") return validateDexName(draft.appName) ?? validateContact(draft.contact);
  if (step === "url") return validateDexUrl(draft.dexUrl);
  if (step === "wallet" && (!isAddress(draft.feesWallet.trim()) || draft.feesWallet.trim().toLowerCase() === zeroAddress)) return "Enter a valid, non-zero EVM fees wallet address.";
  if (step === "wallet" && parseSpotFeePercent(draft.tradingFeePercent) === null) return "Enter a platform fee from 0% to 1%, in 0.001% increments.";
  if (step === "review" && (!draft.policyAccepted || draft.policyVersion !== TERMS_VERSION)) return "Accept the terms and privacy policy before submitting your Spot setup.";
}
export function restoreSpotDraft(value: unknown): SpotDraft {
  if (!isRecord(value)) return emptySpotDraft();
  const draft: SpotDraft = {
    step: spotSteps.find((step) => step.id === value.step)?.id ?? "app",
    integrationMode: value.integrationMode === "ui" || value.integrationMode === "existing" ? value.integrationMode : value.step === "integration" ? null : "existing",
    appName: typeof value.appName === "string" ? value.appName.slice(0, 80) : "",
    ...(typeof value.localTestPartnerId === "string" && /^test[a-f0-9]{16}$/.test(value.localTestPartnerId) ? { localTestPartnerId: value.localTestPartnerId } : {}),
    contact: typeof value.contact === "string" ? value.contact.slice(0, MAX_CONTACT_LENGTH + 1) : "",
    dexUrl: typeof value.dexUrl === "string" ? value.dexUrl.slice(0, MAX_DEX_URL_LENGTH + 1) : "",
    feesWallet: typeof value.feesWallet === "string" ? value.feesWallet.slice(0, 100) : "",
    tradingFeePercent: typeof value.tradingFeePercent === "string" ? value.tradingFeePercent.slice(0, 20) : "0",
    ownerWallets: restoreOwnerWallets(value.ownerWallets),
    policyAccepted: value.policyAccepted === true && value.policyVersion === TERMS_VERSION,
    policyVersion: TERMS_VERSION,
  };
  if (draft.integrationMode === "existing" && (draft.step === "url" && !validateDexUrl(draft.dexUrl))) draft.step = "review";
  const steps = spotStepsForMode(draft.integrationMode, !!validateDexUrl(draft.dexUrl));
  const index = steps.findIndex((step) => step.id === draft.step);
  const invalid = steps.slice(0, index).find((step) => spotStepError(step.id, draft));
  if (invalid) { draft.step = invalid.id; draft.policyAccepted = false; }
  return draft;
}
/** Validated details alone do not prove delivery, wallet ownership or activation. */
export function prepareSpotSetup(draft: SpotDraft): Omit<SpotSetupSnapshot, "transport"> {
  const urlError = validateDexUrl(draft.dexUrl);
  if (urlError) throw new Error(urlError);
  for (const step of spotStepsForMode(draft.integrationMode)) {
    const error = spotStepError(step.id, draft);
    if (error) throw new Error(error);
  }
  return {
    kind: "spot", ...(draft.integrationMode ? { integrationMode: draft.integrationMode } : {}), appName: draft.appName.trim(), feesWallet: draft.feesWallet.trim(), tradingFeeTenthsBps: parseSpotFeePercent(draft.tradingFeePercent)!, ownerWallets: normalizeOwnerWallets(draft.ownerWallets),
    ...(draft.contact.trim() ? { contact: normalizeContact(draft.contact) } : {}),
    ...(draft.dexUrl.trim() ? { dexUrl: draft.dexUrl.trim() } : {}),
    policy: { version: TERMS_VERSION, acceptedAt: new Date().toISOString() },
  };
}
