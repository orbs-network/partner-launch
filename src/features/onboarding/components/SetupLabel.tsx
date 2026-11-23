import { ArrowLeftRight, Rocket } from "lucide-react";

export function SetupLabel({ product }: { product: "perps" | "spot" }) {
  const Icon = product === "spot" ? ArrowLeftRight : Rocket;
  return (
    <p className="mb-3 flex items-center gap-2 text-xs font-medium text-(--link)">
      <Icon size={16} aria-hidden="true" />
      {product === "spot" ? "Set up Spot" : "Set up perps"}
    </p>
  );
}
