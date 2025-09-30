import { OrderParams, OrderResult, Position, Balance } from './types';

/**
 * Lighter Trading Client
 * Documentation: https://docs.lighter.xyz/
 */
export class LighterTrading {
  private apiUrl = 'https://api.lighter.xyz';
  private apiKey: string;
  private apiSecret: string;
  private walletAddress: string;

  constructor(apiKey: string, apiSecret: string, walletAddress: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.walletAddress = walletAddress;
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<Balance> {
    try {
      // Lighter API endpoint - adjust based on actual API
      const response = await fetch(`${this.apiUrl}/api/v1/balances`, {
        method: 'GET',
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      
      // Parse balance based on Lighter's response format
      return {
        total: parseFloat(data.total || '0'),
        available: parseFloat(data.available || '0'),
        locked: parseFloat(data.locked || '0'),
        currency: 'USDC',
      };
    } catch (error) {
      console.error('Lighter getBalance error:', error);
      throw error;
    }
  }

  /**
   * Get open positions
   */
  async getPositions(): Promise<Position[]> {
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/positions`, {
        method: 'GET',
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      const positions: Position[] = [];

      for (const pos of data.positions || []) {
        const size = Math.abs(parseFloat(pos.size || '0'));
        if (size === 0) continue;

        const side = parseFloat(pos.size) > 0 ? 'long' : 'short';
        const entryPrice = parseFloat(pos.entryPrice || '0');
        const markPrice = parseFloat(pos.markPrice || entryPrice);
        const unrealizedPnl = parseFloat(pos.unrealizedPnl || '0');

        positions.push({
          exchange: 'lighter',
          symbol: pos.market || pos.symbol,
          side,
          size,
          entryPrice,
          markPrice,
          unrealizedPnl,
          unrealizedPnlPercent: (unrealizedPnl / (size * entryPrice)) * 100,
          timestamp: Date.now(),
        });
      }

      return positions;
    } catch (error) {
      console.error('Lighter getPositions error:', error);
      throw error;
    }
  }

  /**
   * Place a limit order
   */
  async placeLimitOrder(params: OrderParams): Promise<OrderResult> {
    try {
      // Lighter requires signing - this is a placeholder
      const orderPayload = {
        market: params.symbol,
        side: params.side === 'buy' || params.side === 'long' ? 'buy' : 'sell',
        price: params.price?.toString(),
        size: params.size.toString(),
        orderType: params.orderType,
        timeInForce: params.timeInForce || 'GTC',
        reduceOnly: params.reduceOnly || false,
        postOnly: params.postOnly || false,
      };

      // TODO: Implement proper request signing
      // Lighter likely requires HMAC signature or wallet signature
      return {
        success: false,
        error: 'Signing not implemented - need to add request signing for Lighter',
        message: 'Order payload: ' + JSON.stringify(orderPayload, null, 2)
      };

      // Actual implementation would be:
      // const signature = await this.signRequest(orderPayload);
      // const response = await fetch(`${this.apiUrl}/api/v1/orders`, {
      //   method: 'POST',
      //   headers: {
      //     'X-API-KEY': this.apiKey,
      //     'X-SIGNATURE': signature,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(orderPayload),
      // });
      // return parsed response
    } catch (error) {
      console.error('Lighter placeLimitOrder error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Close a position by placing an opposite order
   */
  async closePosition(symbol: string, size: number, side: 'long' | 'short'): Promise<OrderResult> {
    const oppositeSide = side === 'long' ? 'sell' : 'buy';
    
    return this.placeLimitOrder({
      symbol,
      side: oppositeSide,
      size,
      orderType: 'market',
      reduceOnly: true,
    });
  }

  /**
   * Get market info including limits and requirements
   */
  async getMarketInfo(symbol: string) {
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/markets/${symbol}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Lighter getMarketInfo error:', error);
      throw error;
    }
  }
}

