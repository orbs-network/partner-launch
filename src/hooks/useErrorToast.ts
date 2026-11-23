import { useEffect } from "react";
import { toast, type ExternalToast } from "sonner";

/**
 * Shows `message` as an error toast while `enabled`, replacing the previous one
 * with the same id, and dismisses it once the error clears.
 */
export function useErrorToast(
  id: string,
  message: string | undefined,
  enabled = true,
  options?: ExternalToast,
) {
  useEffect(() => {
    if (enabled && message) toast.error(message, { ...options, id });
    else toast.dismiss(id);
    // Options are presentational; re-show only when the message or visibility changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, message, enabled]);
  useEffect(() => () => void toast.dismiss(id), [id]);
}
