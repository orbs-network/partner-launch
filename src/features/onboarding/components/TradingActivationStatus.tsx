import { useId } from "react";
import { CircleAlert, CircleCheck, LoaderCircle, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useSetupRequestStatus } from "../hooks/useSetupRequestStatus";
import type { SavedSetupRequestReceipt } from "../setup-request-receipt";
import { ActivationStatusCard } from "./ActivationStatusCard";

export function TradingActivationStatus({ receipt, chainIds, titleId, descriptionId }: {
  receipt: SavedSetupRequestReceipt;
  chainIds: number[];
  titleId?: string;
  descriptionId?: string;
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
          {isRefreshing ? <Skeleton className="size-[18px] rounded-md" /> : <RefreshCw size={18} aria-hidden="true" />}
        </Button>}
    >
      {pending ? "The dPERPS team will review your setup before activating trading." : null}
    </ActivationStatusCard>
  );
}
