import { useMemo, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { readRequest, type PendingRequest } from "./request-record";
import { formatBuilderFeePercent } from "../onboarding/builder-fee";
import { useAccount } from "wagmi";
import { WalletRequestsContext } from "./wallet-requests-context";

export function WalletRequestsProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const account = useAccount();
  const address = account.isConnected ? account.address ?? null : null;
  const query = useQuery({
    queryKey: ["wallet-requests", address?.toLowerCase()], enabled: !!address, retry: false, refetchInterval: 30_000,
    queryFn: async () => {
      const response = await fetch("/api/wallet-requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ address }) });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body && typeof body === "object" && "error" in body && typeof body.error === "string" ? body.error : "Your setups are temporarily unavailable.");
      if (!body || typeof body !== "object" || !("requests" in body) || !Array.isArray(body.requests)) throw new Error("Your setups could not be read.");
      return body.requests.map((value: unknown) => {
        if (!value || typeof value !== "object") return null;
        const item = value as Record<string, unknown>;
        return readRequest({ ...item, notification: "telegram", ...(typeof item.builderFeeTenthsBps === "number" ? { extraFeePercent: formatBuilderFeePercent(item.builderFeeTenthsBps) } : {}) });
      }).filter((value: PendingRequest | null): value is PendingRequest => !!value);
    },
  });
  const value = useMemo(() => ({ requests: address ? query.data ?? [] : [], error: address ? query.error?.message ?? null : null, address,
    loading: !!address && query.isPending, refresh: () => { void client.invalidateQueries({ queryKey: ["wallet-requests"] }); } }), [address, query.data, query.error, query.isPending, client]);
  return <WalletRequestsContext.Provider value={value}>{children}</WalletRequestsContext.Provider>;
}
