import { create } from 'zustand';
import { PairInfo, PriceUpdate } from './types';
import { HyperliquidWebSocket } from './websocket/hyperliquid';
import { LighterWebSocket } from './websocket/lighter';
import { db } from './database';
import { DataAggregator } from './dataAggregator';

interface AppStore {
  // Data
  availablePairs: PairInfo[];
  selectedPairs: Set<string>;
  latestPrices: Map<string, PriceUpdate>;
  allPrices: Map<string, PriceUpdate>; // Track ALL pairs for opportunity finding
  
  // Connection status
  isConnectedHyperliquid: boolean;
  isConnectedLighter: boolean;
  
  // WebSocket instances
  hyperliquidWs: HyperliquidWebSocket | null;
  lighterWs: LighterWebSocket | null;
  
  // Data aggregator
  aggregator: DataAggregator;
  
  // Temporary price storage
  tempPrices: Map<string, { hyperliquid?: number; lighter?: number }>;
  
  // Actions
  setAvailablePairs: (pairs: PairInfo[]) => void;
  addPair: (symbol: string) => void;
  removePair: (symbol: string) => void;
  initializeWebSockets: () => void;
  disconnectWebSockets: () => void;
  updateHyperliquidPrice: (coin: string, price: number) => void;
  updateLighterPrice: (marketId: number, price: number) => void;
  exportData: () => Promise<void>;
}

export const useStore = create<AppStore>((set, get) => ({
  // Initial state
  availablePairs: [],
  selectedPairs: new Set(),
  latestPrices: new Map(),
  allPrices: new Map(),
  isConnectedHyperliquid: false,
  isConnectedLighter: false,
  hyperliquidWs: null,
  lighterWs: null,
  aggregator: new DataAggregator(),
  tempPrices: new Map(),

  // Set available pairs
  setAvailablePairs: (pairs) => set({ availablePairs: pairs }),

  // Add a pair to track
  addPair: (symbol) => {
    const state = get();
    const newSelectedPairs = new Set(state.selectedPairs);
    newSelectedPairs.add(symbol);
    
    // Update WebSocket subscriptions
    const pair = state.availablePairs.find(p => p.symbol === symbol);
    if (pair) {
      if (state.hyperliquidWs) {
        const coins = Array.from(newSelectedPairs)
          .map(s => state.availablePairs.find(p => p.symbol === s)?.hyperliquidCoin)
          .filter(Boolean) as string[];
        state.hyperliquidWs.setTrackedCoins(coins);
      }
      
      if (state.lighterWs) {
        const markets = new Map(
          Array.from(newSelectedPairs)
            .map(s => state.availablePairs.find(p => p.symbol === s))
            .filter(Boolean)
            .map(p => [p!.lighterMarketId, p!.symbol])
        );
        state.lighterWs.setTrackedMarkets(markets);
      }
    }
    
    set({ selectedPairs: newSelectedPairs });
  },

  // Remove a pair
  removePair: (symbol) => {
    const state = get();
    const newSelectedPairs = new Set(state.selectedPairs);
    newSelectedPairs.delete(symbol);
    
    // Update WebSocket subscriptions
    if (state.hyperliquidWs) {
      const coins = Array.from(newSelectedPairs)
        .map(s => state.availablePairs.find(p => p.symbol === s)?.hyperliquidCoin)
        .filter(Boolean) as string[];
      state.hyperliquidWs.setTrackedCoins(coins);
    }
    
    if (state.lighterWs) {
      const markets = new Map(
        Array.from(newSelectedPairs)
          .map(s => state.availablePairs.find(p => p.symbol === s))
          .filter(Boolean)
          .map(p => [p!.lighterMarketId, p!.symbol])
      );
      state.lighterWs.setTrackedMarkets(markets);
    }
    
    set({ selectedPairs: newSelectedPairs });
  },

  // Initialize WebSocket connections
  initializeWebSockets: () => {
    const state = get();
    
    if (!state.hyperliquidWs) {
      const hlWs = new HyperliquidWebSocket(
        (coin, price) => get().updateHyperliquidPrice(coin, price),
        (connected) => set({ isConnectedHyperliquid: connected })
      );
      hlWs.connect();
      set({ hyperliquidWs: hlWs });
    }
    
    if (!state.lighterWs) {
      const ltWs = new LighterWebSocket(
        (marketId, price) => get().updateLighterPrice(marketId, price),
        (connected) => set({ isConnectedLighter: connected }),
        (markets) => {
          // Discover markets dynamically from Lighter
          const state = get();
          const hlCoins = new Set(state.availablePairs.map(p => p.hyperliquidCoin));
          const newPairs: PairInfo[] = [];
          
          // Map known market IDs to coins (CORRECT mapping from Lighter API)
          const marketToCoin: Record<number, string> = {
            0: 'ETH', 1: 'BTC', 2: 'SOL', 3: 'DOGE', 4: 'PEPE', 5: 'WIF',
            6: 'WLD', 7: 'XRP', 8: 'LINK', 9: 'AVAX', 10: 'NEAR', 11: 'DOT',
            12: 'TON', 13: 'TAO', 14: 'POL', 15: 'TRUMP', 16: 'SUI', 17: 'SHIB',
            18: 'BONK', 19: 'FLOKI', 20: 'BERA', 21: 'FARTCOIN', 22: 'AI16Z', 23: 'POPCAT',
            24: 'HYPE', 25: 'BNB', 26: 'JUP', 27: 'AAVE', 28: 'MKR', 29: 'ENA',
            30: 'UNI', 31: 'APT', 32: 'SEI', 33: 'KAITO', 34: 'IP', 35: 'LTC',
            36: 'CRV', 37: 'PENDLE', 38: 'ONDO', 39: 'ADA', 40: 'S', 41: 'VIRTUAL',
            42: 'SPX', 43: 'TRX', 44: 'SYRUP', 45: 'PUMP', 46: 'LDO', 47: 'PENGU',
            48: 'PAXG', 49: 'EIGEN', 50: 'ARB', 51: 'RESOLV', 52: 'GRASS', 53: 'ZORA',
            54: 'LAUNCHCOIN', 55: 'OP', 56: 'ZK', 57: 'PROVE', 58: 'BCH', 59: 'HBAR',
            60: 'ZRO', 61: 'GMX', 62: 'DYDX', 63: 'MNT', 64: 'ETHFI', 65: 'AERO',
            66: 'USELESS', 67: 'TIA', 68: 'MORPHO', 69: 'VVV', 70: 'YZY', 71: 'XPL',
            72: 'WLFI', 73: 'CRO', 74: 'NMR', 75: 'DOLO', 76: 'LINEA', 77: 'XMR',
            78: 'PYTH', 79: 'SKY', 80: 'MYX', 81: 'TOSHI', 82: 'AVNT', 83: 'ASTER',
            84: '0G', 85: 'STBL', 86: 'APEX', 87: 'FF',
          };
          
          for (const [marketId, _] of markets) {
            const coin = marketToCoin[marketId];
            const symbol = `${coin}-USD`;
            
            // Hardcoded: Exclude MKR-USD
            if (symbol === 'MKR-USD') continue;
            
            if (coin && hlCoins.has(coin)) {
              const existingPair = state.availablePairs.find(p => p.lighterMarketId === marketId);
              if (!existingPair) {
                newPairs.push({
                  symbol,
                  hyperliquidCoin: coin,
                  lighterMarketId: marketId,
                  lighterSymbol: symbol
                });
              }
            }
          }
          
          if (newPairs.length > 0) {
            console.log(`[Discovery] Found ${newPairs.length} new pairs`);
            const updatedPairs = [...state.availablePairs, ...newPairs];
            set({ availablePairs: updatedPairs });
          }
        }
      );
      ltWs.connect();
      set({ lighterWs: ltWs });
    }
  },

  // Disconnect WebSockets
  disconnectWebSockets: () => {
    const state = get();
    state.hyperliquidWs?.disconnect();
    state.lighterWs?.disconnect();
    set({ 
      hyperliquidWs: null, 
      lighterWs: null,
      isConnectedHyperliquid: false,
      isConnectedLighter: false
    });
  },

  // Update Hyperliquid price
  updateHyperliquidPrice: (coin, price) => {
    const state = get();
    const pair = state.availablePairs.find(p => p.hyperliquidCoin === coin);
    
    if (!pair) return;
    
    // Get or create temp price entry
    let tempPrice = state.tempPrices.get(pair.symbol) || {};
    tempPrice = { ...tempPrice, hyperliquid: price };
    
    // If we have both prices, create update
    if (tempPrice.hyperliquid !== undefined && tempPrice.lighter !== undefined) {
      const spread = tempPrice.lighter - tempPrice.hyperliquid;
      const spreadPct = (spread / tempPrice.hyperliquid) * 100;
      
      const update: PriceUpdate = {
        timestamp: Date.now(),
        symbol: pair.symbol,
        hyperliquidPrice: tempPrice.hyperliquid,
        lighterPrice: tempPrice.lighter,
        spread,
        spreadPct
      };
      
      // Always update allPrices for opportunity finding
      const newAllPrices = new Map(state.allPrices);
      newAllPrices.set(pair.symbol, update);
      set({ allPrices: newAllPrices });
      
      // Only save to DB and update display if pair is selected
      if (state.selectedPairs.has(pair.symbol)) {
        // Save to database
        db.addPriceUpdate(update);
        
        // Add to aggregator
        state.aggregator.addUpdate(update);
        
        // Update latest prices
        const newLatestPrices = new Map(state.latestPrices);
        newLatestPrices.set(pair.symbol, update);
        set({ latestPrices: newLatestPrices });
        
        // Check for completed aggregations every 10 seconds
        const completed = state.aggregator.getCompletedAggregations(Date.now());
        completed.forEach(agg => db.addAggregatedData(agg));
      }
    } else {
      // Store partial update
      const newTempPrices = new Map(state.tempPrices);
      newTempPrices.set(pair.symbol, tempPrice);
      set({ tempPrices: newTempPrices });
    }
  },

  // Update Lighter price
  updateLighterPrice: (marketId, price) => {
    const state = get();
    const pair = state.availablePairs.find(p => p.lighterMarketId === marketId);
    
    if (!pair) return;
    
    // Get or create temp price entry
    let tempPrice = state.tempPrices.get(pair.symbol) || {};
    tempPrice = { ...tempPrice, lighter: price };
    
    // If we have both prices, create update
    if (tempPrice.hyperliquid !== undefined && tempPrice.lighter !== undefined) {
      const spread = tempPrice.lighter - tempPrice.hyperliquid;
      const spreadPct = (spread / tempPrice.hyperliquid) * 100;
      
      const update: PriceUpdate = {
        timestamp: Date.now(),
        symbol: pair.symbol,
        hyperliquidPrice: tempPrice.hyperliquid,
        lighterPrice: tempPrice.lighter,
        spread,
        spreadPct
      };
      
      // Always update allPrices for opportunity finding
      const newAllPrices = new Map(state.allPrices);
      newAllPrices.set(pair.symbol, update);
      set({ allPrices: newAllPrices });
      
      // Only save to DB and update display if pair is selected
      if (state.selectedPairs.has(pair.symbol)) {
        // Save to database
        db.addPriceUpdate(update);
        
        // Add to aggregator
        state.aggregator.addUpdate(update);
        
        // Update latest prices
        const newLatestPrices = new Map(state.latestPrices);
        newLatestPrices.set(pair.symbol, update);
        set({ latestPrices: newLatestPrices });
        
        // Check for completed aggregations
        const completed = state.aggregator.getCompletedAggregations(Date.now());
        completed.forEach(agg => db.addAggregatedData(agg));
      }
    } else {
      // Store partial update
      const newTempPrices = new Map(state.tempPrices);
      newTempPrices.set(pair.symbol, tempPrice);
      set({ tempPrices: newTempPrices });
    }
  },

  // Export data
  exportData: async () => {
    const data = await db.exportData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arbitrage-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}));

