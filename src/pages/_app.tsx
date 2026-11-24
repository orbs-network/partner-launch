import type { AppProps } from "next/app";
import Head from "next/head";
import "@rainbow-me/rainbowkit/styles.css";
import "../components/ui/theme.css";
import "../styles.css";

export default function PortalApp({ Component, pageProps }: AppProps) {
  return <><Head><title>Orbs Partner Portal</title><meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" /><meta name="description" content="Set up Spot or perps trading for your community with Orbs. Choose your app name and fees wallet, then integrate through our docs or API." /><meta property="og:site_name" content="Orbs Partner Portal" /><meta property="og:title" content="Orbs Partner Portal" /><meta property="og:description" content="Set up Spot or perps trading for your community with Orbs." /></Head><Component {...pageProps} /></>;
}
