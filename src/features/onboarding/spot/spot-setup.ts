import { parseSpotFeePercent } from "./spot-fee.js";
import { isAddress, zeroAddress } from "viem";
import { validateDexName } from "../dex-identity.js";
import { isRecord, TERMS_VERSION } from "../terms-policy.js";
import { MAX_DEX_URL_LENGTH, validateDexUrl } from "../../../lib/dex-url.js";
import { MAX_CONTACT_LENGTH, normalizeContact, validateContact } from "../../../lib/contact.js";
import { normalizeOwnerWallets, restoreOwnerWallets } from "../owner-wallets.js";

export const SPOT_DRAFT_KEY = "partner-portal-spot-draft-v1";
export const spotSteps = [
  { id: "integration", name: "Integration", title: "How would you like to add Spot?", intro: "Choose the approach that fits your app. We’ll prepare the right instructions for you." },
  { id: "app", name: "App name", title: "App name", intro: "Choose the name people will see in your Spot app, and how our team can reach you." },
  { id: "url", name: "DEX URL", title: "DEX URL", intro: "Add your DEX website, if you have one. You can leave this blank." },
  { id: "wallet", name: "Fees wallet", title: "Fees wallet", intro: "Choose the wallet where you want to receive Spot fees." },
  { id: "review", name: "Review", title: "Review your Spot setup", intro: "Check your details and accept the policy before continuing." },
  { id: "deposit", name: "Deposit requirement", title: "Deposit requirement", intro: "Review the deposit requirement, then submit your setup to the team." },
] as const;
export type SpotStep = (typeof spotSteps)[number]["id"];

/** Keep stable step IDs while skipping the website question for a new app. */
export function spotStepsForMode(mode: SpotDraft["integrationMode"]) {
  return mode === "ui" ? spotSteps.filter(step => step.id !== "url") : spotSteps;
}
export interface SpotDraft {
  step: SpotStep;
  integrationMode: "ui" | "existing" | null;
  appName: string;
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
  if (step === "wallet" && parseSpotFeePercent(draft.tradingFeePercent) === null) return "Enter a trading fee from 0% to 1%, in 0.001% increments.";
  if (step === "review" && (!draft.policyAccepted || draft.policyVersion !== TERMS_VERSION)) return "Accept the terms and privacy policy before submitting your Spot setup.";
}
export function restoreSpotDraft(value: unknown): SpotDraft {
  if (!isRecord(value)) return emptySpotDraft();
  const draft: SpotDraft = {
    step: spotSteps.find((step) => step.id === value.step)?.id ?? "app",
    integrationMode: value.integrationMode === "ui" || value.integrationMode === "existing" ? value.integrationMode : value.step === "integration" ? null : "existing",
    appName: typeof value.appName === "string" ? value.appName.slice(0, 80) : "",
    contact: typeof value.contact === "string" ? value.contact.slice(0, MAX_CONTACT_LENGTH + 1) : "",
    dexUrl: typeof value.dexUrl === "string" ? value.dexUrl.slice(0, MAX_DEX_URL_LENGTH + 1) : "",
    feesWallet: typeof value.feesWallet === "string" ? value.feesWallet.slice(0, 100) : "",
    tradingFeePercent: typeof value.tradingFeePercent === "string" ? value.tradingFeePercent.slice(0, 20) : "0",
    ownerWallets: restoreOwnerWallets(value.ownerWallets),
    policyAccepted: value.policyAccepted === true && value.policyVersion === TERMS_VERSION,
    policyVersion: TERMS_VERSION,
  };
  if (draft.integrationMode === "ui" && draft.step === "url") draft.step = "wallet";
  const steps = spotStepsForMode(draft.integrationMode);
  const index = steps.findIndex((step) => step.id === draft.step);
  const invalid = steps.slice(0, index).find((step) => spotStepError(step.id, draft));
  if (invalid) { draft.step = invalid.id; draft.policyAccepted = false; }
  return draft;
}
/** Validated details alone do not prove delivery, wallet ownership or activation. */
export function prepareSpotSetup(draft: SpotDraft): Omit<SpotSetupSnapshot, "transport"> {
  for (const step of spotStepsForMode(draft.integrationMode)) {
    const error = spotStepError(step.id, draft);
    if (error) throw new Error(error);
  }
  return {
    kind: "spot", ...(draft.integrationMode ? { integrationMode: draft.integrationMode } : {}), appName: draft.appName.trim(), feesWallet: draft.feesWallet.trim(), tradingFeeTenthsBps: parseSpotFeePercent(draft.tradingFeePercent)!, ownerWallets: normalizeOwnerWallets(draft.ownerWallets),
    ...(draft.contact.trim() ? { contact: normalizeContact(draft.contact) } : {}),
    ...(draft.integrationMode !== "ui" && draft.dexUrl.trim() ? { dexUrl: draft.dexUrl.trim() } : {}),
    policy: { version: TERMS_VERSION, acceptedAt: new Date().toISOString() },
  };
}
