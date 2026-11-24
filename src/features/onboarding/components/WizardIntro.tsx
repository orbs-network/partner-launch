import type { RefObject } from "react";
import { Building2, ClipboardCheck, PanelsTopLeft, Globe2, Handshake, Network, Percent, Wallet } from "lucide-react";
import type { OnboardingStepId } from "../onboarding-steps";
import { SetupLabel } from "./SetupLabel";

const icons = {
  welcome: Handshake,
  "integration-choice": PanelsTopLeft,
  "app-url": Globe2,
  networks: Network,
  partner: Building2,
  websites: Globe2,
  revenue: Percent,
  terms: ClipboardCheck,
  funding: Wallet,
};

export function WizardIntro({ id, title, intro, headingRef }: {
  id: OnboardingStepId;
  title: string;
  intro: string;
  headingRef: RefObject<HTMLHeadingElement | null>;
}) {
  const Icon = icons[id];
  return (
    <div className="card-intro px-8 pt-3 max-[720px]:px-[23px] max-[720px]:pt-2.5 max-[370px]:px-[19px]">
      <SetupLabel product="perps" />
      <div className="flex items-center gap-3.5 max-[720px]:gap-3">
        <span className={`flex size-[46px] shrink-0 items-center justify-center rounded-2xl max-[720px]:size-10 max-[720px]:rounded-[14px] ${id === "welcome" ? "bg-(--friendly-mint-bg) text-(--friendly-mint)" : "bg-(--primary-soft) text-(--link)"}`} aria-hidden="true"><Icon size={23} strokeWidth={1.7} className="max-[720px]:size-[21px]" /></span>
        <h1 className="text-[31px] leading-[1.25] font-semibold tracking-[-1px] focus:outline-none max-[720px]:text-[28px] max-[720px]:tracking-[-0.8px] max-[370px]:text-[26px]" ref={headingRef} tabIndex={-1}>{title}</h1>
      </div>
      <p className="mt-3 max-w-[490px] text-[15px] leading-[1.7] text-pretty text-(--muted) max-[720px]:mt-[11px] max-[720px]:text-[14px]">{intro}</p>
    </div>
  );
}
