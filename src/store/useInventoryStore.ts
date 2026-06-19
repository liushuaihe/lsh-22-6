import { create } from 'zustand';
import type { InventoryState, Batch, OperationLog, Alert, TempLock } from '@/types';
import { mockSKUs, mockBatches } from '@/data/mockData';
import { allocateFIFO, deductStock } from '@/utils/fifoEngine';
import { generateId, calculateExpiryStatus, getSkuTotalStock } from '@/utils/inventoryCalculator';

export const useInventoryStore = create<InventoryState>((set, get) => ({
  skus: mockSKUs,
  batches: mockBatches,
  operationLogs: [],
  alerts: [],
  tempLocks: [],

  getSkuBatches: (skuId: string) => {
    return get().batches
      .filter(b => b.skuId === skuId)
      .sort((a, b) => new Date(a.productionDate).getTime() - new Date(b.productionDate).getTime());
  },

  getSkuAvailableStock: (skuId: string) => {
    return getSkuTotalStock(skuId, get().batches);
  },

  inbound: (skuId: string, batchData: Omit<Batch, 'id' | 'skuId' | 'status'>) => {
    const { batches, skus } = get();
    const now = new Date().toISOString();
    const status = calculateExpiryStatus(batchData.expiryDate);

    const existingBatch = batches.find(
      b => b.skuId === skuId && b.batchNo === batchData.batchNo
    );

    let updatedBatches: Batch[];
    let logMessage: string;

    if (existingBatch) {
      updatedBatches = batches.map(b => {
        if (b.id === existingBatch.id) {
          return {
            ...b,
            quantity: b.quantity + batchData.quantity,
            availableQuantity: b.availableQuantity + batchData.quantity
          };
        }
        return b;
      });
      logMessage = `批次 ${batchData.batchNo} 追加入库 ${batchData.quantity} 件`;
    } else {
      const newBatch: Batch = {
        ...batchData,
        id: generateId(),
        skuId,
        status,
        createdAt: now
      };
      updatedBatches = [...batches, newBatch];
      logMessage = `新批次 ${batchData.batchNo} 入库 ${batchData.quantity} 件`;
    }

    const updatedSKUs = skus.map(s => {
      if (s.id === skuId) {
        return {
          ...s,
          totalStock: getSkuTotalStock(skuId, updatedBatches)
        };
      }
      return s;
    });

    const log: OperationLog = {
      id: generateId(),
      type: 'inbound',
      skuId,
      batchId: existingBatch?.id || updatedBatches.find(b => b.batchNo === batchData.batchNo)?.id,
      quantity: batchData.quantity,
      status: 'success',
      message: logMessage,
      createdAt: now
    };

    set({
      batches: updatedBatches,
      skus: updatedSKUs,
      operationLogs: [log, ...get().operationLogs]
    });
  },

  outbound: (skuId: string, quantity: number) => {
    const { batches, skus, tempLocks } = get();
    const now = new Date().toISOString();

    const operationId = generateId();
    const allocResult = allocateFIFO(skuId, quantity, batches, tempLocks);

    if (!allocResult.success) {
      const log: OperationLog = {
        id: generateId(),
        type: 'outbound',
        skuId,
        quantity,
        status: 'failed',
        message: allocResult.alert?.message || '出库失败',
        createdAt: now
      };

      set(state => ({
        operationLogs: [log, ...state.operationLogs],
        alerts: allocResult.alert ? [allocResult.alert, ...state.alerts] : state.alerts
      }));

      return allocResult;
    }

    const newTempLocks: TempLock[] = allocResult.allocations.map(a => ({
      batchId: a.batchId,
      lockedAt: now,
      operationId
    }));

    set({ tempLocks: [...tempLocks, ...newTempLocks] });

    const { updatedBatches, success } = deductStock(batches, allocResult.allocations);

    if (!success) {
      set({ tempLocks: tempLocks.filter(l => l.operationId !== operationId) });
      
      const alert: Alert = {
        id: generateId(),
        type: 'over_sell',
        level: 'error',
        title: '库存扣减失败',
        message: '库存已发生变化，请重新操作',
        skuId,
        isRead: false,
        createdAt: now
      };

      const log: OperationLog = {
        id: generateId(),
        type: 'outbound',
        skuId,
        quantity,
        status: 'failed',
        message: alert.message,
        createdAt: now
      };

      set(state => ({
        operationLogs: [log, ...state.operationLogs],
        alerts: [alert, ...state.alerts]
      }));

      return { success: false, allocations: [], alert };
    }

    const updatedSKUs = skus.map(s => {
      if (s.id === skuId) {
        return {
          ...s,
          totalStock: getSkuTotalStock(skuId, updatedBatches)
        };
      }
      return s;
    });

    const batchDetails = allocResult.allocations
      .map(a => {
        const batch = updatedBatches.find(b => b.id === a.batchId);
        return `${batch?.batchNo}:${a.quantity}`;
      })
      .join(', ');

    const log: OperationLog = {
      id: generateId(),
      type: 'outbound',
      skuId,
      quantity,
      status: 'success',
      message: `出库成功，扣减批次 [${batchDetails}]`,
      createdAt: now
    };

    set({
      batches: updatedBatches,
      skus: updatedSKUs,
      tempLocks: tempLocks.filter(l => l.operationId !== operationId),
      operationLogs: [log, ...get().operationLogs]
    });

    return allocResult;
  },

  toggleFreeze: (batchId: string) => {
    const { batches, skus } = get();
    const now = new Date().toISOString();

    const batch = batches.find(b => b.id === batchId);
    if (!batch) return;

    const newFrozenState = !batch.isFrozen;

    const updatedBatches = batches.map(b => {
      if (b.id === batchId) {
        return { ...b, isFrozen: newFrozenState };
      }
      return b;
    });

    const updatedSKUs = skus.map(s => {
      if (s.id === batch.skuId) {
        return {
          ...s,
          totalStock: getSkuTotalStock(batch.skuId, updatedBatches)
        };
      }
      return s;
    });

    const log: OperationLog = {
      id: generateId(),
      type: newFrozenState ? 'freeze' : 'unfreeze',
      skuId: batch.skuId,
      batchId,
      quantity: batch.availableQuantity,
      status: 'success',
      message: `批次 ${batch.batchNo} ${newFrozenState ? '已冻结' : '已解冻'}`,
      createdAt: now
    };

    if (newFrozenState) {
      const alert: Alert = {
        id: generateId(),
        type: 'frozen_batch',
        level: 'warning',
        title: '批次已冻结',
        message: `批次 ${batch.batchNo} 已标记为残次品，不可参与出库`,
        batchId,
        skuId: batch.skuId,
        isRead: false,
        createdAt: now
      };

      set(state => ({
        batches: updatedBatches,
        skus: updatedSKUs,
        operationLogs: [log, ...state.operationLogs],
        alerts: [alert, ...state.alerts]
      }));
    } else {
      set(state => ({
        batches: updatedBatches,
        skus: updatedSKUs,
        operationLogs: [log, ...state.operationLogs]
      }));
    }
  },

  addAlert: (alert: Omit<Alert, 'id' | 'createdAt' | 'isRead'>) => {
    const newAlert: Alert = {
      ...alert,
      id: generateId(),
      isRead: false,
      createdAt: new Date().toISOString()
    };
    set(state => ({ alerts: [newAlert, ...state.alerts] }));
  },

  markAlertRead: (alertId: string) => {
    set(state => ({
      alerts: state.alerts.map(a => 
        a.id === alertId ? { ...a, isRead: true } : a
      )
    }));
  },

  clearAllAlerts: () => {
    set({ alerts: [] });
  }
}));
