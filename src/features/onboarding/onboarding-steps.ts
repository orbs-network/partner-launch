export const onboardingSteps = [
  {
    id: "welcome",
    name: "Welcome",
    title: "Welcome to dPERPS",
    intro: "Your community. Your trading experience.",
  },
  {
    id: "networks",
    name: "Networks",
    title: "Choose your network",
    intro:
      "Choose one network for your app and trading deposit. Selecting it continues to the next step.",
  },
  {
    id: "partner",
    name: "App name",
    title: "App name",
    intro: "Choose the name people will see in your app.",
  },
  {
    id: "websites",
    name: "Reserved",
    title: "Reserved",
    intro: "",
  },
  {
    id: "revenue",
    name: "Earnings",
    title: "Plan your earnings",
    intro: "Choose where to receive earnings and set your extra trading fee.",
  },
  {
    id: "terms",
    name: "Review setup",
    title: "Review your setup",
    intro: "Check your details and accept the terms before continuing.",
  },
  {
    id: "funding",
    name: "Deposit funds",
    title: "Deposit funds",
    intro: "Confirm your trading deposit and submit your setup.",
  },
] as const;

export const WELCOME_STEP = 0;
export const NETWORKS_STEP = 1;
export const PARTNER_STEP = 2;
/** Reserved saved step ID; not a current setup navigation target. */
export const WEBSITES_STEP = 3;
export const REVENUE_STEP = 4;
export const TERMS_STEP = 5;
export const FUNDING_STEP = 6;
/** Navigation order is separate from the stable saved step IDs above. */
export const onboardingStepOrder: readonly number[] = [
  WELCOME_STEP, PARTNER_STEP, NETWORKS_STEP, REVENUE_STEP, TERMS_STEP, FUNDING_STEP,
];
export type OnboardingStepId = (typeof onboardingSteps)[number]["id"];

export interface StepProgress {
  target?: number;
  name: string;
  active: boolean;
  done: boolean;
  disabled: boolean;
}
