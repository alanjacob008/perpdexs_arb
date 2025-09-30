import { PairInfo } from './types';

// Correct market ID to coin mappings from Lighter API
// Note: Some Lighter markets have "1000X" prefix which we normalize to "X" for Hyperliquid matching
const LIGHTER_MARKET_MAP: Record<number, string> = {
  0: 'ETH',
  1: 'BTC',
  2: 'SOL',
  3: 'DOGE',
  4: 'PEPE',      // Lighter: 1000PEPE
  5: 'WIF',
  6: 'WLD',
  7: 'XRP',
  8: 'LINK',
  9: 'AVAX',
  10: 'NEAR',
  11: 'DOT',
  12: 'TON',
  13: 'TAO',
  14: 'POL',       // Previously MATIC
  15: 'TRUMP',
  16: 'SUI',
  17: 'SHIB',      // Lighter: 1000SHIB
  18: 'BONK',      // Lighter: 1000BONK
  19: 'FLOKI',     // Lighter: 1000FLOKI
  20: 'BERA',
  21: 'FARTCOIN',
  22: 'AI16Z',
  23: 'POPCAT',
  24: 'HYPE',
  25: 'BNB',
  26: 'JUP',
  27: 'AAVE',
  28: 'MKR',
  29: 'ENA',
  30: 'UNI',
  31: 'APT',
  32: 'SEI',
  33: 'KAITO',
  34: 'IP',
  35: 'LTC',
  36: 'CRV',
  37: 'PENDLE',
  38: 'ONDO',
  39: 'ADA',
  40: 'S',
  41: 'VIRTUAL',
  42: 'SPX',
  43: 'TRX',
  44: 'SYRUP',
  45: 'PUMP',
  46: 'LDO',
  47: 'PENGU',
  48: 'PAXG',
  49: 'EIGEN',
  50: 'ARB',
  51: 'RESOLV',
  52: 'GRASS',
  53: 'ZORA',
  54: 'LAUNCHCOIN',
  55: 'OP',
  56: 'ZK',
  57: 'PROVE',
  58: 'BCH',
  59: 'HBAR',
  60: 'ZRO',
  61: 'GMX',
  62: 'DYDX',
  63: 'MNT',
  64: 'ETHFI',
  65: 'AERO',
  66: 'USELESS',
  67: 'TIA',
  68: 'MORPHO',
  69: 'VVV',
  70: 'YZY',
  71: 'XPL',
  72: 'WLFI',
  73: 'CRO',
  74: 'NMR',
  75: 'DOLO',
  76: 'LINEA',
  77: 'XMR',
  78: 'PYTH',
  79: 'SKY',
  80: 'MYX',
  81: 'TOSHI',     // Lighter: 1000TOSHI
  82: 'AVNT',
  83: 'ASTER',
  84: '0G',
  85: 'STBL',
  86: 'APEX',
  87: 'FF',
};

// Reverse map for quick lookups
const COIN_TO_LIGHTER_MARKET: Record<string, number> = {};
Object.entries(LIGHTER_MARKET_MAP).forEach(([marketId, coin]) => {
  COIN_TO_LIGHTER_MARKET[coin] = parseInt(marketId);
});

// Build initial mappings from known markets
export const KNOWN_PAIR_MAPPINGS: PairInfo[] = Object.entries(LIGHTER_MARKET_MAP).map(([marketId, coin]) => ({
  symbol: `${coin}-USD`,
  hyperliquidCoin: coin,
  lighterMarketId: parseInt(marketId),
  lighterSymbol: `${coin}-USD`
}));

// Fetch available pairs from Hyperliquid API
export async function fetchHyperliquidPairs(): Promise<string[]> {
  try {
    const response = await fetch('https://api.hyperliquid.xyz/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'meta' })
    });
    
    const data = await response.json();
    // data.universe contains array of {name: "BTC", ...}
    return data.universe?.map((u: any) => u.name) || [];
  } catch (error) {
    console.error('Error fetching Hyperliquid pairs:', error);
    return KNOWN_PAIR_MAPPINGS.map(p => p.hyperliquidCoin);
  }
}

// Fetch available markets from Lighter API
export async function fetchLighterMarkets(): Promise<Array<{id: number, symbol: string}>> {
  try {
    const response = await fetch('https://mainnet.zklighter.elliot.ai/api/markets');
    const data = await response.json();
    
    // Parse response to get market IDs and symbols
    return data.markets?.map((m: any) => ({
      id: m.market_id,
      symbol: m.symbol
    })) || [];
  } catch (error) {
    console.error('Error fetching Lighter markets:', error);
    return KNOWN_PAIR_MAPPINGS.map(p => ({
      id: p.lighterMarketId,
      symbol: p.lighterSymbol
    }));
  }
}

// Match pairs between exchanges
export function matchPairs(
  hyperliquidCoins: string[],
  lighterMarkets: Array<{id: number, symbol: string}>
): PairInfo[] {
  const matched: PairInfo[] = [];
  
  // First, use our known mappings as base
  const knownCoins = new Set(Object.values(LIGHTER_MARKET_MAP));
  
  for (const pair of KNOWN_PAIR_MAPPINGS) {
    // Only include if coin exists on Hyperliquid
    if (hyperliquidCoins.includes(pair.hyperliquidCoin)) {
      matched.push(pair);
    }
  }
  
  return matched.length > 0 ? matched : KNOWN_PAIR_MAPPINGS;
}

// Get all available pairs (only pairs available on BOTH exchanges)
export async function getAvailablePairs(): Promise<PairInfo[]> {
  try {
    const hlCoins = await fetchHyperliquidPairs();
    
    // Filter known mappings to only include coins available on Hyperliquid
    // Hardcoded: Exclude MKR-USD
    const availablePairs = KNOWN_PAIR_MAPPINGS.filter(pair =>
      hlCoins.includes(pair.hyperliquidCoin) && pair.symbol !== 'MKR-USD'
    );
    
    console.log(`Found ${availablePairs.length} matching pairs across both exchanges (MKR-USD excluded)`);
    return availablePairs.length > 0 ? availablePairs : KNOWN_PAIR_MAPPINGS.filter(p => p.symbol !== 'MKR-USD');
  } catch (error) {
    console.error('Error getting available pairs:', error);
    return KNOWN_PAIR_MAPPINGS.filter(p => p.symbol !== 'MKR-USD');
  }
}

