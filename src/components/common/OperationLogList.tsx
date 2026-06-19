import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ArrowDownCircle, ArrowUpCircle, Snowflake, CircleDot,
  CheckCircle2, XCircle, X, Filter, RotateCcw, ScrollText, Search
} from 'lucide-react';
import type { OperationLog } from '@/types';
import { formatDate } from '@/utils/inventoryCalculator';
import { useInventoryStore } from '@/store/useInventoryStore';

const typeConfig = {
  inbound: { icon: ArrowDownCircle, color: 'text-emerald-400', bg: 'bg-emerald-900/20', label: '入库' },
  outbound: { icon: ArrowUpCircle, color: 'text-cyan-400', bg: 'bg-cyan-900/20', label: '出库' },
  freeze: { icon: Snowflake, color: 'text-slate-400', bg: 'bg-slate-800/50', label: '冻结' },
  unfreeze: { icon: CircleDot, color: 'text-amber-400', bg: 'bg-amber-900/20', label: '解冻' }
};

const statusConfig = {
  success: { icon: CheckCircle2, color: 'text-emerald-400', label: '成功' },
  failed: { icon: XCircle, color: 'text-red-400', label: '失败' }
};

type TypeFilter = 'inbound' | 'outbound' | 'freeze' | 'failed';

const typeFilterOptions: { key: TypeFilter; label: string; color: string; activeColor: string }[] = [
  { key: 'inbound', label: '入库', color: 'border-slate-600 text-slate-400', activeColor: 'border-emerald-500 text-emerald-400 bg-emerald-500/10' },
  { key: 'outbound', label: '出库', color: 'border-slate-600 text-slate-400', activeColor: 'border-cyan-500 text-cyan-400 bg-cyan-500/10' },
  { key: 'freeze', label: '冻结', color: 'border-slate-600 text-slate-400', activeColor: 'border-slate-400 text-slate-300 bg-slate-500/10' },
  { key: 'failed', label: '失败', color: 'border-slate-600 text-slate-400', activeColor: 'border-red-500 text-red-400 bg-red-500/10' }
];

export function OperationLogDrawer() {
  const [open, setOpen] = useState(false);
  const [typeFilters, setTypeFilters] = useState<Set<TypeFilter>>(new Set());
  const [nameSearch, setNameSearch] = useState('');
  const { operationLogs, skus } = useInventoryStore();

  const getSkuName = useCallback((skuId: string) => {
    return skus.find(s => s.id === skuId)?.name || skuId;
  }, [skus]);

  const toggleTypeFilter = (key: TypeFilter) => {
    setTypeFilters(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setTypeFilters(new Set());
    setNameSearch('');
  };

  const hasActiveFilters = typeFilters.size > 0 || nameSearch.trim().length > 0;

  const filteredLogs = useMemo(() => {
    return operationLogs.filter((log: OperationLog) => {
      const typeFilterKeys = ['inbound', 'outbound', 'freeze'] as const;
      const hasTypeFilter = typeFilterKeys.some(k => typeFilters.has(k));
      if (hasTypeFilter && !typeFilterKeys.some(k => typeFilters.has(k) && log.type === k)) {
        return false;
      }

      if (typeFilters.has('failed') && log.status !== 'failed') return false;

      if (nameSearch.trim()) {
        const skuName = getSkuName(log.skuId);
        const keyword = nameSearch.trim().toLowerCase();
        if (
          !skuName.toLowerCase().includes(keyword) &&
          !log.message.toLowerCase().includes(keyword)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [operationLogs, typeFilters, nameSearch, getSkuName]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-slate-100 transition-all duration-200"
      >
        <ScrollText size={16} />
        <span className="text-sm">操作日志</span>
        {operationLogs.length > 0 && (
          <span className="min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-mono">
            {operationLogs.length}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm animate-drawer-overlay"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 right-0 z-[70] h-full w-[480px] max-w-[90vw] bg-slate-900 border-l border-slate-700 shadow-2xl shadow-black/50 transform transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <ScrollText size={20} className="text-cyan-400" />
              <h2 className="text-lg font-semibold text-slate-100">操作历史</h2>
              <span className="text-xs font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-800">
                {filteredLogs.length} / {operationLogs.length}
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="关闭抽屉"
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="px-6 py-4 border-b border-slate-700/50 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Filter size={14} className="text-slate-400" />
              <span className="text-xs text-slate-400 font-medium">筛选条件</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {typeFilterOptions.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => toggleTypeFilter(opt.key)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200 ${
                    typeFilters.has(opt.key) ? opt.activeColor : opt.color
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={nameSearch}
                onChange={e => setNameSearch(e.target.value)}
                placeholder="搜索商品名称或消息..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-500 transition-colors"
              />
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                <RotateCcw size={12} />
                <span>清空筛选</span>
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4">
            {filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                <CircleDot size={40} className="mb-3 opacity-30" />
                <p className="text-sm">
                  {hasActiveFilters ? '没有匹配的记录' : '暂无操作记录'}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    清空筛选查看全部
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLogs.map((log: OperationLog) => {
                  const config = typeConfig[log.type];
                  const sConfig = statusConfig[log.status];
                  const Icon = config.icon;
                  const StatusIcon = sConfig.icon;

                  return (
                    <div
                      key={log.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 ${
                        log.status === 'success'
                          ? 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                          : 'bg-red-900/20 border-red-900/50 hover:border-red-800'
                      }`}
                    >
                      <div className={`p-2 rounded ${config.bg} mt-0.5`}>
                        <Icon size={16} className={config.color} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${config.bg} ${config.color}`}>
                              {config.label}
                            </span>
                            <span className="text-sm font-medium text-slate-200 truncate">
                              {getSkuName(log.skuId)}
                            </span>
                            <span className="text-xs font-mono text-slate-400">
                              x{log.quantity}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <StatusIcon size={12} className={sConfig.color} />
                            <span className={`text-xs ${sConfig.color}`}>{sConfig.label}</span>
                          </div>
                        </div>

                        <p className={`text-sm ${log.status === 'success' ? 'text-slate-400' : 'text-red-400'}`}>
                          {log.message}
                        </p>

                        <p className="text-xs text-slate-500 mt-1 font-mono">
                          {formatDate(log.createdAt)} {new Date(log.createdAt).toLocaleTimeString('zh-CN')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
