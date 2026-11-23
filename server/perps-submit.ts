import type { IncomingMessage, ServerResponse } from "node:http";
import { preparePerpsRequest } from "../src/features/onboarding/perps-request.js";
import { formatBuilderFeePercent } from "../src/features/onboarding/builder-fee.js";
import { chainById } from "../src/config/supported-chains.js";
import { setupNotificationHandler } from "./setup-notification.js";

export function perpsSubmitHandler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  return setupNotificationHandler(request, response, {
    unavailable: "Perps submission is not available yet. Your details are kept here; please try again later.",
    prepare(body) {
      const setup = preparePerpsRequest(body);
      const chain = chainById(setup.chainIds[0])!;
      return { submittedAt: new Date().toISOString(), text: [
        "New Perps setup request", `App name: ${setup.appName}`, `Partner ID: ${setup.partnerId}`,
        `Network: ${chain.name} (${chain.id})`, `Revenue wallet: ${setup.revenueWallet}`,
        `Extra trading fee: ${formatBuilderFeePercent(setup.builderFeeTenthsBps)}%`,
      ].join("\n") };
    },
  });
}
