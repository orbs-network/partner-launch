export function marketNotionalShare(
  executedNotional: number,
  totalNotional: number,
) {
  if (executedNotional <= 0 || totalNotional <= 0) return 0;
  return Math.min(executedNotional / totalNotional, 1);
}
