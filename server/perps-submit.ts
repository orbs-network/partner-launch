import type { IncomingMessage, ServerResponse } from "node:http";
import { preparePerpsRequest } from "../src/features/onboarding/perps-request.js";
import { formatBuilderFeePercent } from "../src/features/onboarding/builder-fee.js";
import { chainById } from "../src/config/supported-chains.js";
import { setupNotificationHandler } from "./setup-notification.js";
import { isRecord } from "../src/features/onboarding/terms-policy.js";
import { registryPartnerStatus } from "./partner-registry-status.js";

/** Contact goes only to the team's Telegram message; it is never stored. */
function withoutContact<T extends { contact?: string }>(setup: T): Omit<T, "contact"> {
  const details: Partial<T> = { ...setup };
  delete details.contact;
  return details as Omit<T, "contact">;
}

export function perpsSubmitHandler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  return setupNotificationHandler(request, response, {
    unavailable: "Perps submission is not available yet. Your details are kept here; please try again later.",
    async beforeDelivery(body) {
      const setup = preparePerpsRequest(body);
      const status = await registryPartnerStatus(setup.partnerId);
      if (status.exists) return { status: 409, error: "An app with this name already exists. Choose another app name." };
    },
    prepare(body) {
      const setup = preparePerpsRequest(body);
      if (!isRecord(body) || typeof body.requestId !== "string" || typeof body.accessToken !== "string") throw new Error("Check your submission and try again.");
      const chain = chainById(setup.chainIds[0])!;
      return { submittedAt: new Date().toISOString(), text: [
        "New Perps setup request", `App name: ${setup.appName}`, `Partner ID: ${setup.partnerId}`,
        ...(setup.integrationMode ? [`Integration: ${setup.integrationMode === "ui" ? "Complete trading app" : "API integration"}`] : []),
        ...(setup.appUrl ? [`App URL: ${setup.appUrl}`] : []),
        `Network: ${chain.name} (${chain.id})`, `Owner wallet (unverified): ${setup.ownerWallet}`, `Revenue wallet: ${setup.revenueWallet}`,
        ...setup.ownerWallets.map(wallet => `Additional owner wallet (unverified): ${wallet}`),
        `Extra trading fee: ${formatBuilderFeePercent(setup.builderFeeTenthsBps)}%`,
        `Contact: ${setup.contact ?? "Not provided"}`,
      ].join("\n"), record: { id: body.requestId, accessToken: body.accessToken, product: "perps" as const,
        ownerWallet: setup.ownerWallet, ownerWallets: setup.ownerWallets, partnerId: setup.partnerId, details: withoutContact(setup) } };
    },
  });
}
