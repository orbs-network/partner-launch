/** Numeric chain entries from Spot config.json; the "*" entry is shared defaults.
 * Snapshot: https://github.com/orbs-network/spot/blob/3b0fba9b91c696033a9d61b965ec4ed179b09c31/config.json
 * Display metadata is independent of perpetual lanes and wallet configuration.
 */
export const spotSupportedChains = [
  { id: 42161, name: "Arbitrum One", logo: "/chain-logos/42161.svg" },
  { id: 43114, name: "Avalanche", logo: "/chain-logos/43114.webp" },
  { id: 8453, name: "Base", logo: "/chain-logos/8453.svg" },
  { id: 80094, name: "Berachain", logo: "/chain-logos/80094.webp" },
  { id: 56, name: "BNB Smart Chain", logo: "/chain-logos/56.svg" },
  { id: 1, name: "Ethereum", logo: "/chain-logos/1.svg" },
  { id: 14, name: "Flare", logo: "/chain-logos/14.webp" },
  { id: 999, name: "HyperEVM", logo: "/chain-logos/999.webp" },
  { id: 57073, name: "Ink", logo: "/chain-logos/57073.webp" },
  { id: 747474, name: "Katana", logo: "/chain-logos/747474.webp" },
  { id: 59144, name: "Linea", logo: "/chain-logos/59144.webp" },
  { id: 5000, name: "Mantle", logo: "/chain-logos/5000.webp" },
  { id: 4326, name: "MegaETH", logo: "/chain-logos/4326.webp" },
  { id: 143, name: "Monad", logo: "/chain-logos/143.png" },
  { id: 10, name: "OP Mainnet", logo: "/chain-logos/10.webp" },
  { id: 9745, name: "Plasma", logo: "/chain-logos/9745.svg" },
  { id: 137, name: "Polygon", logo: "/chain-logos/137.png" },
  { id: 4663, name: "Robinhood Chain", logo: "/chain-logos/4663.jpg" },
  { id: 1329, name: "Sei Network", logo: "/chain-logos/1329.svg" },
  { id: 146, name: "Sonic", logo: "/chain-logos/146.png" },
  { id: 130, name: "Unichain", logo: "/chain-logos/130.webp" },
  { id: 196, name: "X Layer", logo: "/chain-logos/196.webp" },
] as const;
