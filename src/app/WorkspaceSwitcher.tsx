import { useRef } from "react";
import { chainById } from "@/config/chains";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SavedWorkspace } from "../features/onboarding/workspaces";

function workspaceLabel({ context }: SavedWorkspace) {
  return `${context.name}${context.name !== context.partnerId ? ` (${context.partnerId})` : ""} · ${context.chainIds.map((id) => chainById(id)?.name ?? String(id)).join(", ")}`;
}

export function WorkspaceSwitcher({ workspaces, selectedKey, disabled, onChange }: {
  workspaces: readonly SavedWorkspace[];
  selectedKey: string;
  disabled: boolean;
  onChange: (key: string, element: HTMLButtonElement) => void;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const changedRef = useRef(false);
  if (new Set(workspaces.map(({ context }) => context.partnerId)).size < 2) return null;
  const selected = workspaces.find(({ context }) => context.key === selectedKey);
  return (
    <Select name="workspace" value={selectedKey} disabled={disabled} onValueChange={(key) => {
      if (!triggerRef.current) return;
      changedRef.current = true;
      onChange(key, triggerRef.current);
    }}>
      <SelectTrigger ref={triggerRef} aria-label="Partner" title={selected ? workspaceLabel(selected) : undefined} className="ml-auto w-80 min-w-0 max-w-[45%] max-[480px]:flex-1 max-[480px]:max-w-none max-[480px]:text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent onCloseAutoFocus={(event) => {
        if (changedRef.current) event.preventDefault();
        changedRef.current = false;
      }}>
        {workspaces.map((workspace) => (
          <SelectItem key={workspace.context.key} value={workspace.context.key}>{workspaceLabel(workspace)}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
