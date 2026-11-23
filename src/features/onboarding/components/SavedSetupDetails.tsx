import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { SavedSetup } from "../saved-setups";
import { BuildApp } from "./completion/BuildApp";
import { IntegrationPrompt } from "./integration/IntegrationPrompt";

export function SavedSetupDetails({ setup }: { setup: SavedSetup }) {
  const { draft } = setup;
  const name = draft.launchPath === "api" ? draft.partnerName : draft.displayName || draft.partnerName;
  return (
    <section className="mt-4 border-t border-(--edge) pt-4" aria-label={`Actions for ${name}`}>
      <div className="grid items-start gap-2">
        {draft.launchPath !== "api" ? <div className="[&>div]:mt-0"><IntegrationPrompt draft={draft} launchPath={draft.launchPath} triggerLabel="Continue building" /></div> : <Dialog>
          <DialogTrigger asChild><Button type="button" className="w-full">Continue building <ArrowUpRight size={16} aria-hidden="true" /></Button></DialogTrigger>
          <DialogContent className="max-h-[calc(100dvh-32px)] overflow-y-auto overscroll-contain">
            <DialogTitle className="pr-6 wrap-anywhere">Continue with {name}</DialogTitle>
            <DialogDescription className="mt-2">Instructions use this submitted setup. Your current onboarding draft stays separate.</DialogDescription>
            <BuildApp launchPath={draft.launchPath} draft={draft} />
          </DialogContent>
        </Dialog>}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-(--muted)">Build your app now. Trading requires partner activation.</p>
    </section>
  );
}
