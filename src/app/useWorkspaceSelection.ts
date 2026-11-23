import { useEffect, useState } from "react";
import type { Address } from "viem";
import { useSearchLocation } from "@/hooks/useSearchLocation";
import { useSavedWorkspaces } from "../features/onboarding/hooks/useSavedWorkspaces";
import type { SavedWorkspace } from "../features/onboarding/workspaces";

export function useWorkspaceSelection(address: Address, dirty: boolean) {
  const catalog = useSavedWorkspaces(address);
  const search = useSearchLocation();
  const requested = catalog.workspaces.find((workspace) => workspace.context.key === new URLSearchParams(search).get("workspace"));
  const [selected, setSelected] = useState<SavedWorkspace | undefined>(() => {
    const requested = new URLSearchParams(search).get("workspace");
    return catalog.workspaces.find((workspace) => workspace.context.key === requested) ?? catalog.workspaces[0];
  });
  const latest = requested ?? catalog.workspaces.find((workspace) => workspace.context.key === selected?.context.key) ?? catalog.workspaces[0];
  // Keep an edit buffer tied to the snapshot it opened with.
  if (!dirty && !catalog.error && selected?.setup.id !== latest?.setup.id) setSelected(latest);
  const key = selected?.context.key;
  useEffect(() => {
    if (catalog.error || (dirty && requested && requested.context.key !== key)) return;
    const params = new URLSearchParams(search);
    if (key) params.set("workspace", key);
    else params.delete("workspace");
    if (params.toString() === new URLSearchParams(search).toString()) return;
    window.history.replaceState(null, "", `?${params.toString()}${window.location.hash}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, [catalog.error, dirty, key, requested, search]);

  function select(nextKey: string) {
    const next = catalog.workspaces.find((workspace) => workspace.context.key === nextKey);
    if (!next || catalog.error) return false;
    setSelected(next);
    const params = new URLSearchParams(window.location.search);
    params.set("workspace", nextKey);
    window.history.replaceState(null, "", `?${params.toString()}${window.location.hash}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
    return true;
  }
  const stale = !!selected && !catalog.error && !catalog.workspaces.some((workspace) => workspace.setup.id === selected.setup.id);
  const options = selected && !catalog.workspaces.some((workspace) => workspace.context.key === selected.context.key)
    ? [selected, ...catalog.workspaces]
    : catalog.workspaces.map((workspace) => workspace.context.key === selected?.context.key ? selected : workspace);
  return { ...catalog, selected, requested, options, select, stale };
}
