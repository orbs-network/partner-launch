import { Providers } from "./providers";
import { ThemeProvider } from "./ThemeProvider";
import { App } from "./App";

export default function PortalClient() {
  return <ThemeProvider><Providers><App /></Providers></ThemeProvider>;
}
