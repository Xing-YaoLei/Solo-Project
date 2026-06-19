'use client';

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { useDashboardStore } from '@/store/dashboard';

const NORMAL_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#06B6D4', '#F59E0B'];
const GAP_COLOR = '#DC2626';

const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  isGap,
  name,
}: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05 && !isGap) return null;

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={isGap ? 12 : 10}
      fontWeight={isGap ? 700 : 500}
      style={{ filter: isGap ? 'drop-shadow(0 0 6px rgba(220,38,38,0.9))' : 'none' }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function InventoryPieChart() {
  const { inventoryData, isLoading } = useDashboardStore();

  if (isLoading || inventoryData.length === 0) {
    return (
      <div className="h-[340px] animate-pulse rounded-xl border border-industrial-700 bg-industrial-800" />
    );
  }

  const totalValue = inventoryData.reduce((s, i) => s + i.value, 0);
  const gapItem = inventoryData.find((i) => i.isGap);
  const normalItems = inventoryData.filter((i) => !i.isGap);

  return (
    <div className="rounded-xl border border-industrial-700 bg-gradient-to-br from-industrial-800/80 to-industrial-900/80 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-sm font-bold tracking-wide text-white">配件库存构成</h3>
          <p className="mt-0.5 text-[11px] text-industrial-400">
            库存总价值 ¥{totalValue.toLocaleString()} · 缺口项独立染色
          </p>
        </div>
        {gapItem && (
          <div className="flex items-center gap-2 rounded-md border border-risk-danger/50 bg-risk-danger/10 px-3 py-1 animate-pulse-glow">
            <span className="h-2.5 w-2.5 rounded-full bg-risk-danger" />
            <span className="text-[11px] font-semibold text-risk-danger">
              {gapItem.count} 类配件缺货
            </span>
          </div>
        )}
      </div>
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              <filter id="gapGlow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <Pie
              data={normalItems}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={95}
              paddingAngle={2}
              dataKey="value"
              label={renderCustomLabel}
              labelLine={false}
            >
              {normalItems.map((_, index) => (
                <Cell key={`cell-${index}`} fill={NORMAL_COLORS[index % NORMAL_COLORS.length]} />
              ))}
            </Pie>
            {gapItem && (
              <Pie
                data={[gapItem]}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={105}
                dataKey="value"
                label={renderCustomLabel}
                labelLine={false}
                filter="url(#gapGlow)"
              >
                <Cell fill={GAP_COLOR} />
              </Pie>
            )}
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F172A',
                border: '1px solid #334155',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#F1F5F9',
              }}
              formatter={(value: number, _name: string, props: any) => [
                `¥${value.toLocaleString()} (${props.payload.count} SKU)`,
                props.payload.isGap ? '⚠️ 库存缺口' : props.payload.name,
              ]}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }}
              formatter={(value: string) => (
                <span className={value === '库存缺口' ? 'text-risk-danger font-semibold' : ''}>
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
