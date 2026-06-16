interface StatCardProps {
  title: string;
  value: string | number;
  suffix?: string;
  trend?: 'up' | 'down';
  trendValue?: string;
  color?: string;
}

export default function StatCard({ title, value, suffix, trend, trendValue, color }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="title">{title}</div>
      <div className="value" style={color ? { color } : undefined}>
        {value}
        {suffix && <span className="suffix">{suffix}</span>}
      </div>
      {trend && trendValue && (
        <div className={`trend ${trend}`}>
          {trend === 'up' ? '↑' : '↓'} {trendValue}
        </div>
      )}
    </div>
  );
}
