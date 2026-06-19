import { calculateExpiryPercentage, calculateDaysRemaining } from '@/utils/inventoryCalculator';

interface BatchProgressProps {
  productionDate: string;
  expiryDate: string;
  showLabel?: boolean;
}

export function BatchProgress({ productionDate, expiryDate, showLabel = true }: BatchProgressProps) {
  const percentage = calculateExpiryPercentage(productionDate, expiryDate);
  const daysRemaining = calculateDaysRemaining(expiryDate);
  
  const getColorClass = () => {
    if (daysRemaining < 0) return 'bg-red-500';
    if (daysRemaining <= 7) return 'bg-red-400';
    if (daysRemaining <= 30) return 'bg-orange-400';
    return 'bg-emerald-400';
  };

  const getBgClass = () => {
    if (daysRemaining < 0) return 'bg-red-900/30';
    if (daysRemaining <= 7) return 'bg-red-900/20';
    if (daysRemaining <= 30) return 'bg-orange-900/20';
    return 'bg-emerald-900/20';
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-400">保质期进度</span>
          <span className={`font-mono ${daysRemaining <= 7 ? 'text-red-400' : daysRemaining <= 30 ? 'text-orange-400' : 'text-emerald-400'}`}>
            {daysRemaining < 0 ? `已过期 ${Math.abs(daysRemaining)} 天` : `剩余 ${daysRemaining} 天`}
          </span>
        </div>
      )}
      <div className={`h-2 rounded-full overflow-hidden ${getBgClass()}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${getColorClass()}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
