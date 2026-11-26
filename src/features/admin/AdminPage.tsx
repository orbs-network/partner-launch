import { useState } from "react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { ArrowLeft, ClipboardList, RefreshCw, Search } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { ContentSkeleton } from "@/components/ContentSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminRequestCard } from "./AdminRequestCard";
import { useAdminRequests } from "./useAdminRequests";
import { navigateWithinApp } from "@/hooks/useSearchLocation";

export function AdminPage() {
  const { openConnectModal } = useConnectModal();
  const { connected, needsSignIn, signIn, signingIn, rows, loading, error, retry, busy, approvingId, approve, refreshing, refresh } = useAdminRequests();
  const [view, setView] = useState<"pending" | "approved">("pending");
  const [search, setSearch] = useState("");
  const pending = rows.filter(row => row.request.status === "pending");
  const approved = rows.filter(row => row.request.status === "approved");
  const query = search.trim().toLowerCase();
  const visible = (view === "pending" ? pending : approved).filter(({ request, partnerId, ownerWallet, contact }) => !query || [
    request.appName, request.id, request.kind, request.partnerId, partnerId, ownerWallet, contact,
    ...(request.ownerWallets ?? []), ...(request.kind === "spot" ? [request.feesWallet, request.dexUrl] : [request.revenueWallet, request.appUrl]),
  ].some(value => value?.toLowerCase().includes(query)));
  return <AppLayout hideDisconnectedWallet homeDisabled={busy || signingIn}><main id="main" className="mx-auto w-[min(900px,calc(100%-40px))] flex-1 py-10 max-[720px]:w-[calc(100%-24px)] max-[720px]:py-6">
    <a href="/" onClick={navigateWithinApp} className="inline-flex min-h-11 items-center gap-2 text-sm text-(--link) hover:underline"><ArrowLeft size={16} aria-hidden="true" /> Back to setup</a>
    <h1 className="mt-4 text-3xl font-semibold tracking-tight">Review setup requests</h1>
    <p className="mt-2 text-sm text-(--muted)">Connect an authorized wallet and sign in to review requests. Signing does not move funds. Approval updates the portal record; trading configuration must be updated separately.</p>
    {error ? <div role="alert" className="mt-4 rounded-xl border border-(--warning-border) bg-(--warning-bg) p-3 text-sm text-(--warning-text)">{error} <Button type="button" variant="ghost" size="sm" onClick={retry} className="min-h-11">Try again</Button></div> : null}
    {!connected ? <Button type="button" className="mt-6" disabled={!openConnectModal} onClick={openConnectModal}>Connect admin wallet</Button>
      : needsSignIn ? <Button type="button" className="mt-6" disabled={signingIn} onClick={() => void signIn()}>{signingIn ? "Check your wallet…" : "Sign in as admin"}</Button>
      : loading ? <div className="mt-6"><ContentSkeleton label="Loading setup requests" /></div> : !error || rows.length ? <>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2" aria-label="Request status">
          <Button variant={view === "pending" ? "secondary" : "ghost"} aria-pressed={view === "pending"} onClick={() => setView("pending")}>Pending ({pending.length})</Button>
          <Button variant={view === "approved" ? "secondary" : "ghost"} aria-pressed={view === "approved"} onClick={() => setView("approved")}>Approved ({approved.length})</Button>
        </div>
        <Button type="button" variant="ghost" size="sm" className="min-h-11 rounded-xl px-3 text-sm" onClick={refresh} disabled={refreshing || busy} aria-busy={refreshing}>
          <RefreshCw size={16} className={refreshing ? "animate-spin motion-reduce:animate-none" : undefined} aria-hidden="true" />Refresh
        </Button>
        <span role="status" className="sr-only">{refreshing ? "Refreshing requests." : ""}</span>
      </div>
      <div className="relative mt-4">
        <label htmlFor="admin-request-search" className="sr-only">Search requests</label>
        <Search size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-(--muted)" aria-hidden="true" />
        <Input id="admin-request-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by name, ID, wallet or contact" className="min-h-11 pl-11" />
      </div>
      <section className="mt-5 grid gap-4" aria-label={`${view} requests`}>
        {visible.length ? visible.map(row => <AdminRequestCard key={row.request.id} request={row.request} previous={row.previous} approvedAt={row.approvedAt} ownerWallet={row.ownerWallet} contact={row.contact} partnerId={row.partnerId} busy={busy} approving={approvingId === row.request.id} onApprove={view === "pending" ? () => approve(row.request.id) : undefined} />)
          : <div className="rounded-2xl border border-(--edge) bg-(--surface) px-5 py-12 text-center"><ClipboardList size={28} className="mx-auto text-(--muted)" aria-hidden="true" /><p className="mt-3 text-sm text-(--muted)">{query ? "No matching requests. Try another search." : `No ${view} requests yet.`}</p></div>}
      </section>
    </> : null}
  </main></AppLayout>;
}
