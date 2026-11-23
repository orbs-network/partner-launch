export function normalizeOrigin(value: string): string {
  try {
    const url = new URL(value.trim());
    if (
      /^https?:\/\/[^/?#]+\/?$/i.test(value.trim()) &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash &&
      !url.username &&
      !url.password
    ) {
      return url.origin;
    }
  } catch {
    // Preserve retained draft metadata exactly when it is not a plain origin.
  }
  return value.trim();
}
