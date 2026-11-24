import { ArrowLeftRight, Rocket } from "lucide-react";
import type { PendingRequest } from "./request-record";

/** Compact Spot/Perps tag so mixed request lists show the product at a glance. */
export function ProductBadge({ kind }: { kind: PendingRequest["kind"] }) {
  const Icon = kind === "spot" ? ArrowLeftRight : Rocket;
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-(--edge) bg-(--surface) px-2 py-0.5 text-[11px] leading-none font-medium text-(--secondary-text)">
      <Icon size={11} aria-hidden="true" />{kind === "spot" ? "Spot" : "Perps"}
    </span>
  );
}
