import { useSyncExternalStore } from "react";
import { readRequest, readRequests } from "./request-record";
import type { PendingRequest, SpotRequest } from "./request-record";

export const PENDING_REQUESTS_KEY = "partner-portal-pending-requests-v1";
interface Snapshot { requests: PendingRequest[]; error: string | null }
const empty: Snapshot = { requests: [], error: null };
let snapshot = empty;
let lastRaw: string | null | undefined;
const listeners = new Set<() => void>();
const unavailable = "We couldn’t save your pending requests in this browser. Your setup is still open; allow browser storage and try again.";

function publish(next: Snapshot) {
  snapshot = next;
  for (const notify of listeners) notify();
}
function read(): Snapshot {
  try {
    const raw = localStorage.getItem(PENDING_REQUESTS_KEY);
    if (raw !== lastRaw) {
      snapshot = { requests: readRequests(raw), error: null };
      lastRaw = raw;
    }
  } catch {
    if (!snapshot.error) snapshot = { ...snapshot, error: "Your pending requests could not be loaded. Allow browser storage and try again." };
  }
  return snapshot;
}
function subscribe(notify: () => void) {
  listeners.add(notify);
  function changed(event: StorageEvent) {
    if (event.storageArea === localStorage && (event.key === PENDING_REQUESTS_KEY || event.key === null)) {
      lastRaw = undefined;
      publish(read());
    }
  }
  window.addEventListener("storage", changed);
  return () => { listeners.delete(notify); window.removeEventListener("storage", changed); };
}
export function usePendingRequests() {
  return useSyncExternalStore(subscribe, read, () => empty);
}

/** Save before completing a setup. Failure keeps the current form/proof available to retry. */
export function rememberPendingRequest(request: PendingRequest): void {
  const clean = readRequest(request);
  if (!clean) throw new Error("These request details could not be saved. Check your setup and try again.");
  try {
    // Re-read before every write so sequential saves from other tabs are retained.
    const requests = readRequests(localStorage.getItem(PENDING_REQUESTS_KEY));
    const existing = requests.findIndex(row => row.id === clean.id);
    if (existing < 0) requests.unshift(clean);
    else if (clean.notification === "telegram") requests[existing] = clean;
    const raw = JSON.stringify({ version: 1, requests });
    localStorage.setItem(PENDING_REQUESTS_KEY, raw);
    lastRaw = raw;
    publish({ requests, error: null });
  } catch (cause) {
    publish({ ...snapshot, error: unavailable });
    throw new Error(unavailable, { cause });
  }
}

/** Remove only the exact Spot snapshot whose cancellation was delivered. */
export function removeCancelledSpotRequest(request: SpotRequest): number {
  const clean = readRequest(request);
  if (!clean || clean.kind !== "spot") throw new Error("That Spot request could not be read.");
  let requests: PendingRequest[];
  try {
    requests = readRequests(localStorage.getItem(PENDING_REQUESTS_KEY));
  } catch {
    throw new Error("Cancellation was sent, but we couldn’t update your saved requests. Allow browser storage and retry.");
  }
  const current = requests.find(row => row.id === clean.id);
  if (current && JSON.stringify(current) !== JSON.stringify(clean))
    throw new Error("This request changed while cancellation was being sent. Review its latest details before trying again.");
  const remaining = requests.filter(row => row.id !== clean.id);
  if (!current) return remaining.length;
  try {
    const raw = JSON.stringify({ version: 1, requests: remaining });
    localStorage.setItem(PENDING_REQUESTS_KEY, raw);
    lastRaw = raw;
    publish({ requests: remaining, error: null });
  } catch {
    throw new Error("Cancellation was sent, but we couldn’t update your saved requests. Allow browser storage and retry.");
  }
  return remaining.length;
}

/** Update only an unchanged Perps snapshot after a successful registry check. */
export function setRequestRegistryState(request: PendingRequest, status: "pending" | "ready"): boolean {
  const clean = readRequest(request);
  if (!clean) throw new Error("This request could not be read. Reopen pending requests and try again.");
  let requests: PendingRequest[];
  try { requests = readRequests(localStorage.getItem(PENDING_REQUESTS_KEY)); }
  catch { throw new Error("We couldn’t update pending requests. Restore browser storage and try again."); }
  const current = requests.find(row => row.id === clean.id);
  if (!current) return false;
  if (JSON.stringify(current) !== JSON.stringify(clean))
    throw new Error("This request changed in another tab. Review its latest details.");
  if (current.kind !== "perps" || current.status === status) return false;
  const remaining = requests.map(row => row.id === clean.id ? { ...row, status } : row);
  try {
    const raw = JSON.stringify({ version: 1, requests: remaining });
    localStorage.setItem(PENDING_REQUESTS_KEY, raw);
    lastRaw = raw;
    publish({ requests: remaining, error: null });
  } catch {
    throw new Error("We couldn’t update pending requests. Restore browser storage and try again.");
  }
  return true;
}
