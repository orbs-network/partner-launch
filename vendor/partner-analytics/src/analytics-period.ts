import {
  TIME_RANGES,
  type AnalyticsPeriod,
  type AnalyticsRange,
} from "../lib/analytics-range";

const RANGE_DAYS: Record<Exclude<AnalyticsRange, "24h">, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "1y": 365,
};

function isAnalyticsRange(value: string): value is AnalyticsRange {
  return TIME_RANGES.includes(value as AnalyticsRange);
}

export function parseAnalyticsRange(value: string | null | undefined): AnalyticsRange {
  return value && isAnalyticsRange(value) ? value : "30d";
}

export function parseAnalyticsPeriod(
  rangeValue: string | null | undefined,
): AnalyticsPeriod {
  return { range: parseAnalyticsRange(rangeValue) };
}

export function getPeriodBounds(period: AnalyticsPeriod, now = new Date()) {
  if (period.range === "24h") {
    return {
      from: new Date(now.getTime() - 24 * 60 * 60 * 1_000),
      to: now,
    };
  }

  const from = new Date(now);
  from.setUTCDate(from.getUTCDate() - RANGE_DAYS[period.range] + 1);
  from.setUTCHours(0, 0, 0, 0);
  return { from, to: now };
}
