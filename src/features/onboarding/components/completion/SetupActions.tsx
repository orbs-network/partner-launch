import type { ReactNode, RefObject } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SetupActions({ onCreateNew, createNewButtonRef, busy = false, children }: {
  onCreateNew: () => void;
  createNewButtonRef: RefObject<HTMLButtonElement | null>;
  busy?: boolean;
  children?: ReactNode;
}) {
  return (
    <footer className="mt-5 flex flex-wrap items-center gap-2 border-t border-(--edge) pt-4" aria-label="Setup actions">
      {children}
      <Button ref={createNewButtonRef} type="button" variant="ghost" size="sm" className="h-11 min-w-0 flex-1 rounded-xl px-3 text-xs min-[560px]:ml-auto min-[560px]:flex-none" onClick={onCreateNew} disabled={busy} aria-label="Create new setup"><Plus size={15} aria-hidden="true" /> Create new</Button>
    </footer>
  );
}
