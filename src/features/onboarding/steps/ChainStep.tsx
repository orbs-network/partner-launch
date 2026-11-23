import { FieldError } from "@/components/ui/field-error";
import { Label } from "@/components/ui/label";
import { supportedChains, chainLogo } from "../../../config/chains";
import { useOnboardingStore } from "../store";

export function ChainStep({ error = "", disabled, onSelect }: { error?: string; disabled: boolean; onSelect: (chainId: number) => void }) {
  const selected = useOnboardingStore((state) => state.chainIds);
  return (
    <>
      <fieldset aria-describedby={error ? "chain-error" : undefined} className="m-0 min-w-0 border-0 p-0">
        <legend className="sr-only">Choose your network</legend>
        <p className="mb-[13px] text-[13px] text-(--muted) max-[720px]:mb-3 max-[720px]:text-[12px]">Available networks</p>
        <div className="grid grid-cols-2 gap-2.5 max-[720px]:gap-[9px] max-[370px]:grid-cols-1">
          {supportedChains.map((chain) => {
            const checked = selected.length === 1 && selected[0] === chain.id;
            return (
              <Label
                htmlFor={`chain-${chain.id}`}
                className={`relative flex min-h-[72px] cursor-pointer items-center gap-[11px] rounded-[20px] border px-[15px] py-3.5 transition-[background,border-color] duration-150 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-(--focus-ring) max-[720px]:min-h-[63px] max-[720px]:gap-2 max-[720px]:rounded-[15px] max-[720px]:px-2.5 max-[720px]:py-3 max-[370px]:gap-3 max-[370px]:px-[9px] ${error ? "border-(--status-danger) bg-(--surface)" : checked ? "border-(--selected-border) bg-(--selected-bg)" : "border-(--panel-border) bg-(--surface) hover:border-(--panel-border) hover:bg-(--control-hover)"}`}
                key={chain.id}
              >
                <img className="size-[34px] shrink-0 rounded-full bg-(--soft) object-contain p-1 max-[720px]:size-[27px] max-[370px]:size-8" src={chainLogo(chain.id)} width={36} height={36} alt="" />
                <span className="min-w-0">
                  <strong className="block text-[14px] leading-[1.4] font-medium max-[720px]:text-[13px] max-[720px]:leading-[1.45] max-[370px]:text-[14px]">{chain.name}</strong>
                </span>
                <input type="radio"
                  id={`chain-${chain.id}`}
                  name="network"
                  value={String(chain.id)}
                  aria-label={chain.name}
                  aria-invalid={!!error}
                  aria-describedby={error ? "chain-error" : undefined}
                  className="sr-only"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => onSelect(chain.id)}
                  onClick={() => { if (checked) onSelect(chain.id); }}
                  onKeyDown={(event) => {
                    if (event.key === " " || event.key === "Enter") {
                      event.preventDefault();
                      onSelect(chain.id);
                    }
                  }}
                />
              </Label>
            );
          })}
        </div>
        <FieldError id="chain-error" message={error} />
      </fieldset>
    </>
  );
}
