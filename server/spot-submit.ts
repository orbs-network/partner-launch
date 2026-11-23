import type { IncomingMessage, ServerResponse } from "node:http";
import { emptySpotDraft, prepareSpotSetup, spotStepError } from "../src/features/onboarding/spot/spot-setup.js";
import { isRecord, TERMS_VERSION } from "../src/features/onboarding/terms-policy.js";
import { generateSpotAppId } from "../src/features/onboarding/spot/app-id.js";

import { setupNotificationHandler } from "./setup-notification.js";

function prepareSpotNotification(body: unknown, cancelling: boolean) {
  if (!isRecord(body) || typeof body.appName !== "string" || typeof body.feesWallet !== "string" ||
    (body.dexUrl !== undefined && typeof body.dexUrl !== "string") ||
    body.feesWallet.length > 100 || (!cancelling && (body.policyAccepted !== true || body.policyVersion !== TERMS_VERSION))) {
    throw new Error(cancelling ? "Check the Spot request details." : "Check your Spot details and accept the current policy.");
  }
  let setup: { appName: string; feesWallet: string; dexUrl?: string };
  let submittedAt: string;
  try {
    const draft = { ...emptySpotDraft(), appName: body.appName, dexUrl: typeof body.dexUrl === "string" ? body.dexUrl : "", feesWallet: body.feesWallet };
    if (cancelling) {
      // Cancelling existing details does not accept a new policy or prove ownership.
      const error = (["app", "url", "wallet"] as const).map(step => spotStepError(step, draft)).find(Boolean);
      if (error) throw new Error(error);
      setup = { appName: draft.appName.trim(), feesWallet: draft.feesWallet.trim(),
        ...(draft.dexUrl.trim() ? { dexUrl: draft.dexUrl.trim() } : {}) };
      submittedAt = new Date().toISOString();
    } else {
      const prepared = prepareSpotSetup({ ...draft, step: "review", policyAccepted: true, policyVersion: TERMS_VERSION });
      setup = prepared;
      submittedAt = prepared.policy.acceptedAt;
    }
  } catch (cause) {
    throw new Error(cause instanceof Error ? cause.message : "Check your Spot details.");
  }
  return { submittedAt, text: [cancelling ? "Spot setup cancellation request" : "New Spot setup request", `App name: ${setup.appName}`,
    `App ID: ${generateSpotAppId(setup.appName)}`,
    ...(setup.dexUrl ? [`DEX URL: ${setup.dexUrl}`] : []), `Fees wallet: ${setup.feesWallet}`].join("\n") };
}

export function spotSubmitHandler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  return setupNotificationHandler(request, response, {
    unavailable: "Spot submission is not available yet. Your details are kept here; please try again later.",
    prepare: body => prepareSpotNotification(body, false),
  });
}

export function spotCancelHandler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  return setupNotificationHandler(request, response, {
    unavailable: "Spot cancellation is not available yet. Your request is kept here; please try again later.",
    prepare: body => prepareSpotNotification(body, true),
  });
}
