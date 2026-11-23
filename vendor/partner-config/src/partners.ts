import {
  createPartnerChainConfig,
  partnerChains,
  type PartnerChainConfig,
} from "./chains.ts";

export const PartnerId = {
  Default: "default",
  Fireblocks: "fireblocks",
  Atlantis: "atlantis",
  Gryps: "gryps",
  Ionex: "ionex",
  QuickSwap: "quickswap",
  Spooky: "spooky",
  Treble: "treble",
  Thena: "thena",
  Orbs: "orbs",
  Orvex: "orvex",
  Carbon: "carbon",
  Global: "global",
} as const;

export type PartnerId = (typeof PartnerId)[keyof typeof PartnerId];

export const DEFAULT_PARTNER_SELECTOR = PartnerId.Default;

export interface PartnerOperationalConfig {
  /** Backend/signing identity; a frontend selector may brand an existing lane. */
  id: PartnerId;
  name: string;
  logoUrl: string;
  deployedOrigin: string;
  chains: readonly PartnerChainConfig[];
}

const orbsArbitrumChain = createPartnerChainConfig(
  partnerChains.arbitrum,
  "0xE584f80BcC75d0F72a21512d5845072A4C37ed02",
);

export const partnerRegistry = {
  [PartnerId.Default]: {
    id: PartnerId.Orbs,
    name: "Perpetual Hub",
    logoUrl: "/logo.svg",
    deployedOrigin: "https://perps.orbs.network",
    chains: [orbsArbitrumChain],
  },
  [PartnerId.Thena]: {
    id: PartnerId.Thena,
    name: "THENA",
    logoUrl: "/thena.png",
    deployedOrigin: "https://perps.thena.fi",
    chains: [
      createPartnerChainConfig(
        partnerChains.bsc,
        "0xf0Dae81C451a05e6655F37C04D3e378e518EB99D",
      ),
    ],
  },
  [PartnerId.Orbs]: {
    id: PartnerId.Orbs,
    name: "Orbs",
    logoUrl: "/orbs.svg",
    deployedOrigin: "https://perps.orbs.network",
    chains: [orbsArbitrumChain],
  },
  [PartnerId.QuickSwap]: {
    id: PartnerId.QuickSwap,
    name: "QuickSwap",
    logoUrl: "/quickswap.svg",
    deployedOrigin: "https://www.qperps.exchange",
    chains: [
      createPartnerChainConfig(
        partnerChains.polygon,
        "0xf0Dae81C451a05e6655F37C04D3e378e518EB99D",
      ),
      createPartnerChainConfig(
        partnerChains.base,
        "0x579bdB8D849CFd4816Ec23c3Be088411A79c917D",
      ),
      createPartnerChainConfig(
        partnerChains.arbitrum,
        "0x9A9ED52D1Df6aF6Aa98aA9e2356CEcDfa98fE6e4",
      ),
      createPartnerChainConfig(
        partnerChains.bsc,
        "0x30DdE423d3ed2a53f8F2079C2E2081c4fc8957E9",
      ),
      createPartnerChainConfig(
        partnerChains.robinhood,
        "0x87FC464fa528260F1eeaB94FA20F73FeD8536Eb7",
      ),
    ],
  },
  [PartnerId.Gryps]: {
    id: PartnerId.Gryps,
    name: "Gryps",
    logoUrl: "/gryps.svg",
    deployedOrigin: "https://app.gryps.finance",
    chains: [
      createPartnerChainConfig(
        partnerChains.sei,
        "0xf0Dae81C451a05e6655F37C04D3e378e518EB99D",
      ),
    ],
  },
  [PartnerId.Spooky]: {
    id: PartnerId.Spooky,
    name: "Spooky",
    logoUrl: "/spooky.png",
    deployedOrigin: "https://perps.spooky.fi",
    chains: [
      createPartnerChainConfig(
        partnerChains.sonic,
        "0xAb83f87A8d42a1E2b3c61fa5385FbEB2ccc102Ba",
      ),
    ],
  },
  [PartnerId.Atlantis]: {
    id: PartnerId.Atlantis,
    name: "Atlantis",
    logoUrl: "/atlantis.png",
    deployedOrigin: "https://perps.atlantisdex.xyz",
    chains: [
      createPartnerChainConfig(
        partnerChains.monad,
        "0xf0Dae81C451a05e6655F37C04D3e378e518EB99D",
      ),
      createPartnerChainConfig(
        partnerChains.bsc,
        "0x5AAeD502334C59549056b3183F6eb2B4684a4dE5",
      ),
    ],
  },
  [PartnerId.Treble]: {
    id: PartnerId.Treble,
    name: "Treble",
    logoUrl: "/treble.png",
    deployedOrigin: "https://perps.trebleswap.com",
    chains: [
      createPartnerChainConfig(
        partnerChains.base,
        "0xEa69c69F101B9C9A4382BfAF9C803Da62ab03972",
      ),
    ],
  },
  [PartnerId.Ionex]: {
    id: PartnerId.Ionex,
    name: "Ionex",
    logoUrl: "/ionex.svg",
    deployedOrigin: "https://pro.ionex.trade",
    chains: [
      createPartnerChainConfig(
        partnerChains.plasma,
        "0xAb83f87A8d42a1E2b3c61fa5385FbEB2ccc102Ba",
      ),
    ],
  },
  [PartnerId.Orvex]: {
    id: PartnerId.Orvex,
    name: "Orvex",
    logoUrl: "/orvex-favicon.png",
    // Provisional Vercel origin; confirm the alias before deploying.
    deployedOrigin: "https://perps-orvex-v2.vercel.app",
    chains: [createPartnerChainConfig(partnerChains.robinhood, "0x5AAeD502334C59549056b3183F6eb2B4684a4dE5")],
  },
  [PartnerId.Fireblocks]: {
    // Temporary, explicitly requested alias for the existing Orbs Arbitrum lane.
    id: PartnerId.Orbs,
    name: "Fireblocks",
    logoUrl: "/fireblocks-partner.svg",
    deployedOrigin: "https://fireblocks-perps.vercel.app",
    chains: [orbsArbitrumChain],
  },
  [PartnerId.Carbon]: {
    id: PartnerId.Carbon,
    name: "Carbon",
    logoUrl: "/logo.svg",
    deployedOrigin: "https://project-vayme.vercel.app",
    chains: [
      createPartnerChainConfig(
        partnerChains.arbitrum,
        "0x54bF9d852CC2C4A21cA7f4a00A5bb9eE49F713F3",
      ),
    ],
  },
  [PartnerId.Global]: {
    id: PartnerId.Global,
    name: "Global",
    logoUrl: "/logo.svg",
    deployedOrigin: "https://perps-dev.orbs.network",
    chains: [
      createPartnerChainConfig(
        partnerChains.arbitrum,
        "0xd2c8793397036f6D2F60A93D3eB28295a3F1B102",
      ),
    ],
  },
} as const satisfies Record<PartnerId, PartnerOperationalConfig>;

export type PartnerRegistry = typeof partnerRegistry;
export type PartnerSelector = keyof PartnerRegistry;
