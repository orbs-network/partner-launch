import {
  FUNDING_STEP, onboardingSteps, onboardingStepOrder, PARTNER_STEP, WELCOME_STEP, type StepProgress,
} from "./onboarding-steps";
import type { OnboardingDraft } from "./state/types";
import { getStepError } from "./validation";

export function launchStepOrder() {
  return onboardingStepOrder;
}

export function nextLaunchStep(step: number) {
  const order = launchStepOrder();
  return order[order.indexOf(step) + 1] ?? FUNDING_STEP;
}

export function previousLaunchStep(step: number) {
  const order = launchStepOrder();
  return order[order.indexOf(step) - 1] ?? WELCOME_STEP;
}

export function launchProgress(draft: OnboardingDraft, busy: boolean): StepProgress[] {
  const order = launchStepOrder();
  const current = order.indexOf(draft.step);
  return order.map((target, position) => ({
    target,
    name: target === PARTNER_STEP && draft.launchPath === "api" ? "Partner ID" : onboardingSteps[target].name,
    active: target === draft.step,
    done: position < current && !getStepError(target, draft),
    disabled: busy || !(position <= current || order.slice(0, position).every((step) => !getStepError(step, draft))),
  })).filter((item) => draft.launchPath === null || item.target !== WELCOME_STEP);
}
