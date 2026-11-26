import { formatSpotFeePercent } from "../src/features/onboarding/spot/spot-fee.js";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { PoolClient } from "pg";
import { emptySpotDraft, prepareSpotSetup, spotStepError } from "../src/features/onboarding/spot/spot-setup.js";
import { isRecord, TERMS_VERSION } from "../src/features/onboarding/terms-policy.js";
import { generateSpotAppId } from "../src/features/onboarding/spot/app-id.js";
import { validateRevenueWallet } from "../src/features/onboarding/revenue-settings.js";
import { normalizeOwnerWallets, validateOwnerWallets } from "../src/features/onboarding/owner-wallets.js";
import { verifySpotCancelProof } from "./spot-cancel-proof.js";
import { requestDatabase } from "./request-database.js";
import { cancelOwnedSpotRequest, lockOwnedSpotRequest } from "./spot-owner-authorization.js";

import { setupNotificationHandler } from "./setup-notification.js";

/** A test ID override is accepted only for a verified local development request. */
export function resolveSpotPartnerId(appName: string, override: unknown, allowLocalTestId: boolean): string {
  if (override !== undefined && (!allowLocalTestId || appName.toLowerCase() !== "test" || typeof override !== "string" || !/^test[a-f0-9]{16}$/.test(override))) throw new Error("Invalid local test Partner ID.");
  return typeof override === "string" ? override : generateSpotAppId(appName);
}

function prepareSpotNotification(body: unknown, cancelling: boolean, allowLocalTestId = false) {
  if (!isRecord(body) || typeof body.appName !== "string" || typeof body.feesWallet !== "string" ||
    (body.integrationMode !== undefined && body.integrationMode !== "ui" && body.integrationMode !== "existing") ||
    (body.tradingFeePercent !== undefined && typeof body.tradingFeePercent !== "string") || (body.dexUrl !== undefined && typeof body.dexUrl !== "string") || (body.contact !== undefined && typeof body.contact !== "string") ||
    body.feesWallet.length > 100 || (!cancelling && (body.policyAccepted !== true || body.policyVersion !== TERMS_VERSION))) {
    throw new Error(cancelling ? "Check the Spot request details." : "Check your Spot details and accept the current policy.");
  }
  if (!cancelling && (typeof body.ownerWallet !== "string" || validateRevenueWallet(body.ownerWallet) ||
    typeof body.requestId !== "string" || typeof body.accessToken !== "string" || validateOwnerWallets(body.ownerWallets ?? []))) throw new Error("Check your owner wallets and try again.");
  const ownerWallets = !cancelling ? normalizeOwnerWallets((body.ownerWallets ?? []) as string[]) : [];
  let setup: { appName: string; feesWallet: string; dexUrl?: string; contact?: string; integrationMode?: "ui" | "existing"; tradingFeeTenthsBps?: number };
  let submittedAt: string;
  try {
    const draft = { ...emptySpotDraft(), integrationMode: body.integrationMode === "ui" ? "ui" as const : "existing" as const, appName: body.appName, contact: typeof body.contact === "string" ? body.contact : "", dexUrl: typeof body.dexUrl === "string" ? body.dexUrl : "", feesWallet: body.feesWallet, tradingFeePercent: typeof body.tradingFeePercent === "string" ? body.tradingFeePercent : "0" };
    if (cancelling) {
      // Cancelling existing details does not accept a new policy or prove ownership.
      // Pending requests never keep a contact, so cancellations carry none.
      const error = (["app", "url", "wallet"] as const).map(step => spotStepError(step, { ...draft, contact: "" })).find(Boolean);
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
  if (cancelling && body.partnerId !== undefined && (typeof body.partnerId !== "string" || !/^[\p{L}\p{M}\p{N}]{3,80}$/u.test(body.partnerId))) throw new Error("Invalid Spot Partner ID.");
  const partnerId = cancelling && typeof body.partnerId === "string" ? body.partnerId : resolveSpotPartnerId(setup.appName, body.localTestPartnerId, allowLocalTestId && !cancelling);
  return { submittedAt, text: [cancelling ? "Spot setup cancellation request" : "New Spot setup request", `DEX name: ${setup.appName}`,
    `Partner ID: ${partnerId}`,
    ...(setup.dexUrl ? [`DEX URL: ${setup.dexUrl}`] : []), `Fees wallet: ${setup.feesWallet}`,
    ...(!cancelling ? [`Integration: ${setup.integrationMode === "ui" ? "Complete trading DEX" : "Existing DEX"}`, `Trading fee: ${formatSpotFeePercent(setup.tradingFeeTenthsBps!)}%`, `Owner wallet (unverified): ${body.ownerWallet}`, ...ownerWallets.map(wallet => `Additional owner wallet (unverified): ${wallet}`), `Contact: ${setup.contact ?? "Not provided"}`] : [])].join("\n"),
    ...(!cancelling ? { record: { id: body.requestId as string, accessToken: body.accessToken as string, product: "spot" as const,
      ownerWallet: body.ownerWallet as string, ownerWallets, partnerId, details: { appName: setup.appName, feesWallet: setup.feesWallet, tradingFeeTenthsBps: setup.tradingFeeTenthsBps, integrationMode: setup.integrationMode, ownerWallets,
        // Contact goes only to the team's Telegram message; it is never stored.
        ...(setup.dexUrl ? { dexUrl: setup.dexUrl } : {}) } } } : {}) };
}

export function spotSubmitHandler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  return setupNotificationHandler(request, response, {
    unavailable: "Spot submission is not available yet. Your details are kept here; please try again later.",
    prepare: body => prepareSpotNotification(body, false, process.env.NODE_ENV === "development" && !process.env.VERCEL && ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(request.socket.remoteAddress ?? "") && ["localhost", "127.0.0.1", "[::1]"].includes(new URL(`http://${request.headers.host ?? ""}`).hostname)),
  });
}

export function spotCancelHandler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  let authorized: { id: string; owner: string } | undefined;
  let transaction: PoolClient | undefined;
  let committed = false;
  return setupNotificationHandler(request, response, {
    unavailable: "Spot cancellation is not available yet. Your request is kept here; please try again later.",
    prepare: body => prepareSpotNotification(body, true),
    async authorize(body, incoming) {
      if (!isRecord(body) || typeof body.requestId !== "string" || !/^[\da-f-]{36}$/i.test(body.requestId)) throw new Error("invalid request");
      const owner = await verifySpotCancelProof(body.proof, incoming, body.requestId);
      if (!owner) throw new Error("invalid proof");
      transaction = await requestDatabase().connect();
      await transaction.query("BEGIN");
      const details = await lockOwnedSpotRequest(transaction, body.requestId, owner);
      if (!details || details.appName !== body.appName || details.feesWallet !== body.feesWallet || (details.dexUrl ?? "") !== (body.dexUrl ?? "") || (body.partnerId !== undefined && body.partnerId !== (details.partnerId ?? generateSpotAppId(body.appName as string)))) throw new Error("request changed");
      authorized = { id: body.requestId, owner };
    },
    async afterDelivery() {
      if (!authorized || !transaction) throw new Error("unauthorized");
      if (!await cancelOwnedSpotRequest(transaction, authorized.id, authorized.owner)) throw new Error("request changed");
      await transaction.query("COMMIT");
      committed = true;
    },
    async finalize() {
      if (transaction) {
        if (!committed) await transaction.query("ROLLBACK").catch(() => {});
        transaction.release();
        transaction = undefined;
      }
    },
  });
}
