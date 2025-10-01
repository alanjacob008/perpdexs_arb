'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, LineData, Time } from 'lightweight-charts';
import { useStore } from '@/lib/store';

interface SpreadChartProps {
  symbol: string;
}

export default function SpreadChart({ symbol }: SpreadChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const hyperliquidSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const lighterSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const differenceSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const [timeRange, setTimeRange] = useState<'5m' | '15m' | '1h'>('5m');
  const [viewMode, setViewMode] = useState<'prices' | 'difference'>('prices');
  const dataBufferRef = useRef<{ hl: LineData[], lt: LineData[], diff: LineData[] }>({ hl: [], lt: [], diff: [] });
  
  const { latestPrices } = useStore();

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart with dark theme
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { color: '#0a0e17' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: '#1a2332' },
        horzLines: { color: '#1a2332' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#4a5568',
          labelBackgroundColor: '#2d3748',
        },
        horzLine: {
          color: '#4a5568',
          labelBackgroundColor: '#2d3748',
        },
      },
      timeScale: {
        borderColor: '#2d3748',
        timeVisible: true,
        secondsVisible: true,
      },
      rightPriceScale: {
        borderColor: '#2d3748',
      },
    });

    // Hyperliquid line (bright green)
    const hyperliquidSeries = chart.addLineSeries({
      color: '#10b981',
      lineWidth: 2,
      title: 'Hyperliquid',
      priceFormat: {
        type: 'price',
        precision: 6,
        minMove: 0.000001,
      },
    });

    // Lighter line (blue)
    const lighterSeries = chart.addLineSeries({
      color: '#3b82f6',
      lineWidth: 2,
      title: 'Lighter',
      priceFormat: {
        type: 'price',
        precision: 6,
        minMove: 0.000001,
      },
    });

    // Difference line (yellow) - hidden by default
    const differenceSeries = chart.addLineSeries({
      color: '#f59e0b',
      lineWidth: 2,
      title: 'Difference',
      priceFormat: {
        type: 'price',
        precision: 6,
        minMove: 0.000001,
      },
      lastValueVisible: true,
      priceLineVisible: true,
    });
    differenceSeries.applyOptions({ visible: false });

    chartRef.current = chart;
    hyperliquidSeriesRef.current = hyperliquidSeries;
    lighterSeriesRef.current = lighterSeries;
    differenceSeriesRef.current = differenceSeries;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Update chart with real-time data
  useEffect(() => {
    if (!hyperliquidSeriesRef.current || !lighterSeriesRef.current || !differenceSeriesRef.current) return;

    const priceData = latestPrices.get(symbol);
    if (!priceData || !priceData.hyperliquidPrice || !priceData.lighterPrice) return;

    const time = Math.floor(priceData.timestamp / 1000) as Time;
    
    const lastHlTime = dataBufferRef.current.hl.length > 0 
      ? dataBufferRef.current.hl[dataBufferRef.current.hl.length - 1].time 
      : 0;
    
    if (time <= lastHlTime) {
      if (dataBufferRef.current.hl.length > 0) {
        dataBufferRef.current.hl[dataBufferRef.current.hl.length - 1] = {
          time,
          value: priceData.hyperliquidPrice
        };
        dataBufferRef.current.lt[dataBufferRef.current.lt.length - 1] = {
          time,
          value: priceData.lighterPrice
        };
        const diffVal = priceData.lighterPrice - priceData.hyperliquidPrice;
        dataBufferRef.current.diff[dataBufferRef.current.diff.length - 1] = {
          time,
          value: diffVal,
        };
        
        if (viewMode === 'prices') {
          hyperliquidSeriesRef.current.update({
            time,
            value: priceData.hyperliquidPrice
          });
          lighterSeriesRef.current.update({
            time,
            value: priceData.lighterPrice
          });
        } else {
          differenceSeriesRef.current.update({
            time,
            value: diffVal,
          });
        }
      }
      return;
    }
    
    const hlData = { time, value: priceData.hyperliquidPrice };
    const ltData = { time, value: priceData.lighterPrice };
    const diffData = { time, value: priceData.lighterPrice - priceData.hyperliquidPrice };
    
    dataBufferRef.current.hl.push(hlData);
    dataBufferRef.current.lt.push(ltData);
    dataBufferRef.current.diff.push(diffData);

    const now = Date.now() / 1000;
    const timeRanges = {
      '5m': 5 * 60,
      '15m': 15 * 60,
      '1h': 60 * 60,
    };
    const cutoff = now - timeRanges[timeRange];

    dataBufferRef.current.hl = dataBufferRef.current.hl.filter(d => (d.time as number) > cutoff);
    dataBufferRef.current.lt = dataBufferRef.current.lt.filter(d => (d.time as number) > cutoff);
    dataBufferRef.current.diff = dataBufferRef.current.diff.filter(d => (d.time as number) > cutoff);

    if (viewMode === 'prices') {
      hyperliquidSeriesRef.current.update(hlData);
      lighterSeriesRef.current.update(ltData);
    } else {
      differenceSeriesRef.current.update(diffData);
    }

  }, [latestPrices, symbol, timeRange, viewMode]);

  useEffect(() => {
    dataBufferRef.current = { hl: [], lt: [], diff: [] };
  }, [timeRange]);

  // Toggle visibility of series when switching view modes
  useEffect(() => {
    if (!hyperliquidSeriesRef.current || !lighterSeriesRef.current || !differenceSeriesRef.current) return;
    if (viewMode === 'prices') {
      hyperliquidSeriesRef.current.applyOptions({ visible: true });
      lighterSeriesRef.current.applyOptions({ visible: true });
      differenceSeriesRef.current.applyOptions({ visible: false });
    } else {
      hyperliquidSeriesRef.current.applyOptions({ visible: false });
      lighterSeriesRef.current.applyOptions({ visible: false });
      differenceSeriesRef.current.applyOptions({ visible: true });
    }
  }, [viewMode]);

  return (
    <div className="bg-[#141b2b] border border-gray-800/50 rounded-xl shadow-2xl p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-200">
          {symbol}
        </h3>
        
        {/* Time range selector */}
        <div className="flex gap-2">
          {(['5m', '15m', '1h'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-sm rounded-lg transition-all ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#1a2332] text-gray-400 hover:bg-[#1f2937] border border-gray-800/50'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-4 text-xs">
        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/30 rounded">
          <div className="w-4 h-0.5 bg-green-500"></div>
          <span className="text-green-400 font-semibold">Hyperliquid</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded">
          <div className="w-4 h-0.5 bg-blue-500"></div>
          <span className="text-blue-400 font-semibold">Lighter</span>
        </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('prices')}
            className={`px-3 py-1 text-xs rounded-lg transition-all ${
              viewMode === 'prices'
                ? 'bg-gray-700 text-white border border-gray-600'
                : 'bg-[#1a2332] text-gray-400 hover:bg-[#1f2937] border border-gray-800/50'
            }`}
          >
            Prices
          </button>
          <button
            onClick={() => setViewMode('difference')}
            className={`px-3 py-1 text-xs rounded-lg transition-all ${
              viewMode === 'difference'
                ? 'bg-yellow-600/30 text-yellow-200 border border-yellow-600/40'
                : 'bg-[#1a2332] text-gray-400 hover:bg-[#1f2937] border border-gray-800/50'
            }`}
          >
            Difference
          </button>
        </div>
      </div>

      <div ref={chartContainerRef} className="rounded-lg overflow-hidden" />
    </div>
  );
}
