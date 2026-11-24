import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { WelcomeStep } from "./steps/WelcomeStep";

export function HomePage({ onSpot, onPerps }: { onSpot: () => void; onPerps: () => void }) {
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    mainRef.current?.querySelector<HTMLElement>("h1")?.focus({ preventScroll: true });
  }, []);
  return <main ref={mainRef} id="main" className="mx-auto mt-[38px] mb-8 w-[min(640px,calc(100%-40px))] flex-1 min-[1500px]:mt-[50px] max-[767px]:mt-3 max-[767px]:mb-0 max-[767px]:flex max-[767px]:flex-col max-[720px]:w-[calc(100%-24px)] max-[370px]:w-[calc(100%-20px)]">
    <Card role="region" aria-label="Partner setup" className="block overflow-hidden rounded-[32px] border border-(--panel-border) bg-(--surface) p-0 shadow-[0_12px_46px_var(--card-shadow)] max-[767px]:min-h-fit max-[767px]:flex-1 max-[720px]:rounded-3xl">
      <div className="px-8 pt-[27px] pb-6 max-[720px]:px-[21px] max-[720px]:pt-[23px] max-[720px]:pb-[18px] max-[370px]:px-[17px]"><WelcomeStep onCreator={onPerps} onSpot={onSpot} /></div>
    </Card>
  </main>;
}
