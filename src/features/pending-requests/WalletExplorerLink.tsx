import { ArrowUpRight } from "lucide-react";
import { mainnet } from "viem/chains";
import { chainById } from "@/config/chains";

export function WalletExplorerLink({ address, label, chainIds = [] }: {
  address: string;
  label: string;
  chainIds?: number[];
}) {
  const chains = chainIds.flatMap(id => {
    const chain = chainById(id);
    return chain ? [chain] : [];
  });
  // Spot requests have no network scope; label the Ethereum fallback explicitly.
  const explorers = chains.length ? chains : [mainnet];
  return (
    <div className="min-w-0">
      {explorers.map((chain, index) => <a key={chain.id}
        href={`${chain.blockExplorers.default.url.replace(/\/$/, "")}/address/${address}`}
        target="_blank" rel="noopener noreferrer"
        aria-label={`View ${label.toLowerCase()} ${address} on ${chain.name} explorer (opens in a new tab)`}
        title={`${address} · ${chain.name} explorer`}
        className="flex min-h-11 w-fit max-w-full items-center gap-1.5 rounded-md text-sm font-medium text-(--link) underline-offset-4 hover:text-(--link-hover) hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)">
        <span className="min-w-0 select-text [overflow-wrap:anywhere]" translate="no">{index === 0 ? address : `${chain.name} explorer`}</span>
        <ArrowUpRight size={14} className="shrink-0 opacity-70" aria-hidden="true" />
      </a>)}
    </div>
  );
}
