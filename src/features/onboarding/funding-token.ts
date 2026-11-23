import { erc20Abi, type Hash } from "viem";
import { FUNDING_TOKEN_SYMBOL } from "../../config/funding";
import { fundingNotReady } from "./funding-errors";
import type { FundingExecution } from "./funding-execution";

/** Validate the assigned account and approve only the requested USDC amount. */
export async function prepareFundingToken({
  client,
  wallet,
  target,
  payer,
  units,
  assertCurrent,
  verifyTarget,
  write,
  setPhase,
}: FundingExecution): Promise<void> {
  const waitSuccess = async (hash: Hash) => {
    const result = await client.waitForTransactionReceipt({ hash });
    if (result.status !== "success")
      throw new Error(
        "Your wallet approval didn’t go through. Please try again.",
      );
    assertCurrent();
  };
  setPhase("Checking your account…");
  await verifyTarget();
  const [bytecode, decimals, balance, allowance] = await Promise.all([
    client.getBytecode({ address: target.rollup }),
    client.readContract({
      address: target.token,
      abi: erc20Abi,
      functionName: "decimals",
    }),
    client.readContract({
      address: target.token,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [payer],
    }),
    client.readContract({
      address: target.token,
      abi: erc20Abi,
      functionName: "allowance",
      args: [payer, target.rollup],
    }),
  ]);
  if (!bytecode || bytecode === "0x" || decimals !== target.decimals)
    throw new Error(fundingNotReady);
  if (balance < units)
    throw new Error(
      `You don’t have enough ${FUNDING_TOKEN_SYMBOL}. Choose a smaller amount or add tokens to your wallet.`,
    );
  assertCurrent();
  if (allowance >= units) return;
  if (allowance > 0n) {
    setPhase("Confirm the approval update in your wallet…");
    await waitSuccess(
      await write({
        address: target.token,
        abi: erc20Abi,
        functionName: "approve",
        args: [target.rollup, 0n],
        account: payer,
        chain: wallet.chain,
      }),
    );
  }
  setPhase("Approve this amount in your wallet…");
  await verifyTarget();
  await waitSuccess(
    await write({
      address: target.token,
      abi: erc20Abi,
      functionName: "approve",
      args: [target.rollup, units],
      account: payer,
      chain: wallet.chain,
    }),
  );
  const freshAllowance = await client.readContract({
    address: target.token,
    abi: erc20Abi,
    functionName: "allowance",
    args: [payer, target.rollup],
  });
  if (freshAllowance < units)
    throw new Error(
      "Your wallet approval wasn’t enough for this amount. Please try again.",
    );
}
