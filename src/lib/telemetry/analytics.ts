type Product = "perps" | "spot";
type StoryEvent = "deployment-success" | "configuration-found" | "submission-request" | "signature-request" | "signature-success" |
  "delivery-success" | "submission-success" | "submission-failed";
export type StoryFields = { appName?: string; appUrl?: string; partnerId?: string; chainId?: number; dexUrl?: string;
  hasDexUrl?: boolean; feesWallet?: string; revenueWallet?: string; walletAddress?: string;
  integrationMode?: "ui" | "api" | "existing"; extraTradingFeePercent?: string; builderFeeTenthsBps?: number; policyAccepted?: boolean };
type EventDetails = StoryFields & { product?: Product; step?: string; retry?: boolean; evidence?: "perps-enabled-lanes" | "spot-config-key" };

const endpoint = "https://bi.orbs.network/putes/partner-launch";
const sessionStartedAt = Date.now();
const sessionId = makeId();
let storyStep = 0;

function makeId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

function eventMetadata(event: StoryEvent) {
  const category = "setup";
  const outcome = event.endsWith("-failed") ? "failed" : event.endsWith("-success") ? "success" :
    event.endsWith("-request") ? "request" : "info";
  return { eventCategory: category, eventAction: event.replace(/-(request|success|failed)$/, ""), eventOutcome: outcome };
}

/** Explicit allowlist: setup values may be reported; signatures and signed messages never are. */
export async function trackStory(event: StoryEvent, details: EventDetails = {}): Promise<void> {
  const now = Date.now();
  const eventId = makeId();
  const step = ++storyStep;
  const payload = {
    _id: eventId, eventId, sessionId, storyId: sessionId, storyStep: step, storyEvent: `${step}:${event}`,
    event, ...eventMetadata(event), sessionStartedAt, sessionStartedAtIso: new Date(sessionStartedAt).toISOString(),
    sessionElapsedMs: now - sessionStartedAt, timestampIso: new Date(now).toISOString(),
    partner: "partner-launch", version: 0.3,
    ...(details.product ? { product: details.product } : {}),
    ...(details.step ? { step: details.step } : {}),
    ...(details.chainId !== undefined ? { chainId: details.chainId } : {}),
    ...(details.appName !== undefined ? { appName: details.appName } : {}),
    ...(details.partnerId !== undefined ? { partnerId: details.partnerId } : {}),
    ...(details.dexUrl !== undefined ? { dexUrl: details.dexUrl } : {}),
    ...(details.hasDexUrl !== undefined ? { hasDexUrl: details.hasDexUrl } : {}),
    ...(details.feesWallet !== undefined ? { feesWallet: details.feesWallet } : {}),
    ...(details.revenueWallet !== undefined ? { revenueWallet: details.revenueWallet } : {}),
    ...(details.walletAddress !== undefined ? { walletAddress: details.walletAddress } : {}),
    ...(details.extraTradingFeePercent !== undefined ? { extraTradingFeePercent: details.extraTradingFeePercent } : {}),
    ...(details.builderFeeTenthsBps !== undefined ? { builderFeeTenthsBps: details.builderFeeTenthsBps } : {}),
    ...(details.policyAccepted !== undefined ? { policyAccepted: details.policyAccepted } : {}),
    ...(details.evidence ? { evidence: details.evidence } : {}),
    ...(details.retry !== undefined ? { retry: details.retry } : {}),
  };
  try {
    await fetch(endpoint, { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(payload), keepalive: true });
  } catch { /* Analytics must never interrupt setup. */ }
}

