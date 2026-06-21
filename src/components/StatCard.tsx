import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: string;
  className?: string;
  isCurrency?: boolean;
}

export default function StatCard({
  title,
  value,
  change,
  changeLabel = "环比",
  icon = "📊",
  className,
  isCurrency = false,
}: StatCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  const displayValue = isCurrency ? formatCurrency(value as number) : value;

  return (
    <div
      className={cn(
        "bg-white rounded-xl shadow-sm p-6 border border-gray-100",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold mt-2 text-gray-900">
            {displayValue}
          </p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  "text-sm font-medium",
                  isPositive && "text-green-600",
                  isNegative && "text-red-600",
                  !isPositive && !isNegative && "text-gray-500"
                )}
              >
                {isPositive ? "↑" : isNegative ? "↓" : "→"}
                {Math.abs(change).toFixed(1)}%
              </span>
              <span className="text-sm text-gray-400">{changeLabel}</span>
            </div>
          )}
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );
}
