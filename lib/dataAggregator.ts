import { PriceUpdate, AggregatedData } from './types';

export class DataAggregator {
  private readonly INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  private buckets: Map<string, Map<number, PriceUpdate[]>> = new Map(); // symbol -> timestamp -> updates

  // Add a price update to the appropriate bucket
  addUpdate(update: PriceUpdate) {
    const bucketTime = this.getBucketTimestamp(update.timestamp);
    const symbol = update.symbol;

    if (!this.buckets.has(symbol)) {
      this.buckets.set(symbol, new Map());
    }

    const symbolBuckets = this.buckets.get(symbol)!;
    if (!symbolBuckets.has(bucketTime)) {
      symbolBuckets.set(bucketTime, []);
    }

    symbolBuckets.get(bucketTime)!.push(update);
  }

  // Get bucket timestamp (floor to 5-min intervals)
  private getBucketTimestamp(timestamp: number): number {
    return Math.floor(timestamp / this.INTERVAL_MS) * this.INTERVAL_MS;
  }

  // Aggregate a bucket of updates
  private aggregateBucket(updates: PriceUpdate[]): AggregatedData | null {
    if (updates.length === 0) return null;

    const validUpdates = updates.filter(u => 
      u.hyperliquidPrice !== null && 
      u.lighterPrice !== null &&
      u.spread !== null &&
      u.spreadPct !== null
    );

    if (validUpdates.length === 0) return null;

    const sumHyperliquid = validUpdates.reduce((sum, u) => sum + u.hyperliquidPrice!, 0);
    const sumLighter = validUpdates.reduce((sum, u) => sum + u.lighterPrice!, 0);
    const sumSpread = validUpdates.reduce((sum, u) => sum + u.spread!, 0);
    const sumSpreadPct = validUpdates.reduce((sum, u) => sum + u.spreadPct!, 0);

    const spreads = validUpdates.map(u => u.spread!);
    const minSpread = Math.min(...spreads);
    const maxSpread = Math.max(...spreads);

    return {
      timestamp: updates[0].timestamp,
      symbol: updates[0].symbol,
      avgHyperliquidPrice: sumHyperliquid / validUpdates.length,
      avgLighterPrice: sumLighter / validUpdates.length,
      avgSpread: sumSpread / validUpdates.length,
      avgSpreadPct: sumSpreadPct / validUpdates.length,
      minSpread,
      maxSpread,
      dataPoints: validUpdates.length
    };
  }

  // Get aggregated data for completed buckets
  getCompletedAggregations(currentTime: number): AggregatedData[] {
    const results: AggregatedData[] = [];
    const currentBucket = this.getBucketTimestamp(currentTime);

    for (const [symbol, symbolBuckets] of this.buckets.entries()) {
      for (const [bucketTime, updates] of symbolBuckets.entries()) {
        // Only aggregate completed buckets (not current one)
        if (bucketTime < currentBucket) {
          const aggregated = this.aggregateBucket(updates);
          if (aggregated) {
            results.push(aggregated);
          }
          // Remove processed bucket
          symbolBuckets.delete(bucketTime);
        }
      }
    }

    return results;
  }

  // Get current (incomplete) bucket data for real-time display
  getCurrentBucketData(symbol: string): AggregatedData | null {
    const currentBucket = this.getBucketTimestamp(Date.now());
    const symbolBuckets = this.buckets.get(symbol);
    
    if (!symbolBuckets) return null;
    
    const updates = symbolBuckets.get(currentBucket);
    if (!updates || updates.length === 0) return null;

    return this.aggregateBucket(updates);
  }

  // Clear old buckets (cleanup)
  clearOldBuckets(hoursToKeep: number = 24) {
    const cutoffTime = Date.now() - (hoursToKeep * 60 * 60 * 1000);
    const cutoffBucket = this.getBucketTimestamp(cutoffTime);

    for (const symbolBuckets of this.buckets.values()) {
      for (const bucketTime of symbolBuckets.keys()) {
        if (bucketTime < cutoffBucket) {
          symbolBuckets.delete(bucketTime);
        }
      }
    }
  }
}


