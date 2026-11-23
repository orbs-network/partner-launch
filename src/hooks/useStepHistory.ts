import { useEffect, useRef } from "react";

const STATE_KEY = "portalStep";

interface StepEntry<T> { flow: string; step: T }

function readEntry<T>(state: unknown, flow: string): StepEntry<T> | null {
  const entry = (state as Record<string, unknown> | null)?.[STATE_KEY] as StepEntry<T> | undefined;
  return entry && entry.flow === flow ? entry : null;
}

function writeEntry<T>(flow: string, step: T, mode: "push" | "replace") {
  const state = { ...(window.history.state ?? {}), [STATE_KEY]: { flow, step } };
  if (mode === "push") window.history.pushState(state, "", window.location.href);
  else window.history.replaceState(state, "", window.location.href);
}

/**
 * Give each wizard step its own browser history entry, so the phone's Back gesture
 * returns to the previous step instead of leaving the site. `step` is null when the
 * flow has no navigable step (for example on a completion screen). `onPop` returns
 * false to refuse a step (busy, locked or not reachable); the current step is then
 * pushed back so history and screen stay in sync.
 */
export function useStepHistory<T extends string | number>(flow: string, step: T | null, onPop: (step: T) => boolean) {
  const stepRef = useRef(step);
  const onPopRef = useRef(onPop);
  const popping = useRef(false);
  useEffect(() => {
    onPopRef.current = onPop;
  });
  useEffect(() => {
    stepRef.current = step;
    if (step === null) return;
    const current = readEntry<T>(window.history.state, flow);
    if (popping.current) {
      // The screen followed a Back/Forward; record where it actually landed.
      popping.current = false;
      if (current?.step !== step) writeEntry(flow, step, "replace");
      return;
    }
    if (current?.step === step) return;
    // The first step of a flow takes over its entry; later steps add one each.
    writeEntry(flow, step, current ? "push" : "replace");
  }, [flow, step]);
  useEffect(() => {
    function onPopState(event: PopStateEvent) {
      const entry = readEntry<T>(event.state, flow);
      const current = stepRef.current;
      if (!entry || current === null || entry.step === current) return;
      if (onPopRef.current(entry.step)) popping.current = true;
      else writeEntry(flow, current, "push");
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [flow]);
}
