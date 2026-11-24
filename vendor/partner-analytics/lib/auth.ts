import type { PartnerOperationalConfig } from "./partner-scope";
import { isIP } from "node:net";
const DEFAULT_BACKEND_URL = "https://perps-api.orbs.network";

export class PartnerAdminProxyError extends Error {
  constructor(
    message: string,
    readonly status = 502,
  ) {
    super(message);
    this.name = "PartnerAdminProxyError";
  }
}

export function partnerPayload(
  partner: PartnerOperationalConfig,
  walletAddress: string,
) {
  return {
    walletAddress,
    partner: {
      id: partner.id,
    },
  };
}

function backendBaseUrl() {
  const configured =
    process.env.PARTNER_ANALYTICS_BACKEND_URL?.trim() || DEFAULT_BACKEND_URL;
  let url: URL;
  try {
    url = new URL(configured);
  } catch {
    throw new PartnerAdminProxyError(
      "Partner analytics backend is not configured",
      500,
    );
  }
  if (!new Set(["http:", "https:"]).has(url.protocol)) {
    throw new PartnerAdminProxyError(
      "Partner analytics backend is not configured",
      500,
    );
  }
  return url.toString().replace(/\/$/, "");
}

export function partnerAdminUrl(path: string) {
  return `${backendBaseUrl()}${path}`;
}

export function partnerAdminHeaders(
  partner: PartnerOperationalConfig,
  requestHeaders?: Headers,
) {
  const chain = partner.chains[0];
  if (!chain) {
    throw new PartnerAdminProxyError(
      "This partner does not have an analytics chain",
      500,
    );
  }
  const headers = new Headers({
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Partner-Chain-Key": `${partner.id}:${chain.chainId}`,
    "X-Partner-ID": partner.id,
    "X-Chain-ID": String(chain.chainId),
  });
  const forwardedFor = requestHeaders
    ?.get("x-vercel-forwarded-for")
    ?.split(",")[0]
    ?.trim() || requestHeaders
    ?.get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim() || requestHeaders?.get("x-real-ip")?.trim();
  const normalizedIp = forwardedFor?.replace(/^\[|\]$/g, "");
  if (normalizedIp && isIP(normalizedIp)) {
    headers.set("X-Forwarded-For", normalizedIp);
  }
  return headers;
}

type PartnerAccessCheck = {
  authorized: boolean;
  unavailable: boolean;
};

async function checkPartnerAdminAccess(
  partner: PartnerOperationalConfig,
  walletAddress: string,
  requestHeaders?: Headers,
): Promise<PartnerAccessCheck> {
  let response: Response;
  try {
    const query = new URLSearchParams({ address: walletAddress });
    response = await fetch(
      partnerAdminUrl(`/api/v1/partner-admin/check?${query.toString()}`),
      {
        cache: "no-store",
        headers: partnerAdminHeaders(partner, requestHeaders),
      },
    );
  } catch {
    return { authorized: false, unavailable: true };
  }

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const originRejected = !!body && typeof body === "object" &&
      "code" in body && body.code === "PARTNER_ADMIN_ORIGIN_REJECTED";
    return {
      authorized: false,
      unavailable: originRejected || response.status === 429 || response.status >= 500,
    };
  }

  const payload = (await response.json().catch(() => null)) as
    | {
        admin?: boolean;
        partnerId?: string;
        walletAddress?: string;
      }
    | null;
  return {
    authorized:
      payload?.admin === true &&
      payload.partnerId === partner.id &&
      payload.walletAddress?.toLowerCase() === walletAddress.toLowerCase(),
    unavailable: false,
  };
}

export async function hasPartnerAdminAccess(
  partner: PartnerOperationalConfig,
  walletAddress: string,
  requestHeaders?: Headers,
) {
  const check = await checkPartnerAdminAccess(
    partner,
    walletAddress,
    requestHeaders,
  );
  if (check.unavailable) {
    throw new PartnerAdminProxyError("Partner access check is unavailable");
  }
  return check.authorized;
}
