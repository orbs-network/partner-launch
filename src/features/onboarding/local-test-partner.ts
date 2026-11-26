/** Skip only the interactive availability lookup for the local development fixture. */
export function isLocalTestPartner(name: string, environment = process.env.NODE_ENV, hostname = typeof window === "undefined" ? "" : window.location.hostname): boolean {
  return environment === "development" && ["localhost", "127.0.0.1", "[::1]"].includes(hostname) && name.toLowerCase() === "test";
}

/** A stable, product-compatible local fixture ID, created once per draft. */
export function generateLocalTestPartnerId(product: "spot" | "perps"): string {
  const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 16);
  return product === "spot" ? `test${suffix}` : `test-${suffix}`;
}
