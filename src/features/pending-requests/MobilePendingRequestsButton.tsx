import { ChevronRight, Inbox } from "lucide-react";
import type { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/useIsMobile";
import { usePendingRequests } from "./store";

export function MobilePendingRequestsButton({ open, onOpen, id, triggerRef }: {
  open: boolean;
  onOpen: () => void;
  id: string;
  triggerRef: RefObject<HTMLButtonElement | null>;
}) {
  const mobile = useIsMobile();
  const { requests, error } = usePendingRequests();
  if (!mobile || (!requests.length && !error)) return null;
  return (
    <div className="mx-auto mt-4 w-[min(640px,calc(100%-24px))] shrink-0 max-[370px]:w-[calc(100%-20px)]">
      <Button ref={triggerRef} type="button" variant="outline" size="sm" onClick={onOpen} aria-haspopup="dialog" aria-controls={id} aria-expanded={open}
        aria-label={error ? "Pending requests: check saved requests" : `Pending requests (${requests.length})`}
        className="flex min-h-12 w-full items-center gap-2.5 rounded-xl border-(--edge) bg-(--surface) px-3.5 py-2 text-left text-sm text-(--text) hover:bg-(--control-hover)">
        <Inbox size={17} className="text-(--link)" aria-hidden="true" />
        <span className="min-w-0 flex-1">Pending requests</span>
        {requests.length ? <span aria-hidden="true" className="flex min-h-6 min-w-6 items-center justify-center rounded-full bg-(--primary-soft) px-1.5 text-xs tabular-nums text-(--link)">{requests.length}</span> : null}
        <ChevronRight size={16} className="text-(--muted)" aria-hidden="true" />
      </Button>
    </div>
  );
}
