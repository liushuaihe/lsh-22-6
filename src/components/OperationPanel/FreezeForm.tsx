import { useState } from 'react';
import { Snowflake, Package, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { useInventoryStore } from '@/store/useInventoryStore';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDate } from '@/utils/inventoryCalculator';
import type { Batch } from '@/types';

export function FreezeForm() {
  const { skus, batches, toggleFreeze } = useInventoryStore();
  const [selectedSku, setSelectedSku] = useState('');

  const skuBatches = selectedSku
    ? batches.filter(b => b.skuId === selectedSku).sort(
        (a, b) => new Date(a.productionDate).getTime() - new Date(b.productionDate).getTime()
      )
    : [];

  const getSkuName = (skuId: string) => {
    return skus.find(s => s.id === skuId)?.name || skuId;
  };

  const handleToggleFreeze = (batchId: string) => {
    toggleFreeze(batchId);
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-700/50 border border-slate-600 mb-3">
          <Snowflake size={32} className="text-cyan-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-100">残次品冻结</h3>
        <p className="text-sm text-slate-400">一键冻结有问题的批次，不可参与出库</p>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
          <Package size={14} />
          选择商品
        </label>
        <select
          value={selectedSku}
          onChange={(e) => setSelectedSku(e.target.value)}
          className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
        >
          <option value="">请选择商品...</option>
          {skus.map((sku) => (
            <option key={sku.id} value={sku.id}>
              {sku.name} ({sku.skuCode})
            </option>
          ))}
        </select>
      </div>

      {selectedSku && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-slate-300">批次列表</h4>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-400" />
                <span className="text-slate-400">可出库</span>
              </div>
              <div className="flex items-center gap-1">
                <Snowflake size={12} className="text-cyan-400" />
                <span className="text-slate-400">已冻结</span>
              </div>
              <div className="flex items-center gap-1">
                <XCircle size={12} className="text-red-400" />
                <span className="text-slate-400">已过期</span>
              </div>
            </div>
          </div>

          {skuBatches.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Package size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">暂无批次</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
              {skuBatches.map((batch: Batch, index: number) => (
                <div
                  key={batch.id}
                  className={`p-3 rounded-lg border transition-all duration-200 ${
                    batch.isFrozen
                      ? 'bg-cyan-900/10 border-cyan-800/50'
                      : batch.status === 'expired'
                        ? 'bg-red-900/10 border-red-800/50'
                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 flex items-center justify-center text-xs font-bold rounded bg-slate-700 text-slate-300">
                          {index + 1}
                        </span>
                        <span className="font-mono text-sm text-slate-200">{batch.batchNo}</span>
                        <StatusBadge
                          status={batch.status}
                          isFrozen={batch.isFrozen}
                          showText={false}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                        <div>
                          <span className="text-slate-500">生产:</span>{' '}
                          {formatDate(batch.productionDate)}
                        </div>
                        <div>
                          <span className="text-slate-500">过期:</span>{' '}
                          {formatDate(batch.expiryDate)}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-slate-500">库存:</span>
                        <span className={`font-mono font-bold ${
                          batch.isFrozen ? 'text-cyan-400' : batch.status === 'expired' ? 'text-red-400' : 'text-emerald-400'
                        }`}>
                          {batch.availableQuantity} 件
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleFreeze(batch.id)}
                      disabled={batch.status === 'expired'}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                        batch.status === 'expired'
                          ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                          : batch.isFrozen
                            ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30'
                            : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30'
                      }`}
                    >
                      <Snowflake size={14} />
                      {batch.isFrozen ? '解冻' : '冻结'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedSku && (
        <div className="p-3 bg-amber-900/20 border border-amber-800/50 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-300">操作提示</p>
              <p className="text-xs text-amber-400/70 mt-0.5">
                冻结后的批次将无法参与出库分配，直到解冻。已过期的批次无法解冻。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
