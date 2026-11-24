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

/**
 * My setups dashboard (`/setups?id=…&section=overview|analytics`).
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
  const requested = requests.find(request => request.id === requestedId);
  const selected = requested ?? requests[0];
  const selectedReviewStatus = selected ? statusOf(selected) : "pending";
  const selectedStatus = useSetupStatus(selected, selectedReviewStatus);
  const section = params.get("section") === "analytics" ? "analytics" : "overview";
  const onCancelBusyChange = useCallback((busy: boolean) => { setCancelling(busy); onCancellationBusyChange?.(busy); }, [onCancellationBusyChange, setCancelling]);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    headingRef.current?.focus({ preventScroll: true });
  }, []);
  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(changes)) if (value) next.set(key, value); else next.delete(key);
    window.history.replaceState(window.history.state, "", `?${next.toString()}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
  function select(id: string | null) {
    const next = new URLSearchParams(window.location.search);
    if (id) next.set("id", id); else next.delete("id");
    window.history.replaceState(window.history.state, "", `?${next.toString()}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
  return (
    <main id="main" className="mx-auto mt-8 mb-10 w-[min(1200px,calc(100%-40px))] flex-1 max-[767px]:mt-4 max-[720px]:w-[calc(100%-24px)]">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2">
        <h1 ref={headingRef} tabIndex={-1} className="text-[31px] leading-[1.25] font-semibold tracking-[-1px] focus:outline-none max-[720px]:text-[28px]">My setups</h1>
        {address && !loading && !error && selected ? <Button type="button" size="sm" disabled={cancelling} onClick={onCreateSetup} aria-label="Create new setup" className="min-h-11 rounded-xl px-4 text-sm max-[767px]:size-11 max-[767px]:p-0"><Plus size={18} aria-hidden="true" /><span className="max-[767px]:sr-only">Create new setup</span></Button> : null}
        <p className="col-span-2 text-[15px] text-(--muted) max-[720px]:text-sm">Track your setup requests and see their trading activity in one place.</p>
      </div>
      {reconnecting ? <div className="mt-6"><ContentSkeleton label="Connecting your wallet" /></div> : !address ? (
        <div className="mt-8 rounded-[24px] border border-(--edge) bg-(--surface) px-6 py-12 text-center">
          <Wallet size={28} className="mx-auto text-(--muted)" aria-hidden="true" />
          <p className="mt-3 text-sm text-(--muted)">Connect your wallet to see the setups you submitted with it.</p>
          <Button type="button" className="mt-5" disabled={!openConnectModal} onClick={openConnectModal}>Connect wallet</Button>
        </div>
      ) : <>
        {error ? <p role="alert" className="mt-5 rounded-xl border border-(--warning-border) bg-(--warning-bg) p-3 text-sm text-(--warning-text)">{error}</p> : null}
        {!error ? <>
        {loading ? <div className="mt-5"><ContentSkeleton label="Loading your setups" /></div>
          : !selected ? (
            <div className="mt-8 rounded-[24px] border border-(--edge) bg-(--surface) px-6 py-14 text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-(--primary-soft) text-(--link)"><Inbox size={23} aria-hidden="true" /></span>
              <h2 className="mt-4 text-lg font-semibold text-(--text)">No setups yet</h2>
              <p className="mt-2 text-sm text-(--muted)">Create a setup to get started with Spot or Perps.</p>
              <Button type="button" size="sm" disabled={cancelling} onClick={onCreateSetup} className="mt-5 min-h-11 rounded-xl px-4 text-sm"><Plus size={16} aria-hidden="true" />Create new setup</Button>
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
                <div className="w-full max-w-sm">
                  <Select value={selected.id} onValueChange={select} disabled={cancelling}>
                    <SelectTrigger id="setup-select" aria-label="Select setup" className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent align="start">
                      {requests.map(request => <SelectItem key={request.id} value={request.id}>{request.appName} · {request.kind === "spot" ? "Spot" : "Perps"}{statusOf(request) === "pending" ? " · Pending" : ""}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <section aria-label={`${selected.appName} details`} className="min-w-0">
                {section === "analytics"
                  ? <SetupAnalytics request={selected} />
                  : <SetupDetail key={selected.id} request={selected} status={selectedReviewStatus} live={selectedStatus} cancelling={cancelling} onCancelBusyChange={onCancelBusyChange}
                    onCancelled={() => { select(null); requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true })); }} />}
              </section>
            </div>
          )}
        </> : null}
      </>}
    </main>
  );
}
