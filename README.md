# PerpDEX Arbitrage Visualizer

Real-time price spread visualization between **Hyperliquid** and **Lighter** perpetual DEXs.

## Features

✅ **Real-time WebSocket Connections** to both Hyperliquid and Lighter
✅ **Mark Price Comparison** - Uses stable mark prices from both exchanges
✅ **5-Minute Aggregated Charts** - Smooth visualization with Lightweight Charts
✅ **Local Data Storage** - IndexedDB stores all price updates for analysis
✅ **Multi-Pair Tracking** - Add/remove pairs on demand
✅ **Live Spread Monitoring** - See percentage spreads in real-time
✅ **Data Export** - Download your data as JSON

## How It Works

### Price Tracking
- **Hyperliquid**: Subscribes to `allMids` channel (gets all coin mid prices)
- **Lighter**: Subscribes to `market_stats/all` channel (gets mark prices for all markets)

### Spread Calculation
```
spread = lighter_mark_price - hyperliquid_mid_price
spread_percentage = (spread / hyperliquid_mid_price) * 100
```

### Data Aggregation
- Raw updates stored in IndexedDB
- Aggregated into 5-minute buckets for chart display
- Shows: avg spread, min spread, max spread per bucket

## Getting Started

### Installation

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Usage

1. **Connect**: App automatically connects to both WebSocket APIs on load
2. **Add Pairs**: Click "Add Pair" to select trading pairs you want to track
3. **Monitor**: Watch real-time price spreads in the Live Prices panel
4. **Analyze**: View 5-minute aggregated spread charts for each pair
5. **Export**: Click "Export Data" to download all stored price data

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Next.js App                       │
├─────────────────────────────────────────────────────┤
│  Components                                          │
│  ├── PairSelector    (Add/remove pairs)              │
│  ├── LivePrices      (Real-time spreads)             │
│  ├── SpreadChart     (5-min aggregated chart)        │
│  └── ConnectionStatus (WebSocket status)             │
├─────────────────────────────────────────────────────┤
│  State Management (Zustand)                          │
│  ├── Selected pairs                                  │
│  ├── Latest prices                                   │
│  └── Connection status                               │
├─────────────────────────────────────────────────────┤
│  WebSocket Managers                                  │
│  ├── HyperliquidWebSocket (wss://api.hyperliquid)   │
│  └── LighterWebSocket (wss://mainnet.zklighter)     │
├─────────────────────────────────────────────────────┤
│  Data Layer                                          │
│  ├── DataAggregator   (5-min buckets)               │
│  └── IndexedDB        (Dexie.js)                     │
└─────────────────────────────────────────────────────┘
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Lightweight Charts (TradingView)
- **State**: Zustand
- **Storage**: IndexedDB (Dexie.js)
- **WebSockets**: Native WebSocket API

## Pair Mapping

The app automatically matches pairs between exchanges:

| Symbol    | Hyperliquid Coin | Lighter Market ID |
|-----------|------------------|-------------------|
| ETH-USD   | ETH              | 0                 |
| BTC-USD   | BTC              | 1                 |
| SOL-USD   | SOL              | 2                 |
| ARB-USD   | ARB              | 3                 |

More pairs can be added via API discovery or manual configuration in `lib/pairMapping.ts`.

## Data Storage

- **Raw Updates**: Every price update stored with timestamp
- **Aggregated Data**: 5-minute buckets with avg/min/max spreads
- **Cleanup**: Automatically removes data older than 7 days
- **Export**: Download as JSON for external analysis

## WebSocket Reconnection

- Automatic reconnection on disconnect
- Max 5 attempts with exponential backoff
- Visual connection status indicators

## Customization

### Change Aggregation Interval

Edit `lib/dataAggregator.ts`:
```typescript
private readonly INTERVAL_MS = 5 * 60 * 1000; // Change to 1 min, 15 min, etc.
```

### Add More Pairs

Edit `lib/pairMapping.ts`:
```typescript
export const KNOWN_PAIR_MAPPINGS: PairInfo[] = [
  // Add your custom mapping
  {
    symbol: 'CUSTOM-USD',
    hyperliquidCoin: 'CUSTOM',
    lighterMarketId: 99,
    lighterSymbol: 'CUSTOM-USD'
  }
];
```

### Modify Chart Appearance

Edit `components/SpreadChart.tsx` - Lightweight Charts configuration.

## Troubleshooting

### WebSocket Connection Issues
- Check browser console for errors
- Ensure no firewall/proxy blocking WebSocket connections
- Both exchanges must be accessible

### No Data Showing
- Ensure you've selected at least one pair
- Wait a few seconds for initial price updates
- Check Connection Status panel (both should be green)

### Database Full
- Click Export Data to backup
- Clear browser data for the site
- Or adjust cleanup interval in code

## Development

### Project Structure
```
perpdexs_arb/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Main page
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components
├── lib/                   # Core logic
│   ├── types.ts          # TypeScript types
│   ├── database.ts       # IndexedDB wrapper
│   ├── store.ts          # Zustand store
│   ├── pairMapping.ts    # Pair matching logic
│   ├── dataAggregator.ts # 5-min aggregation
│   └── websocket/        # WebSocket managers
├── package.json
└── tsconfig.json
```

## License

MIT

## Contributing

Feel free to open issues or submit PRs for improvements!

## Acknowledgments

- [Hyperliquid](https://hyperliquid.xyz/) - High-performance perpetual DEX
- [Lighter](https://lighter.xyz/) - zkSync-based perpetual DEX
- [Lightweight Charts](https://tradingview.github.io/lightweight-charts/) - TradingView charting library

