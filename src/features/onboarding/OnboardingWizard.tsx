import { Check } from "lucide-react";
import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ContentSkeleton } from "@/components/ContentSkeleton";
import { getStorageAvailable } from "./store";
import { useOnboardingWizard } from "./hooks/useOnboardingWizard";
import { OnboardingLayout } from "./components/OnboardingLayout";
import { WizardProgress } from "./components/WizardProgress";
import { WizardNavigation } from "./components/WizardNavigation";
import { WizardStep } from "./components/WizardStep";
import { WizardIntro } from "./components/WizardIntro";
import { StartOverButton } from "./components/StartOverButton";
import { BUILD_UI_STEP, FUNDING_STEP, TERMS_STEP, WELCOME_STEP } from "./onboarding-steps";

// The completion screen (share image, launch brief) is only needed at the end of setup.
const loadSetupComplete = () => import("./SetupComplete");
const SetupComplete = lazy(() => loadSetupComplete().then((m) => ({ default: m.SetupComplete })));

export function OnboardingWizard({ renderHeaderActions, notice, externalBusy = false, onSpot, onPendingRequests }: {
  renderHeaderActions?: (busy: boolean) => ReactNode;
  notice?: ReactNode;
  externalBusy?: boolean;
  onSpot: () => void;
  onPendingRequests?: () => void;
}) {
  const {
    showCompletion,
    navigate,
    step,
    progress,
    headingRef,
    activeStep,
    launchPath,
    choosePath,
    selectNetwork,
    back,
    next,
    busy,
    onBusyChange,
    onFundingConfirmed,
    editFromReview,
    canContinue,
    continueLabel,
    checkingPartner,
    stepError,
    actionError,
    partnerCheckUnavailable,
    resetButtonRef,
    openReset,
    resetOpen,
    closeReset,
    reset,
  } = useOnboardingWizard(externalBusy);
  // Fetch the completion screen while the user reviews, so Finish shows it without a gap.
  useEffect(() => {
    if (step === TERMS_STEP || step === FUNDING_STEP) void loadSetupComplete();
  }, [step]);
  const storageAvailable = getStorageAvailable();
  return (
    <OnboardingLayout
      headerActions={renderHeaderActions?.(busy)}
      homeDisabled={busy}
      onHome={showCompletion ? reset : undefined}
      notice={notice}
      // Signing the deposit confirmation connects the wallet, so setup never shows a second "Connect wallet".
      hideDisconnectedWallet={!showCompletion}
    >
      <main id="main" className="mx-auto mt-[38px] mb-8 w-[min(640px,calc(100%-40px))] flex-1 min-[1500px]:mt-[50px] max-[767px]:mt-3 max-[767px]:mb-0 max-[767px]:flex max-[767px]:flex-col max-[720px]:w-[calc(100%-24px)] max-[370px]:w-[calc(100%-20px)]">
        {!storageAvailable && !showCompletion ? (
          <p className="mb-5 shrink-0 rounded-[15px] border border-(--warning-border) bg-(--warning-bg) px-4 py-3.5 text-[13px] text-(--warning-text)" role="alert">
            We can’t save progress in this browser. Keep this tab open until
            you’re done.
          </p>
        ) : null}
        {showCompletion ? (
          <Suspense fallback={<ContentSkeleton label="Loading setup details" />}>
            <SetupComplete onSend={() => navigate(TERMS_STEP)} onCreateNew={openReset} onOpenSetups={onPendingRequests} createNewButtonRef={resetButtonRef} busy={busy} />
          </Suspense>
        ) : (
          <>
            <Card
              role="region"
              className="block overflow-hidden rounded-[32px] border border-(--panel-border) bg-(--surface) p-0 shadow-[0_12px_46px_var(--card-shadow)] max-[767px]:min-h-fit max-[767px]:flex-1 max-[720px]:rounded-3xl"
              aria-label="Partner setup"
            >
              {step !== WELCOME_STEP ? <WizardProgress
                steps={progress}
                step={Math.max(0, progress.findIndex((item) => item.active))}
                onNavigate={navigate}
              /> : null}
              <div key={step}>
                {step !== WELCOME_STEP ? <WizardIntro {...activeStep} title={launchPath === "api" && activeStep.id === "partner" ? "Partner ID" : activeStep.title} intro={launchPath === "api" && activeStep.id === "partner" ? "Enter the Partner ID your integration will use." : activeStep.intro} headingRef={headingRef} /> : null}
                <form
                  id="onboarding-step"
                  className={`px-8 max-[720px]:px-[21px] max-[370px]:px-[17px] ${step === BUILD_UI_STEP ? "pt-4 pb-3 max-[720px]:pt-3 max-[720px]:pb-2" : "pt-[27px] pb-6 max-[720px]:pt-[23px] max-[720px]:pb-[18px]"}`}
                  key={step}
                  noValidate
                  inert={externalBusy}
                  onSubmit={(event) => {
                    event.preventDefault();
                    next();
                  }}
                >
                  <WizardStep
                    step={step}
                    busy={busy}
                    stepError={stepError}
                    partnerCheckUnavailable={partnerCheckUnavailable}
                    onBack={back}
                    onNext={next}
                    onBusyChange={onBusyChange}
                    onEdit={editFromReview}
                    onSelectNetwork={selectNetwork}
                    onFundingConfirmed={onFundingConfirmed}
                    onCreator={() => choosePath("creator")}
                    onSpot={onSpot}
                  />
                  {actionError ? <p role="alert" className="mt-3 text-[13px] leading-relaxed text-(--danger)">{actionError}</p> : null}
                </form>
                {step !== WELCOME_STEP ? <WizardNavigation
                  step={step}
                  busy={busy}
                  canContinue={canContinue}
                  continueLabel={continueLabel}
                  checkingPartner={checkingPartner}
                  onBack={back}
                /> : null}
              </div>
            </Card>
            {step !== WELCOME_STEP ? <div className="mt-[18px] flex shrink-0 items-center justify-between gap-3.5 px-[9px] max-[720px]:mt-3.5 max-[720px]:gap-2.5 max-[720px]:px-[7px]" data-setup-footer="">
              <span className="flex items-center gap-1.5 text-[13px] leading-normal text-(--muted) max-[720px]:max-w-[230px] max-[720px]:leading-[1.5] max-[370px]:max-w-[180px]">
                <Check size={14} className="text-(--icon-accent)" aria-hidden="true" />
                {storageAvailable
                  ? <><span className="max-[720px]:hidden">Your progress is saved automatically</span><span className="min-[721px]:hidden">Progress saved</span></>
                  : "Progress kept in this tab"}
              </span>
              <StartOverButton
                ref={resetButtonRef}
                onClick={openReset}
                disabled={busy}
              />
            </div> : null}
          </>
        )}
      </main>
      <ConfirmDialog
        intent={showCompletion ? "create-new" : "reset"}
        returnFocusRef={resetButtonRef}
        open={resetOpen}
        onClose={closeReset}
        onConfirm={reset}
      />
    </OnboardingLayout>
  );
}
