export function createLoginMessage(details: {
  address: `0x${string}`;
  origin: string;
  signedAt: string;
  nonce: string;
}): string {
  return [
    "Perpetual Hub — partner login",
    "",
    `Wallet: ${details.address}`,
    `Website: ${details.origin}`,
    `Created at: ${details.signedAt}`,
    `Request: ${details.nonce}`,
    "",
    "Sign in to the partner workspace.",
    "This signature does not transfer funds or approve token spending.",
  ].join("\n");
}
