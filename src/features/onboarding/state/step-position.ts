import { onboardingSteps, REVENUE_STEP, TERMS_STEP, WEBSITES_STEP, WELCOME_STEP } from "../onboarding-steps";
import type { OnboardingStepId } from "../onboarding-steps";

export type { OnboardingStepId } from "../onboarding-steps";

const legacyStepIds = [
  "networks", "partner", "funding", "websites", "integration", "terms",
] as const;

/** Saved IDs survive reordering; drafts without one use the original order. */
export function restoreStep(value: Record<string, unknown>): number {
  const identified = value.stepId === "integration"
    ? TERMS_STEP
    : onboardingSteps.findIndex((step) => step.id === value.stepId);
  if (identified >= 0) return identified === WEBSITES_STEP ? REVENUE_STEP : identified;
  if (typeof value.step !== "number" || !Number.isFinite(value.step)) return WELCOME_STEP;
  const index = Math.max(0, Math.min(legacyStepIds.length - 1, Math.trunc(value.step)));
  const restored = legacyStepIds[index] === "integration"
    ? TERMS_STEP
    : onboardingSteps.findIndex((step) => step.id === legacyStepIds[index]);
  return restored === WEBSITES_STEP ? REVENUE_STEP : restored;
}

export function getStepId(step: number): OnboardingStepId {
  return (onboardingSteps[step] ?? onboardingSteps[0]).id;
}
