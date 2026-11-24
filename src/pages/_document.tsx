import { Head, Html, Main, NextScript } from "next/document";

const themeScript = `(() => {
  let preference = "system";
  try { const saved = localStorage.getItem("perpetual-hub-theme"); if (saved === "light" || saved === "dark") preference = saved; } catch {}
  const theme = preference === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : preference;
  document.documentElement.classList.add(theme);
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]').content = theme === "dark" ? "#10131c" : "#f8f9fc";
})();`;

export default function Document() {
  return <Html lang="en"><Head>
    <meta name="application-name" content="Orbs Partner Portal" /><meta name="apple-mobile-web-app-title" content="Orbs Partner Portal" /><meta name="theme-color" content="#f8f9fc" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" /><link rel="preload" href="/fonts/montserrat/Montserrat-Latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" /><link rel="stylesheet" href="/fonts/montserrat/montserrat.css" />
    <script dangerouslySetInnerHTML={{ __html: themeScript }} />
  </Head><body><Main /><NextScript /></body></Html>;
}
