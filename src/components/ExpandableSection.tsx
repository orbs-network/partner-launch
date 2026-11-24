import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExpandableSection({ title, children, disabled = false, id, headingId, contentId }: {
  title: string;
  children: ReactNode;
  disabled?: boolean;
  id?: string;
  headingId?: string;
  contentId?: string;
}) {
  const generatedId = useId();
  const [open, setOpen] = useState(false);
  const heading = headingId ?? `${generatedId}-heading`;
  const content = contentId ?? `${generatedId}-content`;

  return (
    <section id={id} className="mt-5 border-t border-(--edge) pt-4" aria-labelledby={heading}>
      <h2 id={heading} className="min-w-0 text-sm font-medium">
        <Button type="button" variant="ghost" size="sm" className="h-11 min-h-0 gap-2 rounded-lg px-0 text-sm text-(--text)" aria-expanded={open} aria-controls={content} onClick={() => setOpen(value => !value)} disabled={disabled}>
          {title} <ChevronDown size={15} className={open ? "rotate-180" : undefined} aria-hidden="true" />
        </Button>
      </h2>
      <div id={content} hidden={!open}>{children}</div>
    </section>
  );
}
