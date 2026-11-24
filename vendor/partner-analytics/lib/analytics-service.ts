import type { PartnerOperationalConfig } from "./partner-scope";
import { hasPartnerAdminAccess, PartnerAdminProxyError } from "./auth";
import { buildStatsQuery, parseStatsResponse } from "../src/elasticsearch";
import { parseAnalyticsPeriod } from "../src/analytics-period";
import { statsCacheKey, withStatsCache } from "../app/api/stats/stats-cache";

const DEFAULT_ANALYTICS_BI_QUERY_URL = "https://api.bi.orbs.network";

function validIndex(index: string) {
  return /^[a-zA-Z0-9*_.-]+$/.test(index);
}

async function elasticsearchError(response: Response) {
  const content = await response.text();
  try {
    const body = JSON.parse(content) as {
      error?: { reason?: string; root_cause?: Array<{ reason?: string }> };
    };
    return body.error?.reason || body.error?.root_cause?.[0]?.reason || content;
  } catch {
    return content;
  }
}

/** Both apps validate wallet identity before entering this shared read-only service. */
export async function loadPartnerAnalytics(
  request: Request,
  partner: PartnerOperationalConfig,
  walletAddress: string,
) {
  const responseHeaders = { "Cache-Control": "private, no-store" };
  let authorized;
  try {
    authorized = await hasPartnerAdminAccess(
      partner,
      walletAddress,
      request.headers,
    );
  } catch (error) {
    console.error("Partner analytics access check failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return Response.json(
      { error: "Partner access check is temporarily unavailable" },
      {
        status: error instanceof PartnerAdminProxyError ? 502 : 500,
        headers: responseHeaders,
      },
    );
  }

  if (!authorized) {
    return Response.json(
      { error: "Wallet access is not available" },
      { status: 401, headers: responseHeaders },
    );
  }

  const searchParams = new URL(request.url).searchParams;
  const allowedChainIds = partner.chains.map(
    (chain) => String(chain.chainId),
  );
  const index = process.env.ANALYTICS_BI_INDEX?.trim() || "orbs-perps2.*";
  const baseUrl = DEFAULT_ANALYTICS_BI_QUERY_URL;

  if (allowedChainIds.length === 0 || !index || !validIndex(index)) {
    return Response.json(
      { error: "Partner analytics is not configured" },
      { status: 500, headers: responseHeaders },
    );
  }

  const requestedChainId = searchParams.get("chainId")?.trim();
  if (requestedChainId && !allowedChainIds.includes(requestedChainId)) {
    return Response.json(
      { error: "Invalid analytics chain" },
      { status: 400, headers: responseHeaders },
    );
  }

  const period = parseAnalyticsPeriod(searchParams.get("range"));
  const scope = {
    partnerId: partner.id,
    chainIds: requestedChainId ? [requestedChainId] : allowedChainIds,
  };

  try {
    const payload = await withStatsCache(
      statsCacheKey(partner.id, scope.chainIds, period.range),
      async () => {
        const searchResponse = await fetch(
          `${baseUrl.replace(/\/$/, "")}/${index}/_search`,
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(buildStatsQuery(scope, period)),
          },
        );

        if (!searchResponse.ok) {
          const detail = await elasticsearchError(searchResponse);
          console.error("Partner analytics Elasticsearch query failed", {
            status: searchResponse.status,
            detail,
            partnerId: partner.id,
            chainIds: scope.chainIds,
          });
          throw new Error("Elasticsearch query failed");
        }

        return parseStatsResponse(
          (await searchResponse.json()) as Parameters<
            typeof parseStatsResponse
          >[0],
          scope,
          period,
        );
      },
    );
    return Response.json(payload, { status: 200, headers: responseHeaders });
  } catch (error) {
    console.error("Partner analytics request failed", {
      error: error instanceof Error ? error.message : String(error),
      partnerId: partner.id,
      chainIds: scope.chainIds,
    });
    return Response.json(
      { error: "Analytics data is temporarily unavailable" },
      { status: 502, headers: responseHeaders },
    );
  }
}
