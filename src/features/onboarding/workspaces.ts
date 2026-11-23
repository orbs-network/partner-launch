import type { WorkspaceContext } from "@/types/workspace";
import type { SavedSetup } from "./saved-setups";

export interface SavedWorkspace {
  context: WorkspaceContext;
  setup: SavedSetup;
}

/** Show the newest current-page snapshot for each partner/network. */
export function savedWorkspaces(setups: readonly SavedSetup[]): SavedWorkspace[] {
  const latest = new Map<string, SavedWorkspace>();
  const ordered = [...setups].sort((a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt) || a.id.localeCompare(b.id));
  for (const setup of ordered) {
    const { draft } = setup;
    const key = `${draft.partnerName}:${[...draft.chainIds].sort((a, b) => a - b).join(",")}`;
    if (latest.has(key)) continue;
    latest.set(key, {
      setup,
      context: {
        key,
        partnerId: draft.partnerName,
        name: draft.launchPath === "api" ? draft.partnerName : draft.displayName || draft.partnerName,
        chainIds: [...draft.chainIds],
        revision: setup.id,
      },
    });
  }
  return [...latest.values()];
}
