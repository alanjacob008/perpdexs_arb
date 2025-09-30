'use client';

import { useStore } from '@/lib/store';
import { Plus, X, Search } from 'lucide-react';
import { useState } from 'react';

export default function PairSelector() {
  const { availablePairs, selectedPairs, addPair, removePair } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const unselectedPairs = availablePairs.filter(
    pair => !selectedPairs.has(pair.symbol) &&
    (searchQuery === '' || 
     pair.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
     pair.hyperliquidCoin.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="bg-[#141b2b] border border-gray-800/50 rounded-xl shadow-2xl p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white">
            Trading Pairs
          </h2>
          <p className="text-xs text-gray-500 mt-1">{availablePairs.length} pairs available</p>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
        >
          <Plus size={20} />
          Add
        </button>
      </div>

      {/* Selected Pairs */}
      <div className="space-y-2 mb-4">
        {selectedPairs.size === 0 ? (
          <p className="text-gray-500 text-sm italic text-center py-4">
            No pairs selected
          </p>
        ) : (
          Array.from(selectedPairs).map(symbol => {
            const pair = availablePairs.find(p => p.symbol === symbol);
            return (
              <div
                key={symbol}
                className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg hover:bg-blue-500/20 transition-all"
              >
                <div>
                  <span className="font-semibold text-gray-200">{symbol}</span>
                  <div className="text-xs text-gray-500 mt-1">
                    Market {pair?.lighterMarketId}
                  </div>
                </div>
                <button
                  onClick={() => removePair(symbol)}
                  className="p-1 hover:bg-red-500/20 rounded transition-colors"
                  title="Remove pair"
                >
                  <X size={18} className="text-red-400" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Available Pairs Dropdown */}
      {isOpen && (
        <div className="border border-gray-800/50 rounded-lg p-4 bg-[#1a2332]/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-300">Available Pairs</h3>
            <button
              onClick={() => {
                setIsOpen(false);
                setSearchQuery('');
              }}
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Search Input */}
          <div className="relative mb-3">
            <Search size={18} className="absolute left-3 top-2.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search pairs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#0a0e17] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200 placeholder-gray-600"
              autoFocus
            />
          </div>

          {/* Pairs List */}
          <div className="max-h-96 overflow-y-auto space-y-2 custom-scrollbar">
            {unselectedPairs.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                {searchQuery ? 'No pairs found' : 'All pairs selected'}
              </p>
            ) : (
              unselectedPairs.map(pair => (
                <button
                  key={pair.symbol}
                  onClick={() => {
                    addPair(pair.symbol);
                    setSearchQuery('');
                  }}
                  className="w-full text-left p-3 bg-[#0a0e17]/50 hover:bg-blue-500/10 rounded-lg border border-gray-800/50 hover:border-blue-500/50 transition-all"
                >
                  <div className="font-semibold text-gray-200">{pair.symbol}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {pair.hyperliquidCoin} • Market {pair.lighterMarketId}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
