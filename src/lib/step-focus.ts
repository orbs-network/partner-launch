/**
 * Move focus to a new step. On desktop with a precise pointer, land in the step's
 * first field so typing continues straight away; elsewhere (touch keyboards, steps
 * without a field) focus the heading so the step change is announced without
 * popping up the on-screen keyboard.
 */
export function focusStepStart(field: HTMLElement | null, heading: HTMLElement | null) {
  const typingReady = typeof window.matchMedia === "function" && window.matchMedia("(min-width: 768px) and (pointer: fine)").matches;
  const usableField = field && !field.matches(":disabled") ? field : null;
  (typingReady && usableField ? usableField : heading)?.focus({ preventScroll: true });
}
