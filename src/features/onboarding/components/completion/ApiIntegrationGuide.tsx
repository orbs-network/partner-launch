import { ArrowUpRight } from "lucide-react";
import { API_GUIDE_URL, FRONTEND_REPO_URL } from "../../../../config/links";

const resourceLinkClass = "inline-flex min-h-11 items-center gap-1.5 text-xs text-(--link) hover:text-(--link-hover) hover:underline hover:underline-offset-4 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-(--focus-ring)";

export function ApiIntegrationGuide() {
  return (
    <section className="mt-7 border-t border-(--edge) pt-6" aria-labelledby="api-integration-title">
      <h2 id="api-integration-title" className="text-xl font-semibold tracking-[-0.4px]">Start your integration</h2>
      <p className="mt-2 text-[13px] leading-[1.7] text-(--muted)">
        API access uses your partner ID and selected networks. Confirm their activation with the team before going live.
      </p>
      <nav aria-label="API resources" className="mt-3 flex flex-wrap items-center gap-x-5">
        <a href={API_GUIDE_URL} target="_blank" rel="noreferrer" className={resourceLinkClass}>
          API getting started <ArrowUpRight size={13} aria-hidden="true" />
        </a>
        <a href={`${FRONTEND_REPO_URL}/tree/main/src/api`} target="_blank" rel="noreferrer" className={resourceLinkClass}>
          View the public API client <ArrowUpRight size={13} aria-hidden="true" />
        </a>
      </nav>
    </section>
  );
}
