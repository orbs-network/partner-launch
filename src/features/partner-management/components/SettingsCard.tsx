import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function SettingsCard({
  title,
  description,
  icon: Icon,
  className = "",
  iconClassName,
  children,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  className?: string;
  iconClassName?: string;
  children: ReactNode;
}) {
  return (
    <Card className={cn("block min-w-0 rounded-[26px] border border-(--edge) bg-(--surface) p-[26px] shadow-[0_4px_20px_var(--card-shadow)] max-[720px]:rounded-[22px] max-[720px]:p-[21px] max-[370px]:p-[18px]", className)}>
      <div className="mb-6 flex items-start gap-3 max-[720px]:mb-[21px]">
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-[13px] bg-(--primary-soft) text-(--link)", iconClassName)}><Icon size={19} aria-hidden="true" /></span>
        <div>
          <h2 className="text-left text-lg leading-[1.5] font-medium tracking-[-0.4px]">{title}</h2>
          <p className="mt-[3px] text-[13px] leading-[1.6] text-(--muted)">{description}</p>
        </div>
      </div>
      <div className="min-w-0">{children}</div>
    </Card>
  );
}
