import { Skeleton } from "./ui/skeleton";

export function ContentSkeleton({ label = "Loading content" }: { label?: string }) {
  return (
    <div role="status" aria-label={label} aria-busy="true" className="rounded-[32px] border border-(--panel-border) bg-(--surface) p-8 max-[720px]:rounded-3xl max-[720px]:p-[21px]">
      <div aria-hidden="true" className="grid gap-6">
        <div className="flex justify-between gap-4"><Skeleton className="h-1.5 w-36" /><Skeleton className="h-6 w-14 rounded-full" /></div>
        <div className="grid gap-3"><Skeleton className="h-8 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /></div>
        {[0, 1].map((field) => <div key={field} className="grid gap-2.5"><Skeleton className="h-3.5 w-24" /><Skeleton className="h-12 w-full rounded-[14px]" /></div>)}
        <Skeleton className="mt-2 h-[51px] w-full rounded-[19px]" />
      </div>
    </div>
  );
}

export function PageSkeleton({ label }: { label?: string }) {
  return (
    <main id="main" className="mx-auto mt-[38px] mb-8 w-[min(640px,calc(100%-40px))] flex-1 max-[720px]:mt-[19px] max-[720px]:w-[calc(100%-24px)]">
      <ContentSkeleton label={label} />
    </main>
  );
}
