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
      "Choose the network where your DEX will be deployed and where users will deposit funds.",
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
    title: "Set your platform fee",
    intro: "Choose where to receive your revenue and set the platform fee charged on your users’ trades.",
  },
  {
    id: "terms",
    name: "Review setup",
    title: "Review your setup",
    intro: "Check your details and accept the terms before continuing.",
  },
  {
    id: "funding",
    name: "Activation deposit",
    title: "One-time activation deposit",
    intro: "Review the deposit for your network, then submit your setup to the team.",
  },
  { id: "integration-choice", name: "Integration", title: "How would you like to add perpetuals?", intro: "Choose a ready-made trading interface or connect directly through our API." },
  { id: "app-url", name: "App URL", title: "Add your DEX URL", intro: "Enter your published DEX address, or skip this step and add it later in My workspaces." },
  { id: "build-ui", name: "Build your DEX", title: "Build your DEX", intro: "Use these instructions to customize and publish your ready-made trading interface." },
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
export const BUILD_UI_STEP = 9;
/** Navigation order is separate from the stable saved step IDs above. */
export const onboardingStepOrder: readonly number[] = [
  WELCOME_STEP, INTEGRATION_CHOICE_STEP, PARTNER_STEP, NETWORKS_STEP, REVENUE_STEP, BUILD_UI_STEP, APP_URL_STEP, TERMS_STEP, FUNDING_STEP,
];
export type OnboardingStepId = (typeof onboardingSteps)[number]["id"];

export interface StepProgress {
  target?: number;
  name: string;
  active: boolean;
  done: boolean;
  disabled: boolean;
}
