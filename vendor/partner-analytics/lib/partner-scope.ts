/** The exact lane authorized and queried by the analytics service. */
export interface PartnerOperationalConfig {
  id: string;
  chains: readonly { chainId: number }[];
}
