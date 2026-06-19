import { useState, useMemo } from 'react';
import { ArrowUpCircle, Package, Hash, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useInventoryStore } from '@/store/useInventoryStore';
import { previewFIFOAllocation } from '@/utils/fifoEngine';
import { formatDate } from '@/utils/inventoryCalculator';

interface OutboundFormProps {
  onStateChange?: (skuId: string, quantity: string) => void;
}

export function OutboundForm({ onStateChange }: OutboundFormProps) {
  const { skus, batches, outbound } = useInventoryStore();
  const [selectedSku, setSelectedSku] = useState('');
  const [quantity, setQuantity] = useState('');

  const handleSkuChange = (value: string) => {
    setSelectedSku(value);
    onStateChange?.(value, quantity);
  };

  const handleQuantityChange = (value: string) => {
    setQuantity(value);
    onStateChange?.(selectedSku, value);
  };

  const preview = useMemo(() => {
    if (!selectedSku || !quantity) return null;
    const qty = parseInt(quantity);
    if (qty <= 0) return null;
    return previewFIFOAllocation(selectedSku, qty, batches);
  }, [selectedSku, quantity, batches]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSku || !quantity) return;

    const qty = parseInt(quantity);
    if (qty <= 0) return;

    const result = outbound(selectedSku, qty);
    
    if (result.success) {
      setSelectedSku('');
      setQuantity('');
      onStateChange?.('', '');
    }
  };

  const getSkuName = (skuId: string) => {
    return skus.find(s => s.id === skuId)?.name || skuId;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-500/30 mb-3">
          <ArrowUpCircle size={32} className="text-cyan-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-100">出库录入</h3>
        <p className="text-sm text-slate-400">系统将自动执行先进先出规则</p>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
          <Package size={14} />
          选择商品
        </label>
        <select
          value={selectedSku}
          onChange={(e) => handleSkuChange(e.target.value)}
          className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
          required
        >
          <option value="">请选择商品...</option>
          {skus.map((sku) => (
            <option key={sku.id} value={sku.id}>
              {sku.name} ({sku.skuCode}) - 可用库存: {sku.totalStock}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
          <Hash size={14} />
          出库数量
        </label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => handleQuantityChange(e.target.value)}
          min="1"
          className={`w-full px-4 py-3 bg-slate-800 border rounded-lg text-slate-100 font-mono text-lg focus:outline-none transition-all ${
            preview && !preview.canFulfill
              ? 'border-red-500 focus:ring-2 focus:ring-red-500/50 focus:border-red-500 animate-pulse'
              : 'border-slate-600 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500'
          }`}
          placeholder="请输入数量"
          required
        />
        {preview && (
          <div className={`mt-2 flex items-center gap-2 text-sm ${
            preview.canFulfill ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {preview.canFulfill ? (
              <><CheckCircle2 size={14} /> 可用库存: {preview.totalAvailable} 件</>
            ) : (
              <><AlertTriangle size={14} /> 库存不足，当前可用: {preview.totalAvailable} 件</>
            )}
          </div>
        )}
      </div>

      {preview && preview.allocations.length > 0 && (
        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <Package size={14} className="text-cyan-400" />
            FIFO 分配预览
          </h4>
          <div className="space-y-2">
            {preview.allocations.map((alloc, index) => {
              const batch = batches.find(b => b.id === alloc.batchId);
              if (!batch) return null;
              return (
                <div
                  key={alloc.batchId}
                  className="flex items-center justify-between p-2 bg-slate-900/50 rounded border border-slate-700"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 flex items-center justify-center text-xs font-bold rounded bg-cyan-500/20 text-cyan-400">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-mono text-slate-200">{batch.batchNo}</p>
                      <p className="text-xs text-slate-500">
                        生产: {formatDate(batch.productionDate)} | 过期: {formatDate(batch.expiryDate)}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-mono text-cyan-400 font-bold">
                    -{alloc.quantity}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={!selectedSku || !quantity || (preview !== null && !preview.canFulfill)}
        className="w-full py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40"
      >
        <ArrowUpCircle size={20} />
        确认出库（FIFO自动分配）
      </button>
    </form>
  );
}
