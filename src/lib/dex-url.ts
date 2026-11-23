export const MAX_DEX_URL_LENGTH = 2048;

/** Optional display/contact URL; it grants no website or trading permissions. */
export function validateDexUrl(value: string): string | undefined {
  const url = value.trim();
  if (!url) return;
  if (url.length > MAX_DEX_URL_LENGTH) return "Keep your DEX URL to 2,048 characters or fewer.";
  try {
    const parsed = new URL(url);
    if (!/^https?:\/\//i.test(url) || !["https:", "http:"].includes(parsed.protocol) || !parsed.hostname ||
      parsed.username || parsed.password || /\s/.test(url) ||
      Array.from(url).some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) throw new Error("url");
  } catch { return "Enter a valid DEX URL starting with https:// or http://, or leave it blank."; }
}
