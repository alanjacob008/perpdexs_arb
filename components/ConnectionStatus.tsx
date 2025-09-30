'use client';

import { useStore } from '@/lib/store';
import { Wifi, WifiOff } from 'lucide-react';

export default function ConnectionStatus() {
  const { isConnectedHyperliquid, isConnectedLighter } = useStore();

  return (
    <div className="bg-[#141b2b] border border-gray-800/50 rounded-xl shadow-2xl p-6 backdrop-blur-sm">
      <h3 className="text-lg font-bold text-white mb-4">
        Connection Status
      </h3>
      
      <div className="space-y-3">
        {/* Hyperliquid Status */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-[#1a2332]/50 border border-gray-800/50">
          <span className="text-sm font-medium text-gray-300">Hyperliquid</span>
          <div className="flex items-center gap-2">
            {isConnectedHyperliquid ? (
              <>
                <Wifi size={16} className="text-green-400" />
                <span className="text-xs text-green-400 font-semibold">Connected</span>
              </>
            ) : (
              <>
                <WifiOff size={16} className="text-red-400" />
                <span className="text-xs text-red-400 font-semibold">Disconnected</span>
              </>
            )}
          </div>
        </div>

        {/* Lighter Status */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-[#1a2332]/50 border border-gray-800/50">
          <span className="text-sm font-medium text-gray-300">Lighter</span>
          <div className="flex items-center gap-2">
            {isConnectedLighter ? (
              <>
                <Wifi size={16} className="text-green-400" />
                <span className="text-xs text-green-400 font-semibold">Connected</span>
              </>
            ) : (
              <>
                <WifiOff size={16} className="text-red-400" />
                <span className="text-xs text-red-400 font-semibold">Disconnected</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Overall Status */}
      <div className="mt-4 pt-4 border-t border-gray-800/50">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full animate-pulse ${
            isConnectedHyperliquid && isConnectedLighter ? 'bg-green-500' :
            isConnectedHyperliquid || isConnectedLighter ? 'bg-yellow-500' :
            'bg-red-500'
          }`} />
          <span className="text-xs text-gray-400">
            {isConnectedHyperliquid && isConnectedLighter ? 'All systems operational' :
             isConnectedHyperliquid || isConnectedLighter ? 'Partial connectivity' :
             'No connections'}
          </span>
        </div>
      </div>
    </div>
  );
}
