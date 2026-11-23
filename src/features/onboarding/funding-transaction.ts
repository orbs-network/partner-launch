import type { Config } from "wagmi";
import { getAccount, getWalletClient } from "wagmi/actions";
import { padHex, type Hash, type WriteContractParameters } from "viem";
import { FUNDING_CHAIN_ID } from "../../config/funding";
import {
  depositAbi,
  fundingFingerprint,
  verifyFundingRegistry,
  type FundingTarget,
} from "./funding";
import { fundingNotReady } from "./funding-errors";
import { parseMinimumFundingAmount } from "./funding-amount";
import type { FundingIntent, FundingPublicClient } from "./funding-execution";
import { prepareFundingToken } from "./funding-token";
import { getPendingDeposit, useOnboardingStore } from "./store";

interface FundingTransactionOptions {
  config: Config;
  client: FundingPublicClient | undefined;
  target: FundingTarget | undefined;
  intent: FundingIntent;
  isMounted: () => boolean;
  switchChain: (chainId: number) => Promise<unknown>;
  setPhase: (phase: string) => void;
}

export async function submitFundingTransaction({
  config,
  client,
  target,
  intent,
  isMounted,
  switchChain,
  setPhase,
}: FundingTransactionOptions): Promise<Hash> {
  if (!target || !client) throw new Error(fundingNotReady);
  const account = getAccount(config);
  if (!account.isConnected || !account.address)
    throw new Error("Connect your wallet before adding funds.");
  const payer = account.address;
  const units = parseMinimumFundingAmount(intent.amount, target.decimals);
  const assertCurrent = (requireChain = true) => {
    const wallet = getAccount(config);
    const draft = useOnboardingStore.getState();
    if (
      !isMounted() ||
      draft.revision !== intent.revision ||
      draft.partnerName !== intent.partnerId ||
      wallet.address?.toLowerCase() !== payer.toLowerCase() ||
      !wallet.isConnected ||
      (requireChain && wallet.chainId !== FUNDING_CHAIN_ID) ||
      getPendingDeposit(draft)
    ) {
      throw new Error(
        "Your wallet or setup changed. Check your details and try again.",
      );
    }
  };
  assertCurrent(false);
  if (account.chainId !== FUNDING_CHAIN_ID) {
    setPhase("Getting your wallet ready…");
    await switchChain(FUNDING_CHAIN_ID);
  }
  assertCurrent();
  // Read a fresh wallet client only after the network switch has completed.
  const wallet = await getWalletClient<Config, number>(config, {
    chainId: FUNDING_CHAIN_ID,
  });
  assertCurrent();
  const verifyTarget = async () => {
    assertCurrent();
    await verifyFundingRegistry(target);
    assertCurrent();
  };
  const write = async (request: WriteContractParameters) => {
    assertCurrent();
    return wallet.writeContract({
      ...request,
      account: payer,
      chain: wallet.chain,
    });
  };
  await prepareFundingToken({
    client,
    wallet,
    target,
    payer,
    units,
    assertCurrent,
    verifyTarget,
    write,
    setPhase,
  });
  setPhase("Confirm your payment in your wallet…");
  await verifyTarget();
  const request = await client.simulateContract({
    address: target.rollup,
    abi: depositAbi,
    functionName: "depositForAccount",
    args: [padHex(target.hedger, { size: 32 }), units],
    account: payer,
  });
  assertCurrent();
  const hash = await write({ ...request.request, chain: wallet.chain });
  // Persist before observing confirmation so refresh cannot repeat the payment.
  useOnboardingStore.getState().setDeposit(
    {
      hash,
      status: "pending",
      payer,
      chainId: FUNDING_CHAIN_ID,
      amount: intent.amount,
      partnerId: target.partnerId,
      targetFingerprint: fundingFingerprint(target),
      createdAt: new Date().toISOString(),
    },
    FUNDING_CHAIN_ID,
  );
  setPhase("Payment sent. Waiting for confirmation…");
  return hash;
}
