import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SpotChainList } from "./SpotChainList";

export function SpotNetworksDialog({ label = "View all networks", compact = false }: { label?: string; compact?: boolean }) {
  return <Dialog>
    <DialogTrigger asChild><Button type="button" variant="link" size="sm" className={`flex min-h-11 items-start justify-start px-0 pt-1 ${compact ? "text-xs" : "text-sm"}`}>{label}</Button></DialogTrigger>
    <DialogContent className="max-h-[calc(100dvh-32px)] w-[580px] max-w-[calc(100vw-32px)] overflow-y-auto">
      <DialogTitle className="pr-10 text-xl font-semibold">Supported Spot networks</DialogTitle>
      <DialogDescription className="sr-only">Available networks for Spot trading.</DialogDescription>
      <div className="mt-4"><SpotChainList /></div>
    </DialogContent>
  </Dialog>;
}
