import { useState } from 'react';
import { AlertTriangle, XCircle, Info, Snowflake, X, Bell, Check, Trash2 } from 'lucide-react';
import { useInventoryStore } from '@/store/useInventoryStore';
import type { Alert } from '@/types';
import { formatDate } from '@/utils/inventoryCalculator';

const typeConfig = {
  stock_shortage: { icon: XCircle, color: 'red', label: '库存不足' },
  batch_occupied: { icon: AlertTriangle, color: 'orange', label: '批次占用' },
  expiry_warning: { icon: AlertTriangle, color: 'orange', label: '临期预警' },
  over_sell: { icon: XCircle, color: 'red', label: '超卖风险' },
  frozen_batch: { icon: Snowflake, color: 'cyan', label: '批次冻结' }
};

export function AlertCenter() {
  const { alerts, markAlertRead, clearAllAlerts } = useInventoryStore();
  const [isExpanded, setIsExpanded] = useState(true);

  const unreadCount = alerts.filter(a => !a.isRead).length;

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'red':
        return {
          icon: 'text-red-400',
          bg: 'bg-red-900/30',
          border: 'border-red-800/50',
          badge: 'bg-red-500/20 text-red-400 border-red-500/30'
        };
      case 'orange':
        return {
          icon: 'text-orange-400',
          bg: 'bg-orange-900/30',
          border: 'border-orange-800/50',
          badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
        };
      case 'cyan':
        return {
          icon: 'text-cyan-400',
          bg: 'bg-cyan-900/30',
          border: 'border-cyan-800/50',
          badge: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
        };
      default:
        return {
          icon: 'text-blue-400',
          bg: 'bg-blue-900/30',
          border: 'border-blue-800/50',
          badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
        };
    }
  };

  return (
    <div className={`rounded-xl border transition-all duration-300 overflow-hidden ${
      alerts.length > 0 ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-800/30 border-slate-700/50'
    }`}>
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell size={20} className="text-slate-300" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-bold animate-pulse">
                {unreadCount}
              </span>
            )}
          </div>
          <h3 className="text-lg font-semibold text-slate-100">告警中心</h3>
          <span className="text-xs text-slate-400">共 {alerts.length} 条</span>
        </div>
        <div className="flex items-center gap-2">
          {alerts.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearAllAlerts();
              }}
              className="p-2 text-slate-400 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
              title="清除所有告警"
            >
              <Trash2 size={16} />
            </button>
          )}
          <button
            className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X
              size={18}
              className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Check size={32} className="mx-auto mb-2 text-emerald-500/50" />
              <p className="text-sm">暂无告警，运行状态良好</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {alerts.map((alert: Alert) => {
                const config = typeConfig[alert.type] || { icon: Info, color: 'blue', label: '通知' };
                const colors = getColorClasses(config.color);
                const Icon = config.icon;

                return (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border transition-all duration-200 ${colors.bg} ${colors.border} ${
                      !alert.isRead ? 'ring-2 ring-cyan-500/30' : 'opacity-70'
                    }`}
                    onClick={() => !alert.isRead && markAlertRead(alert.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-1.5 rounded ${colors.badge} mt-0.5`}>
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="text-sm font-medium text-slate-200">
                            {alert.title}
                          </h4>
                          {!alert.isRead && (
                            <span className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0 animate-pulse" />
                          )}
                        </div>
                        <p className="text-sm text-slate-400">{alert.message}</p>
                        <p className="text-xs text-slate-500 mt-1 font-mono">
                          {formatDate(alert.createdAt)} {new Date(alert.createdAt).toLocaleTimeString('zh-CN')}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
