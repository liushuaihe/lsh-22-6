import { ArrowDownCircle, ArrowUpCircle, Snowflake } from 'lucide-react';
import type { OperationType } from '@/types';

interface OperationTabsProps {
  activeTab: OperationType;
  onTabChange: (tab: OperationType) => void;
}

const tabs = [
  { id: 'inbound' as OperationType, label: '入库', icon: ArrowDownCircle, color: 'emerald' },
  { id: 'outbound' as OperationType, label: '出库', icon: ArrowUpCircle, color: 'cyan' },
  { id: 'freeze' as OperationType, label: '冻结', icon: Snowflake, color: 'slate' }
];

export function OperationTabs({ activeTab, onTabChange }: OperationTabsProps) {
  return (
    <div className="flex gap-1 p-1 bg-slate-800/50 rounded-lg border border-slate-700">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        const colorClasses = {
          emerald: isActive
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
            : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10',
          cyan: isActive
            ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
            : 'text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10',
          slate: isActive
            ? 'bg-slate-600/50 text-slate-200 border-slate-500/50 shadow-lg shadow-slate-500/10'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
        };

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 border ${colorClasses[tab.color as keyof typeof colorClasses]}`}
          >
            <Icon size={18} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
