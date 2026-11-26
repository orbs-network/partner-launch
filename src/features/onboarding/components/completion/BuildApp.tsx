import type { OnboardingDraft } from "../../store";
import { ArrowRight, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IntegrationPrompt } from "../integration/IntegrationPrompt";
import { InlineLaunchInstructions } from "../integration/InlineLaunchInstructions";
import { API_GUIDE_URL } from "@/config/links";
import { PromptDocsLink } from "../integration/PromptDocsLink";
import { ApiIntegrationOption } from "./ApiIntegrationOption";

export function BuildApp({ launchPath, draft }: Pick<OnboardingDraft, "launchPath"> & { draft?: OnboardingDraft }) {
  const path = draft?.integrationMode === "api" ? "api" : draft?.integrationMode === "ui" ? "creator" : draft ? draft.launchPath : launchPath;
  if (path === "api") return <section className="mt-5" aria-labelledby="api-completion-title">
    <h2 id="api-completion-title" className="text-lg font-semibold">Integrate dPERPS into your application</h2>
    <p className="mt-2 text-sm leading-relaxed text-(--secondary-text)">Use your personalized setup instructions with an AI coding agent to integrate trading into your existing application.</p>
    <div className="mt-4"><IntegrationPrompt guided launchPath="api" draft={draft} trigger={<Button type="button" className="w-full"><Code2 size={17} aria-hidden="true" />Integrate the API<ArrowRight size={17} aria-hidden="true" /></Button>} /></div>
    <div className="mt-1 flex justify-center"><PromptDocsLink href={API_GUIDE_URL}>View API documentation</PromptDocsLink></div>
  </section>;
  return (
    <>
      <InlineLaunchInstructions draft={draft} />
      {draft?.integrationMode === "ui" ? null : <ApiIntegrationOption draft={draft} />}
    </>
  );
}
