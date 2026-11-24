import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import { useSpotConfigStatus } from "../../pending-requests/useSpotConfigStatus";
import { ActivationStatusCard } from "../components/ActivationStatusCard";
import type { SpotSetupSnapshot } from "./spot-setup";
import { SpotContactGuidance } from "./SpotContactGuidance";

export function SpotApprovalStatus({ setup }: { setup: SpotSetupSnapshot }) {
  const status = useSpotConfigStatus({ kind: "spot", id: "completion", status: "pending", appName: setup.appName,
    feesWallet: setup.feesWallet, savedAt: setup.policy.acceptedAt, notification: "telegram" });
  const ready = status.ready && !status.isError;
  const Icon = ready ? CircleCheck : status.isError ? CircleAlert : LoaderCircle;
  const title = ready ? "Spot configuration found" : status.isError ? "Spot status unavailable" : "Approval pending";
  return (
    <ActivationStatusCard announcement={title} title={<>
      <Icon size={18} className={`shrink-0${!ready && !status.isError ? " animate-spin motion-reduce:animate-none" : ""}`} aria-hidden="true" />
      <span>{title}</span>
    </>}>
      {ready ? <SpotContactGuidance /> : status.isError
        ? "We couldn’t check the Spot config. You can continue integrating while we retry."
        : "Partner approval can take up to 48 hours. You can start integrating Spot while you wait."}
    </ActivationStatusCard>
  );
}
