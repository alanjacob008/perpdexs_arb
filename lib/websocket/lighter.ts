import { PairInfo } from '../types';

export class LighterWebSocket {
  private ws: WebSocket | null = null;
  private url = 'wss://mainnet.zklighter.elliot.ai/stream';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private subscribedMarkets: Map<number, string> = new Map(); // marketId -> symbol
  private onPriceUpdate: (marketId: number, price: number) => void;
  private onConnectionChange: (connected: boolean) => void;
  private onMarketsDiscovered?: (markets: Map<number, string>) => void;
  private discoveredMarkets: Map<number, string> = new Map();

  constructor(
    onPriceUpdate: (marketId: number, price: number) => void,
    onConnectionChange: (connected: boolean) => void,
    onMarketsDiscovered?: (markets: Map<number, string>) => void
  ) {
    this.onPriceUpdate = onPriceUpdate;
    this.onConnectionChange = onConnectionChange;
    this.onMarketsDiscovered = onMarketsDiscovered;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('[Lighter] Connected');
        this.reconnectAttempts = 0;
        this.onConnectionChange(true);
        
        // Subscribe to market_stats/all
        this.subscribeToAllMarketStats();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('[Lighter] Error parsing message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[Lighter] WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('[Lighter] Disconnected');
        this.onConnectionChange(false);
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('[Lighter] Connection error:', error);
      this.attemptReconnect();
    }
  }

  private subscribeToAllMarketStats() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    // Subscribe to market_stats/all to get all markets at once
    const subscription = {
      type: 'subscribe',
      channel: 'market_stats/all'
    };

    this.ws.send(JSON.stringify(subscription));
    console.log('[Lighter] Subscribed to market_stats/all');
  }

  private handleMessage(message: any) {
    // Handle "market_stats:all" format - market_stats is an object with market IDs as keys
    if (message.channel === 'market_stats:all' && message.market_stats) {
      // market_stats is like: { "0": {...}, "1": {...}, "8": {...} }
      let newMarketsFound = false;
      
      for (const [marketIdStr, stats] of Object.entries(message.market_stats)) {
        const marketId = parseInt(marketIdStr);
        const statsObj = stats as any;
        const markPrice = parseFloat(statsObj.mark_price);
        
        // Track discovered markets
        if (!this.discoveredMarkets.has(marketId)) {
          this.discoveredMarkets.set(marketId, `Market${marketId}`);
          newMarketsFound = true;
        }
        
        if (!isNaN(markPrice) && !isNaN(marketId)) {
          if (this.subscribedMarkets.size === 0 || this.subscribedMarkets.has(marketId)) {
            this.onPriceUpdate(marketId, markPrice);
          }
        }
      }
      
      // Notify about discovered markets
      if (newMarketsFound && this.onMarketsDiscovered) {
        this.onMarketsDiscovered(new Map(this.discoveredMarkets));
      }
      return;
    }
    
    // Handle individual market format: "market_stats:0", "market_stats:1", etc
    if (message.channel && message.channel.startsWith('market_stats:') && message.market_stats) {
      const stats = message.market_stats;
      const marketId = stats.market_id;
      const markPrice = parseFloat(stats.mark_price);
      
      if (!isNaN(markPrice) && !isNaN(marketId)) {
        if (this.subscribedMarkets.size === 0 || this.subscribedMarkets.has(marketId)) {
          this.onPriceUpdate(marketId, markPrice);
        }
      }
      return;
    }
    
    // Handle type-based format
    if (message.type === 'update/market_stats' && message.market_stats) {
      const stats = message.market_stats;
      const marketId = stats.market_id;
      const markPrice = parseFloat(stats.mark_price);
      
      if (!isNaN(markPrice) && !isNaN(marketId)) {
        if (this.subscribedMarkets.size === 0 || this.subscribedMarkets.has(marketId)) {
          this.onPriceUpdate(marketId, markPrice);
        }
      }
    }
  }

  // Set which markets to track (empty map = track all)
  setTrackedMarkets(markets: Map<number, string>) {
    this.subscribedMarkets = markets;
    console.log('[Lighter] Tracking markets:', Array.from(this.subscribedMarkets.entries()));
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[Lighter] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    
    console.log(`[Lighter] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

