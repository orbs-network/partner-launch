import { lazy, Suspense, useEffect, useRef, useState, type MouseEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart3, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LoginSession } from "../features/login";
import { navigateWithinApp, useSearchLocation } from "@/hooks/useSearchLocation";
import { analyticsQueryKey } from "../features/analytics/useAnalytics";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ContentSkeleton";
import { useWorkspaceSelection } from "./useWorkspaceSelection";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { WorkspaceSwitchDialog } from "./WorkspaceSwitchDialog";

const PartnerManagement = lazy(() => import("../features/partner-management/PartnerManagement").then((module) => ({ default: module.PartnerManagement })));
const SavedSetups = lazy(() => import("../features/onboarding/components/SavedSetups").then((module) => ({ default: module.SavedSetups })));
const AnalyticsPage = lazy(() => import("../features/analytics/AnalyticsPage").then((module) => ({ default: module.AnalyticsPage })));

export function AuthenticatedWorkspace({ session, onPartnerChange }: { session: LoginSession; onPartnerChange?: (partnerId: string | null) => void }) {
  const [settingsDirty, setDirty] = useState(false);
  const dirty = settingsDirty;
  const [pending, setPending] = useState<{ workspace: string } | { href: string; replace?: boolean } | null>(null);
  const [notice, setNotice] = useState("");
  const returnFocusRef = useRef<HTMLElement>(null);
  const selection = useWorkspaceSelection(session.address, dirty);
  const workspace = selection.selected?.context;
  const partnerId = selection.error ? null : workspace?.partnerId ?? null;
  // Report the actual selected workspace, without coupling saved-copy UI to the header.
  useEffect(() => { onPartnerChange?.(partnerId); }, [onPartnerChange, partnerId]);
  const search = useSearchLocation();
  const params = new URLSearchParams(search);
  const requestedPage = params.get("page") === "analytics" ? "analytics" : "workspace";
  const [page, setPage] = useState(requestedPage);
  const analytics = page === "analytics";
  const requestedWorkspaceChange = !!selection.requested && selection.requested.context.key !== workspace?.key;
  if (!pending && (page !== requestedPage || requestedWorkspaceChange)) {
    if (dirty) setPending({ href: window.location.href, replace: true });
    else if (page !== requestedPage) setPage(requestedPage);
  }
  function href(page: string) {
    const next = new URLSearchParams(params);
    next.delete("partner");
    next.delete("chain");
    if (workspace) next.set("workspace", workspace.key);
    else next.delete("workspace");
    next.set("page", page);
    return `?${next.toString()}`;
  }
  const client = useQueryClient();
  function perform(action: NonNullable<typeof pending>): boolean {
    const target = "href" in action ? new URL(action.href, window.location.href) : undefined;
    const key = "workspace" in action ? action.workspace : target?.searchParams.get("workspace");
    if (key && key !== workspace?.key && !selection.select(key)) {
      setNotice("That workspace is no longer available. Your edits are still here.");
      return false;
    }
    void client.cancelQueries({ queryKey: analyticsQueryKey });
    client.removeQueries({ queryKey: analyticsQueryKey });
    setDirty(false);
    setNotice("");
    if ("href" in action) {
      setPage(target?.searchParams.get("page") === "analytics" ? "analytics" : "workspace");
      if (action.replace) window.history.replaceState(null, "", action.href);
      else window.history.pushState(null, "", action.href);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
    return true;
  }
  function cancelPending() {
    if (pending && "href" in pending && pending.replace) {
      const next = new URLSearchParams(window.location.search);
      next.set("page", page);
      if (workspace) next.set("workspace", workspace.key);
      else next.delete("workspace");
      window.history.replaceState(null, "", `?${next.toString()}`);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
    setPending(null);
  }
  function chooseWorkspace(key: string, element: HTMLButtonElement) {
    if (key === workspace?.key) return;
    returnFocusRef.current = element;
    if (dirty) setPending({ workspace: key });
    else perform({ workspace: key });
  }
  function navigate(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = event.currentTarget.href;
    if (new URL(target).searchParams.get("page") === (analytics ? "analytics" : "workspace")) {
      event.preventDefault();
      return;
    }
    if (dirty) {
      event.preventDefault();
      returnFocusRef.current = event.currentTarget;
      setPending({ href: target });
    } else navigateWithinApp(event);
  }
  useEffect(() => {
    if (!dirty) return;
    function beforeUnload(event: BeforeUnloadEvent) { event.preventDefault(); }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);
  useEffect(() => {
    if (!dirty || pending) return;
    function rememberFocus() {
      if (document.activeElement instanceof HTMLElement) returnFocusRef.current = document.activeElement;
    }
    window.addEventListener("popstate", rememberFocus);
    return () => window.removeEventListener("popstate", rememberFocus);
  }, [dirty, pending]);
  useEffect(() => () => {
    void client.cancelQueries({ queryKey: analyticsQueryKey });
    client.removeQueries({ queryKey: analyticsQueryKey });
  }, [client, session.nonce]);
  return (
    <>
      <div className="mx-auto mt-5 grid w-[min(1200px,calc(100%_-_48px))] gap-4 max-[720px]:w-[calc(100%_-_24px)]">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <nav aria-label="Partner workspace" className="flex shrink-0 gap-2 max-[480px]:gap-1">
            {[{ href: href("workspace"), label: "Workspace", icon: LayoutDashboard, active: !analytics }, { href: href("analytics"), label: "Analytics", icon: BarChart3, active: analytics }].map(({ href, label, icon: Icon, active }) => (
              <a key={href} href={href} onClick={navigate} aria-current={active ? "page" : undefined} className={cn("inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors max-[480px]:px-2.5 max-[480px]:text-xs", active ? "bg-(--primary-soft) text-(--link)" : "text-(--muted) hover:bg-(--soft) hover:text-(--text)")}><Icon size={17} aria-hidden="true" className="max-[480px]:hidden" />{label}</a>
            ))}
          </nav>
          <WorkspaceSwitcher workspaces={selection.options} selectedKey={workspace?.key ?? ""} disabled={selection.error} onChange={chooseWorkspace} />
        </div>
        {selection.error ? <div role="alert" className="rounded-xl border border-(--edge) bg-(--surface) p-4 text-xs text-(--muted)"><p>We couldn’t load your workspaces.</p><Button variant="link" size="sm" onClick={selection.refresh}>Try again</Button></div> : null}
        {selection.stale && dirty ? <p role="status" className="text-xs text-(--muted)">Workspace details changed. Your current edits are kept until you save or discard them.</p> : null}
        {notice ? <p role="status" className="text-xs text-(--muted)">{notice}</p> : null}
      </div>
      <Suspense fallback={<PageSkeleton />}>
        {selection.error && !workspace ? <main id="main" className="flex-1"><h1 tabIndex={-1} className="sr-only">Workspace</h1></main> : analytics
          ? <AnalyticsPage key={`${workspace?.key ?? "preview"}:${workspace?.revision ?? ""}`} session={session} workspace={workspace} />
          : <PartnerManagement key={workspace?.key ?? "preview"} address={session.address} workspace={workspace} onDirtyChange={setDirty} savedSetups={<SavedSetups setup={selection.selected?.setup} />} />}
      </Suspense>
      <WorkspaceSwitchDialog open={pending !== null} returnFocusRef={returnFocusRef} onCancel={cancelPending} onDiscard={() => { const success = !!pending && perform(pending); if (success) setPending(null); else cancelPending(); return success; }} />
    </>
  );
}
