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
    intro: "Choose the name people will see in your app, and how our team can reach you.",
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
    intro: "Choose where to receive earnings and set your additional fees.",
  },
  {
    id: "terms",
    name: "Review setup",
    title: "Review your setup",
    intro: "Check your details and accept the terms before continuing.",
  },
  {
    id: "funding",
    name: "Deposit requirement",
    title: "Deposit requirement",
    intro: "Review the deposit for your network, then submit your setup to the team.",
  },
  { id: "integration-choice", name: "Integration", title: "How would you like to add Perps?", intro: "Choose the approach that fits your app. We’ll prepare the right instructions for you." },
  { id: "app-url", name: "App URL", title: "Add your app URL", intro: "Add your app’s website address, or skip this step if your app isn’t ready yet." },
] as const;

export const WELCOME_STEP = 0;
export const NETWORKS_STEP = 1;
export const PARTNER_STEP = 2;
/** Reserved saved step ID; not a current setup navigation target. */
export const WEBSITES_STEP = 3;
export const REVENUE_STEP = 4;
export const TERMS_STEP = 5;
export const FUNDING_STEP = 6;
export const INTEGRATION_CHOICE_STEP = 7;
export const APP_URL_STEP = 8;
/** Navigation order is separate from the stable saved step IDs above. */
export const onboardingStepOrder: readonly number[] = [
  WELCOME_STEP, INTEGRATION_CHOICE_STEP, PARTNER_STEP, APP_URL_STEP, NETWORKS_STEP, REVENUE_STEP, TERMS_STEP, FUNDING_STEP,
];
export type OnboardingStepId = (typeof onboardingSteps)[number]["id"];

export interface StepProgress {
  target?: number;
  name: string;
  active: boolean;
  done: boolean;
  disabled: boolean;
}
