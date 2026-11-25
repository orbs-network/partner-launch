import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAccount, signMessage } from "wagmi/actions";
import { useAccount, useConfig } from "wagmi";
import { readRequest, type PendingRequest } from "../pending-requests/request-record";
import { formatBuilderFeePercent } from "../onboarding/builder-fee";
import { useEffect, useRef, useState } from "react";
import { adminSignInMessage, type AdminProof } from "./admin-proof";
import { toast } from "sonner";
import { useMountedRef } from "@/hooks/useMountedRef";

interface ReviewRow { request: PendingRequest; previous?: PendingRequest; approvedAt?: string; ownerWallet?: string; contact?: string; partnerId?: string }

/** The server has no admin session for this wallet; one signature starts an 8-hour session. */
export class AdminSignInRequired extends Error {}

async function adminCall(address: string, action: "list" | "approve", requestId?: string, proof?: AdminProof, version?: number) {
  const response = await fetch("/api/admin-requests", { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, action, requestId, ...(proof ? { proof } : {}), ...(version !== undefined ? { version } : {}) }) });
  const body: unknown = await response.json().catch(() => null);
  if (response.status === 401) throw new AdminSignInRequired("Sign in with an authorized admin wallet.");
  if (!response.ok) throw new Error(body && typeof body === "object" && "error" in body && typeof body.error === "string" ? body.error : "Requests are unavailable.");
  return body;
}
function parseRows(value: unknown): ReviewRow[] {
  if (!value || typeof value !== "object" || !("requests" in value) || !Array.isArray(value.requests)) throw new Error("Requests could not be read.");
  return value.requests.flatMap((row: Record<string, unknown>) => {
    if (!row.details || typeof row.details !== "object") return [];
    const details = row.details as Record<string, unknown>;
    const owners = [...new Set([...(typeof row.owner_wallet === "string" ? [row.owner_wallet.toLowerCase()] : []),
      ...(Array.isArray(details.ownerWallets) ? details.ownerWallets.filter((v): v is string => typeof v === "string").map(v => v.toLowerCase()) : [])])];
    const build = (fields: Record<string, unknown>, status: unknown) => readRequest({ ...fields, id: row.id, kind: row.product, status, ownerWallets: owners,
      savedAt: row.created_at, notification: "telegram", ...(typeof fields.builderFeeTenthsBps === "number" ? { extraFeePercent: formatBuilderFeePercent(fields.builderFeeTenthsBps) } : {}) });
    const request = build(details, row.status);
    return request ? [{ request, ...(typeof row.approved_at === "string" ? { approvedAt: row.approved_at } : {}),
      ...(typeof row.partner_id === "string" ? { partnerId: row.partner_id } : {}),
      ...(typeof row.owner_wallet === "string" ? { ownerWallet: row.owner_wallet } : {}),
      ...(typeof details.contact === "string" ? { contact: details.contact } : {}) }] : [];
  });
}
export function useAdminRequests() {
  const account = useAccount();
  const config = useConfig();
  const client = useQueryClient();
  const mounted = useMountedRef();
  const inFlight = useRef(false);
  const loadingToast = useRef<string | number | null>(null);
  useEffect(() => () => { if (loadingToast.current !== null) toast.dismiss(loadingToast.current); }, []);
  const address = account.isConnected ? account.address : undefined;
  const queryKey = ["admin-requests", address?.toLowerCase()] as const;
  const query = useQuery({ queryKey, enabled: !!address, retry: false,
    queryFn: async () => parseRows(await adminCall(address!, "list")) });
  const [signingIn, setSigningIn] = useState(false);
  const [signInError, setSignInError] = useState("");
  async function signIn() {
    if (!address || signingIn) return;
    setSigningIn(true); setSignInError("");
    try {
      const details = { address, origin: window.location.origin, issuedAt: new Date().toISOString(), nonce: crypto.randomUUID() };
      const signature = await signMessage(config, { account: address, message: adminSignInMessage(details) });
      const current = getAccount(config);
      if (!current.isConnected || current.address?.toLowerCase() !== address.toLowerCase()) throw new Error("Your wallet changed. Sign in again.");
      // The first signed call starts the session cookie; later calls use it.
      client.setQueryData(queryKey, parseRows(await adminCall(address, "list", undefined, { ...details, signature })));
      mutation.reset();
    } catch (cause) {
      if (mounted.current) setSignInError(cause instanceof Error && !/reject|denied|cancel/i.test(cause.message) ? cause.message.split("\n")[0] : "");
    } finally { if (mounted.current) setSigningIn(false); }
  }
  const mutation = useMutation({
    onMutate: () => {
      const id = toast.loading("Approving request…", { duration: Infinity, dismissible: false, closeButton: false });
      loadingToast.current = id;
      return { toastId: id };
    },
    mutationFn: async (id: string) => {
      const current = getAccount(config);
      if (!address || !current.isConnected || current.address?.toLowerCase() !== address.toLowerCase())
        throw new Error("Your wallet changed. Check the request and try again.");
      const row = query.data?.find(item => item.request.id === id);
      if (!row) throw new Error("This request changed. Refresh and try again.");
      await adminCall(address, "approve", id, undefined, row.request.workspaceVersion ?? 0);
    },
    onSuccess: async (_data, _id, attempt) => {
      if (mounted.current && attempt) toast.success("Request approved", { id: attempt.toastId, duration: 4000, dismissible: true, closeButton: true });
      loadingToast.current = null;
      await client.invalidateQueries({ queryKey });
      await client.invalidateQueries({ queryKey: ["wallet-requests"] });
    },
    onError: (cause, _id, attempt) => {
      if (mounted.current && attempt) toast.error(cause instanceof Error ? cause.message : "Couldn’t approve the request.",
        { id: attempt.toastId, duration: 6000, dismissible: true, closeButton: true });
      loadingToast.current = null;
    },
    onSettled: () => { inFlight.current = false; },
  });
  const needsSignIn = !!address && (query.error instanceof AdminSignInRequired || mutation.error instanceof AdminSignInRequired);
  return { connected: !!address, needsSignIn, signIn, signingIn, rows: address && !needsSignIn ? query.data ?? [] : [], loading: !!address && query.isPending,
    error: signInError || (needsSignIn ? "" : query.error?.message ?? mutation.error?.message ?? ""), retry: () => { mutation.reset(); void query.refetch(); },
    refreshing: query.isFetching, refresh: () => { if (!query.isFetching && !mutation.isPending) { mutation.reset(); void query.refetch({ cancelRefetch: false }); } },
    busy: mutation.isPending, approvingId: mutation.isPending ? mutation.variables : undefined,
    approve: (id: string) => { if (inFlight.current) return; inFlight.current = true; mutation.mutate(id); } };
}
