import { getPeriodBounds } from "./analytics-period.js";
import type { AnalyticsPeriod } from "../lib/analytics-range";
import {
  HISTORY_ACCOUNT_METRIC_FIELDS,
  LIVE_ACCOUNT_METRIC_FIELDS,
  PLATFORM_METRIC_FIELDS,
  type AccountMetricField,
} from "./elasticsearch-fields.js";
import type { AnalyticsScope } from "./types";

function equalsFilter(field: string, value: string) {
  return { term: { [`${field}.keyword`]: value } };
}

function anyEqualsFilter(field: string, values: string[]) {
  return {
    bool: {
      should: values.map((value) => equalsFilter(field, value)),
      minimum_should_match: 1,
    },
  };
}

function booleanFilter(field: string, value: boolean) {
  return { term: { [field]: value } };
}

/**
 * Executed trades only. A `create_order`/`close_order` document exists for every
 * order the TEE accepted, including STOP/LIMIT orders that were merely
 * registered: until 2026-09-22 the backend also stamped those registrations
 * with a `positionUsdMicros` derived from the requested size and trigger price,
 * so `exists positionUsdMicros` alone counted them as trades and, once a stop
 * triggered, counted the same trade twice (registration + `fill_order`).
 *
 * Only a MARKET order executes inside its own request; a conditional order
 * trades later and is reported by its `fill_order`. Documents written before the
 * backend fix still carry the stray field, so the order type is required here
 * as well.
 *
 * `close_order` documents written before that fix recorded a hard-coded MARKET
 * order type even for reduce-only STOP/TAKE_PROFIT registrations, so the type
 * cannot separate them; Gryps' protective stops were all of this shape. The
 * hedge result can: the backend hedges every executed market order on the
 * exchange before the TEE commits it and records `hedgeSuccess: true`, while a
 * registration is never hedged when it is accepted. Close documents therefore
 * additionally require a successful hedge. This ties "executed" to "hedged" for
 * closes, which holds for every production lane today; a lane run without
 * hedging would report no closes here until this rule is revisited.
 */
function successfulTradeFilter() {
  return {
    bool: {
      filter: [
        anyEqualsFilter("status", ["tee_success", "rolled_up"]),
        { exists: { field: "positionUsdMicros" } },
      ],
      should: [
        equalsFilter("eventType", "fill_order"),
        {
          bool: {
            filter: [
              equalsFilter("eventType", "create_order"),
              equalsFilter("orderType", "MARKET"),
            ],
          },
        },
        {
          bool: {
            filter: [
              equalsFilter("eventType", "close_order"),
              equalsFilter("orderType", "MARKET"),
              booleanFilter("hedgeSuccess", true),
            ],
          },
        },
      ],
      minimum_should_match: 1,
    },
  };
}

function accountSummaryFilter() {
  return {
    bool: {
      filter: [
        equalsFilter("eventType", "account_summary"),
        equalsFilter("status", "snapshot"),
        equalsFilter("hostname", "ip-10-1-4-102"),
      ],
    },
  };
}

function platformSummaryFilter() {
  return {
    bool: {
      filter: [
        equalsFilter("eventType", "platform_summary"),
        equalsFilter("status", "snapshot"),
      ],
    },
  };
}

function flowFilter(eventType: "deposit" | "withdrawal", kindField: string) {
  return {
    bool: {
      filter: [
        equalsFilter("eventType", eventType),
        anyEqualsFilter("status", ["tee_success", "rolled_up"]),
        equalsFilter(kindField, "user"),
        { exists: { field: "amountMicros" } },
      ],
    },
  };
}

function liquidationFilter() {
  return {
    bool: {
      filter: [
        equalsFilter("eventType", "liquidation"),
        anyEqualsFilter("status", ["tee_success", "rolled_up"]),
        { exists: { field: "positionUsdMicros" } },
      ],
    },
  };
}

function fundingFilter() {
  return {
    bool: {
      filter: [
        equalsFilter("eventType", "funding_charge"),
        anyEqualsFilter("status", ["tee_success", "rolled_up"]),
        { exists: { field: "fundingFeeMicros" } },
      ],
    },
  };
}

function moneyAggregation(field: string) {
  return { amount: { sum: { field } } };
}

function accountSnapshotAggregation(
  metricNames: readonly AccountMetricField[],
) {
  const readMetrics = metricNames
    .map((field) =>
      `entry.${field} = doc['${field}'].size() == 0 ? 0L : doc['${field}'].value;`,
    )
    .join("\n");
  const sumMetrics = metricNames
    .map((field) => `totals.${field} += account.${field};`)
    .join("\n");
  const initialTotals = metricNames
    .map((field) => `'${field}': 0L`)
    .join(",\n");

  return {
    latestTotals: {
      scripted_metric: {
        init_script: "state.accounts = [:];",
        map_script: `
          if (
            doc['chainId.keyword'].size() == 0 ||
            doc['user.keyword'].size() == 0 ||
            doc['timestamp'].size() == 0
          ) return;
          def key = doc['chainId.keyword'].value + '|' + doc['user.keyword'].value;
          def timestamp = doc['timestamp'].value.toInstant().toEpochMilli();
          def current = state.accounts.get(key);
          if (current == null || timestamp > current.timestamp) {
            def entry = ['timestamp': timestamp];
            ${readMetrics}
            state.accounts.put(key, entry);
          }
        `,
        combine_script: "return state.accounts;",
        reduce_script: `
          def latest = [:];
          for (def shard : states) {
            if (shard == null) continue;
            for (def item : shard.entrySet()) {
              def current = latest.get(item.getKey());
              def candidate = item.getValue();
              if (current == null || candidate.timestamp > current.timestamp) {
                latest.put(item.getKey(), candidate);
              }
            }
          }
          def totals = [${initialTotals}];
          for (def account : latest.values()) {
            ${sumMetrics}
          }
          return totals;
        `,
      },
    },
  };
}

function platformChainsAggregation() {
  return {
    chains: {
      terms: { field: "chainId.keyword", size: 100 },
      aggs: {
        latest: {
          top_hits: {
            size: 1,
            sort: [{ timestamp: { order: "desc" } }],
            _source: { includes: [...PLATFORM_METRIC_FIELDS, "timestamp"] },
          },
        },
      },
    },
  };
}

function liveAccountChainsAggregation() {
  const sums = Object.fromEntries(
    LIVE_ACCOUNT_METRIC_FIELDS.map((field) => [field, { sum: { field } }]),
  );

  return {
    chains: {
      terms: { field: "chainId.keyword", size: 100 },
      aggs: {
        latestBatch: {
          terms: {
            field: "timestamp",
            order: { _key: "desc" },
            size: 100,
          },
          aggs: sums,
        },
      },
    },
  };
}

function periodAggregations() {
  return {
    trades: {
      filter: successfulTradeFilter(),
      aggs: {
        notional: { sum: { field: "positionUsdMicros" } },
        users: {
          cardinality: { field: "user.keyword", precision_threshold: 40_000 },
        },
      },
    },
    deposits: {
      filter: flowFilter("deposit", "depositKind"),
      aggs: moneyAggregation("amountMicros"),
    },
    withdrawals: {
      filter: flowFilter("withdrawal", "withdrawalKind"),
      aggs: moneyAggregation("amountMicros"),
    },
    liquidations: { filter: liquidationFilter() },
    funding: {
      filter: fundingFilter(),
      aggs: moneyAggregation("fundingFeeMicros"),
    },
  };
}

function historyAggregations() {
  return {
    ...periodAggregations(),
    accountSnapshots: {
      filter: accountSummaryFilter(),
      aggs: accountSnapshotAggregation(HISTORY_ACCOUNT_METRIC_FIELDS),
    },
    platformSnapshots: {
      filter: platformSummaryFilter(),
      aggs: platformChainsAggregation(),
    },
  };
}

function marketAggregation() {
  return {
    filter: successfulTradeFilter(),
    aggs: {
      symbols: {
        terms: {
          field: "symbol.keyword",
          order: { notional: "desc" },
          size: 10,
        },
        aggs: {
          notional: { sum: { field: "positionUsdMicros" } },
          users: {
            cardinality: { field: "user.keyword", precision_threshold: 40_000 },
          },
        },
      },
    },
  };
}

function scopedRangeFilters(scope: AnalyticsScope, from: string, to: string) {
  return [
    {
      range: {
        timestamp: {
          format: "strict_date_optional_time",
          gte: from,
          lte: to,
        },
      },
    },
    equalsFilter("partnerId", scope.partnerId),
    anyEqualsFilter("chainId", scope.chainIds),
  ];
}

function scopeFilters(scope: AnalyticsScope) {
  return [
    equalsFilter("partnerId", scope.partnerId),
    anyEqualsFilter("chainId", scope.chainIds),
  ];
}

export function buildStatsQuery(
  scope: AnalyticsScope,
  period: AnalyticsPeriod,
  now = new Date(),
) {
  const bounds = getPeriodBounds(period, now);
  const from = bounds.from.toISOString();
  const to = bounds.to.toISOString();
  const trailing24hFrom = new Date(
    bounds.to.getTime() - 24 * 60 * 60 * 1_000,
  ).toISOString();
  const rangeFilters = scopedRangeFilters(scope, from, to);

  return {
    size: 0,
    track_total_hits: false,
    query: { bool: { filter: rangeFilters } },
    aggs: {
      overview: {
        filter: { match_all: {} },
        aggs: {
          ...periodAggregations(),
          markets: marketAggregation(),
        },
      },
      days: {
        date_histogram: {
          field: "timestamp",
          ...(period.range === "24h"
            ? { fixed_interval: "1h" }
            : { calendar_interval: "1d" }),
          min_doc_count: 0,
          extended_bounds: { min: from, max: to },
        },
        aggs: historyAggregations(),
      },
      live: {
        global: {},
        aggs: {
          accounts: {
            filter: {
              bool: {
                filter: [
                  ...scopeFilters(scope),
                  ...accountSummaryFilter().bool.filter,
                ],
              },
            },
            aggs: liveAccountChainsAggregation(),
          },
          platform: {
            filter: {
              bool: {
                filter: [
                  ...scopeFilters(scope),
                  ...platformSummaryFilter().bool.filter,
                ],
              },
            },
            aggs: platformChainsAggregation(),
          },
          trailingTrades: {
            filter: {
              bool: {
                filter: [
                  ...scopeFilters(scope),
                  {
                    range: {
                      timestamp: {
                        format: "strict_date_optional_time",
                        gte: trailing24hFrom,
                        lte: to,
                      },
                    },
                  },
                  ...successfulTradeFilter().bool.filter,
                ],
              },
            },
            aggs: {
              notional: { sum: { field: "positionUsdMicros" } },
            },
          },
        },
      },
    },
  };
}
