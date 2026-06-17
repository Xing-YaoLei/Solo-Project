"use client";

import React, { useState } from "react";

interface NoteItem {
  id: string;
  content: string;
  author: string;
  createdAt: string | Date;
  stockDiffId: string | null;
}

interface NotePanelProps {
  siteId: string;
  stockDiffId?: string | null;
  initialNotes: NoteItem[];
}

export function NotePanel({ siteId, stockDiffId, initialNotes }: NotePanelProps) {
  const [notes, setNotes] = useState<NoteItem[]>(initialNotes || []);
  const [newContent, setNewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitNote() {
    if (!newContent.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newContent.trim(),
          author: "当前用户",
          siteId,
          stockDiffId: stockDiffId || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setNotes([data.note, ...notes]);
        setNewContent("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full min-h-[400px]">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="card-title flex items-center gap-2">
          <svg className="w-4 h-4 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          复盘备注
        </div>
        <span className="chip bg-slate-100 text-slate-600">{notes.length} 条</span>
      </div>

      <div className="p-4 border-b border-slate-100 space-y-2">
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submitNote();
          }}
          placeholder="写点什么？复盘结论、跟进事项、协调记录都可以，⌘/Ctrl + Enter 提交"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
          rows={2}
        />
        <div className="flex justify-end">
          <button
            onClick={submitNote}
            disabled={!newContent.trim() || submitting}
            className="btn btn-primary text-xs py-1.5"
          >
            {submitting ? "提交中..." : "保存备注"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3 scrollbar-thin">
        {notes.length === 0 && (
          <div className="text-center text-sm text-slate-400 py-8">
            还没有备注，来当第一个留言的人 ✍️
          </div>
        )}
        {notes.map((n) => (
          <div key={n.id} className="rounded-lg bg-slate-50 p-3 border border-slate-100">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-semibold">
                  {n.author?.slice(0, 1) || "U"}
                </div>
                <span className="text-sm font-medium text-slate-700">{n.author}</span>
              </div>
              <span className="text-xs text-slate-400">
                {new Date(n.createdAt).toLocaleString("zh-CN")}
              </span>
            </div>
            <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {n.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
