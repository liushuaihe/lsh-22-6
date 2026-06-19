import type { SKU, Batch } from '@/types';
import { calculateExpiryStatus, generateId } from '@/utils/inventoryCalculator';

const today = new Date();
const addDays = (days: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};
const subtractDays = (days: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
};

export const mockSKUs: SKU[] = [
  {
    id: 'sku-001',
    name: '进口牛奶',
    skuCode: 'MILK-001',
    totalStock: 0,
    category: '乳品'
  },
  {
    id: 'sku-002',
    name: '有机鸡蛋',
    skuCode: 'EGG-002',
    totalStock: 0,
    category: '禽蛋'
  },
  {
    id: 'sku-003',
    name: '新鲜面包',
    skuCode: 'BREAD-003',
    totalStock: 0,
    category: '烘焙'
  },
  {
    id: 'sku-004',
    name: '精品牛排',
    skuCode: 'BEEF-004',
    totalStock: 0,
    category: '肉类'
  },
  {
    id: 'sku-005',
    name: '鲜榨橙汁',
    skuCode: 'JUICE-005',
    totalStock: 0,
    category: '饮料'
  },
  {
    id: 'sku-006',
    name: '即食沙拉',
    skuCode: 'SALAD-006',
    totalStock: 0,
    category: '生鲜'
  }
];

function createBatch(
  skuId: string,
  batchNo: string,
  productionDaysAgo: number,
  shelfLifeDays: number,
  quantity: number,
  isFrozen = false
): Batch {
  const productionDate = subtractDays(productionDaysAgo);
  const expiryDate = addDays(shelfLifeDays - productionDaysAgo);
  const status = calculateExpiryStatus(expiryDate);
  
  return {
    id: generateId(),
    skuId,
    batchNo,
    productionDate,
    expiryDate,
    quantity,
    availableQuantity: quantity,
    status,
    isFrozen,
    createdAt: productionDate
  };
}

export const mockBatches: Batch[] = [
  createBatch('sku-001', 'B20260601MK01', 15, 45, 200),
  createBatch('sku-001', 'B20260610MK02', 8, 45, 150),
  createBatch('sku-001', 'B20260615MK03', 3, 45, 180),
  
  createBatch('sku-002', 'B20260612EG01', 6, 30, 300),
  createBatch('sku-002', 'B20260616EG02', 2, 30, 250),
  createBatch('sku-002', 'B20260617EG03', 1, 30, 0, true),
  
  createBatch('sku-003', 'B20260614BR01', 4, 7, 100),
  createBatch('sku-003', 'B20260617BR02', 1, 7, 120),
  createBatch('sku-003', 'B20260618BR03', 0, 7, 80),
  
  createBatch('sku-004', 'B20260601BF01', 17, 90, 80),
  createBatch('sku-004', 'B20260610BF02', 8, 90, 60),
  createBatch('sku-004', 'B20260615BF03', 3, 90, 100),
  
  createBatch('sku-005', 'B20260613JC01', 5, 14, 150),
  createBatch('sku-005', 'B20260616JC02', 2, 14, 200),
  
  createBatch('sku-006', 'B20260616SD01', 2, 5, 60),
  createBatch('sku-006', 'B20260617SD02', 1, 5, 75),
  createBatch('sku-006', 'B20260618SD03', 0, 5, 40)
];

mockSKUs.forEach(sku => {
  sku.totalStock = mockBatches
    .filter(b => b.skuId === sku.id && !b.isFrozen && b.status !== 'expired')
    .reduce((sum, b) => sum + b.availableQuantity, 0);
});
