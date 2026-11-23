export const TIME_RANGES = ["24h", "7d", "30d", "90d", "1y"] as const;

export type AnalyticsRange = (typeof TIME_RANGES)[number];

export type AnalyticsPeriod = {
  range: AnalyticsRange;
};

export const DEFAULT_ANALYTICS_RANGE: AnalyticsRange = "30d";

export const RANGE_LABELS: Record<AnalyticsRange, string> = {
  "24h": "Past 24 hours",
  "7d": "Past 7 days",
  "30d": "Past 30 days",
  "90d": "Past 90 days",
  "1y": "Past year",
};
