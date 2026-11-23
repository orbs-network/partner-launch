import { ArrowUpRight } from "lucide-react";
import { chainById } from "../../../config/chains";
import { validateRevenueWallet } from "../revenue-settings";

export function RevenueWalletLink({ address, chainIds }: { address: string; chainIds: readonly number[] }) {
  const chain = chainIds.map(chainById).find((item) => item?.blockExplorers?.default?.url);
  const explorer = chain?.blockExplorers?.default;
  if (!chain || !explorer || validateRevenueWallet(address)) return <>{address || "Not set"}</>;

  return (
    <a
      href={`${explorer.url.replace(/\/+$/, "")}/address/${address}`}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-sm text-(--link) underline underline-offset-3 hover:text-(--link-hover)"
      title={`View on ${explorer.name} (${chain.name})`}
      aria-label={`View revenue wallet ${address} on ${chain.name} explorer (opens in a new tab)`}
    >
      {address}<ArrowUpRight size={12} className="ml-1 inline-block align-text-bottom" aria-hidden="true" />
    </a>
  );
}
