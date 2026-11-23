import { toast } from "sonner";
import { createSetupExport } from "./setup-export";
import type { OnboardingDraft } from "./state/types";

export function downloadSetup(draft: OnboardingDraft): void {
  let url: string | undefined;
  try {
    url = URL.createObjectURL(new Blob([JSON.stringify(createSetupExport(draft), null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${draft.partnerName}-setup.json`;
    link.click();
    toast.success("Setup downloaded", { description: "Keep this file for your account activation." });
  } catch {
    toast.error("We couldn’t download your setup", { description: "Your saved setup is still here. Please try again." });
  } finally {
    if (url) {
      const objectUrl = url;
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    }
  }
}
