"use client";

interface Props {
  data: Array<{ name: string; value: number }>;
}

export default function LevelFunnel({ data }: Props) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const colors = ["#C9A961", "#B8944F", "#A67F40", "#8B6F47"];

  return (
    <div className="w-full h-72 flex flex-col justify-center gap-2 px-4">
      {data.map((item, idx) => {
        const width = (item.value / max) * 100;
        const pct = data[0].value > 0 ? ((item.value / data[0].value) * 100).toFixed(1) : "0";
        return (
          <div key={item.name} className="flex items-center gap-4">
            <div className="w-16 text-sm font-medium text-right" style={{ color: "#8B8378" }}>
              {item.name}
            </div>
            <div className="flex-1 h-10 rounded-xl overflow-hidden relative" style={{ backgroundColor: "#0F0D0B" }}>
              <div
                className="h-full rounded-xl flex items-center justify-between px-4 transition-all duration-700"
                style={{
                  width: `${Math.max(width, 12)}%`,
                  background: `linear-gradient(90deg, ${colors[idx]}, ${colors[idx]}dd)`,
                }}
              >
                <span className="font-mono text-sm font-semibold text-white">
                  {item.value.toLocaleString()}
                </span>
                <span className="font-mono text-xs text-white/80">{pct}%</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
