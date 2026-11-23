import { useState } from "react";
import { toast } from "sonner";
import { chainById } from "../../../config/chains";
import { createIntegrationPrompt } from "../integration-prompt";
import { useOnboardingStore } from "../store";
import { useMountedRef } from "./useMountedRef";
import type { OnboardingDraft } from "../state/types";

export function useIntegrationPrompt(draft?: OnboardingDraft, path?: OnboardingDraft["launchPath"]) {
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const mountedRef = useMountedRef();
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
  const copied = copiedPrompt === prompt;

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      if (!mountedRef.current) return false;
      setCopiedPrompt(prompt);
      toast.success(promptPath === "api" ? "Prompt copied" : "Instructions copied", { id: "integration-prompt-copy" });
      return true;
    } catch {
      if (!mountedRef.current) return false;
      setCopiedPrompt(null);
      toast.error("Copy didn’t work. Select the prompt and copy it manually.", {
        id: "integration-prompt-copy",
      });
      return false;
    }
  }

  function setChooseBranding(chosen: boolean) {
    setBrandingChoice({ scope, chosen });
  }

  return { prompt, copied, copyPrompt, chooseBranding, setChooseBranding };
}
