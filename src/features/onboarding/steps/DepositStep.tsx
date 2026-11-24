import { ArrowLeft, LoaderCircle } from "lucide-react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { DepositSummary } from "../components/DepositSummary";
import { useChainCollateral } from "../hooks/useChainCollateral";
import { useSetupSubmission } from "../hooks/useSetupSubmission";
import { useOnboardingStore } from "../store";

export function DepositStep({ disabled, onBack, onBusyChange, onComplete }: {
  disabled: boolean;
  onBack?: () => void;
  onBusyChange: (busy: boolean) => void;
  onComplete: () => void;
}) {
  const chainIds = useOnboardingStore((state) => state.chainIds);
  const chainId = chainIds.length === 1 ? chainIds[0] : null;
  const collateral = useChainCollateral(chainId);
  const usableCollateral = collateral.isError || collateral.isFetching ? undefined : collateral.data;
  const submission = useSetupSubmission({ onBusyChange, onComplete });
  const { isConnected, address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const needsWallet = !isConnected || !address;
  const controlsDisabled = disabled || submission.busy;
  const progress = { connecting: "Connecting…", sending: "Submitting…" };

  return (
    <>
      <DepositSummary chainId={chainId} collateral={usableCollateral} loading={collateral.isFetching} error={collateral.isError} onRetry={() => { void collateral.refetch(); }} />
      <div className="mt-5 flex items-center gap-3 max-[720px]:gap-2.5">
        {onBack ? (
          <Button
            variant="ghost"
            className="min-w-[85px] bg-transparent text-[13px] text-(--muted) hover:enabled:bg-(--control-hover) hover:enabled:text-(--link) disabled:text-(--disabled-text) max-[720px]:min-w-[77px] max-[720px]:text-[12px]"
            type="button"
            onClick={onBack}
            disabled={controlsDisabled}
          >
            <ArrowLeft size={18} aria-hidden="true" />
            Back
          </Button>
        ) : null}
        <Button
          type="button"
          className="min-w-0 flex-1 whitespace-normal max-[720px]:px-3 max-[720px]:text-[13px]"
          onClick={needsWallet ? openConnectModal : submission.save}
          disabled={controlsDisabled || (needsWallet && !openConnectModal)}
          aria-busy={submission.busy}
        >
          {submission.busy ? <><LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> {submission.phase ? progress[submission.phase] : "Preparing…"}</> : needsWallet ? "Connect wallet to submit" : "Submit setup"}
        </Button>
      </div>
    </>
  );
}
