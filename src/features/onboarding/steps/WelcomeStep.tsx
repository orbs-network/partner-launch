import { ArrowLeftRight, ArrowRight, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WelcomeStep({ onCreator, onSpot }: {
  onCreator: () => void;
  onSpot: () => void;
}) {
  return (
    <section aria-labelledby="creator-welcome-title" className="py-1">
      <h1 id="creator-welcome-title" tabIndex={-1} className="text-[46px] leading-[1.08] font-semibold tracking-[-1.9px] text-(--text) focus:outline-none max-[480px]:text-[39px] max-[480px]:tracking-[-1.5px] max-[370px]:text-[35px]">
        Your DEX.<br />
        <span className="text-(--link)">Your community.</span>
      </h1>
      <p className="mt-4 max-w-[440px] text-[15px] leading-[1.75] text-(--secondary-text) max-[480px]:text-sm">
        Set up trading for your community, with your own app and fees wallet.
      </p>
      <div className="mt-8 grid gap-3 max-[480px]:mt-7">
        <Button
          type="button"
          className="min-h-[88px] w-full justify-between gap-3 rounded-[20px] px-5 py-4 text-left whitespace-normal max-[720px]:min-h-[88px] max-[720px]:px-4 max-[720px]:py-4"
          aria-label="Set up perps"
          aria-describedby="creator-path-description"
          onClick={onCreator}
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15"><Rocket size={21} aria-hidden="true" /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] leading-[1.5] font-semibold max-[370px]:text-sm">Set up perps</span>
            <span id="creator-path-description" className="mt-1 block text-sm leading-[1.5] font-normal text-white/80">Set up your own perps DEX or use our API.</span>
          </span>
          <ArrowRight size={18} aria-hidden="true" />
        </Button>

        <Button
          type="button"
          variant="secondary"
          className="min-h-[78px] w-full justify-between gap-3 rounded-[20px] bg-(--control-bg) px-5 py-4 text-left whitespace-normal max-[720px]:px-4"
          aria-label="Set up Spot"
          aria-describedby="spot-path-description"
          onClick={onSpot}
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-(--primary-soft) text-(--link)"><ArrowLeftRight size={21} aria-hidden="true" /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] leading-[1.5] font-semibold text-(--text) max-[370px]:text-sm">Set up Spot</span>
            <span id="spot-path-description" className="mt-1 block text-sm leading-[1.5] font-normal text-(--muted)">Bring advanced spot trading to your app.</span>
          </span>
          <ArrowRight size={18} className="text-(--muted)" aria-hidden="true" />
        </Button>
      </div>
    </section>
  );
}
