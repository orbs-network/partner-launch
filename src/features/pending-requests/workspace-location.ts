import { generateSpotAppId } from "../onboarding/spot/app-id";
import type { PendingRequest } from "./request-record";

export function workspacePartnerId(request: PendingRequest): string {
  return request.kind === "spot" ? request.partnerId ?? generateSpotAppId(request.appName) : request.partnerId;
}

export function workspaceHref(request: PendingRequest): string {
  return `/setups?${new URLSearchParams({ id: workspacePartnerId(request), product: request.kind })}`;
}

/** Legacy UUID links remain readable; product distinguishes matching Spot and Perps IDs. */
export function findWorkspace(requests: PendingRequest[], id: string | null, product: string | null): PendingRequest | undefined {
  if (!id) return undefined;
  return requests.find(request => request.id === id) ?? requests.find(request =>
    (!product || request.kind === product) && workspacePartnerId(request).toLowerCase() === id.toLowerCase());
}
