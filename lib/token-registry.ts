// Client configuration utility managing supported stablecoin assets on Arc Testnet

export interface TokenConfig {
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
  icon: string; // Dynamic currency icons ($, €)
  explorerUrl: string;
}

export const SUPPORTED_TOKENS: Record<string, TokenConfig> = {
  USDC: {
    address: '0x3600000000000000000000000000000000000000',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    icon: '$',
    explorerUrl: 'https://testnet.arcscan.app/address/0x3600000000000000000000000000000000000000',
  },
  EURC: {
    address: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a',
    symbol: 'EURC',
    name: 'Euro Coin',
    decimals: 6,
    icon: '€',
    explorerUrl: 'https://testnet.arcscan.app/address/0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a',
  },
};

export function getTokenByAddress(address?: string): TokenConfig | undefined {
  if (!address) return undefined;
  const normalized = address.toLowerCase();
  return Object.values(SUPPORTED_TOKENS).find(
    (t) => t.address.toLowerCase() === normalized
  );
}

export function formatTokenAmount(amount: bigint | number | string, tokenAddress?: string): string {
  const token = getTokenByAddress(tokenAddress);
  const decimals = token ? token.decimals : 6;
  const amtBig = BigInt(amount.toString());
  
  // Format with correct decimals
  const formatted = (Number(amtBig) / 10**decimals).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return token ? `${token.icon}${formatted}` : `$${formatted}`;
}
