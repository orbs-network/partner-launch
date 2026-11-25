import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { PageSkeleton } from "@/components/ContentSkeleton";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { SetupRouter } from "../features/onboarding/SetupRouter";
import { LoginButton, LoginFeedback, useDemoLogin } from "../features/login";
import { SetupsPage } from "../features/pending-requests/SetupsPage";
import { usePathLocation, useSearchLocation } from "@/hooks/useSearchLocation";
import { HeaderPendingRequestsButton } from "../features/pending-requests/HeaderPendingRequestsButton";
import { WalletRequestsProvider } from "../features/pending-requests/WalletRequestsProvider";
import { RegistryReadyNotifications } from "../features/pending-requests/RegistryReadyNotifications";
import { WalletApprovalNotifications } from "../features/pending-requests/WalletApprovalNotifications";
import type { DemoLogin } from "../features/login/hooks/useDemoLogin";
import { useLoginConnection } from "../features/login/hooks/useLoginConnection";
import { toast } from "sonner";
import { getPendingDeposit, useOnboardingStore } from "../features/onboarding/store";
import { safeStorage } from "../features/onboarding/state/storage";
import { SPOT_DRAFT_KEY } from "../features/onboarding/spot/spot-setup";
import { PARTNER_STEP, WELCOME_STEP } from "../features/onboarding/onboarding-steps";
import { HomePage } from "../features/onboarding/HomePage";

// The workspace is only reachable after wallet login; keep it out of the first download.
const AuthenticatedWorkspace = lazy(() => import("./AuthenticatedWorkspace").then((m) => ({ default: m.AuthenticatedWorkspace })));
const AdminPage = lazy(() => import("../features/admin/AdminPage").then(m => ({ default: m.AdminPage })));

export function App() {
  const search = useSearchLocation();
  const pathname = usePathLocation();
  if (pathname === "/admin" || new URLSearchParams(search).get("admin") === "true") {
    return <Suspense fallback={<AppLayout hideDisconnectedWallet><main id="main" className="mx-auto w-[min(900px,calc(100%-40px))] flex-1"><PageSkeleton label="Loading admin page" /></main></AppLayout>}><AdminPage /><Toaster /></Suspense>;
  }
  return <PortalApp />;
}

function PortalApp() {
  const [view, setView] = useState<"setup" | "manage">("setup");
  const [requestCancellationBusy, setRequestCancellationBusy] = useState(false);
  const [setupInstance, setSetupInstance] = useState(0);
  const [showHome, setShowHome] = useState(() => !!window.history.state?.portalWelcome);
  const setupsView = usePathLocation() === "/setups";
  const openSetups = useCallback(() => {
    if (window.location.pathname === "/setups") return;
    window.history.pushState({ portalFromSetup: true }, "", "/setups");
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);
  // Return to the exact setup entry when the page was opened from it; otherwise resume an unfinished draft or Welcome.
  const backToSetup = useCallback(() => {
    if (window.history.state?.portalFromSetup) { window.history.back(); return; }
    const perps = useOnboardingStore.getState();
    const product = safeStorage.getItem(SPOT_DRAFT_KEY) ? "spot" : perps.step !== WELCOME_STEP && !perps.completed ? "perps" : null;
    if (!product) { window.dispatchEvent(new Event("portal-home", { cancelable: true })); return; }
    setShowHome(false);
    window.history.pushState({ portalHome: true }, "", `/?setup=${product}`);
    window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
  }, []);
  const auth = useDemoLogin(() => { if (window.location.pathname !== "/setups") setView("manage"); });
  const createSetup = () => {
    if (requestCancellationBusy || auth.busy || auth.walletConnecting) return;
    if (getPendingDeposit(useOnboardingStore.getState())) {
      toast.error("Wait for the pending deposit to finish before starting a new setup.");
      return;
    }
    safeStorage.removeItem(SPOT_DRAFT_KEY);
    useOnboardingStore.getState().reset();
    setShowHome(false);
    setSetupInstance(current => current + 1);
    setView("setup");
    window.history.pushState({ portalHome: true }, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
  };
  useEffect(() => {
    const goHome = (event: Event) => {
      event.preventDefault();
      if (requestCancellationBusy || auth.busy || auth.walletConnecting) return;
      setView("setup");
      setShowHome(true);
      window.history.pushState({ portalHome: true, portalWelcome: true }, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
    };
    window.addEventListener("portal-home", goHome);
    return () => window.removeEventListener("portal-home", goHome);
  }, [requestCancellationBusy, auth.busy, auth.walletConnecting, view]);
  useEffect(() => {
    const restore = (event: PopStateEvent) => {
      if (event.state?.portalWelcome) setShowHome(true);
      else if (window.location.pathname !== "/setups" && !event.state?.portalHome) setShowHome(false);
    };
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  const chooseProduct = (product: "spot" | "perps") => {
    if (requestCancellationBusy || auth.busy || auth.walletConnecting) return;
    if (product === "perps") {
      const draft = useOnboardingStore.getState();
      if (draft.step === WELCOME_STEP && !draft.completed) {
        if (!draft.launchPath) draft.setLaunchPath("creator");
        useOnboardingStore.getState().setStep(PARTNER_STEP);
      }
    }
    setShowHome(false);
    window.history.pushState({ portalHome: true }, "", `/?setup=${product}`);
    window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
  };
  const requestInFlightRef = useRef(false);
  const onRequestsConnected = useCallback(() => { requestInFlightRef.current = false; openSetups(); }, [openSetups]);
  const onRequestsConnectError = useCallback((message: string) => { toast.error(message); }, []);
  const { requestLogin: requestConnection } = useLoginConnection({ operationInFlightRef: requestInFlightRef, onLogin: onRequestsConnected, onError: onRequestsConnectError });
  const openRequests = () => { if (requestInFlightRef.current) return; requestInFlightRef.current = true; requestConnection(); };
  const headerTrigger = <HeaderPendingRequestsButton active={setupsView} onOpen={openRequests} disabled={requestCancellationBusy || auth.busy || auth.walletConnecting} />;
  return <WalletRequestsProvider><WalletApprovalNotifications /><RegistryReadyNotifications paused={requestCancellationBusy} /><PortalContent auth={auth} view={view} setView={setView} setupInstance={setupInstance} showHome={showHome && !setupsView} onChooseProduct={chooseProduct} onPendingRequests={openRequests} headerTrigger={headerTrigger} setupsPage={setupsView ? <SetupsPage onCancellationBusyChange={setRequestCancellationBusy} onCreateSetup={createSetup} onBack={backToSetup} /> : null} /><Toaster /></WalletRequestsProvider>;
}

function PortalContent({ auth, view, setView, setupInstance, showHome, onChooseProduct, onPendingRequests, headerTrigger, setupsPage }: {
  auth: DemoLogin;
  view: "setup" | "manage";
  setView: (view: "setup" | "manage") => void;
  setupInstance: number;
  showHome: boolean;
  onChooseProduct: (product: "spot" | "perps") => void;
  onPendingRequests: () => void;
  headerTrigger: ReactNode;
  setupsPage: ReactNode;
}) {
  // Sign-in is asked for only where it is needed, and always opens the workspace overview.
  const openWorkspace = () => {
    const next = new URLSearchParams(window.location.search);
    next.delete("page");
    window.history.replaceState(window.history.state, "", `?${next.toString()}`);
    // An open workspace follows the URL; the setup view ignores the page parameter.
    if (view === "manage") window.dispatchEvent(new PopStateEvent("popstate"));
    auth.login();
  };
  const accountAuth = { ...auth, login: openWorkspace };
  const [workspacePartner, setWorkspacePartner] = useState<{ sessionKey: string; partnerId: string | null } | null>(null);
  const sessionKey = auth.session ? `${auth.session.address.toLowerCase()}:${auth.session.nonce}` : null;
  const onPartnerChange = useCallback((partnerId: string | null) => {
    if (sessionKey) setWorkspacePartner({ sessionKey, partnerId });
  }, [sessionKey]);
  const partnerId = auth.isLoggedIn && workspacePartner?.sessionKey === sessionKey ? workspacePartner?.partnerId : null;
  const walletBusy = auth.busy || auth.walletConnecting;
  const logout = () => { auth.logout(); setWorkspacePartner(null); setView("setup"); };
  // Keep the sign-out control in the existing workspace and feedback during sign-in.
  const showAccount = auth.signing || auth.restoring || view === "manage";
  const header = (disabled = false) => (
    <>{headerTrigger}{showAccount ? <LoginButton auth={accountAuth} managing={view === "manage"} disabled={disabled} onLogout={logout} partnerId={partnerId} /> : null}</>
  );
  const notice = <LoginFeedback auth={auth} />;
  const content = auth.restoring ? (
      <AppLayout headerActions={header(true)} notice={notice} hideDisconnectedWallet>
        <PageSkeleton label={auth.walletConnecting ? "Connecting your wallet" : "Restoring your session"} />
      </AppLayout>
    ) : view === "setup" ? (
    <SetupRouter key={setupInstance} renderHeaderActions={header} notice={notice} externalBusy={walletBusy} onPendingRequests={onPendingRequests} />
  ) : (
    <AppLayout headerActions={header()} notice={notice}>
      {auth.isLoggedIn && auth.session ? (
        <Suspense fallback={<PageSkeleton />}>
          <AuthenticatedWorkspace key={auth.session.nonce} session={auth.session} onPartnerChange={onPartnerChange} />
        </Suspense>
      ) : (
        <main id="main" className="mx-auto my-16 grid w-[min(480px,calc(100%-32px))] gap-[22px] rounded-[25px] border border-(--edge) bg-(--surface) p-8">
          <span className="inline-flex items-center gap-1 rounded-[7px] bg-(--tint-bg) px-1.5 py-1 text-[10px] whitespace-nowrap text-(--link)">dPERPS workspace</span>
          <h1 className="text-[28px] tracking-[-0.8px]">Open your creator workspace</h1>
          <p className="leading-[1.7] text-(--muted)">Sign in with your wallet to open your partner workspace and manage your app.</p>
          <Button type="button" onClick={openWorkspace} disabled={walletBusy}>
            Log in with wallet
          </Button>
        </main>
      )}
    </AppLayout>
  );
  return <>
    <div hidden={(!!setupsPage || showHome) && !auth.restoring}>{content}</div>
    {setupsPage && !auth.restoring ? <AppLayout headerActions={header()} notice={notice}>{setupsPage}</AppLayout> : null}
    {showHome && !auth.restoring ? <AppLayout headerActions={header()} notice={notice}><HomePage onSpot={() => onChooseProduct("spot")} onPerps={() => onChooseProduct("perps")} /></AppLayout> : null}
  </>;
}
