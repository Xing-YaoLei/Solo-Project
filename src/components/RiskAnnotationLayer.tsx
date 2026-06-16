import { useStore } from '@/store/useStore';
import type { RiskAnnotation } from '@/types';

const typeConfig: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  terminal_delay: {
    label: '终端延迟',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
  access_missing: {
    label: '门禁缺失',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
  },
  billing_caliber_change: {
    label: '口径变更',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
  },
  fall_event: {
    label: '跌倒事件',
    color: 'text-red-500',
    bg: 'bg-red-600/10',
    border: 'border-red-600/30',
  },
};

function AnnotationTag({ annotation }: { annotation: RiskAnnotation }) {
  const { setSelectedAnnotation } = useStore();
  const cfg = typeConfig[annotation.type] || typeConfig.terminal_delay;

  const timeLabel =
    annotation.type === 'terminal_delay'
      ? ` ${annotation.timestamp.slice(11, 16)}`
      : '';

  return (
    <button
      onClick={() => setSelectedAnnotation(annotation)}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition-colors hover:brightness-125 ${cfg.bg} ${cfg.color} ${cfg.border}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: 'currentColor' }}
      />
      {cfg.label}{timeLabel}
    </button>
  );
}

export default function RiskAnnotationLayer() {
  const { annotations } = useStore();

  if (annotations.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 p-3 bg-[#1B2A4A]/80 rounded-lg border border-white/[0.06]">
      <span className="text-xs text-white/40 mr-1 self-center">风险标注</span>
      {annotations.map((a) => (
        <AnnotationTag key={a.id} annotation={a} />
      ))}
    </div>
  );
}
