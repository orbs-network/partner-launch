import { ExpandableSection } from "@/components/ExpandableSection";
import { spotSupportedChains } from "@/config/spot-chains";

export function SpotSupportedChains() {
  return (
    <ExpandableSection title="Supported Spot chains" headingId="spot-supported-chains">
        <ul className="m-0 mt-3 grid list-none grid-cols-2 gap-x-3 gap-y-1 p-0 min-[560px]:grid-cols-3">
          {spotSupportedChains.map((chain) => (
            <li key={chain.id} className="flex min-w-0 items-center gap-2 py-2">
              <img src={chain.logo} width={24} height={24} alt="" loading="lazy" className="size-6 shrink-0 rounded-full bg-white object-contain" />
              <span className="min-w-0 text-xs leading-[1.6] text-(--secondary-text)">{chain.name}</span>
            </li>
          ))}
        </ul>
    </ExpandableSection>
  );
}
