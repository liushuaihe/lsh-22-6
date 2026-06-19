import { useState } from 'react';
import { ArrowDownCircle, Package, Calendar, Hash, Plus } from 'lucide-react';
import { useInventoryStore } from '@/store/useInventoryStore';
import { generateBatchNo } from '@/utils/inventoryCalculator';

export function InboundForm() {
  const { skus, inbound } = useInventoryStore();
  const [selectedSku, setSelectedSku] = useState('');
  const [batchNo, setBatchNo] = useState(generateBatchNo());
  const [productionDate, setProductionDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState('');
  const [quantity, setQuantity] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSku || !quantity || !expiryDate) return;

    const qty = parseInt(quantity);
    if (qty <= 0) return;

    inbound(selectedSku, {
      batchNo,
      productionDate,
      expiryDate,
      quantity: qty,
      availableQuantity: qty,
      isFrozen: false,
      createdAt: new Date().toISOString()
    });

    setSelectedSku('');
    setBatchNo(generateBatchNo());
    setQuantity('');
    setExpiryDate('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 mb-3">
          <ArrowDownCircle size={32} className="text-emerald-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-100">入库录入</h3>
        <p className="text-sm text-slate-400">录入新批次商品信息</p>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
          <Package size={14} />
          选择商品
        </label>
        <select
          value={selectedSku}
          onChange={(e) => setSelectedSku(e.target.value)}
          className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
          required
        >
          <option value="">请选择商品...</option>
          {skus.map((sku) => (
            <option key={sku.id} value={sku.id}>
              {sku.name} ({sku.skuCode}) - {sku.category}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
          <Hash size={14} />
          批次号
        </label>
        <div className="relative">
          <input
            type="text"
            value={batchNo}
            onChange={(e) => setBatchNo(e.target.value.toUpperCase())}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
            placeholder="自动生成或手动输入"
            required
          />
          <button
            type="button"
            onClick={() => setBatchNo(generateBatchNo())}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-emerald-400 transition-colors"
            title="重新生成批次号"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
            <Calendar size={14} />
            生产日期
          </label>
          <input
            type="date"
            value={productionDate}
            onChange={(e) => setProductionDate(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
            required
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
            <Calendar size={14} />
            过期日期
          </label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            min={productionDate}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
            required
          />
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
          <Hash size={14} />
          入库数量
        </label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          min="1"
          className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 font-mono text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
          placeholder="请输入数量"
          required
        />
      </div>

      <button
        type="submit"
        disabled={!selectedSku || !quantity || !expiryDate}
        className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40"
      >
        <ArrowDownCircle size={20} />
        确认入库
      </button>
    </form>
  );
}
