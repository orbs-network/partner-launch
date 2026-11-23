import {
  isCurrencyMetric,
  type MetricDataKey,
} from "./chart-data";

export function formatCurrency(value: number, compact = false) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 2,
  }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "standard",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function pluralizeCount(count: number, singular: string) {
  return count === 1 ? singular : `${singular}s`;
}

export function formatPercent(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDay(date: string) {
  if (!date) return "";
  const includesTime = date.includes("T");
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(includesTime ? { hour: "numeric" as const } : {}),
    timeZone: "UTC",
  }).format(new Date(includesTime ? date : `${date}T00:00:00.000Z`));
}

export function formatMetricValue(
  dataKey: MetricDataKey,
  value: number,
  axisSpan?: number,
) {
  if (!isCurrencyMetric(dataKey)) return formatCompactNumber(value);
  const scale = Math.max(Math.abs(value), 1);
  const relativeSpan = axisSpan === undefined ? 1 : Math.abs(axisSpan) / scale;
  const maximumFractionDigits = relativeSpan < 0.001
    ? 3
    : relativeSpan < 0.01
      ? 2
      : 1;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits,
  }).format(value);
}
