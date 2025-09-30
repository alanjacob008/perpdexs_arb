'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { getAvailablePairs } from '@/lib/pairMapping';
import PairSelector from '@/components/PairSelector';
import ConnectionStatus from '@/components/ConnectionStatus';
import LivePrices from '@/components/LivePrices';
import SpreadChart from '@/components/SpreadChart';
import OpportunityFinder from '@/components/OpportunityFinder';
import { Download, Database, TrendingUp } from 'lucide-react';
import { db } from '@/lib/database';

export default function Home() {
  const {
    availablePairs,
    selectedPairs,
    setAvailablePairs,
    initializeWebSockets,
    disconnectWebSockets,
    exportData,
  } = useStore();

  const [dbStats, setDbStats] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Load available pairs
    getAvailablePairs().then(pairs => {
      setAvailablePairs(pairs);
      setIsInitialized(true);
    });

    // Initialize WebSockets
    initializeWebSockets();

    // Cleanup on unmount
    return () => {
      disconnectWebSockets();
    };
  }, []);

  // Update DB stats periodically
  useEffect(() => {
    const updateStats = async () => {
      const stats = await db.getStats();
      setDbStats(stats);
    };

    updateStats();
    const interval = setInterval(updateStats, 10000);

    return () => clearInterval(interval);
  }, []);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading arbitrage opportunities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-[#141b2b] shadow-xl border-b border-gray-800/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                PerpDEX Arbitrage Visualizer
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Real-time arbitrage tracking • Hyperliquid vs Lighter
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* DB Stats */}
              {dbStats && (
                <div className="flex items-center gap-2 px-4 py-2 bg-[#1a2332]/50 rounded-lg border border-gray-800/50 backdrop-blur-sm">
                  <Database size={18} className="text-blue-400" />
                  <div className="text-sm">
                    <div className="text-xs text-gray-500">Stored Updates</div>
                    <div className="font-semibold text-green-400">
                      {dbStats.totalUpdates.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              {/* Export Button */}
              <button
                onClick={exportData}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
              >
                <Download size={18} />
                Export Data
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Opportunity Finder - Full Width */}
        <div className="mb-6">
          <OpportunityFinder />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column: Pair Selector */}
          <div className="lg:col-span-1">
            <PairSelector />
          </div>

          {/* Middle Column: Connection Status */}
          <div className="lg:col-span-1">
            <ConnectionStatus />
          </div>

          {/* Right Column: Live Prices */}
          <div className="lg:col-span-1">
            <LivePrices />
          </div>
        </div>

        {/* Charts */}
        <div className="space-y-6">
          {selectedPairs.size === 0 ? (
            <div className="bg-[#141b2b] border border-gray-800/50 rounded-xl shadow-2xl p-12 text-center backdrop-blur-sm">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-full mb-4">
                <TrendingUp size={40} className="text-green-400" />
              </div>
              <p className="text-gray-300 text-lg font-semibold">
                Select pairs to visualize real-time arbitrage opportunities
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Live price charts with millisecond precision
              </p>
            </div>
          ) : (
            Array.from(selectedPairs).map(symbol => (
              <SpreadChart key={symbol} symbol={symbol} />
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#141b2b] border-t border-gray-800/50 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <p className="text-sm text-gray-500 text-center">
            Data stored locally via IndexedDB • 
            <span className="text-green-400">●</span> Live WebSocket connections
          </p>
        </div>
      </footer>
    </div>
  );
}

