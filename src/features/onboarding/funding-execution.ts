import type { usePublicClient } from "wagmi";
import type { getWalletClient } from "wagmi/actions";
import type { Address, Hash, WriteContractParameters } from "viem";
import type { FundingTarget } from "./funding";

export interface FundingIntent {
  revision: number;
  amount: string;
  partnerId: string;
  modalSeen: boolean;
}

export type FundingPublicClient = NonNullable<
  ReturnType<typeof usePublicClient>
>;
export type FundingWalletClient = Awaited<ReturnType<typeof getWalletClient>>;

export interface FundingExecution {
  client: FundingPublicClient;
  wallet: FundingWalletClient;
  target: FundingTarget;
  payer: Address;
  units: bigint;
  assertCurrent: (requireChain?: boolean) => void;
  verifyTarget: () => Promise<void>;
  write: (request: WriteContractParameters) => Promise<Hash>;
  setPhase: (phase: string) => void;
}
