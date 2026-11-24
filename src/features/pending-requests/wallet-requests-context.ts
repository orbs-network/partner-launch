import { createContext, useContext } from "react";
import type { PendingRequest } from "./request-record";

export interface WalletRequests { requests: PendingRequest[]; error: string | null; address: `0x${string}` | null; loading: boolean; refresh: () => void }
export const WalletRequestsContext = createContext<WalletRequests>({ requests: [], error: null, address: null, loading: false, refresh: () => {} });
export function useWalletRequests() { return useContext(WalletRequestsContext); }
