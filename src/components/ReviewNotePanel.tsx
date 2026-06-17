import { useState, useEffect } from 'react';
import { X, Send, AlertTriangle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { createReviewNote, getReviewNotes } from '@/services/api';
import type { ReviewNote } from '@/types';

const severityMap: Record<string, { label: string; color: string }> = {
  low: { label: '低', color: 'text-amber-400' },
  medium: { label: '中', color: 'text-orange-400' },
  high: { label: '高', color: 'text-red-400' },
  critical: { label: '紧急', color: 'text-red-500' },
};

const typeLabels: Record<string, string> = {
  terminal_delay: '终端延迟',
  access_missing: '门禁缺失',
  billing_caliber_change: '口径变更',
  fall_event: '跌倒事件',
};

export default function ReviewNotePanel() {
  const { selectedAnnotation, setSelectedAnnotation, reviewNotes, setReviewNotes } =
    useStore();
  const [noteText, setNoteText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedAnnotation) {
      setLoading(true);
      getReviewNotes(selectedAnnotation.id)
        .then((notes) => {
          setReviewNotes(notes);
        })
        .catch(() => {
          setReviewNotes([]);
        })
        .finally(() => setLoading(false));
    }
  }, [selectedAnnotation, setReviewNotes]);

  if (!selectedAnnotation) return null;

  const sev = severityMap[selectedAnnotation.severity] || severityMap.low;

  const handleSubmit = async () => {
    if (!noteText.trim()) return;
    setSubmitting(true);
    try {
      await createReviewNote(selectedAnnotation.id, '护理主管', noteText.trim());
      const notes = await getReviewNotes(selectedAnnotation.id);
      setReviewNotes(notes);
      setNoteText('');
    } catch {
      setReviewNotes([
        ...reviewNotes,
        {
          id: `local-${Date.now()}`,
          annotationId: selectedAnnotation.id,
          content: noteText.trim(),
          author: '护理主管',
          createdAt: new Date().toISOString(),
        },
      ]);
      setNoteText('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="absolute right-0 top-0 h-full w-[360px] bg-[#1B2A4A] border-l border-white/[0.08] z-30 animate-slide-in-right flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
        <h3 className="text-sm font-semibold text-white/90">审核笔记</h3>
        <button
          onClick={() => setSelectedAnnotation(null)}
          className="text-white/40 hover:text-white/80 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="px-4 py-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={14} className={sev.color} />
          <span className={`text-xs font-medium ${sev.color}`}>
            {typeLabels[selectedAnnotation.type]}
          </span>
          <span className={`text-xs ${sev.color}`}>({sev.label})</span>
        </div>
        <p className="text-xs text-white/50 mb-1 font-[JetBrains_Mono,monospace]">
          {selectedAnnotation.timestamp}
        </p>
        <p className="text-sm text-white/70">{selectedAnnotation.description}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {loading ? (
          <p className="text-xs text-white/30 text-center py-6">加载中...</p>
        ) : reviewNotes.filter((n) => n.annotationId === selectedAnnotation.id).length === 0 ? (
          <p className="text-xs text-white/30 text-center py-6">暂无审核笔记</p>
        ) : (
          reviewNotes
            .filter((n) => n.annotationId === selectedAnnotation.id)
            .map((note) => (
              <div key={note.id} className="bg-white/[0.03] rounded-lg p-3">
                <p className="text-sm text-white/80">{note.content}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-white/40">
                  <span>{note.author}</span>
                  <span>·</span>
                  <span className="font-[JetBrains_Mono,monospace]">
                    {new Date(note.createdAt).toLocaleString('zh-CN')}
                  </span>
                </div>
              </div>
            ))
        )}
      </div>

      <div className="px-4 py-3 border-t border-white/[0.08]">
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="输入审核笔记..."
          className="w-full h-20 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/30 resize-none focus:outline-none focus:border-amber-500/40"
        />
        <button
          onClick={handleSubmit}
          disabled={submitting || !noteText.trim()}
          className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-amber-500/20 text-amber-400 text-sm font-medium hover:bg-amber-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send size={14} />
          提交
        </button>
      </div>
    </div>
  );
}
