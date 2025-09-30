import Dexie, { Table } from 'dexie';
import { PriceUpdate, AggregatedData } from './types';

export class PriceDatabase extends Dexie {
  priceUpdates!: Table<PriceUpdate & { id?: number }>;
  aggregatedData!: Table<AggregatedData & { id?: number }>;

  constructor() {
    super('PriceArbitrageDB');
    
    this.version(1).stores({
      priceUpdates: '++id, timestamp, symbol, [symbol+timestamp]',
      aggregatedData: '++id, timestamp, symbol, [symbol+timestamp]',
    });
  }

  // Add price update
  async addPriceUpdate(update: PriceUpdate) {
    return await this.priceUpdates.add(update);
  }

  // Add aggregated data
  async addAggregatedData(data: AggregatedData) {
    return await this.aggregatedData.add(data);
  }

  // Get price updates for a symbol in time range
  async getPriceUpdates(symbol: string, startTime: number, endTime: number) {
    return await this.priceUpdates
      .where('[symbol+timestamp]')
      .between([symbol, startTime], [symbol, endTime])
      .toArray();
  }

  // Get aggregated data for chart display
  async getAggregatedData(symbol: string, startTime: number, endTime: number) {
    return await this.aggregatedData
      .where('[symbol+timestamp]')
      .between([symbol, startTime], [symbol, endTime])
      .toArray();
  }

  // Export data as JSON
  async exportData(startTime?: number, endTime?: number) {
    let updates = await this.priceUpdates.toArray();
    
    if (startTime && endTime) {
      updates = updates.filter(u => u.timestamp >= startTime && u.timestamp <= endTime);
    }
    
    return updates;
  }

  // Clear old data (keep last N days)
  async clearOldData(daysToKeep: number = 7) {
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    
    await this.priceUpdates.where('timestamp').below(cutoffTime).delete();
    await this.aggregatedData.where('timestamp').below(cutoffTime).delete();
  }

  // Get database stats
  async getStats() {
    const updateCount = await this.priceUpdates.count();
    const aggregatedCount = await this.aggregatedData.count();
    
    const firstUpdate = await this.priceUpdates.orderBy('timestamp').first();
    const lastUpdate = await this.priceUpdates.orderBy('timestamp').last();
    
    return {
      totalUpdates: updateCount,
      totalAggregated: aggregatedCount,
      firstTimestamp: firstUpdate?.timestamp || null,
      lastTimestamp: lastUpdate?.timestamp || null,
    };
  }
}

// Singleton instance
export const db = new PriceDatabase();


