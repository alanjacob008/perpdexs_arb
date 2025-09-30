'use client';

import { useStore } from '@/lib/store';
import { useEffect, useState } from 'react';
import { TrendingUp, RefreshCw, Pause, Play, Activity, ChevronDown, ChevronUp } from 'lucide-react';

interface Opportunity {
  symbol: string;
  avgSpread: number;
  avgSpreadPct: number;
  maxSpread: number;
  minSpread: number;
  dataPoints: number;
  currentPrice: number;
}

export default function OpportunityFinder() {
  const { availablePairs, allPrices, addPair } = useStore();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);
  const [totalDataPoints, setTotalDataPoints] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [dataHistory] = useState<Map<string, Array<{spread: number, spreadPct: number, timestamp: number}>>>(
    new Map()
  );

  // Track last 30 data points for each pair
  useEffect(() => {
    if (isPaused) return;
    
    let newDataAdded = false;
    for (const [symbol, priceData] of allPrices.entries()) {
      if (!priceData.spread || !priceData.spreadPct) continue;
      
      if (!dataHistory.has(symbol)) {
        dataHistory.set(symbol, []);
      }
      
      const history = dataHistory.get(symbol)!;
      
      const lastTimestamp = history.length > 0 ? history[history.length - 1].timestamp : 0;
      if (priceData.timestamp > lastTimestamp) {
        history.push({
          spread: priceData.spread,
          spreadPct: priceData.spreadPct,
          timestamp: priceData.timestamp
        });
        newDataAdded = true;
        
        if (history.length > 30) {
          history.shift();
        }
      }
    }
    
    if (newDataAdded) {
      setIsCollecting(true);
      setTimeout(() => setIsCollecting(false), 300);
    }
    
    let total = 0;
    dataHistory.forEach(h => total += h.length);
    setTotalDataPoints(total);
  }, [allPrices, isPaused]);

  const analyzeOpportunities = () => {
    setIsAnalyzing(true);
    setIsExpanded(true);
    
    const opps: Opportunity[] = [];
    
    for (const [symbol, history] of dataHistory.entries()) {
      if (history.length < 5) continue;
      
      const spreads = history.map(h => h.spread);
      const spreadPcts = history.map(h => h.spreadPct);
      
      const avgSpread = spreads.reduce((a, b) => a + b, 0) / spreads.length;
      const avgSpreadPct = spreadPcts.reduce((a, b) => a + b, 0) / spreadPcts.length;
      const maxSpread = Math.max(...spreads.map(s => Math.abs(s)));
      const minSpread = Math.min(...spreads.map(s => Math.abs(s)));
      
      const latestPrice = allPrices.get(symbol);
      
      opps.push({
        symbol,
        avgSpread,
        avgSpreadPct: Math.abs(avgSpreadPct),
        maxSpread,
        minSpread,
        dataPoints: history.length,
        currentPrice: latestPrice?.hyperliquidPrice || 0
      });
    }
    
    opps.sort((a, b) => b.avgSpreadPct - a.avgSpreadPct);
    
    setOpportunities(opps.slice(0, 10));
    setIsAnalyzing(false);
  };

  return (
    <div className={`bg-[#141b2b] border rounded-xl shadow-2xl transition-all duration-300 backdrop-blur-sm ${
      isCollecting && !isPaused ? 'border-green-500/50 shadow-green-500/20' : 'border-gray-800/50'
    }`}>
      {/* Header - Always Visible */}
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity group"
            >
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                🎯 Best Opportunities
                {isCollecting && !isPaused && (
                  <span className="inline-flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                )}
              </h2>
              {isExpanded ? (
                <ChevronUp size={24} className="text-gray-400 group-hover:text-gray-200" />
              ) : (
                <ChevronDown size={24} className="text-gray-400 group-hover:text-gray-200" />
              )}
            </button>
            
            {/* Live Stats */}
            <div className="flex items-center gap-3 text-sm">
              <div className={`px-3 py-2 rounded-lg border ${
                isPaused 
                  ? 'bg-orange-500/10 border-orange-500/30' 
                  : 'bg-green-500/10 border-green-500/30'
              } flex items-center gap-2`}>
                <Activity size={14} className={isPaused ? 'text-orange-400' : 'text-green-400'} />
                <span className={isPaused ? 'text-orange-300 font-semibold' : 'text-green-300 font-semibold'}>
                  {isPaused ? 'Paused' : 'Live'}
                </span>
              </div>
              
              <div className="bg-blue-500/10 border border-blue-500/30 px-3 py-2 rounded-lg">
                <span className="text-blue-300 font-semibold">
                  {dataHistory.size} pairs
                </span>
              </div>
              
              <div className="bg-purple-500/10 border border-purple-500/30 px-3 py-2 rounded-lg">
                <span className="text-purple-300 font-semibold">
                  {totalDataPoints.toLocaleString()} pts
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all shadow-lg ${
                isPaused 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-orange-600 hover:bg-orange-700 text-white'
              }`}
            >
              {isPaused ? (
                <>
                  <Play size={18} />
                  Resume
                </>
              ) : (
                <>
                  <Pause size={18} />
                  Pause
                </>
              )}
            </button>
            
            <button
              onClick={analyzeOpportunities}
              disabled={isAnalyzing || dataHistory.size === 0}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg disabled:bg-gray-700 disabled:opacity-50"
            >
              <RefreshCw size={18} className={isAnalyzing ? 'animate-spin' : ''} />
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </div>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="px-6 pb-6 border-t border-gray-800/50 pt-6">
          {dataHistory.size === 0 && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800/30 rounded-full mb-4">
                <Activity size={32} className="text-gray-500 animate-pulse" />
              </div>
              <p className="text-gray-400">Waiting for price data...</p>
              <p className="text-xs text-gray-600 mt-2">WebSocket connections are collecting data from both exchanges</p>
            </div>
          )}

          {dataHistory.size > 0 && opportunities.length === 0 && (
            <div className="text-center py-8">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                isPaused ? 'bg-orange-500/10' : 'bg-green-500/10'
              }`}>
                <Activity size={32} className={`${
                  isPaused ? 'text-orange-400' : 'text-green-400 animate-pulse'
                }`} />
              </div>
              <p className="text-gray-300 font-semibold">
                {isPaused ? 'Data collection paused' : `Tracking ${dataHistory.size} pairs in real-time`}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {isPaused 
                  ? 'Click "Resume" to continue collecting data' 
                  : 'Click "Analyze" to find the best arbitrage opportunities'
                }
              </p>
              {!isPaused && (
                <>
                  <div className="mt-4 text-xs text-gray-600">
                    Active pairs: {Array.from(dataHistory.keys()).slice(0, 8).join(', ')}
                    {dataHistory.size > 8 && ` +${dataHistory.size - 8} more`}
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-4 max-w-md mx-auto">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Data Completeness</span>
                      <span>{Math.round((totalDataPoints / (dataHistory.size * 30)) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-green-600 h-2 transition-all duration-500 ease-out"
                        style={{ width: `${Math.min(100, (totalDataPoints / (dataHistory.size * 30)) * 100)}%` }}
                      >
                        <div className="h-full w-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 text-center mt-1">
                      {totalDataPoints} / {dataHistory.size * 30} optimal points
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {opportunities.length > 0 && (
            <div className="space-y-3">
              {opportunities.map((opp, index) => (
                <div
                  key={opp.symbol}
                  className={`p-4 rounded-lg border-2 transition-all hover:scale-[1.02] ${
                    index === 0 
                      ? 'bg-green-500/5 border-green-500/50' 
                      : 'bg-[#1a2332]/50 border-gray-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {index === 0 && (
                        <div className="text-2xl">🏆</div>
                      )}
                      <div>
                        <span className="font-bold text-lg text-gray-200">
                          {opp.symbol}
                        </span>
                        {index === 0 && (
                          <span className="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded">
                            BEST
                          </span>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          {opp.dataPoints} data points • ${opp.currentPrice.toFixed(opp.currentPrice < 1 ? 6 : 2)}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => addPair(opp.symbol)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-all"
                    >
                      Track
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div className="text-center p-2 bg-[#0a0e17]/50 rounded border border-gray-800/50">
                      <div className="text-xs text-gray-500">Avg Spread</div>
                      <div className="font-bold text-green-400">
                        {opp.avgSpreadPct.toFixed(3)}%
                      </div>
                    </div>
                    <div className="text-center p-2 bg-[#0a0e17]/50 rounded border border-gray-800/50">
                      <div className="text-xs text-gray-500">Max Spread</div>
                      <div className="font-semibold text-gray-200">
                        ${opp.maxSpread.toFixed(opp.maxSpread < 1 ? 5 : 2)}
                      </div>
                    </div>
                    <div className="text-center p-2 bg-[#0a0e17]/50 rounded border border-gray-800/50">
                      <div className="text-xs text-gray-500">Min Spread</div>
                      <div className="font-semibold text-gray-200">
                        ${opp.minSpread.toFixed(opp.minSpread < 1 ? 5 : 2)}
                      </div>
                    </div>
                  </div>

                  {index === 0 && (
                    <div className="mt-3 p-2 bg-green-500/10 border border-green-500/30 rounded text-xs text-green-300">
                      <TrendingUp size={14} className="inline mr-1" />
                      <strong>Best opportunity!</strong> Highest avg spread over last {opp.dataPoints} updates.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
