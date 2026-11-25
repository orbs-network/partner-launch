import { LoaderCircle } from "lucide-react";
import { ActivationStatusCard } from "../components/ActivationStatusCard";

export function SpotApprovalStatus() {
  return <ActivationStatusCard announcement="Approval pending" title={<>
    <LoaderCircle size={18} className="shrink-0 animate-spin motion-reduce:animate-none" aria-hidden="true" />
    <span>Approval pending</span>
  </>}>
    Partner approval can take up to 48 hours. You can start integrating Spot while you wait.
  </ActivationStatusCard>;
}
