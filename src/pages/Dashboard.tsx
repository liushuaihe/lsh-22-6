import { useState, useMemo } from 'react';
import { Warehouse, Box, AlertTriangle, TrendingUp, Package, Snowflake, ArrowDownCircle, ArrowUpCircle, BarChart3 } from 'lucide-react';
import type { OperationType } from '@/types';
import { useInventoryStore } from '@/store/useInventoryStore';
import { OperationTabs } from '@/components/OperationPanel/OperationTabs';
import { InboundForm } from '@/components/OperationPanel/InboundForm';
import { OutboundForm } from '@/components/OperationPanel/OutboundForm';
import { FreezeForm } from '@/components/OperationPanel/FreezeForm';
import { SKUCard } from '@/components/InventoryDashboard/SKUCard';
import { AlertCenter } from '@/components/InventoryDashboard/AlertCenter';
import { OperationLogDrawer } from '@/components/common/OperationLogList';
import { previewFIFOAllocation } from '@/utils/fifoEngine';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<OperationType>('outbound');
  const [outboundSku, setOutboundSku] = useState('');
  const [outboundQuantity, setOutboundQuantity] = useState('');
  
  const { skus, batches, alerts } = useInventoryStore();

  const previewAllocations = useMemo(() => {
    if (activeTab !== 'outbound' || !outboundSku || !outboundQuantity) return null;
    const qty = parseInt(outboundQuantity);
    if (qty <= 0) return null;
    const result = previewFIFOAllocation(outboundSku, qty, batches);
    return result.allocations;
  }, [activeTab, outboundSku, outboundQuantity, batches]);

  const totalStock = useMemo(() => {
    return skus.reduce((sum, s) => sum + s.totalStock, 0);
  }, [skus]);

  const totalSKUs = skus.length;
  const totalBatches = batches.length;
  const activeAlerts = alerts.filter(a => !a.isRead).length;
  const warningBatches = batches.filter(b => b.status === 'warning' && !b.isFrozen).length;
  const frozenBatches = batches.filter(b => b.isFrozen).length;
  const expiredBatches = batches.filter(b => b.status === 'expired').length;

  const stats = [
    { label: '总库存', value: totalStock, icon: Package, color: 'cyan' },
    { label: '商品种类', value: totalSKUs, icon: Box, color: 'emerald' },
    { label: '批次总数', value: totalBatches, icon: BarChart3, color: 'slate' },
    { label: '临期批次', value: warningBatches, icon: AlertTriangle, color: 'orange' },
    { label: '冻结批次', value: frozenBatches, icon: Snowflake, color: 'cyan' },
    { label: '未读告警', value: activeAlerts, icon: AlertTriangle, color: 'red' },
  ];

  const renderForm = () => {
    switch (activeTab) {
      case 'inbound':
        return <InboundForm />;
      case 'outbound':
        return (
          <OutboundForm
            onStateChange={(skuId, qty) => {
              setOutboundSku(skuId);
              setOutboundQuantity(qty);
            }}
          />
        );
      case 'freeze':
        return <FreezeForm />;
      default:
        return null;
    }
  };

  const colorClasses = {
    cyan: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30',
    emerald: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
    slate: 'text-slate-400 bg-slate-700/50 border-slate-600/50',
    orange: 'text-orange-400 bg-orange-500/20 border-orange-500/30',
    red: 'text-red-400 bg-red-500/20 border-red-500/30',
  };

  return (
    <div className="min-h-screen bg-slate-900 bg-[linear-gradient(180deg,#0f172a_0%,#020617_100%)">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
                <Warehouse size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  盲盒仓管
                  <span className="text-xs font-normal px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    进销存演练器
                  </span>
                </h1>
                <p className="text-sm text-slate-400">批次维度 · 先进先出 · 规则固化</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <OperationLogDrawer />
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <TrendingUp size={16} className="text-emerald-400" />
                <span className="text-sm text-emerald-400">演练模式</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1920px] mx-auto px-6 py-6">
        <div className="grid grid-cols-6 gap-4 mb-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const colors = colorClasses[stat.color as keyof typeof colorClasses];
            return (
              <div
                key={index}
                className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400">{stat.label}</span>
                  <div className={`p-1.5 rounded-lg border ${colors}`}>
                    <Icon size={14} />
                  </div>
                </div>
                <div className="font-mono text-2xl font-bold text-slate-100 tabular-nums">
                  {stat.value}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-10 gap-6">
          <div className="col-span-4 space-y-6">
            <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700 backdrop-blur-sm">
              <div className="mb-6">
                <OperationTabs activeTab={activeTab} onTabChange={setActiveTab} />
              </div>
              {renderForm()}
            </div>
          </div>

          <div className="col-span-6 space-y-6">
            <AlertCenter />
            
            <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                  <Warehouse size={20} className="text-cyan-400" />
                  全局库存大屏
                </h3>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>正常</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-orange-400" />
                    <span>临期</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <span>过期</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span>冻结</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 max-h-[calc(100vh-480px)] overflow-y-auto pr-2 custom-scrollbar">
                {skus.map((sku) => (
                  <SKUCard
                    key={sku.id}
                    sku={sku}
                    batches={batches}
                    previewAllocations={
                      activeTab === 'outbound' && previewAllocations && outboundSku === sku.id
                        ? previewAllocations
                        : []
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-4 right-4 flex flex-col gap-2 text-xs text-slate-500 font-mono opacity-50">
        <div className="flex items-center gap-2">
          <ArrowDownCircle size={12} />
          <span>入库</span>
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpCircle size={12} />
          <span>出库</span>
        </div>
        <div className="flex items-center gap-2">
          <Snowflake size={12} />
          <span>冻结</span>
        </div>
      </div>
    </div>
  );
}
