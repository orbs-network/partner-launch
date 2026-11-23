const zeroAddress = "0x0000000000000000000000000000000000000000";

const chainMetadata = {
  arbitrum: { id: 42161, name: "Arbitrum One" },
  base: { id: 8453, name: "Base" },
  bsc: { id: 56, name: "BNB Smart Chain" },
  monad: { id: 143, name: "Monad" },
  plasma: { id: 9745, name: "Plasma" },
  polygon: { id: 137, name: "Polygon" },
  robinhood: { id: 4663, name: "Robinhood Chain" },
  sei: { id: 1329, name: "Sei Network" },
  sonic: { id: 146, name: "Sonic" },
} as const;

export interface PartnerChainMetadata {
  chainId: number;
  chainName: string;
  collateralDecimals: 6 | 18;
  collateralAddress: string;
  collateralSymbol: string;
}

export interface PartnerChainConfig extends PartnerChainMetadata {
  contractAddress: string;
}

export function createPartnerChainConfig(
  chain: PartnerChainMetadata,
  contractAddress: string,
): PartnerChainConfig {
  return {
    ...chain,
    contractAddress,
  };
}

export function createPlaceholderPartnerChain(
  chain: PartnerChainMetadata,
): PartnerChainConfig {
  return createPartnerChainConfig(chain, zeroAddress);
}

export const partnerChains = {
  robinhood: {
    chainId: chainMetadata.robinhood.id,
    chainName: chainMetadata.robinhood.name,
    collateralDecimals: 6,
    collateralSymbol: "USDG",
    collateralAddress: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
  },
  arbitrum: {
    chainId: chainMetadata.arbitrum.id,
    chainName: chainMetadata.arbitrum.name,
    collateralDecimals: 6,
    collateralSymbol: "USDC",
    collateralAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  },
  polygon: {
    chainId: chainMetadata.polygon.id,
    chainName: chainMetadata.polygon.name,
    collateralDecimals: 6,
    collateralSymbol: "USDC",
    collateralAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
  },
  base: {
    chainId: chainMetadata.base.id,
    chainName: chainMetadata.base.name,
    collateralDecimals: 6,
    collateralSymbol: "USDC",
    collateralAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  },
  sei: {
    chainId: chainMetadata.sei.id,
    chainName: chainMetadata.sei.name,
    collateralDecimals: 6,
    collateralSymbol: "USDC",
    collateralAddress: "0xe15fC38F6D8c56aF07bbCBe3BAf5708A2Bf42392",
  },
  sonic: {
    chainId: chainMetadata.sonic.id,
    chainName: chainMetadata.sonic.name,
    collateralDecimals: 6,
    collateralSymbol: "USDC",
    collateralAddress: "0x29219dd400f2Bf60E5a23d13Be72B486D4038894",
  },
  bsc: {
    chainId: chainMetadata.bsc.id,
    chainName: chainMetadata.bsc.name,
    collateralDecimals: 18,
    collateralSymbol: "USDT",
    collateralAddress: "0x55d398326f99059fF775485246999027B3197955",
  },
  monad: {
    chainId: chainMetadata.monad.id,
    chainName: chainMetadata.monad.name,
    collateralDecimals: 6,
    collateralSymbol: "USDC",
    collateralAddress: "0x754704Bc059F8C67012fEd69BC8A327a5aafb603",
  },
  plasma: {
    chainId: chainMetadata.plasma.id,
    chainName: chainMetadata.plasma.name,
    collateralDecimals: 6,
    collateralSymbol: "USDT0",
    collateralAddress: "0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb",
  },
} as const satisfies Readonly<Record<string, PartnerChainMetadata>>;
