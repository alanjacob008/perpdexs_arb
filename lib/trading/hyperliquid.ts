import { OrderParams, OrderResult, Position, Balance } from './types';

/**
 * Hyperliquid Trading Client
 * Documentation: https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api
 */
export class HyperliquidTrading {
  private apiUrl: string;
  private privateKey: string;
  private accountAddress: string;

  constructor(privateKey: string, accountAddress: string, isMainnet = false) {
    this.apiUrl = isMainnet
      ? 'https://api.hyperliquid.xyz'
      : 'https://api.hyperliquid-testnet.xyz';
    this.privateKey = privateKey;
    this.accountAddress = accountAddress;
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<Balance> {
    try {
      const response = await fetch(`${this.apiUrl}/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'clearinghouseState',
          user: this.accountAddress,
        }),
      });

      const data = await response.json();
      
      // Parse balance from response
      const marginSummary = data.marginSummary;
      return {
        total: parseFloat(marginSummary.accountValue || '0'),
        available: parseFloat(marginSummary.withdrawable || '0'),
        locked: parseFloat(marginSummary.accountValue || '0') - parseFloat(marginSummary.withdrawable || '0'),
        currency: 'USDC',
      };
    } catch (error) {
      console.error('Hyperliquid getBalance error:', error);
      throw error;
    }
  }

  /**
   * Get open positions
   */
  async getPositions(): Promise<Position[]> {
    try {
      const response = await fetch(`${this.apiUrl}/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'clearinghouseState',
          user: this.accountAddress,
        }),
      });

      const data = await response.json();
      const positions: Position[] = [];

      for (const pos of data.assetPositions || []) {
        const position = pos.position;
        if (!position || position.szi === '0') continue;

        const size = Math.abs(parseFloat(position.szi));
        const side = parseFloat(position.szi) > 0 ? 'long' : 'short';
        const entryPrice = parseFloat(position.entryPx);
        const markPrice = parseFloat(pos.markPx || entryPrice);
        const unrealizedPnl = parseFloat(position.unrealizedPnl || '0');

        positions.push({
          exchange: 'hyperliquid',
          symbol: pos.position.coin,
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
      console.error('Hyperliquid getPositions error:', error);
      throw error;
    }
  }

  /**
   * Place a limit order
   * Note: In production, this needs proper signing using eth_signTypedData_v4
   * This is a placeholder that shows the structure
   */
  async placeLimitOrder(params: OrderParams): Promise<OrderResult> {
    try {
      // Hyperliquid requires signing the order with EIP-712
      // This is a simplified version - you'll need to implement proper signing
      const order = {
        asset: params.symbol,
        isBuy: params.side === 'buy' || params.side === 'long',
        limitPx: params.price?.toFixed(6),
        sz: params.size.toString(),
        reduceOnly: params.reduceOnly || false,
        orderType: {
          limit: { tif: params.timeInForce || 'Gtc' }
        }
      };

      // TODO: Implement proper EIP-712 signing
      // For now, return structure showing what's needed
      return {
        success: false,
        error: 'Signing not implemented - need to add ethers.js and sign order with EIP-712',
        message: 'Order structure: ' + JSON.stringify(order, null, 2)
      };

      // Actual implementation would be:
      // const signature = await this.signOrder(order);
      // const response = await fetch(`${this.apiUrl}/exchange`, { ... });
      // return parsed response
    } catch (error) {
      console.error('Hyperliquid placeLimitOrder error:', error);
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
   * Get available trading pairs
   */
  async getAvailablePairs(): Promise<string[]> {
    try {
      const response = await fetch(`${this.apiUrl}/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'meta' }),
      });

      const data = await response.json();
      return data.universe?.map((u: any) => u.name) || [];
    } catch (error) {
      console.error('Hyperliquid getAvailablePairs error:', error);
      return [];
    }
  }
}

