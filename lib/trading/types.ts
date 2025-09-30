export type OrderSide = 'buy' | 'sell' | 'long' | 'short';
export type OrderType = 'limit' | 'market';
export type TimeInForce = 'GTC' | 'IOC' | 'FOK'; // Good-Till-Cancel, Immediate-Or-Cancel, Fill-Or-Kill

export interface OrderParams {
  symbol: string;
  side: OrderSide;
  size: number; // quantity
  price?: number; // required for limit orders
  orderType: OrderType;
  timeInForce?: TimeInForce;
  reduceOnly?: boolean;
  postOnly?: boolean; // maker-only order
}

export interface Position {
  exchange: 'hyperliquid' | 'lighter';
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  markPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  orderId?: string;
  timestamp: number;
}

export interface OrderResult {
  success: boolean;
  orderId?: string;
  message?: string;
  error?: string;
  fillPrice?: number;
  fillSize?: number;
}

export interface Balance {
  total: number;
  available: number;
  locked: number;
  currency: string;
}

export interface ArbitrageParams {
  symbol: string;
  size: number;
  lighterPrice: number;
  hyperliquidPrice: number;
  slippagePercent: number;
}

export interface ArbitrageResult {
  success: boolean;
  lighterOrder?: OrderResult;
  hyperliquidOrder?: OrderResult;
  error?: string;
  spread: number;
  spreadPercent: number;
}

