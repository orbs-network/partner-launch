import { WELCOME_STEP } from "./onboarding-steps";

/** The URL identifies the product, never the setup details or the current step. */
export function perpsStepUrl(step: number): string {
  const url = new URL(window.location.href);
  if (step === WELCOME_STEP) {
    if (url.searchParams.get("setup") === "perps") url.searchParams.delete("setup");
  } else url.searchParams.set("setup", "perps");
  return url.href;
}

export function clearPerpsRoute(): void {
  const url = new URL(window.location.href);
  if (url.searchParams.get("setup") !== "perps") return;
  url.searchParams.delete("setup");
  window.history.replaceState(window.history.state, "", url);
}
