import { CircleAlert, CircleCheck } from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useTheme } from "@/app/theme-context";

/** App-wide toasts for operation results; follows the app's light/dark theme. */
export function Toaster(props: ToasterProps) {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      theme={resolvedTheme}
      position="bottom-right"
      closeButton
      icons={{
        success: <CircleCheck size={17} className="text-(--friendly-mint)" />,
        error: <CircleAlert size={17} className="text-(--danger)" />,
      }}
      toastOptions={{ classNames: { toast: "rounded-[14px]! border! border-(--edge)! bg-(--surface)! font-sans! text-[13px]! leading-normal! text-(--text)! shadow-[0_10px_30px_rgb(20_30_60/0.12)]!" } }}
      {...props}
    />
  );
}
