export const DEFAULT_BRAND_COLOR = "#3d3ef0";
export const MAX_LOGO_DATA_URL_LENGTH = 400_000;
/** Bound preserved Creator metadata even when the API path does not display it. */
export const MAX_RETAINED_DISPLAY_NAME_LENGTH = 200;

/** Existing operational IDs are reserved; generated IDs are not reservations. */
export const reservedPartnerNames: ReadonlySet<string> = new Set([
  "default", "fireblocks", "atlantis", "gryps", "ionex", "quickswap", "spooky",
  "treble", "thena", "orbs", "orvex", "carbon", "global",
]);

/** Deterministic local suggestion; availability is confirmed during activation. */
export function generateAccountId(name: string): string {
  return name.normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
}

export function validateDexName(name: string): string | undefined {
  if (!name.trim()) return "Enter a name for your app.";
  if (name.trim().length < 3) return "Use at least 3 characters for your app name.";
  if (name.length > 80) return "Keep your app name to 80 characters or fewer.";
  if (name !== name.trim() || !/^[\p{L}\p{N}][\p{L}\p{M}\p{N} ._&'’-]*$/u.test(name))
    return "Start with a letter or number; use letters, numbers, spaces, or . _ & ' - in your app name.";
  if (!generateAccountId(name))
    return "Include at least one letter from A to Z or number in your app name.";
}

export function validateBrandColor(color: string): string | undefined {
  if (!/^#[a-fA-F0-9]{6}$/.test(color))
    return "Choose a color with six hexadecimal digits, such as #3d3ef0.";
}

export function validateLogoDataUrl(value: string): string | undefined {
  if (!value) return;
  if (value.length > MAX_LOGO_DATA_URL_LENGTH)
    return "Choose a smaller logo, up to 300 KB.";
  if (!/^data:image\/(?:png|jpeg|webp);base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value) || value.endsWith(","))
    return "Choose a PNG, JPEG, or WebP logo.";
}

/** Keep the existing ID format, with the explicitly supported mixed-case partner ID. */
export function isPartnerIdFormat(value: string): boolean {
  return value === "QuickSwap1" || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export function validatePartnerName(value: string): string | undefined {
  const name = value.trim();
  if (name.length < 3)
    return "Use at least 3 characters for your partner ID.";
  if (name.length > 40)
    return "Keep your partner ID to 40 characters or fewer.";
  if (name !== value || !isPartnerIdFormat(name)) {
    return "Use lowercase letters, numbers, and single hyphens, with no spaces.";
  }
  if (reservedPartnerNames.has(name))
    return "This partner ID is reserved. Choose another name.";
}
