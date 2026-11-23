import { useEffect } from "react";
import { toast } from "sonner";
import { LayoutDashboard, LoaderCircle, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LOGIN_TOAST_ID, type DemoLogin } from "./hooks/useDemoLogin";
import { cn } from "@/lib/utils";

export function LoginButton({ auth, managing, disabled, onLogout, partnerId }: {
  auth: DemoLogin;
  managing: boolean;
  disabled?: boolean;
  onLogout: () => void;
  partnerId?: string | null;
}) {
  // The wallet sheet being open is not a pending wallet action; only show progress once one is.
  const loading = auth.signing || auth.restoring || auth.walletConnecting;
  const Icon = loading ? LoaderCircle : !auth.isLoggedIn ? LogIn : managing ? LogOut : LayoutDashboard;
  const label = auth.walletConnecting ? "Connecting…" : auth.restoring ? "Restoring…" : auth.signing ? "Check wallet…" : !auth.isLoggedIn ? "Wallet sign-in" : managing ? "Sign out" : "My workspace";
  const visiblePartnerId = auth.isLoggedIn ? partnerId : null;
  return (
    <Button
      type="button"
      className={cn("min-h-11 rounded-[17px] px-4 py-2.5 text-[13px] whitespace-nowrap max-[720px]:min-h-11 max-[720px]:gap-[5px] max-[720px]:rounded-[15px] max-[720px]:px-[11px] max-[720px]:py-[9px] max-[720px]:text-xs max-[720px]:[&>svg]:hidden max-[370px]:min-w-0 max-[370px]:px-2.5", visiblePartnerId && "min-w-0 max-w-[260px] text-left max-[720px]:max-w-[150px] max-[370px]:max-w-[112px] max-[370px]:whitespace-nowrap")}
      aria-label={visiblePartnerId ? `${label} — Partner ID ${visiblePartnerId}` : undefined}
      title={visiblePartnerId ? `Partner ID: ${visiblePartnerId}` : undefined}
      variant={auth.isLoggedIn ? "default" : "secondary"}
      disabled={disabled || loading || auth.busy}
      onClick={auth.isLoggedIn && managing ? onLogout : auth.login}
    >
      <Icon size={15} className={loading ? "size-[15px] animate-spin motion-reduce:animate-none" : "size-[15px]"} aria-hidden="true" />
      {visiblePartnerId ? (
        <span className="min-w-0">
          <span className="block leading-[18px]">{label}</span>
          <span className="flex min-w-0 items-baseline gap-1 text-[10px] leading-[14px] opacity-85">
            <span className="hidden shrink-0 min-[721px]:inline">Partner ID</span>
            <span className="min-w-0 truncate font-mono" translate="no">{visiblePartnerId}</span>
          </span>
        </span>
      ) : label === "Wallet sign-in" ? (
        <><span className="max-[370px]:hidden">Wallet sign-in</span><span className="hidden max-[370px]:inline">Sign in</span></>
      ) : label}
    </Button>
  );
}

export function LoginFeedback({ auth }: { auth: DemoLogin }) {
  useEffect(() => {
    if (auth.signing)
      toast.loading(auth.phase === "verification" ? "Checking your sign-in…" : "Confirm the sign-in message in your wallet…", {
        id: LOGIN_TOAST_ID,
        description: "No funds will move.",
        action: undefined,
      });
    else if (auth.error)
      toast.error(auth.error, {
        id: LOGIN_TOAST_ID,
        description: undefined,
        action: undefined,
      });
  }, [auth.signing, auth.phase, auth.error]);
  return null;
}
