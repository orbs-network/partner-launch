import { useEffect, useRef } from "react";

const STATE_KEY = "portalStep";

interface StepEntry<T> { flow: string; step: T }

function readEntry<T>(state: unknown, flow: string): StepEntry<T> | null {
  const entry = (state as Record<string, unknown> | null)?.[STATE_KEY] as StepEntry<T> | undefined;
  return entry && entry.flow === flow ? entry : null;
}

function writeEntry<T>(flow: string, step: T, mode: "push" | "replace", urlForStep?: (step: T) => string) {
  const state = { ...(window.history.state ?? {}), [STATE_KEY]: { flow, step } };
  const url = urlForStep ? urlForStep(step) : window.location.href;
  if (mode === "push") window.history.pushState(state, "", url);
  else window.history.replaceState(state, "", url);
}

/**
 * Give each wizard step its own browser history entry, so the phone's Back gesture
 * returns to the previous step instead of leaving the site. `step` is null when the
 * flow has no navigable step (for example on a completion screen). `onPop` returns
 * false to refuse a step (busy, locked or not reachable); the current step is then
 * pushed back so history and screen stay in sync.
 */
export function useStepHistory<T extends string | number>(flow: string, step: T | null, onPop: (step: T) => boolean, urlForStep?: (step: T) => string) {
  const stepRef = useRef(step);
  const onPopRef = useRef(onPop);
  const popping = useRef(false);
  const urlForStepRef = useRef(urlForStep);
  const completionEntry = useRef<{ url: string; state: unknown } | null>(null);
  const restoringCompletion = useRef(false);
  useEffect(() => {
    onPopRef.current = onPop;
    urlForStepRef.current = urlForStep;
  });
  useEffect(() => {
    stepRef.current = step;
    // A setup stays mounted behind My setups; it must not rewrite that page's URL or history.
    if (window.location.pathname === "/setups") return;
    if (step === null) {
      if (urlForStepRef.current) completionEntry.current = { url: window.location.href, state: window.history.state };
      return;
    }
    completionEntry.current = null;
    const current = readEntry<T>(window.history.state, flow);
    if (popping.current) {
      // The screen followed a Back/Forward; record where it actually landed.
      popping.current = false;
      if (current?.step !== step || (urlForStepRef.current && urlForStepRef.current(step) !== window.location.href))
        writeEntry(flow, step, "replace", urlForStepRef.current);
      return;
    }
    if (current?.step === step) {
      if (urlForStepRef.current && urlForStepRef.current(step) !== window.location.href)
        writeEntry(flow, step, "replace", urlForStepRef.current);
      return;
    }
    // The first step of a flow takes over its entry; later steps add one each.
    writeEntry(flow, step, current ? "push" : "replace", urlForStepRef.current);
  }, [flow, step]);
  useEffect(() => {
    function onPopState(event: PopStateEvent) {
      if ((event.state as { portalHome?: boolean } | null)?.portalHome) return;
      if (window.location.pathname === "/setups") return;
      if (restoringCompletion.current) return;
      const entry = readEntry<T>(event.state, flow);
      const current = stepRef.current;
      if (current === null) {
        const locked = completionEntry.current;
        if (locked) {
          window.history.pushState(locked.state, "", locked.url);
          // Keep the outer setup router in sync if Back targeted the other product.
          restoringCompletion.current = true;
          window.dispatchEvent(new PopStateEvent("popstate", { state: locked.state }));
          restoringCompletion.current = false;
        }
        return;
      }
      if (!entry || entry.step === current) return;
      if (onPopRef.current(entry.step)) popping.current = true;
      else writeEntry(flow, current, "push", urlForStepRef.current);
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [flow]);
}
