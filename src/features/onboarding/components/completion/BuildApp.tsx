import type { OnboardingDraft } from "../../store";
import { IntegrationPrompt } from "../integration/IntegrationPrompt";
import { InlineLaunchInstructions } from "../integration/InlineLaunchInstructions";
import { ApiIntegrationGuide } from "./ApiIntegrationGuide";
import { ApiIntegrationOption } from "./ApiIntegrationOption";

export function BuildApp({ launchPath, draft }: Pick<OnboardingDraft, "launchPath"> & { draft?: OnboardingDraft }) {
  const path = draft?.integrationMode === "api" ? "api" : draft?.integrationMode === "ui" ? "creator" : draft ? draft.launchPath : launchPath;
  if (path === "api") return <><ApiIntegrationGuide /><IntegrationPrompt launchPath="api" draft={draft} /></>;
  return (
    <>
      <InlineLaunchInstructions draft={draft} />
      {draft?.integrationMode === "ui" ? null : <ApiIntegrationOption draft={draft} />}
    </>
  );
}
