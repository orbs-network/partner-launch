import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { WalletButton } from "./WalletButton";
import { ThemeToggle } from "./ThemeToggle";

export interface AppLayoutProps {
  children: ReactNode;
  headerActions?: ReactNode;
  notice?: ReactNode;
  /** Hide "Connect wallet" only while a returning wallet reconnects; it shows once the state is known. */
  hideDisconnectedWallet?: boolean;
  homeDisabled?: boolean;
}

export function AppLayout({ children, headerActions, notice, hideDisconnectedWallet, homeDisabled = false }: AppLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] bg-[radial-gradient(ellipse_850px_500px_at_50%_0,var(--friendly-halo),transparent_75%)]">
      <a className="fixed -top-[70px] left-5 z-[99] rounded-[14px] bg-primary px-[18px] py-[13px] text-primary-foreground focus:top-3" href="#main">Skip to main content</a>
      <header data-has-login={!!headerActions} className="group/header sticky top-0 z-30 flex h-[calc(var(--app-header-height)+env(safe-area-inset-top))] shrink-0 items-center justify-between gap-5 border-b border-(--edge) bg-(--bg) pt-[env(safe-area-inset-top)] px-9 min-[1500px]:px-12 max-[720px]:gap-2.5 max-[720px]:px-[19px] max-[370px]:gap-2 max-[370px]:px-[13px] max-[370px]:data-[has-login=true]:gap-[7px] max-[370px]:data-[has-login=true]:px-3">
        <a href="/" onClick={event => {
          if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          if (homeDisabled) return;
          if (window.dispatchEvent(new Event("portal-home", { cancelable: true }))) {
            window.history.pushState({ portalHome: true, portalWelcome: true }, "", "/");
            window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
          }
        }} className="inline-flex shrink-0 rounded-md text-(--text) transition-colors hover:text-(--link)" aria-label="Orbs home">
          <span aria-hidden="true" className="inline-flex items-center gap-[0.6em] text-xl leading-none font-normal tracking-wider uppercase">
            <img src="/orbs/orbs-mark.svg" alt="" width={42} height={41} className="size-[1.4em] shrink-0" />
            <span>Orbs</span>
          </span>
        </a>
        <div className="flex min-w-0 items-center gap-2.5 max-[720px]:gap-[7px] max-[720px]:group-data-[has-login=true]/header:gap-1.5 max-[370px]:gap-[5px]">
          <ThemeToggle />
          <WalletButton hideWhileConnecting={hideDisconnectedWallet} />
          {headerActions}
        </div>
      </header>
      {notice}
      {children}
      <footer className="flex shrink-0 items-center justify-center gap-[25px] px-6 pt-5 pb-[25px] text-[13px] text-(--muted) max-[720px]:gap-5 max-[720px]:px-[18px] max-[720px]:pt-[14px] max-[767px]:pb-[max(18px,env(safe-area-inset-bottom))]">
        <a className="inline-flex min-h-11 items-center gap-[5px] hover:text-(--link)" href="https://www.orbs.com/" target="_blank" rel="noreferrer">
          <img src="/orbs/orbs-mark.svg" alt="" width={17} height={17} className="size-4 opacity-70" />Powered by Orbs
        </a>
        <a className="inline-flex min-h-11 items-center gap-[5px] hover:text-(--link)" href="https://perps.orbs.network/terms" target="_blank" rel="noreferrer">
          Terms of Use<ArrowUpRight size={12} aria-hidden="true" />
        </a>
      </footer>
    </div>
  );
}
