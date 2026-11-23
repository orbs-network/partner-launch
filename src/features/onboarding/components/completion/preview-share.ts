import { FONT_FAMILY } from "../../../../config/typography";
import { DEFAULT_BRAND_COLOR, validateLogoDataUrl } from "../../dex-identity";

export const DPERPS_PRODUCT_URL = "https://www.orbs.com/dperps/";

export function previewDisplayName(name: string): string {
  return Array.from(name.trim().replace(/\s+/gu, " ")).slice(0, 80).join("") || "my DEX";
}

/** Share only a public display name and the product page, never a setup payload. */
export function createPreviewShareUrl(name: string): string {
  const url = new URL("https://x.com/intent/tweet");
  url.searchParams.set("text", `I’m preparing ${previewDisplayName(name)} with dPERPS. Coming soon.`);
  url.searchParams.set("url", DPERPS_PRODUCT_URL);
  return url.href;
}

export function previewBrandColor(color: string): string {
  return /^#[a-fA-F0-9]{6}$/.test(color) ? color : DEFAULT_BRAND_COLOR;
}

function wrapText(context: CanvasRenderingContext2D, text: string, width: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const character of Array.from(text)) {
    if (line && context.measureText(line + character).width > width) {
      const space = line.lastIndexOf(" ");
      lines.push(space > 0 ? line.slice(0, space) : line);
      line = space > 0 ? line.slice(space + 1) + character : character;
    } else line += character;
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

async function loadLocalLogo(dataUrl: string): Promise<HTMLImageElement> {
  const invalid = validateLogoDataUrl(dataUrl);
  if (invalid) throw new Error(invalid);
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("We couldn’t read your logo. Try downloading again."));
    image.src = dataUrl;
  });
}

/** Render a local coming-soon image. No external images, uploads or account data. */
export async function createPreviewCardBlob({ name, brandColor, logoDataUrl }: {
  name: string;
  brandColor: string;
  logoDataUrl?: string;
}): Promise<Blob> {
  const logo = logoDataUrl ? await loadLocalLogo(logoDataUrl) : undefined;
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image downloads aren’t available in this browser.");
  const color = previewBrandColor(brandColor);
  const displayName = previewDisplayName(name);
  const rounded = (x: number, y: number, width: number, height: number, radius: number, fill: string) => {
    context.fillStyle = fill;
    context.beginPath();
    context.roundRect(x, y, width, height, radius);
    context.fill();
  };
  const background = context.createLinearGradient(0, 0, 1200, 630);
  background.addColorStop(0, "#08111f");
  background.addColorStop(1, "#101d35");
  context.fillStyle = background;
  context.fillRect(0, 0, 1200, 630);
  rounded(72, 72, 64, 64, 18, "#f1f5fd");
  context.textBaseline = "top";
  if (logo) {
    const scale = Math.min(48 / logo.naturalWidth, 48 / logo.naturalHeight);
    const width = logo.naturalWidth * scale;
    const height = logo.naturalHeight * scale;
    context.drawImage(logo, 104 - width / 2, 104 - height / 2, width, height);
  } else {
    context.font = `700 34px ${FONT_FAMILY}`;
    context.fillStyle = "#13213b";
    context.textAlign = "center";
    context.fillText(Array.from(displayName)[0].toUpperCase(), 104, 84);
  }
  rounded(935, 83, 193, 42, 21, "#1b2942");
  context.fillStyle = color;
  context.beginPath();
  context.arc(958, 104, 4, 0, Math.PI * 2);
  context.fill();
  context.font = `500 18px ${FONT_FAMILY}`;
  context.textAlign = "center";
  context.fillStyle = "#dce5f7";
  context.fillText("Coming soon", 1041, 92);

  // A single directional mark is decorative, not a market chart or performance claim.
  const arrow = context.createLinearGradient(884, 454, 1082, 254);
  arrow.addColorStop(0, "#22314b");
  arrow.addColorStop(1, "#4b5e83");
  context.strokeStyle = arrow;
  context.lineWidth = 30;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(882, 452);
  context.lineTo(1082, 252);
  context.moveTo(938, 252);
  context.lineTo(1082, 252);
  context.lineTo(1082, 396);
  context.stroke();

  rounded(72, 177, 40, 4, 2, color);
  context.textAlign = "left";
  context.font = `500 18px ${FONT_FAMILY}`;
  context.fillStyle = "#9eacc5";
  context.fillText("PREPARING MY DEX", 72, 207);
  let size = 86;
  let lines: string[];
  while (true) {
    context.font = `700 ${size}px ${FONT_FAMILY}`;
    lines = wrapText(context, displayName, 744);
    if ((lines.length <= 3 && lines.length * size * 1.08 <= 222) || size <= 24) break;
    size -= 2;
  }
  context.fillStyle = "#f5f7fd";
  lines.forEach((line, index) => context.fillText(line, 72, 249 + index * size * 1.08));
  context.fillStyle = "#2a3952";
  context.fillRect(72, 523, 1056, 1);
  context.font = `500 20px ${FONT_FAMILY}`;
  context.fillStyle = "#aebbd2";
  context.fillText("Built with dPERPS", 72, 552);
  return new Promise((resolve, reject) => canvas.toBlob(
    (blob) => blob ? resolve(blob) : reject(new Error("We couldn’t create your image. Please try again.")),
    "image/png",
  ));
}
