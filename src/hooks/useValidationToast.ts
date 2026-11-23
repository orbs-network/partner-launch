import { useCallback, useEffect, useRef } from "react";
import { toast, type ExternalToast } from "sonner";

/** Each attempt owns a toast so a queued dismissal cannot hide the next error. */
export function useValidationToast() {
  const active = useRef<string | number | undefined>(undefined);
  const dismiss = useCallback(() => {
    if (active.current !== undefined) toast.dismiss(active.current);
    active.current = undefined;
  }, []);
  const error = useCallback((message: string, options?: Omit<ExternalToast, "id">) => {
    dismiss();
    active.current = toast.error(message, options);
  }, [dismiss]);
  useEffect(() => dismiss, [dismiss]);
  return { error, dismiss };
}
