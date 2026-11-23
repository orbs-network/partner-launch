import { supportedChains } from "../../config/chains";
import type { WorkspaceContext } from "@/types/workspace";

export interface PartnerProfile {
  partnerId: string;
  chainIds: number[];
}

export interface ProfileErrors {
  chainIds?: string;
}

const partnerId = "sample-partner";

export function createPlaceholderProfile(workspace?: WorkspaceContext): PartnerProfile {
  if (workspace) return {
    partnerId: workspace.partnerId,
    chainIds: [...workspace.chainIds],
  };
  return {
    partnerId,
    chainIds: [8453],
  };
}

export function normalizePartnerProfile(profile: PartnerProfile, workspace?: WorkspaceContext): PartnerProfile {
  return {
    partnerId: workspace?.partnerId ?? partnerId,
    chainIds: supportedChains
      .map((chain) => chain.id)
      .filter((id) => profile.chainIds.includes(id)),
  };
}

export function validatePartnerProfile(profile: PartnerProfile): ProfileErrors {
  const errors: ProfileErrors = {};
  if (
    profile.chainIds.length !== 1 ||
    profile.chainIds.some((id) => !supportedChains.some((chain) => chain.id === id))
  )
    errors.chainIds = "Choose one supported network.";
  return errors;
}

/** Restore a valid local profile without changing its expected read-only identity. */
export function parsePartnerProfile(value: unknown, workspace?: WorkspaceContext): PartnerProfile | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  const item = value as Record<string, unknown>;
  if (
    (workspace && item.partnerId !== workspace.partnerId) ||
    !Array.isArray(item.chainIds) ||
    item.chainIds.some((id) => typeof id !== "number")
  ) return null;
  const candidate: PartnerProfile = {
    partnerId: workspace?.partnerId ?? partnerId,
    chainIds: item.chainIds,
  };
  if (workspace && Object.keys(validatePartnerProfile(candidate)).length) return null;
  const profile = normalizePartnerProfile(candidate, workspace);
  return Object.keys(validatePartnerProfile(profile)).length ? null : profile;
}
