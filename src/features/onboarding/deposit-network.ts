/** Require the selected network before a new deposit confirmation or submission. */
export async function ensureDepositNetwork({ chainId, chainName, getChainId, switchNetwork, assertCurrent, onSwitch }: {
  chainId: number;
  chainName: string;
  getChainId: () => Promise<number>;
  switchNetwork: () => Promise<unknown>;
  assertCurrent: () => void;
  onSwitch: () => void;
}): Promise<void> {
  assertCurrent();
  let connectedChain = await getChainId();
  assertCurrent();
  if (connectedChain !== chainId) {
    onSwitch();
    try { await switchNetwork(); }
    catch (cause) {
      assertCurrent();
      if (cause instanceof Error && /reject|denied|cancelled|canceled/i.test(cause.message))
        throw new Error(`Network switch cancelled. Switch to ${chainName} in your wallet and try again.`, { cause });
      throw new Error(`Couldn’t switch networks. Switch to ${chainName} in your wallet and try again.`, { cause });
    }
    assertCurrent();
    connectedChain = await getChainId();
    assertCurrent();
  }
  if (connectedChain !== chainId) throw new Error(`Switch to ${chainName} in your wallet and try again.`);
}
