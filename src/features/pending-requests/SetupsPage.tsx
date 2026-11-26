import { BarChart3, Inbox, LayoutDashboard, Plus, Wallet } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ContentSkeleton } from "@/components/ContentSkeleton";
import { useSearchLocation } from "@/hooks/useSearchLocation";
import { cn } from "@/lib/utils";
import { SetupDetail } from "./SetupDetail";
import { SetupAnalytics } from "./SetupAnalytics";
import { useSetupStatus } from "./useSetupStatus";
import { useSetupCounts } from "./useSetupCounts";
import { useWalletRequests } from "./wallet-requests-context";
import { findWorkspace, workspacePartnerId } from "./workspace-location";

/**
 * My workspaces dashboard (`/setups?id=…&section=overview|analytics`).
 */
export function SetupsPage({ onCancellationBusyChange, onCreateSetup }: {
  onCancellationBusyChange?: (busy: boolean) => void;
  onCreateSetup: () => void;
}) {
  const { requests, error, statusOf } = useSetupCounts();
  const { loading: requestsLoading, address } = useWalletRequests();
  // A returning wallet is still reconnecting: show loading instead of empty lists or the connect prompt.
  const { status: walletStatus } = useAccount();
  const reconnecting = walletStatus === "connecting" || walletStatus === "reconnecting";
  const loading = requestsLoading || reconnecting;
  const { openConnectModal } = useConnectModal();
  const params = new URLSearchParams(useSearchLocation());
  const requestedId = params.get("id");
  const [cancelling, setCancelling] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const requested = findWorkspace(requests, requestedId, params.get("product"));
  const selected = requested ?? requests[0];
  const selectedReviewStatus = selected ? statusOf(selected) : "pending";
  const selectedStatus = useSetupStatus(selected, selectedReviewStatus);
  const section = params.get("section") === "analytics" ? "analytics" : "overview";
  const onCancelBusyChange = useCallback((busy: boolean) => { setCancelling(busy); onCancellationBusyChange?.(busy); }, [onCancellationBusyChange, setCancelling]);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    headingRef.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    if (!requested || requestedId !== requested.id) return;
    const next = new URLSearchParams(window.location.search);
    next.set("id", workspacePartnerId(requested));
    next.set("product", requested.kind);
    window.history.replaceState(window.history.state, "", `?${next.toString()}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, [requested, requestedId]);
  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(changes)) if (value) next.set(key, value); else next.delete(key);
    window.history.replaceState(window.history.state, "", `?${next.toString()}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
  function select(id: string | null) {
    const request = requests.find(item => item.id === id);
    const next = new URLSearchParams(window.location.search);
    if (request) { next.set("id", workspacePartnerId(request)); next.set("product", request.kind); }
    else { next.delete("id"); next.delete("product"); }
    window.history.replaceState(window.history.state, "", `?${next.toString()}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
  return (
    <main id="main" className="mx-auto mt-8 mb-10 w-[min(900px,calc(100%-40px))] flex-1 max-[767px]:mt-4 max-[720px]:w-[calc(100%-24px)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 ref={headingRef} tabIndex={-1} className="text-[28px] font-semibold tracking-[-0.8px] focus:outline-none max-[767px]:text-2xl">My workspaces</h1>
        {address && !loading && !error && selected ? <Button type="button" variant="secondary" size="sm" disabled={cancelling} onClick={onCreateSetup} className="min-h-11 rounded-xl px-4 text-sm"><Plus size={16} aria-hidden="true" />Create workspace</Button> : null}
      </div>
      {address && !loading && !error && requests.length ? <p className="mt-1 text-sm text-(--muted)">{requests.length} {requests.length === 1 ? "workspace" : "workspaces"}</p> : null}
      {reconnecting ? <div className="mt-6"><ContentSkeleton label="Connecting your wallet" /></div> : !address ? (
        <div className="mt-8 rounded-[24px] border border-(--edge) bg-(--surface) px-6 py-12 text-center">
          <Wallet size={28} className="mx-auto text-(--muted)" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-semibold text-(--text)">Connect the wallet you set up with</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-(--muted)">Your workspaces are linked to the wallet that submitted each setup.</p>
          <Button type="button" className="mt-5" disabled={!openConnectModal} onClick={openConnectModal}>Connect wallet</Button>
          <p className="mt-4 text-sm text-(--muted)">No setup yet? <button type="button" onClick={onCreateSetup} className="min-h-11 border-0 bg-transparent p-0 font-medium text-(--link) hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)">Start one</button></p>
        </div>
      ) : <>
        {error ? <p role="alert" className="mt-5 rounded-xl border border-(--warning-border) bg-(--warning-bg) p-3 text-sm text-(--warning-text)">{error}</p> : null}
        {!error ? <>
        {loading ? <div className="mt-5"><ContentSkeleton label="Loading your workspaces" /></div>
          : !selected ? (
            <div className="mt-8 rounded-[24px] border border-(--edge) bg-(--surface) px-6 py-14 text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-(--primary-soft) text-(--link)"><Inbox size={23} aria-hidden="true" /></span>
              <h2 className="mt-4 text-lg font-semibold text-(--text)">No workspaces yet</h2>
              <p className="mt-2 text-sm text-(--muted)">Create a setup to get started with Spot or Perps.</p>
              <Button type="button" size="sm" disabled={cancelling} onClick={onCreateSetup} className="mt-5 min-h-11 rounded-xl px-4 text-sm"><Plus size={16} aria-hidden="true" />Create workspace</Button>
            </div>
          ) : (
            <div className="mt-5">
              <div className="mb-5 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="inline-flex max-w-full gap-2 border-b border-(--edge)" role="group" aria-label={`${selected.appName} sections`}>
                  {([["overview", "Overview", LayoutDashboard], ["analytics", "Analytics", BarChart3]] as const).map(([id, label, Icon]) => (
                    <Button key={id} type="button" variant="ghost" size="sm" aria-pressed={section === id} disabled={cancelling} onClick={() => update({ section: id === "overview" ? null : id })}
                      className={cn("-mb-px min-h-11 gap-2 rounded-none border-0 border-b-2 px-3 text-sm hover:bg-transparent", section === id ? "border-b-(--link) text-(--link)" : "border-b-transparent text-(--muted)")}>
                      <Icon size={16} aria-hidden="true" />{label}
                    </Button>
                  ))}
                </div>
                {requests.length > 1 ? <div className="w-full max-w-sm">
                  <Select value={selected.id} onValueChange={select} disabled={cancelling}>
                    <SelectTrigger id="setup-select" aria-label="Select setup" className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent align="start">
                      {requests.map(request => <SelectItem key={request.id} value={request.id}>{request.appName} · {request.kind === "spot" ? "Spot" : "Perps"}{statusOf(request) === "pending" ? " · Pending" : ""}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div> : null}
              </div>
              <section aria-label={`${selected.appName} details`} className="min-w-0">
                {section === "analytics"
                  ? <SetupAnalytics key={selected.id} request={selected} address={address} />
                  : <SetupDetail key={selected.id} request={selected} status={selectedReviewStatus} live={selectedStatus} cancelling={cancelling} onCancelBusyChange={onCancelBusyChange} />}
              </section>
            </div>
          )}
        </> : null}
      </>}
    </main>
  );
}
