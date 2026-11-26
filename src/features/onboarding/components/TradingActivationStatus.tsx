import { useId } from "react";
import { CircleAlert, CircleCheck, LoaderCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSetupRequestStatus } from "../hooks/useSetupRequestStatus";
import type { SavedSetupRequestReceipt } from "../setup-request-receipt";
import { ActivationStatusCard } from "./ActivationStatusCard";

export function TradingActivationStatus({ receipt, chainIds, titleId, descriptionId, pendingDescription }: {
  receipt: SavedSetupRequestReceipt;
  chainIds: number[];
  titleId?: string;
  descriptionId?: string;
  pendingDescription?: string;
}) {
  const { status, refresh, isRefreshing } = useSetupRequestStatus(receipt, chainIds);
  const generatedDescriptionId = useId();
  const statusDescriptionId = descriptionId ?? generatedDescriptionId;
  const pending = status.data !== "active";
  const label = status.isError ? "Activation status unavailable" : status.data === "active" ? "Trading activation confirmed" : "Trading activation pending";
  const StatusIcon = status.isError ? CircleAlert : status.data === "active" ? CircleCheck : LoaderCircle;

  return (
    <ActivationStatusCard
      titleId={titleId}
      descriptionId={statusDescriptionId}
      announcement={isRefreshing ? "Refreshing trading activation status…" : label}
      title={<>
          <StatusIcon size={18} className={`shrink-0${pending && !status.isError ? " animate-spin motion-reduce:animate-none" : ""}`} aria-hidden="true" />
          <span id={pending ? undefined : statusDescriptionId}>{label}</span>
      </>}
      action={<Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 text-(--link) disabled:text-(--link) max-[720px]:size-11"
          aria-label="Refresh trading activation status"
          title="Refresh status"
          aria-busy={isRefreshing}
          disabled={isRefreshing}
          onClick={refresh}
        >
          <RefreshCw size={18} className={isRefreshing ? "animate-spin motion-reduce:animate-none" : undefined} aria-hidden="true" />
        </Button>}
    >
      {pending ? status.isError ? "The dPERPS team will review your setup before activating trading." : pendingDescription ?? "The dPERPS team will review your setup before activating trading." : null}
    </ActivationStatusCard>
  );
}
