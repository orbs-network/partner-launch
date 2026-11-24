import { useSyncExternalStore, type MouseEvent } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("popstate", callback);
  return () => window.removeEventListener("popstate", callback);
}

export function useSearchLocation() {
  return useSyncExternalStore(subscribe, () => window.location.search, () => "");
}

export function usePathLocation() {
  return useSyncExternalStore(subscribe, () => window.location.pathname, () => "/");
}

/** Preserve native new-tab links while navigating ordinary clicks within the app. */
export function navigateWithinApp(event: MouseEvent<HTMLAnchorElement>) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  window.history.pushState(null, "", event.currentTarget.href);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
