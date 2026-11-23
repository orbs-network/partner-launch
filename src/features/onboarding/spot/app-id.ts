/** Suggested Spot config key; deriving it does not reserve or activate it. */
export function generateSpotAppId(appName: string): string {
  return appName.trim().normalize("NFC").toLowerCase().split(/[ -]+/u)
    .map((word, index) => index === 0 ? word : word.replace(/^\p{L}/u, first => first.toUpperCase()))
    .join("");
}
