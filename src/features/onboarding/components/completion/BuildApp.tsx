import { FRONTEND_REPO_URL } from "../../../../config/links";
import type { OnboardingDraft } from "../../store";
import { IntegrationPrompt } from "../integration/IntegrationPrompt";
import { ApiIntegrationGuide } from "./ApiIntegrationGuide";
import { ApiIntegrationOption } from "./ApiIntegrationOption";

export function BuildApp({ launchPath, draft }: Pick<OnboardingDraft, "launchPath"> & { draft?: OnboardingDraft }) {
  const path = draft ? draft.launchPath : launchPath;
  if (path === "api") return <><ApiIntegrationGuide /><IntegrationPrompt launchPath="api" draft={draft} /></>;
  return (
    <>
      <section className="mt-6" aria-labelledby="build-app-title">
        <h2 id="build-app-title" className="text-base font-medium">Build your perps app now</h2>
        <p className="mt-2 text-sm leading-[1.7] text-(--secondary-text)">Use AI to customize the <a href={FRONTEND_REPO_URL} target="_blank" rel="noreferrer" className="text-(--link) underline underline-offset-4">official dPERPS app</a> and publish your app to your own hosting account. Trading requires partner activation.</p>
        <IntegrationPrompt launchPath={path} draft={draft} />
      </section>
      <ApiIntegrationOption draft={draft} />
    </>
  );
}
