import type { Batch, AllocationResult, AllocationItem, Alert } from '@/types';
import { generateId } from './inventoryCalculator';

export function allocateFIFO(
  skuId: string,
  quantity: number,
  batches: Batch[],
  tempLocks: { batchId: string }[]
): AllocationResult {
  const availableBatches = batches
    .filter(b => 
      b.skuId === skuId && 
      !b.isFrozen && 
      b.status !== 'expired' &&
      b.availableQuantity > 0
    )
    .sort((a, b) => new Date(a.productionDate).getTime() - new Date(b.productionDate).getTime());

  const totalAvailable = availableBatches.reduce((sum, b) => sum + b.availableQuantity, 0);

  if (totalAvailable < quantity) {
    const alert: Alert = {
      id: generateId(),
      type: 'stock_shortage',
      level: 'error',
      title: '库存不足',
      message: `出库数量 ${quantity} 大于可用库存 ${totalAvailable}，操作已中断`,
      skuId,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    return { success: false, allocations: [], alert };
  }

  const allocations: AllocationItem[] = [];
  let remaining = quantity;

  for (const batch of availableBatches) {
    if (remaining <= 0) break;

    const isLocked = tempLocks.some(l => l.batchId === batch.id);
    if (isLocked) {
      const alert: Alert = {
        id: generateId(),
        type: 'batch_occupied',
        level: 'error',
        title: '批次被占用',
        message: `批次 ${batch.batchNo} 正在被其他操作占用，请稍后重试`,
        batchId: batch.id,
        skuId,
        isRead: false,
        createdAt: new Date().toISOString()
      };
      return { success: false, allocations: [], alert };
    }

    const takeQuantity = Math.min(batch.availableQuantity, remaining);
    allocations.push({
      batchId: batch.id,
      quantity: takeQuantity
    });
    remaining -= takeQuantity;
  }

  if (remaining > 0) {
    const alert: Alert = {
      id: generateId(),
      type: 'over_sell',
      level: 'error',
      title: '超卖风险',
      message: `可分配库存不足，无法完成出库操作`,
      skuId,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    return { success: false, allocations: [], alert };
  }

  return { success: true, allocations };
}

export function deductStock(
  batches: Batch[],
  allocations: AllocationItem[]
): { updatedBatches: Batch[]; success: boolean } {
  const allocationMap = new Map(allocations.map(a => [a.batchId, a.quantity]));
  
  for (const [batchId, quantity] of allocationMap) {
    const batch = batches.find(b => b.id === batchId);
    if (!batch || batch.availableQuantity < quantity) {
      return { updatedBatches: batches, success: false };
    }
  }

  const updatedBatches = batches.map(batch => {
    const deductQuantity = allocationMap.get(batch.id);
    if (deductQuantity) {
      return {
        ...batch,
        availableQuantity: batch.availableQuantity - deductQuantity,
        quantity: batch.quantity - deductQuantity
      };
    }
    return batch;
  });

  return { updatedBatches, success: true };
}

export function previewFIFOAllocation(
  skuId: string,
  quantity: number,
  batches: Batch[]
): { allocations: AllocationItem[]; totalAvailable: number; canFulfill: boolean } {
  const availableBatches = batches
    .filter(b => 
      b.skuId === skuId && 
      !b.isFrozen && 
      b.status !== 'expired' &&
      b.availableQuantity > 0
    )
    .sort((a, b) => new Date(a.productionDate).getTime() - new Date(b.productionDate).getTime());

  const totalAvailable = availableBatches.reduce((sum, b) => sum + b.availableQuantity, 0);
  const allocations: AllocationItem[] = [];
  let remaining = quantity;

  for (const batch of availableBatches) {
    if (remaining <= 0) break;
    const takeQuantity = Math.min(batch.availableQuantity, remaining);
    allocations.push({
      batchId: batch.id,
      quantity: takeQuantity
    });
    remaining -= takeQuantity;
  }

  return {
    allocations,
    totalAvailable,
    canFulfill: remaining <= 0
  };
}
