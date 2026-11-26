import { MessageSquareText } from "lucide-react";
import { API_GUIDE_URL } from "@/config/links";
import { Button } from "@/components/ui/button";
import { PromptDocsLink } from "./PromptDocsLink";
import { IntegrationPrompt } from "./IntegrationPrompt";

export function InlineApiInstructions() {
  return <section className="rounded-[22px] border border-(--edge) bg-(--control-bg) p-5 max-[480px]:p-4" aria-labelledby="api-prompt-card-title">
    <div className="flex items-center gap-3">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-(--primary-soft) text-(--link)" aria-hidden="true"><MessageSquareText size={21} /></span>
      <div><p className="text-xs font-medium text-(--link)">Trading API</p><h2 id="api-prompt-card-title" className="mt-0.5 text-base font-semibold">Integrate dPERPS</h2></div>
    </div>
    <p className="mt-4 text-sm leading-[1.7] text-(--secondary-text)">Use this prompt to add perpetual trading to your DEX or server.</p>
    <p className="mt-2 text-[13px] leading-[1.7] text-(--muted)">Share it with your developer or a coding agent with access to your project.</p>
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <IntegrationPrompt launchPath="api" trigger={<Button type="button" size="sm" className="min-h-11 rounded-xl px-5 text-sm has-[>svg]:px-5 max-[480px]:flex-1"><MessageSquareText size={17} aria-hidden="true" />API integration prompt</Button>} />
      <PromptDocsLink href={API_GUIDE_URL}>API integration docs</PromptDocsLink>
    </div>
  </section>;
}
