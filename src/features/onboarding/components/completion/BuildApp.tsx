import type { OnboardingDraft } from "../../store";
import { IntegrationPrompt } from "../integration/IntegrationPrompt";
import { InlineLaunchInstructions } from "../integration/InlineLaunchInstructions";
import { API_GUIDE_URL } from "@/config/links";
import { PromptDocsLink } from "../integration/PromptDocsLink";
import { ApiIntegrationOption } from "./ApiIntegrationOption";

export function BuildApp({ launchPath, draft }: Pick<OnboardingDraft, "launchPath"> & { draft?: OnboardingDraft }) {
  const path = draft?.integrationMode === "api" ? "api" : draft?.integrationMode === "ui" ? "creator" : draft ? draft.launchPath : launchPath;
  if (path === "api") return <div className="mt-5"><IntegrationPrompt launchPath="api" draft={draft} /><div className="mt-1"><PromptDocsLink href={API_GUIDE_URL}>API integration docs</PromptDocsLink></div></div>;
  return (
    <>
      <InlineLaunchInstructions draft={draft} />
      {draft?.integrationMode === "ui" ? null : <ApiIntegrationOption draft={draft} />}
    </>
  );
}
