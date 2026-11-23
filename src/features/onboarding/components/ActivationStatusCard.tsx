import { useId, type ReactNode } from "react";

export function ActivationStatusCard({ title, titleId, descriptionId, action, announcement, children }: {
  title: ReactNode;
  titleId?: string;
  descriptionId?: string;
  action?: ReactNode;
  announcement: string;
  children?: ReactNode;
}) {
  const generatedId = useId();
  const description = descriptionId ?? generatedId;
  return (
    <div className="rounded-2xl border border-(--edge) bg-(--primary-soft) py-2.5 pr-2.5 pl-4 text-(--link)">
      <div className="flex min-h-11 items-center justify-between gap-3">
        <h2 id={titleId} aria-describedby={children ? description : undefined} className="m-0 flex min-w-0 items-center gap-2.5 text-[15px] leading-normal font-medium max-[720px]:text-sm">
          {title}
        </h2>
        {action}
      </div>
      {children ? <p id={description} className="pb-1 pr-1.5 text-[13px] leading-[1.6] text-(--secondary-text) max-[720px]:text-xs">{children}</p> : null}
      <span role="status" className="sr-only">{announcement}</span>
    </div>
  );
}
