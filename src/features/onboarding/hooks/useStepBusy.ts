import { useEffect } from "react";

/** Report a step's async work to the wizard and release it on unmount. */
export function useStepBusy(
  busy: boolean,
  onBusyChange?: (busy: boolean) => void,
) {
  useEffect(() => {
    onBusyChange?.(busy);
    return () => onBusyChange?.(false);
  }, [busy, onBusyChange]);
}
