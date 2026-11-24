import { FieldError } from "@/components/ui/field-error";
import { Network } from "lucide-react";
import { Label } from "@/components/ui/label";
import { FieldHelp } from "@/components/FieldHelp";
import { chainLogo, selectablePerpsChains } from "@/config/chains";
import { cn } from "@/lib/utils";
import type { usePartnerSettings } from "../hooks/usePartnerSettings";
import { SettingsCard } from "./SettingsCard";

type Settings = ReturnType<typeof usePartnerSettings>;

export function NetworkSettings({ settings }: { settings: Settings }) {
  return (
    <SettingsCard title="Networks" description="Choose one network where your customers can trade." icon={Network} className="col-span-full max-[720px]:col-auto max-[720px]:row-auto">
      <div className="mb-[14px] flex items-center justify-between gap-2.5 text-[11px] text-(--muted)">
        <span className="flex items-center gap-1">Select one network<FieldHelp label="Trading networks">Choose the network for this workspace. Saving requests a change; it does not activate trading.</FieldHelp></span>
        <strong className="rounded-lg bg-(--primary-soft) px-2 py-[5px] text-[10px] font-medium text-(--link)">{settings.profile.chainIds.length} selected</strong>
      </div>
      <div className="grid grid-cols-4 gap-2.5 max-[1100px]:grid-cols-3 max-[720px]:grid-cols-2 max-[370px]:grid-cols-1" role="group" aria-label="Trading networks" aria-describedby={settings.errors.chainIds ? "managed-network-error" : undefined}>
        {selectablePerpsChains.map((chain) => {
          const selected = settings.profile.chainIds.length === 1 && settings.profile.chainIds[0] === chain.id;
          return (
            <Label key={chain.id} htmlFor={`managed-chain-${chain.id}`} className={cn(
              "relative flex min-h-[62px] min-w-0 cursor-pointer items-center gap-[9px] rounded-[14px] border px-[14px] py-[13px] hover:border-(--focus-ring) has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-(--focus-ring) max-[720px]:gap-[7px] max-[720px]:px-2.5 max-[720px]:py-3",
              settings.errors.chainIds ? "border-(--status-danger) bg-(--control-bg)" : selected ? "border-(--selected-border) bg-(--selected-bg)" : "border-(--edge) bg-(--control-bg)",
            )}>
              <img className="size-[31px] shrink-0 rounded-full bg-(--soft) p-[3px]" src={chainLogo(chain.id)} width={25} height={25} alt="" />
              <span className="min-w-0 flex-1 text-xs leading-[1.45] wrap-break-word">{chain.name}</span>
              <input type="radio" name="managed-network"
                className="sr-only"
                id={`managed-chain-${chain.id}`}
                checked={selected}
                onChange={() => settings.toggleChain(chain.id)}
                aria-invalid={!!settings.errors.chainIds}
                aria-describedby={settings.errors.chainIds ? "managed-network-error" : undefined}
              />
            </Label>
          );
        })}
      </div>
      <FieldError id="managed-network-error" message={settings.errors.chainIds} />
    </SettingsCard>
  );
}
