import { useCallback, useState } from "react";
import type { Address } from "viem";
import { loadSavedSetups } from "../saved-setups";
import { savedWorkspaces } from "../workspaces";

function readWorkspaces(address: Address) {
  try {
    return { owner: address.toLowerCase(), workspaces: savedWorkspaces(loadSavedSetups(address)), error: false };
  } catch {
    return { owner: address.toLowerCase(), workspaces: [], error: true };
  }
}

export function useSavedWorkspaces(address: Address) {
  const [catalog, setCatalog] = useState(() => readWorkspaces(address));
  if (catalog.owner !== address.toLowerCase()) setCatalog(readWorkspaces(address));
  const refresh = useCallback(() => setCatalog(readWorkspaces(address)), [address]);
  return { ...catalog, refresh };
}
