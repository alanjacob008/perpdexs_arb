// Exchange Types
export interface PairInfo {
  symbol: string; // "BTC-USD", "ETH-USD"
  hyperliquidCoin: string; // "BTC", "ETH"
  lighterMarketId: number; // 0, 1, 2
  lighterSymbol: string; // "BTC-USD", "ETH-USD"
}

export interface PriceUpdate {
  timestamp: number;
  symbol: string;
  hyperliquidPrice: number | null;
  lighterPrice: number | null;
  spread: number | null; // lighter - hyperliquid
  spreadPct: number | null; // percentage
}

export interface AggregatedData {
  timestamp: number; // Start of 5-min window
  symbol: string;
  avgHyperliquidPrice: number;
  avgLighterPrice: number;
  avgSpread: number;
  avgSpreadPct: number;
  minSpread: number;
  maxSpread: number;
  dataPoints: number;
}

// WebSocket Message Types
export interface HyperliquidAllMidsMessage {
  channel: string;
  data: {
    mids: Record<string, string>;
  };
}

export interface LighterMarketStatsMessage {
  channel: string;
  market_stats: {
    market_id: number;
    index_price: string;
    mark_price: string;
    last_trade_price: string;
    [key: string]: any;
  };
  type: string;
}

// Store State
export interface AppState {
  selectedPairs: Set<string>;
  availablePairs: PairInfo[];
  latestPrices: Map<string, PriceUpdate>;
  isConnected: {
    hyperliquid: boolean;
    lighter: boolean;
  };
}


