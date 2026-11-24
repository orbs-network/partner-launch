/**
 * Partner-facing destinations. The monorepo (orbs-network/perpetual-hub) is
 * private, so partners are sent to the public frontend repository instead.
 */
function httpsUrl(raw: string | undefined, fallback: string | null) {
  const value = raw?.trim();
  if (!value) return fallback;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href.replace(/\/$/, "") : fallback;
  } catch {
    return fallback;
  }
}

export const FRONTEND_REPO_URL = httpsUrl(
  process.env.VITE_FRONTEND_REPO_URL,
  "https://github.com/orbs-network/perpetual-hub-frontend",
)!;
export const FRONTEND_GUIDE_URL = `${FRONTEND_REPO_URL}#readme`;

/** Show a contact action only when a real public HTTPS destination is configured. */
export const PARTNER_ACTIVATION_CONTACT_URL = httpsUrl(process.env.VITE_PARTNER_ACTIVATION_CONTACT_URL, null);
export const PARTNER_ACTIVATION_CONTACT = PARTNER_ACTIVATION_CONTACT_URL ?? "Confirm activation with the dPERPS team.";

/** Canonical AI instructions for partner API integrations. */
export const PERPS_API_SKILL_URL = "https://github.com/orbs-network/spot-integration-docs/tree/main/skills/perps-api-integration";

/** Official API docs; deployments may supply another HTTPS guide. */
export const API_GUIDE_URL = httpsUrl(process.env.VITE_API_GUIDE_URL, "https://docs.orbs.com/perps/api")!;
/** Spot integration skills; prefer the version bundled with an installed SDK. */
export const SPOT_SKILLS_URL = "https://github.com/orbs-network/spot-ui/tree/master/skills";

/** Official Spot integration overview and setup documentation. */
export const SPOT_DOCS_URL = "https://docs.orbs.com/advanced-orders/shared";
export const SPOT_APP_REPO_URL = "https://github.com/orbs-network/orbs-spot";
