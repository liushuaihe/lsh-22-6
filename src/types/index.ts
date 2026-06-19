export interface SKU {
  id: string;
  name: string;
  skuCode: string;
  totalStock: number;
  category: string;
}

export interface Batch {
  id: string;
  skuId: string;
  batchNo: string;
  productionDate: string;
  expiryDate: string;
  quantity: number;
  availableQuantity: number;
  status: 'normal' | 'warning' | 'expired';
  isFrozen: boolean;
  createdAt: string;
}

export interface OperationLog {
  id: string;
  type: 'inbound' | 'outbound' | 'freeze' | 'unfreeze';
  skuId: string;
  batchId?: string;
  quantity: number;
  status: 'success' | 'failed';
  message: string;
  createdAt: string;
}

export type AlertType = 'stock_shortage' | 'batch_occupied' | 'expiry_warning' | 'over_sell' | 'frozen_batch';
export type AlertLevel = 'warning' | 'error' | 'info';

export interface Alert {
  id: string;
  type: AlertType;
  level: AlertLevel;
  title: string;
  message: string;
  batchId?: string;
  skuId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AllocationItem {
  batchId: string;
  quantity: number;
}

export interface AllocationResult {
  success: boolean;
  allocations: AllocationItem[];
  alert?: Alert;
}

export type OperationType = 'inbound' | 'outbound' | 'freeze';

export interface TempLock {
  batchId: string;
  lockedAt: string;
  operationId: string;
}

export interface InventoryState {
  skus: SKU[];
  batches: Batch[];
  operationLogs: OperationLog[];
  alerts: Alert[];
  tempLocks: TempLock[];
  inbound: (skuId: string, batchData: Omit<Batch, 'id' | 'skuId' | 'status'>) => void;
  outbound: (skuId: string, quantity: number) => AllocationResult;
  toggleFreeze: (batchId: string) => void;
  addAlert: (alert: Omit<Alert, 'id' | 'createdAt' | 'isRead'>) => void;
  markAlertRead: (alertId: string) => void;
  clearAllAlerts: () => void;
  getSkuBatches: (skuId: string) => Batch[];
  getSkuAvailableStock: (skuId: string) => number;
}
