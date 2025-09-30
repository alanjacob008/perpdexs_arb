'use client';

import { useState, useEffect } from 'react';
import { ArrowLeftRight, TrendingUp, TrendingDown, Settings, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import type { OrderParams, Position, Balance } from '@/lib/trading/types';

export default function TradeTestPage() {
  const [activeTab, setActiveTab] = useState<'config' | 'test' | 'positions'>('config');
  const [apiKeysConfigured, setApiKeysConfigured] = useState(false);
  
  // API Configuration
  const [hlPrivateKey, setHlPrivateKey] = useState('');
  const [hlAccountAddress, setHlAccountAddress] = useState('');
  const [lighterApiKey, setLighterApiKey] = useState('');
  const [lighterApiSecret, setLighterApiSecret] = useState('');
  const [lighterWallet, setLighterWallet] = useState('');

  // Trading Parameters
  const [testSymbol, setTestSymbol] = useState('BTC-USD');
  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy');
  const [orderSize, setOrderSize] = useState('0.01');
  const [orderPrice, setOrderPrice] = useState('');
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit');
  const [timeInForce, setTimeInForce] = useState<'GTC' | 'IOC' | 'FOK'>('GTC');
  const [reduceOnly, setReduceOnly] = useState(false);
  const [postOnly, setPostOnly] = useState(false);
  const [slippagePercent, setSlippagePercent] = useState('0.5');

  // State
  const [positions, setPositions] = useState<Position[]>([]);
  const [hlBalance, setHlBalance] = useState<Balance | null>(null);
  const [lighterBalance, setLighterBalance] = useState<Balance | null>(null);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if API keys are in localStorage
    const stored = {
      hlPrivateKey: localStorage.getItem('hl_private_key') || '',
      hlAccountAddress: localStorage.getItem('hl_account_address') || '',
      lighterApiKey: localStorage.getItem('lighter_api_key') || '',
      lighterApiSecret: localStorage.getItem('lighter_api_secret') || '',
      lighterWallet: localStorage.getItem('lighter_wallet') || '',
    };

    if (stored.hlPrivateKey && stored.hlAccountAddress) {
      setHlPrivateKey(stored.hlPrivateKey);
      setHlAccountAddress(stored.hlAccountAddress);
      setApiKeysConfigured(true);
    }
    if (stored.lighterApiKey && stored.lighterApiSecret) {
      setLighterApiKey(stored.lighterApiKey);
      setLighterApiSecret(stored.lighterApiSecret);
      setLighterWallet(stored.lighterWallet);
    }
  }, []);

  const saveApiKeys = () => {
    localStorage.setItem('hl_private_key', hlPrivateKey);
    localStorage.setItem('hl_account_address', hlAccountAddress);
    localStorage.setItem('lighter_api_key', lighterApiKey);
    localStorage.setItem('lighter_api_secret', lighterApiSecret);
    localStorage.setItem('lighter_wallet', lighterWallet);
    setApiKeysConfigured(true);
    alert('API keys saved to localStorage! ⚠️ Remember: This is for testing only.');
  };

  const clearApiKeys = () => {
    localStorage.removeItem('hl_private_key');
    localStorage.removeItem('hl_account_address');
    localStorage.removeItem('lighter_api_key');
    localStorage.removeItem('lighter_api_secret');
    localStorage.removeItem('lighter_wallet');
    setHlPrivateKey('');
    setHlAccountAddress('');
    setLighterApiKey('');
    setLighterApiSecret('');
    setLighterWallet('');
    setApiKeysConfigured(false);
  };

  const testHyperliquidConnection = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would call an API route
      setTestResults(prev => [...prev, {
        timestamp: new Date().toISOString(),
        exchange: 'Hyperliquid',
        action: 'Test Connection',
        status: 'info',
        message: 'Connection test not implemented yet - see console for structure'
      }]);
      
      console.log('Hyperliquid Test Config:', {
        privateKey: hlPrivateKey.slice(0, 10) + '...',
        accountAddress: hlAccountAddress,
      });
    } catch (error) {
      setTestResults(prev => [...prev, {
        timestamp: new Date().toISOString(),
        exchange: 'Hyperliquid',
        action: 'Test Connection',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const testLighterConnection = async () => {
    setLoading(true);
    try {
      setTestResults(prev => [...prev, {
        timestamp: new Date().toISOString(),
        exchange: 'Lighter',
        action: 'Test Connection',
        status: 'info',
        message: 'Connection test not implemented yet - see console for structure'
      }]);
      
      console.log('Lighter Test Config:', {
        apiKey: lighterApiKey.slice(0, 10) + '...',
        wallet: lighterWallet,
      });
    } catch (error) {
      setTestResults(prev => [...prev, {
        timestamp: new Date().toISOString(),
        exchange: 'Lighter',
        action: 'Test Connection',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const testPlaceOrder = async (exchange: 'hyperliquid' | 'lighter') => {
    setLoading(true);
    try {
      const orderParams: OrderParams = {
        symbol: testSymbol,
        side: orderSide,
        size: parseFloat(orderSize),
        price: orderType === 'limit' ? parseFloat(orderPrice) : undefined,
        orderType,
        timeInForce,
        reduceOnly,
        postOnly: orderType === 'limit' ? postOnly : undefined,
      };

      setTestResults(prev => [...prev, {
        timestamp: new Date().toISOString(),
        exchange: exchange.charAt(0).toUpperCase() + exchange.slice(1),
        action: `Test ${orderType.toUpperCase()} Order`,
        status: 'info',
        message: `Order structure: ${JSON.stringify(orderParams, null, 2)}`
      }]);

      console.log(`${exchange} Order Test:`, orderParams);
    } catch (error) {
      setTestResults(prev => [...prev, {
        timestamp: new Date().toISOString(),
        exchange: exchange.charAt(0).toUpperCase() + exchange.slice(1),
        action: 'Place Order',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Trading Test Lab</h1>
          <p className="text-gray-400">
            Test and debug trading functionality before integrating into main UI
          </p>
          <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              <span className="text-yellow-500 font-semibold">Testing Environment</span>
            </div>
            <p className="text-gray-300 text-sm mt-2">
              This page is for development only. API keys are stored in localStorage. Never use mainnet keys here.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('config')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'config'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Configuration
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'test'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4 inline mr-2" />
            Test Orders
          </button>
          <button
            onClick={() => setActiveTab('positions')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'positions'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Positions
          </button>
        </div>

        {/* Configuration Tab */}
        {activeTab === 'config' && (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-2xl font-bold mb-4 text-white">Hyperliquid API</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Private Key (Wallet)
                  </label>
                  <input
                    type="password"
                    value={hlPrivateKey}
                    onChange={(e) => setHlPrivateKey(e.target.value)}
                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                    placeholder="0x..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Generate at: https://app.hyperliquid.xyz/ → More → API
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Account Address
                  </label>
                  <input
                    type="text"
                    value={hlAccountAddress}
                    onChange={(e) => setHlAccountAddress(e.target.value)}
                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                    placeholder="0x..."
                  />
                </div>
                <button
                  onClick={testHyperliquidConnection}
                  disabled={loading || !hlPrivateKey || !hlAccountAddress}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
                >
                  Test Connection
                </button>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-2xl font-bold mb-4 text-white">Lighter API</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={lighterApiKey}
                    onChange={(e) => setLighterApiKey(e.target.value)}
                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                    placeholder="Your Lighter API key"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    API Secret
                  </label>
                  <input
                    type="password"
                    value={lighterApiSecret}
                    onChange={(e) => setLighterApiSecret(e.target.value)}
                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                    placeholder="Your Lighter API secret"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Wallet Address
                  </label>
                  <input
                    type="text"
                    value={lighterWallet}
                    onChange={(e) => setLighterWallet(e.target.value)}
                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                    placeholder="0x..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Contact Lighter support for API access
                  </p>
                </div>
                <button
                  onClick={testLighterConnection}
                  disabled={loading || !lighterApiKey || !lighterApiSecret}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
                >
                  Test Connection
                </button>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={saveApiKeys}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors"
              >
                Save API Keys (localStorage)
              </button>
              <button
                onClick={clearApiKeys}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors"
              >
                Clear All Keys
              </button>
            </div>
          </div>
        )}

        {/* Test Orders Tab */}
        {activeTab === 'test' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order Form */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-2xl font-bold mb-4 text-white">Test Order Placement</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Symbol</label>
                  <input
                    type="text"
                    value={testSymbol}
                    onChange={(e) => setTestSymbol(e.target.value)}
                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Side</label>
                    <select
                      value={orderSide}
                      onChange={(e) => setOrderSide(e.target.value as 'buy' | 'sell')}
                      className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white"
                    >
                      <option value="buy">Buy / Long</option>
                      <option value="sell">Sell / Short</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                    <select
                      value={orderType}
                      onChange={(e) => setOrderType(e.target.value as 'limit' | 'market')}
                      className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white"
                    >
                      <option value="limit">Limit</option>
                      <option value="market">Market</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Size</label>
                    <input
                      type="number"
                      value={orderSize}
                      onChange={(e) => setOrderSize(e.target.value)}
                      step="0.001"
                      className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  {orderType === 'limit' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Price</label>
                      <input
                        type="number"
                        value={orderPrice}
                        onChange={(e) => setOrderPrice(e.target.value)}
                        step="0.01"
                        className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white"
                      />
                    </div>
                  )}
                </div>

                {orderType === 'limit' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Time In Force</label>
                    <select
                      value={timeInForce}
                      onChange={(e) => setTimeInForce(e.target.value as any)}
                      className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white"
                    >
                      <option value="GTC">Good Till Cancel</option>
                      <option value="IOC">Immediate Or Cancel</option>
                      <option value="FOK">Fill Or Kill</option>
                    </select>
                  </div>
                )}

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-gray-300">
                    <input
                      type="checkbox"
                      checked={reduceOnly}
                      onChange={(e) => setReduceOnly(e.target.checked)}
                      className="w-4 h-4"
                    />
                    Reduce Only
                  </label>
                  {orderType === 'limit' && (
                    <label className="flex items-center gap-2 text-gray-300">
                      <input
                        type="checkbox"
                        checked={postOnly}
                        onChange={(e) => setPostOnly(e.target.checked)}
                        className="w-4 h-4"
                      />
                      Post Only
                    </label>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <button
                    onClick={() => testPlaceOrder('hyperliquid')}
                    disabled={loading || !apiKeysConfigured}
                    className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 rounded-lg font-semibold"
                  >
                    Test on Hyperliquid
                  </button>
                  <button
                    onClick={() => testPlaceOrder('lighter')}
                    disabled={loading || !apiKeysConfigured}
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded-lg font-semibold"
                  >
                    Test on Lighter
                  </button>
                </div>
              </div>
            </div>

            {/* Test Results */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Test Results</h2>
                <button
                  onClick={() => setTestResults([])}
                  className="text-sm text-gray-400 hover:text-white"
                >
                  Clear
                </button>
              </div>
              
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {testResults.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No test results yet</p>
                ) : (
                  testResults.reverse().map((result, idx) => (
                    <div key={idx} className="bg-black rounded-lg p-4 border border-gray-800">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="font-semibold text-white">{result.exchange}</span>
                          <span className="text-gray-500 text-sm ml-2">{result.action}</span>
                        </div>
                        {result.status === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                        {result.status === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
                        {result.status === 'info' && <AlertCircle className="w-5 h-5 text-blue-500" />}
                      </div>
                      <p className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                        {result.message}
                      </p>
                      <p className="text-xs text-gray-600 mt-2">{result.timestamp}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Positions Tab */}
        {activeTab === 'positions' && (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-2xl font-bold mb-4 text-white">Open Positions</h2>
              <p className="text-gray-400 mb-4">Position tracking will be implemented here</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black rounded-lg p-4 border border-gray-800">
                  <h3 className="font-semibold text-white mb-2">Hyperliquid Balance</h3>
                  {hlBalance ? (
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total:</span>
                        <span className="text-white">${hlBalance.total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Available:</span>
                        <span className="text-green-500">${hlBalance.available.toFixed(2)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Not connected</p>
                  )}
                </div>

                <div className="bg-black rounded-lg p-4 border border-gray-800">
                  <h3 className="font-semibold text-white mb-2">Lighter Balance</h3>
                  {lighterBalance ? (
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total:</span>
                        <span className="text-white">${lighterBalance.total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Available:</span>
                        <span className="text-green-500">${lighterBalance.available.toFixed(2)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Not connected</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-2xl font-bold mb-4 text-white">Implementation Notes</h2>
              <div className="space-y-4 text-gray-300">
                <div>
                  <h3 className="font-semibold text-white mb-2">✅ What's Working:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>API key storage (localStorage - testing only)</li>
                    <li>Order parameter configuration</li>
                    <li>UI structure and layout</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">🚧 What Needs Implementation:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>Hyperliquid:</strong> EIP-712 signing with ethers.js</li>
                    <li><strong>Lighter:</strong> Request signing (HMAC or wallet signature)</li>
                    <li>Next.js API routes for secure server-side execution</li>
                    <li>Real-time position tracking</li>
                    <li>Balance fetching</li>
                    <li>Order status monitoring</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">📚 Resources Needed:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Hyperliquid: Install <code className="bg-black px-2 py-1 rounded">ethers</code> for wallet signing</li>
                    <li>Lighter: API documentation for exact signing method</li>
                    <li>Both: Test API endpoints to verify request/response formats</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

