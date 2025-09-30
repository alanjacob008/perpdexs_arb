'use client';

import { useStore } from '@/lib/store';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

function formatPrice(price: number): string {
  if (price >= 1000) return price.toFixed(2);
  if (price >= 1) return price.toFixed(4);
  if (price >= 0.01) return price.toFixed(5);
  return price.toFixed(6);
}

export default function LivePrices() {
  const { selectedPairs, latestPrices } = useStore();

  if (selectedPairs.size === 0) {
    return (
      <div className="bg-[#141b2b] border border-gray-800/50 rounded-xl shadow-2xl p-6 backdrop-blur-sm">
        <h3 className="text-lg font-bold text-white mb-3">
          Live Prices
        </h3>
        <p className="text-gray-500 text-sm text-center py-4">Select pairs to see live prices</p>
      </div>
    );
  }

  return (
    <div className="bg-[#141b2b] border border-gray-800/50 rounded-xl shadow-2xl p-6 backdrop-blur-sm">
      <h3 className="text-lg font-bold text-white mb-4">
        Live Prices
      </h3>
      
      <div className="space-y-3">
        {Array.from(selectedPairs).map(symbol => {
          const priceData = latestPrices.get(symbol);
          
          if (!priceData) {
            return (
              <div key={symbol} className="p-4 bg-[#1a2332]/50 border border-gray-800/50 rounded-lg">
                <div className="font-semibold text-gray-300 mb-2">{symbol}</div>
                <p className="text-sm text-gray-500">Waiting...</p>
              </div>
            );
          }

          const spreadIsPositive = priceData.spread! > 0;
          const spreadIsZero = Math.abs(priceData.spread!) < 0.01;

          return (
            <div key={symbol} className="p-4 bg-[#1a2332]/50 border border-gray-800/50 rounded-lg hover:bg-[#1a2332]/80 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-gray-200">{symbol}</span>
                <div className="flex items-center gap-1">
                  {spreadIsZero ? (
                    <Minus size={16} className="text-gray-500" />
                  ) : spreadIsPositive ? (
                    <TrendingUp size={16} className="text-green-400" />
                  ) : (
                    <TrendingDown size={16} className="text-red-400" />
                  )}
                  <span className={`font-bold ${
                    spreadIsZero ? 'text-gray-500' :
                    spreadIsPositive ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {priceData.spreadPct!.toFixed(2)}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-2 bg-[#0a0e17]/50 rounded border border-gray-800/50">
                  <div className="text-xs text-gray-500 mb-1">Hyperliquid</div>
                  <div className="font-mono font-semibold text-green-400">
                    ${formatPrice(priceData.hyperliquidPrice!)}
                  </div>
                </div>
                <div className="p-2 bg-[#0a0e17]/50 rounded border border-gray-800/50">
                  <div className="text-xs text-gray-500 mb-1">Lighter</div>
                  <div className="font-mono font-semibold text-blue-400">
                    ${formatPrice(priceData.lighterPrice!)}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-800/50">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Spread:</span>
                  <span className="font-mono font-semibold text-gray-300">
                    ${formatPrice(Math.abs(priceData.spread!))}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
