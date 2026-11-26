import type { ReactNode, RefObject } from "react";
import { Inbox, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SetupActions({ onCreateNew, onOpenSetups, createNewButtonRef, busy = false, children }: {
  onCreateNew: () => void;
  onOpenSetups?: () => void;
  createNewButtonRef: RefObject<HTMLButtonElement | null>;
  busy?: boolean;
  children?: ReactNode;
}) {
  return (
    <footer className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-(--control-bg) p-2" aria-label="Setup actions">
      {onOpenSetups ? <Button type="button" variant="secondary" size="sm" className="min-h-11 rounded-xl px-3 text-[13px]" onClick={onOpenSetups} disabled={busy}><Inbox size={15} aria-hidden="true" />My workspaces</Button> : null}
      {children}
      <Button ref={createNewButtonRef} type="button" variant="ghost" size="sm" className="min-h-11 rounded-xl px-3 text-[13px]" onClick={onCreateNew} disabled={busy}><Plus size={15} aria-hidden="true" />Create workspace</Button>
    </footer>
  );
}
