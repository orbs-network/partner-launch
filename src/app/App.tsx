import { lazy, Suspense, useCallback, useId, useRef, useState, type ReactNode } from "react";
import { PageSkeleton } from "@/components/ContentSkeleton";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { SetupRouter } from "../features/onboarding/SetupRouter";
import { LoginButton, LoginFeedback, useDemoLogin } from "../features/login";
import { PendingRequests } from "../features/pending-requests/PendingRequests";
import { MobilePendingRequestsButton } from "../features/pending-requests/MobilePendingRequestsButton";

// The workspace is only reachable after wallet login; keep it out of the first download.
const AuthenticatedWorkspace = lazy(() => import("./AuthenticatedWorkspace").then((m) => ({ default: m.AuthenticatedWorkspace })));

export function App() {
  const [requestsOpen, setRequestsOpen] = useState(false);
  const openRequests = useCallback(() => setRequestsOpen(true), []);
  const requestsId = useId();
  const requestsTriggerRef = useRef<HTMLButtonElement>(null);
  const requestsTrigger = <MobilePendingRequestsButton open={requestsOpen} onOpen={openRequests} id={requestsId} triggerRef={requestsTriggerRef} />;
  return <><PortalContent onPendingRequests={openRequests} requestsTrigger={requestsTrigger} /><PendingRequests open={requestsOpen} onOpenChange={setRequestsOpen} onOpen={openRequests} id={requestsId} triggerRef={requestsTriggerRef} /></>;
}

function PortalContent({ onPendingRequests, requestsTrigger }: { onPendingRequests: () => void; requestsTrigger: ReactNode }) {
  const [view, setView] = useState<"setup" | "manage">("setup");
  const openManagement = useCallback(() => setView("manage"), []);
  const auth = useDemoLogin(openManagement);
  const [workspacePartner, setWorkspacePartner] = useState<{ sessionKey: string; partnerId: string | null } | null>(null);
  const sessionKey = auth.session ? `${auth.session.address.toLowerCase()}:${auth.session.nonce}` : null;
  const onPartnerChange = useCallback((partnerId: string | null) => {
    if (sessionKey) setWorkspacePartner({ sessionKey, partnerId });
  }, [sessionKey]);
  const partnerId = auth.isLoggedIn && workspacePartner?.sessionKey === sessionKey ? workspacePartner?.partnerId : null;
  const walletBusy = auth.busy || auth.walletConnecting;
  const logout = () => { auth.logout(); setWorkspacePartner(null); setView("setup"); };
  const header = (disabled = false) => (
    <LoginButton auth={auth} managing={view === "manage"} disabled={disabled} onLogout={logout} partnerId={partnerId} />
  );
  const notice = <>{requestsTrigger}<LoginFeedback auth={auth} /></>;
  if (auth.restoring) {
    return (
      <AppLayout headerActions={header(true)} notice={notice} hideDisconnectedWallet>
        <PageSkeleton label={auth.walletConnecting ? "Connecting your wallet" : "Restoring your session"} />
      </AppLayout>
    );
  }
  if (view === "setup") {
    return <SetupRouter renderHeaderActions={header} notice={notice} externalBusy={walletBusy} onManage={auth.login} onPendingRequests={onPendingRequests} />;
  }
  return (
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
          <Button type="button" onClick={auth.login} disabled={walletBusy}>
            Log in with wallet
          </Button>
        </main>
      )}
    </AppLayout>
  );
}
