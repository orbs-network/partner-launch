export const ACCOUNT_METRIC_FIELDS = [
  "volume24hMicros",
  "totalCommissionPaidMicros",
  "totalUPnlMicros",
  "totalPnlMicros",
  "balanceMicros",
] as const;

export type AccountMetricField = (typeof ACCOUNT_METRIC_FIELDS)[number];

export const HISTORY_ACCOUNT_METRIC_FIELDS = [
  "volume24hMicros",
  "totalCommissionPaidMicros",
] as const satisfies readonly AccountMetricField[];

export const LIVE_ACCOUNT_METRIC_FIELDS = [
  "totalCommissionPaidMicros",
  "totalPnlMicros",
] as const satisfies readonly AccountMetricField[];

export const PLATFORM_METRIC_FIELDS = [
  "userCount",
  "activeUserCount",
  "openPositionCount",
  "totalEquityMicros",
  "grossOpenInterestMicros",
  "availableBalanceMicros",
  "marginUsedMicros",
  "totalUnrealizedPnlMicros",
] as const;
