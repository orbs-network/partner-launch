import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePartnerSettings } from "./hooks/usePartnerSettings";
import { NetworkSettings } from "./components/NetworkSettings";
import type { WorkspaceContext } from "@/types/workspace";

export function PartnerManagement({ address, savedSetups, workspace, onDirtyChange }: {
  address: `0x${string}`;
  savedSetups?: ReactNode;
  workspace?: WorkspaceContext;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const settings = usePartnerSettings(address, workspace);
  useLayoutEffect(() => { onDirtyChange?.(settings.dirty); }, [onDirtyChange, settings.dirty]);
  useLayoutEffect(() => () => { onDirtyChange?.(false); }, [onDirtyChange]);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);
  return (
    <main id="main" className="mx-auto mt-9 mb-[46px] w-[min(1040px,calc(100%_-_48px))] flex-1 max-[720px]:mt-5 max-[720px]:w-[calc(100%_-_24px)]">
      <h1 ref={headingRef} tabIndex={-1} className="sr-only">Workspace</h1>
      {savedSetups}
      <form
        ref={formRef}
        className="grid grid-cols-1 gap-5 max-[720px]:gap-[15px]"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          settings.save();
          requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
        }}
      >
        <NetworkSettings settings={settings} />
        <div className={cn(
          "col-span-full flex items-center justify-between gap-5 rounded-[19px] border px-[22px] py-[18px] max-[720px]:flex-col max-[720px]:items-stretch max-[720px]:gap-[14px] max-[720px]:p-[18px]",
          settings.dirty ? "border-(--selected-border) bg-(--primary-soft)" : "border-(--edge) bg-(--surface)",
        )}>
          <div>
            <p className="flex items-center gap-[7px] text-xs leading-[1.6] text-(--muted)" role="status">
              {settings.dirty ? "You have unsaved changes." : "Your settings are up to date."}
            </p>
          </div>
          <Button type="submit" className="min-h-12 min-w-40 text-[13px] whitespace-nowrap max-[720px]:w-full max-[720px]:min-h-12 max-[720px]:text-[13px]" disabled={!settings.dirty}>
            <Save size={16} aria-hidden="true" /> Save changes
          </Button>
        </div>
      </form>
    </main>
  );
}
