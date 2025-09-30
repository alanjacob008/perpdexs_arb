import { PairInfo } from '../types';

export class HyperliquidWebSocket {
  private ws: WebSocket | null = null;
  private url = 'wss://api.hyperliquid.xyz/ws';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private subscribedCoins: Set<string> = new Set();
  private onPriceUpdate: (coin: string, price: number) => void;
  private onConnectionChange: (connected: boolean) => void;

  constructor(
    onPriceUpdate: (coin: string, price: number) => void,
    onConnectionChange: (connected: boolean) => void
  ) {
    this.onPriceUpdate = onPriceUpdate;
    this.onConnectionChange = onConnectionChange;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('[Hyperliquid] Connected');
        this.reconnectAttempts = 0;
        this.onConnectionChange(true);
        
        // Subscribe to allMids (gets all coins at once)
        this.subscribeToAllMids();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('[Hyperliquid] Error parsing message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[Hyperliquid] WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('[Hyperliquid] Disconnected');
        this.onConnectionChange(false);
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('[Hyperliquid] Connection error:', error);
      this.attemptReconnect();
    }
  }

  private subscribeToAllMids() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const subscription = {
      method: 'subscribe',
      subscription: { type: 'allMids' }
    };

    this.ws.send(JSON.stringify(subscription));
    console.log('[Hyperliquid] Subscribed to allMids');
  }

  private handleMessage(message: any) {
    // Handle subscription response
    if (message.channel === 'subscriptionResponse') {
      console.log('[Hyperliquid] Subscription confirmed');
      return;
    }

    // Handle allMids updates
    if (message.channel === 'allMids' && message.data?.mids) {
      const mids = message.data.mids;
      
      // Process each coin we're interested in
      for (const [coin, priceStr] of Object.entries(mids)) {
        if (this.subscribedCoins.size === 0 || this.subscribedCoins.has(coin)) {
          const price = parseFloat(priceStr as string);
          if (!isNaN(price)) {
            this.onPriceUpdate(coin, price);
          }
        }
      }
    }
  }

  // Set which coins to track (empty set = track all)
  setTrackedCoins(coins: string[]) {
    this.subscribedCoins = new Set(coins);
    console.log('[Hyperliquid] Tracking coins:', Array.from(this.subscribedCoins));
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[Hyperliquid] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    
    console.log(`[Hyperliquid] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
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

