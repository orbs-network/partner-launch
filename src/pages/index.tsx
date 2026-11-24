import dynamic from "next/dynamic";

// The existing wallet and draft state are intentionally initialized in the browser.
const Portal = dynamic(() => import("../app/PortalClient"), { ssr: false });
export default function HomePage() { return <Portal />; }
