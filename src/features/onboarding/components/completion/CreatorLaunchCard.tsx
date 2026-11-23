import { ArrowUpRight, Download, ImageDown, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { validateLogoDataUrl } from "../../dex-identity";
import { usePreviewCard } from "../../hooks/usePreviewCard";
import { createPreviewShareUrl, previewBrandColor, previewDisplayName } from "./preview-share";

export function CreatorLaunchCard({ displayName, partnerId, brandColor, logoDataUrl }: {
  displayName: string;
  partnerId: string;
  brandColor: string;
  logoDataUrl?: string;
}) {
  const name = previewDisplayName(displayName || partnerId);
  const color = previewBrandColor(brandColor);
  const logo = logoDataUrl && !validateLogoDataUrl(logoDataUrl) ? logoDataUrl : undefined;
  const { preview, retry } = usePreviewCard({ name, brandColor: color, logoDataUrl: logo });

  function downloadCard() {
    if (preview.status !== "ready") return;
    let objectUrl: string | undefined;
    try {
      objectUrl = URL.createObjectURL(preview.blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `${partnerId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || "dperps"}-coming-soon.png`;
      anchor.click();
      toast.success("Announcement image downloaded", { description: "Add it to your announcement when you’re ready." });
    } catch {
      toast.error("We couldn’t save your announcement image. Please try again.");
    } finally {
      if (objectUrl) {
        const url = objectUrl;
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    }
  }

  return (
    <section aria-label="Coming-soon announcement">
      <div className="mb-3 flex items-center justify-between gap-3 text-[11px]">
        <p className="font-medium text-(--secondary-text)">Your announcement</p>
        <span className="text-(--muted)">PNG · 1200 × 630</span>
      </div>
      <div className={cn("relative aspect-[40/21] w-full max-w-full overflow-hidden rounded-2xl border border-(--edge) bg-(--surface)", preview.status === "error" && "min-h-44")}>
        {preview.status === "ready" ? (
          <img src={preview.url} alt={`Coming soon: ${name}, built with dPERPS`} width={1200} height={630} className="block size-full object-contain" />
        ) : preview.status === "error" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center">
            <ImageDown size={24} className="text-(--icon-muted)" aria-hidden="true" />
            <p role="alert" className="max-w-full text-xs leading-relaxed text-(--muted)">We couldn’t prepare your announcement image.</p>
            <Button type="button" variant="secondary" className="min-h-9 px-3 py-2 text-xs" onClick={retry}><RotateCcw size={13} aria-hidden="true" /> Try again</Button>
          </div>
        ) : (
          <div className="absolute inset-0" role="status" aria-label="Preparing your announcement image" aria-busy="true">
            <Skeleton className="size-full rounded-none" />
          </div>
        )}
      </div>
      <div className="mt-4 grid gap-2 min-[480px]:grid-cols-2">
        <Button type="button" variant="secondary" className="min-h-11 rounded-xl px-3 py-2.5 text-xs max-[720px]:min-h-11 max-[720px]:px-3 max-[720px]:py-2.5 max-[720px]:text-xs" disabled={preview.status !== "ready"} aria-busy={preview.status === "loading"} onClick={downloadCard}>
          <Download size={15} aria-hidden="true" /> Download image
        </Button>
        <Button asChild variant="ghost" className="min-h-11 rounded-xl border-(--edge) px-3 py-2.5 text-xs max-[720px]:min-h-11 max-[720px]:px-3 max-[720px]:py-2.5 max-[720px]:text-xs">
          <a href={createPreviewShareUrl(name)} target="_blank" rel="noreferrer"><span className="text-sm font-semibold" aria-hidden="true">X</span> Share to X <ArrowUpRight size={13} aria-hidden="true" /></a>
        </Button>
      </div>
      <p className="mt-3 text-[11px] leading-[1.7] text-(--muted)">X opens a draft. Add the downloaded image before posting.</p>
    </section>
  );
}
