import { useState } from "react";
import { toast } from "sonner";
import { useMountedRef } from "./useMountedRef";

/** Copy a selectable prompt; a failure leaves the text available for manual copying. */
export function usePromptClipboard(prompt: string, successMessage: string, toastId: string) {
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const mounted = useMountedRef();
  async function copyPrompt(): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(prompt);
      if (!mounted.current) return false;
      setCopiedPrompt(prompt);
      toast.success(successMessage, { id: toastId });
      return true;
    } catch {
      if (!mounted.current) return false;
      setCopiedPrompt(null);
      toast.error("Copy didn’t work. Select the prompt and copy it manually.", { id: toastId });
      return false;
    }
  }
  return { copied: copiedPrompt === prompt, copyPrompt };
}
