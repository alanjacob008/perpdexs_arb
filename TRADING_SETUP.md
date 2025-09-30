# Trading Implementation Guide

## Overview

This document explains the trading functionality setup for executing arbitrage trades between Hyperliquid and Lighter.

## 🚀 Quick Start

### 1. Access the Test Page

```bash
npm run dev
```

Navigate to: `http://localhost:3000/trade-test`

### 2. Get API Keys

#### Hyperliquid:
1. Go to https://app.hyperliquid.xyz/
2. Click "More" → "API"
3. Generate API Wallet
4. **IMPORTANT**: Use testnet for testing
5. Save your Private Key and Account Address securely

#### Lighter:
1. Visit https://lighter.xyz/
2. Contact support for API access
3. You'll receive: API Key, API Secret, and Wallet Address

### 3. Configure Keys

- Open `/trade-test` page
- Go to "Configuration" tab
- Enter your API credentials
- Click "Test Connection" for each exchange
- Click "Save API Keys" (stored in localStorage only)

---

## 📋 Current Status

### ✅ Implemented

1. **UI/UX**:
   - Trading test page at `/trade-test`
   - API key management interface
   - Order parameter configuration
   - Test results display

2. **Types & Structure**:
   - Complete TypeScript interfaces
   - Order types (limit, market)
   - Position tracking types
   - Balance structures

3. **Basic Clients**:
   - Hyperliquid trading client skeleton
   - Lighter trading client skeleton
   - REST API endpoint structure

### 🚧 Needs Implementation

#### 1. **Hyperliquid Order Signing**

Hyperliquid requires EIP-712 signature for orders. You need to:

```bash
npm install ethers
```

Then implement in `/lib/trading/hyperliquid.ts`:

```typescript
import { ethers } from 'ethers';

// Create wallet from private key
const wallet = new ethers.Wallet(privateKey);

// Sign order with EIP-712
const domain = {
  name: 'Hyperliquid',
  version: '1',
  chainId: 42161, // Arbitrum
  verifyingContract: '0x...' // Hyperliquid contract
};

const types = {
  Order: [
    { name: 'asset', type: 'uint32' },
    { name: 'isBuy', type: 'bool' },
    { name: 'limitPx', type: 'uint64' },
    { name: 'sz', type: 'uint64' },
    // ... other fields
  ]
};

const signature = await wallet._signTypedData(domain, types, order);
```

**Resources**:
- https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/signing
- https://github.com/hyperliquid-dex/hyperliquid-python-sdk (reference implementation)

#### 2. **Lighter Request Signing**

Lighter likely uses HMAC-SHA256 or wallet signature. You need to:

1. Check Lighter's documentation for exact signing method
2. Implement in `/lib/trading/lighter.ts`:

```typescript
import crypto from 'crypto';

// HMAC example (verify with Lighter docs)
const signature = crypto
  .createHmac('sha256', apiSecret)
  .update(timestamp + method + path + body)
  .digest('hex');
```

**Resources**:
- https://github.com/elliottech/lighter-python
- Contact Lighter support for documentation

#### 3. **Next.js API Routes**

Create server-side endpoints to securely handle trading:

`/app/api/trade/hyperliquid/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { HyperliquidTrading } from '@/lib/trading/hyperliquid';

export async function POST(request: Request) {
  const body = await request.json();
  
  // Get keys from env vars (never from client)
  const client = new HyperliquidTrading(
    process.env.HYPERLIQUID_PRIVATE_KEY!,
    process.env.HYPERLIQUID_ACCOUNT_ADDRESS!,
    process.env.HYPERLIQUID_IS_MAINNET === 'true'
  );
  
  const result = await client.placeLimitOrder(body.order);
  return NextResponse.json(result);
}
```

#### 4. **Position Tracking**

Implement WebSocket listeners or polling to track open positions in real-time.

---

## 🔐 Security Best Practices

### For Testing:
- ✅ Use testnet/demo accounts only
- ✅ Store keys in `.env.local` (never commit)
- ✅ Use small position sizes
- ❌ NEVER use mainnet keys in development

### For Production:
- Use Next.js API routes (server-side)
- Store keys in environment variables
- Implement request authentication
- Add rate limiting
- Log all trades
- Add 2FA for critical operations

---

## 🎯 Trading Flow

### Arbitrage Strategy:

1. **Detect Opportunity**:
   ```
   Lighter: $0.0058
   Hyperliquid: $0.0060
   Spread: 0.34% → ARB opportunity
   ```

2. **Execute Simultaneously**:
   - Long on Lighter (buy at $0.0058)
   - Short on Hyperliquid (sell at $0.0060)

3. **Monitor Convergence**:
   - Track both positions
   - Calculate P&L as spread narrows

4. **Close Positions**:
   - Close Lighter long (sell)
   - Close Hyperliquid short (buy)
   - Realize profit

### Order Parameters:

```typescript
{
  symbol: 'PUMP-USD',
  size: 100,              // quantity
  orderType: 'limit',     // or 'market'
  timeInForce: 'GTC',     // Good-Till-Cancel
  slippage: 0.5,          // 0.5%
  
  // Lighter position
  lighterSide: 'buy',
  lighterPrice: 0.0058,
  
  // Hyperliquid position
  hyperliquidSide: 'sell',
  hyperliquidPrice: 0.0060
}
```

---

## 📊 Order Types Explained

### Limit Order
- Specify exact price
- Only fills at your price or better
- May not fill immediately
- **Use for**: Precise entry, avoiding slippage

### Market Order
- Fills immediately at best available price
- Guaranteed execution (if liquidity exists)
- May have slippage
- **Use for**: Urgent closing, high liquidity pairs

### Time In Force:
- **GTC** (Good Till Cancel): Stays open until filled or canceled
- **IOC** (Immediate Or Cancel): Fill immediately or cancel
- **FOK** (Fill Or Kill): Fill entire order immediately or cancel

### Post Only:
- Only acts as a maker (adds liquidity)
- Rejects if would take liquidity
- Often gets maker fee rebates

### Reduce Only:
- Only reduces existing position
- Can't increase or open new position
- **Use for**: Closing positions safely

---

## 🧪 Testing Checklist

Before going live:

- [ ] API keys generated for both exchanges
- [ ] Test connection to both APIs
- [ ] Verify balance fetching works
- [ ] Test limit order placement
- [ ] Test market order placement
- [ ] Verify position tracking
- [ ] Test order cancellation
- [ ] Test position closing
- [ ] Implement error handling
- [ ] Add logging for all operations
- [ ] Test with minimum position sizes
- [ ] Verify P&L calculations

---

## 🛠️ Next Steps

1. **Install Dependencies**:
   ```bash
   npm install ethers
   ```

2. **Get API Keys**:
   - Create Hyperliquid testnet account
   - Get Lighter API access

3. **Implement Signing**:
   - Complete Hyperliquid EIP-712 signing
   - Complete Lighter request signing

4. **Create API Routes**:
   - `/api/trade/hyperliquid/place-order`
   - `/api/trade/lighter/place-order`
   - `/api/trade/get-positions`
   - `/api/trade/close-positions`

5. **Test Everything**:
   - Use `/trade-test` page
   - Start with tiny positions
   - Verify each function works

6. **Integrate into Main UI**:
   - Add ARB button to main visualizer
   - Add position tracking sidebar
   - Add quick-close functionality

---

## 📖 API Documentation References

### Hyperliquid:
- Main Docs: https://hyperliquid.gitbook.io/hyperliquid-docs/
- API Reference: https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api
- Python SDK: https://github.com/hyperliquid-dex/hyperliquid-python-sdk
- WebSocket: Already implemented in `/lib/websocket/hyperliquid.ts`

### Lighter:
- Website: https://lighter.xyz/
- Python SDK: https://github.com/elliottech/lighter-python
- WebSocket: Already implemented in `/lib/websocket/lighter.ts`

---

## ⚠️ Important Notes

1. **This is a testing framework** - Real trading requires additional security and error handling

2. **Order signing is NOT implemented** - You need to add proper cryptographic signing for both exchanges

3. **Use testnet first** - Never test with real funds

4. **Rate limits** - Both exchanges have rate limits, implement proper throttling

5. **Slippage** - Market orders can have significant slippage on low-liquidity pairs

6. **Fees** - Factor in trading fees when calculating profitability

7. **Risk management** - Implement position size limits and stop losses

---

## 💡 Trading Tips

- Start with well-known, liquid pairs (BTC, ETH)
- Use limit orders to control entry price
- Set realistic spread thresholds (> 0.3%)
- Monitor both positions simultaneously
- Have a plan to close if spread widens
- Factor in fees: taker fees ~0.05%, maker fees ~0.02%
- Be ready for failed orders or partial fills

---

## 🆘 Support

If you need help:
1. Check the test results in `/trade-test`
2. Review console logs for detailed errors
3. Verify API key permissions
4. Ensure you're on testnet
5. Check exchange status pages

**Remember**: Always test with small amounts first! 🚨

