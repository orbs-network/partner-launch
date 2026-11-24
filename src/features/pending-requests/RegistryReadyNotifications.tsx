import { generateSpotAppId } from "../onboarding/spot/app-id";
import { trackStory } from "@/lib/telemetry/analytics";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useWalletRequests } from "./wallet-requests-context";
import { useRegistryStatus } from "./useRegistryStatus";
import { useSpotConfigStatus } from "./useSpotConfigStatus";
import type { PerpsRequest, SpotRequest } from "./request-record";

async function reportPerpsDeployment(request: PerpsRequest) {
  await trackStory("deployment-success", { product: "perps", evidence: "perps-enabled-lanes", appName: request.appName, partnerId: request.partnerId,
    ...(request.chainIds.length === 1 ? { chainId: request.chainIds[0] } : {}), revenueWallet: request.revenueWallet,
    ...(request.extraFeePercent ? { extraTradingFeePercent: request.extraFeePercent } : {}) });
}

async function reportSpotMatch(request: SpotRequest) {
  await trackStory("configuration-found", { product: "spot", evidence: "spot-config-key", appName: request.appName, partnerId: request.partnerId ?? generateSpotAppId(request.appName),
    feesWallet: request.feesWallet, hasDexUrl: !!request.dexUrl, ...(request.dexUrl ? { dexUrl: request.dexUrl } : {}) });
}

function RegistryReadyNotification({ request, paused }: { request: PerpsRequest; paused: boolean }) {
  const { ready, isError, isFetching, data } = useRegistryStatus(request);
  const notified = useRef(false);
  const toastId = `perps-ready:${request.id}`;
  useEffect(() => {
    if (paused || !data || isError || isFetching) return;
    if (!ready) {
      if (notified.current) toast.dismiss(toastId);
      notified.current = false;
      return;
    }
    if (request.status === "ready") return;
    if (notified.current) return;
    notified.current = true;
    void reportPerpsDeployment(request);
    toast.success(`${request.appName} is ready!`, {
      id: toastId,
      description: "Perps trading is enabled on your requested networks. You can now add it to your app.",
      duration: Infinity,
      closeButton: true,
      dismissible: true,
    });
  }, [ready, isError, isFetching, data, request, toastId, paused]);
  return null;
}

function SpotReadyNotification({ request, paused }: { request: SpotRequest; paused: boolean }) {
  const { ready, isError, isFetching, data } = useSpotConfigStatus(request);
  const notified = useRef(false);
  const toastId = `spot-ready:${request.id}`;
  useEffect(() => {
    if (paused || !data || isError || isFetching) return;
    if (!ready) {
      if (notified.current) toast.dismiss(toastId);
      notified.current = false;
      return;
    }
    if (notified.current) return;
    notified.current = true;
    void reportSpotMatch(request);
    toast.info("Spot configuration found", {
      id: toastId,
      description: "A matching Partner ID was found. If you provided contact details, the team can follow up there to confirm it belongs to your setup.",
      duration: Infinity, closeButton: true, dismissible: true,
    });
  }, [ready, isError, isFetching, data, request, toastId, paused]);
  return null;
}

export function RegistryReadyNotifications({ paused }: { paused: boolean }) {
  const { requests } = useWalletRequests();
  return requests.filter(request => request.kind === "perps" || request.status === "pending").map(request => request.kind === "perps"
    ? <RegistryReadyNotification key={request.id} request={request} paused={paused} />
    : <SpotReadyNotification key={request.id} request={request} paused={paused} />);
}
