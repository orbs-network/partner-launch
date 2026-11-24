import { useState } from "react";
import { chainById } from "../../../config/chains";
import { createIntegrationPrompt } from "../integration-prompt";
import { useOnboardingStore } from "../store";
import { usePromptClipboard } from "./usePromptClipboard";
import type { OnboardingDraft } from "../state/types";

export type PromptSetup = Pick<OnboardingDraft, "partnerName" | "chainIds" | "launchPath" | "displayName"> & Partial<Pick<OnboardingDraft, "setupRequestReceipt">>;

export function useIntegrationPrompt(draft?: PromptSetup, path?: OnboardingDraft["launchPath"]) {
  const partnerName = useOnboardingStore((state) => state.partnerName);
  const chainIds = useOnboardingStore((state) => state.chainIds);
  const launchPath = useOnboardingStore((state) => state.launchPath);
  const displayName = useOnboardingStore((state) => state.displayName);
  // Always subscribe in the same order; an explicit saved copy owns the handoff data.
  const details = draft ?? { partnerName, chainIds, launchPath, displayName };
  // The integration choice changes the instructions, never the submitted setup.
  const promptPath = path ?? details.launchPath;
  const scope = JSON.stringify([promptPath, details.partnerName, details.displayName, details.chainIds, draft?.setupRequestReceipt?.requestId]);
  const [brandingChoice, setBrandingChoice] = useState({ scope, chosen: false });
  if (brandingChoice.scope !== scope) setBrandingChoice({ scope, chosen: false });
  const chooseBranding = promptPath !== "api" && brandingChoice.scope === scope && brandingChoice.chosen;
  const prompt = createIntegrationPrompt({
    partnerName: details.partnerName,
    networks: details.chainIds.flatMap((id) => chainById(id)?.name ?? []),
    launchPath: promptPath,
    displayName: details.displayName,
    chooseBranding,
    portalOrigin: typeof window === "undefined" ? undefined : window.location.origin,
  });
  const { copied, copyPrompt } = usePromptClipboard(prompt, promptPath === "api" ? "Prompt copied" : "Instructions copied", "integration-prompt-copy");

  function setChooseBranding(chosen: boolean) {
    setBrandingChoice({ scope, chosen });
  }

  return { prompt, copied, copyPrompt, chooseBranding, setChooseBranding };
}
