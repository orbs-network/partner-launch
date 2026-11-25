import dynamic from "next/dynamic";
import { PageSkeleton } from "../components/ContentSkeleton";

/** Server-rendered placeholder so a hard load never shows an empty page while the client bundle starts. */
function PortalLoading() {
  return <div className="flex min-h-dvh flex-col">
    <div className="h-[65px] shrink-0 border-b border-(--edge)" aria-hidden="true" />
    <PageSkeleton label="Loading the partner portal" />
  </div>;
}

// The existing wallet and draft state are intentionally initialized in the browser.
const Portal = dynamic(() => import("../app/PortalClient"), { ssr: false, loading: PortalLoading });
export default function HomePage() { return <Portal />; }
