import { ExpandableSection } from "@/components/ExpandableSection";
import { SpotChainList } from "./SpotChainList";

export function SpotSupportedChains() {
  return <ExpandableSection title="Supported chains" headingId="spot-supported-chains">
    <div className="mt-3"><SpotChainList /></div>
  </ExpandableSection>;
}
