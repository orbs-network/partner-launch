import type { SavedSetup } from "../saved-setups";
import { CompletionSummary } from "./completion/CompletionSummary";
import { SavedSetupDetails } from "./SavedSetupDetails";
import { SavedSetupStatus } from "./SavedSetupStatus";

export function SavedSetups({ setup }: { setup?: SavedSetup }) {
  if (!setup) return (
    <section className="mb-5" aria-label="Submitted setups">
      <p className="rounded-2xl border border-(--edge) bg-(--surface) px-4 py-3 text-xs leading-[1.7] text-(--muted)">No workspaces available.</p>
    </section>
  );
  const name = setup.draft.launchPath === "api" ? setup.draft.partnerName : setup.draft.displayName || setup.draft.partnerName;
  return (
    <section className="mb-5" aria-label="Submitted setups">
      <article aria-label={`Submitted setup for ${name}`} className="min-w-0 rounded-2xl border border-(--edge) bg-(--surface) p-4 max-[720px]:p-3.5">
        <CompletionSummary
          {...setup.draft}
          className="mt-0 border-0 bg-transparent p-0 max-[720px]:p-0"
        />
        <SavedSetupDetails key={setup.id} setup={setup} />
        <SavedSetupStatus draft={setup.draft} />
        <p className="mt-2 text-[11px] leading-[1.7] text-(--muted)">Submitted <time dateTime={setup.savedAt}>{new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(setup.savedAt))}</time></p>
      </article>
    </section>
  );
}
