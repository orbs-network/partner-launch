import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { PageSkeleton } from "@/components/ContentSkeleton";
import { OnboardingLayout } from "./components/OnboardingLayout";
import { OnboardingWizard } from "./OnboardingWizard";
import { useOnboardingStore } from "./store";
import { WELCOME_STEP } from "./onboarding-steps";

const SpotSetup = lazy(() => import("./spot/SpotSetup").then((module) => ({ default: module.SpotSetup })));

function spotSelected(): boolean {
  return new URL(window.location.href).searchParams.get("setup") === "spot";
}

export function SetupRouter(props: {
  renderHeaderActions?: (busy: boolean) => ReactNode;
  notice?: ReactNode;
  externalBusy?: boolean;
  onManage?: () => void;
  onPendingRequests?: () => void;
}) {
  const [spot, setSpot] = useState(spotSelected);
  useEffect(() => {
    const restore = () => setSpot(spotSelected());
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  // Choosing or leaving Spot adds a history entry so the phone's Back gesture can undo it.
  function selectSpot(value: boolean, mode: "push" | "replace" = "push") {
    const url = new URL(window.location.href);
    if (value) url.searchParams.set("setup", "spot");
    else url.searchParams.delete("setup");
    if (mode === "push") window.history.pushState(null, "", url);
    else window.history.replaceState(null, "", url);
    setSpot(value);
  }
  function returnToWelcome() {
    // Navigate to setup choices while retaining the independent Perps details.
    useOnboardingStore.getState().setStep(WELCOME_STEP);
    selectSpot(false, "replace");
  }
  if (spot) return (
    <Suspense fallback={<OnboardingLayout headerActions={props.renderHeaderActions?.(props.externalBusy ?? false)} notice={props.notice} hideDisconnectedWallet><PageSkeleton label="Loading Spot setup" /></OnboardingLayout>}>
      <SpotSetup {...props} onExit={() => selectSpot(false)} onStartOver={returnToWelcome} />
    </Suspense>
  );
  return <OnboardingWizard {...props} onSpot={() => selectSpot(true)} />;
}
