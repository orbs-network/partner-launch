import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, isThemeMode } from "@/app/theme-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const options = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const selected =
    options.find((option) => option.value === theme) ?? options[0];
  const Icon = selected.icon;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 shrink-0 max-[720px]:size-11 rounded-[17px] border-0 bg-(--surface) p-0 text-(--secondary-text) enabled:hover:bg-(--primary-soft) max-[720px]:rounded-[15px] max-[370px]:rounded-[13px]"
          aria-label={`Appearance: ${selected.label}`}
          title={`Appearance: ${selected.label}`}
        >
          <Icon size={18} aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="min-w-[190px] rounded-[17px] border border-(--edge) bg-(--surface) p-1.5 text-(--text) shadow-[0_12px_35px_var(--dialog-shadow)] duration-150 ease-[var(--ease-out)]">
        <DropdownMenuLabel className="px-2.5 py-2 text-[12px] font-medium text-(--muted)">
          Appearance
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => {
            if (isThemeMode(value)) setTheme(value);
          }}
        >
          {options.map(({ value, label, icon: OptionIcon }) => (
            <DropdownMenuRadioItem
              key={value}
              value={value}
              className="min-h-11 cursor-pointer gap-2.5 rounded-[11px] py-[9px] pr-3 pl-[31px] text-[13px] data-highlighted:bg-(--primary-soft) data-highlighted:text-(--link) data-[state=checked]:text-(--link)"
              aria-label={label}
            >
              <OptionIcon size={16} aria-hidden="true" />
              <span>
                {label}
                {value === "system" ? (
                  <small className="mt-[3px] block text-[12px] leading-[1.4] text-(--muted)">Use device setting</small>
                ) : null}
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
