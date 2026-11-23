import {
  createPlaceholderProfile,
  normalizePartnerProfile,
  parsePartnerProfile,
  validatePartnerProfile,
  type PartnerProfile,
} from "./profile";
import type { WorkspaceContext } from "@/types/workspace";

function profileKey(address: `0x${string}`, workspace?: WorkspaceContext): string {
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) throw new Error("Invalid wallet address.");
  if (workspace) return `perpetual-hub-workspace-settings:${address.toLowerCase()}:${encodeURIComponent(workspace.key)}`;
  return `perpetual-hub-demo-partner:${address.toLowerCase()}`;
}

export function loadPartnerProfile(address: `0x${string}`, workspace?: WorkspaceContext): PartnerProfile {
  try {
    const raw = localStorage.getItem(profileKey(address, workspace));
    if (!raw) return createPlaceholderProfile(workspace);
    const saved: unknown = JSON.parse(raw);
    if (saved === null || typeof saved !== "object" || Array.isArray(saved))
      return createPlaceholderProfile(workspace);
    const item = saved as Record<string, unknown>;
    const profile = item.version === 1 ? parsePartnerProfile(item.profile, workspace) : null;
    if (!profile) return createPlaceholderProfile(workspace);
    return profile;
  } catch {
    return createPlaceholderProfile(workspace);
  }
}

/** Explicitly saved local settings never replace the selected signed snapshot. */
export function savePartnerProfile(
  address: `0x${string}`,
  profile: PartnerProfile,
  workspace?: WorkspaceContext,
): PartnerProfile {
  if ((workspace && profile.partnerId !== workspace.partnerId) || Object.keys(validatePartnerProfile(profile)).length)
    throw new Error("Review your settings before saving.");
  const normalized = normalizePartnerProfile(profile, workspace);
  const key = profileKey(address, workspace);
  const serialized = JSON.stringify({ version: 1, profile: normalized });
  localStorage.setItem(key, serialized);
  if (localStorage.getItem(key) !== serialized) throw new Error("Your settings could not be saved.");
  return normalized;
}
