"use client";

import { useState } from "react";

type NoteStatus = "urgent" | "warning" | "expired" | "normal";

interface MemberNote {
  id: string;
  content: string;
  createdAt: Date;
  staff: { name: string } | null;
}

interface MemberInfo {
  id: string;
  name: string;
  memberNo: string;
  phone: string | null;
  level: string;
}

interface EnrichedBenefit {
  id: string;
  memberId: string;
  type: string;
  name: string;
  value: { toNumber: () => number };
  expireAt: Date | null;
  status: NoteStatus;
  member: MemberInfo;
  memberNotes: MemberNote[];
  daysLeft: number | null;
}

interface Props {
  benefits: EnrichedBenefit[];
  formatCurrency: (amount: number | string) => string;
  formatDate: (date: Date | string) => string;
}

export default function BenefitsList({ benefits, formatCurrency, formatDate }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [noteContents, setNoteContents] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [localNotes, setLocalNotes] = useState<Record<string, MemberNote[]>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getDisplayNotes = (benefitId: string, original: MemberNote[]) => {
    return localNotes[benefitId] || original;
  };

  const handleNoteChange = (benefitId: string, value: string) => {
    setNoteContents((prev) => ({ ...prev, [benefitId]: value }));
  };

  const handleSubmitNote = async (benefit: EnrichedBenefit) => {
    const content = noteContents[benefit.id]?.trim();
    if (!content) return;

    setSubmitting((prev) => ({ ...prev, [benefit.id]: true }));

    try {
      const res = await fetch(`/api/members/${benefit.memberId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, benefitId: benefit.id }),
      });

      if (res.ok) {
        const data = await res.json();
        const newNote = data.note as MemberNote;
        setLocalNotes((prev) => {
          const existing = prev[benefit.id] || benefit.memberNotes;
          return { ...prev, [benefit.id]: [newNote, ...existing] };
        });
        setNoteContents((prev) => ({ ...prev, [benefit.id]: "" }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting((prev) => ({ ...prev, [benefit.id]: false }));
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "coupon":
        return "优惠券";
      case "stored_value":
        return "储值金";
      case "points":
        return "积分";
      default:
        return type;
    }
  };

  const getStatusStyle = (status: NoteStatus) => {
    switch (status) {
      case "urgent":
        return { color: "#B84A4A", bg: "rgba(184,74,74,0.1)", label: "紧急" };
      case "warning":
        return { color: "#C9A961", bg: "rgba(201,169,97,0.1)", label: "即将过期" };
      case "expired":
        return { color: "#8B8378", bg: "rgba(139,131,120,0.1)", label: "已过期" };
      default:
        return { color: "#4A8B5C", bg: "rgba(74,139,92,0.1)", label: "正常" };
    }
  };

  if (benefits.length === 0) {
    return (
      <div className="text-center py-16" style={{ color: "#8B8378" }}>
        <svg className="w-16 h-16 mx-auto mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm">暂无即将过期的权益</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-2">
      <table className="w-full">
        <thead>
          <tr className="text-xs" style={{ color: "#8B8378", borderBottom: "1px solid #2D2722" }}>
            <th className="text-left py-3 px-4 font-medium w-8"></th>
            <th className="text-left py-3 px-4 font-medium">权益名称</th>
            <th className="text-left py-3 px-4 font-medium">类型</th>
            <th className="text-right py-3 px-4 font-medium">价值</th>
            <th className="text-left py-3 px-4 font-medium">会员</th>
            <th className="text-left py-3 px-4 font-medium">有效期</th>
            <th className="text-right py-3 px-4 font-medium">剩余天数</th>
            <th className="text-left py-3 px-4 font-medium">状态</th>
          </tr>
        </thead>
        <tbody>
          {benefits.map((b) => {
            const isExpanded = expandedIds.has(b.id);
            const statusStyle = getStatusStyle(b.status);
            const displayNotes = getDisplayNotes(b.id, b.memberNotes);

            return (
              <>
                <tr
                  key={b.id}
                  className="border-b hover:bg-white/5 cursor-pointer transition-colors"
                  style={{ borderColor: "#2D2722" }}
                  onClick={() => toggleExpand(b.id)}
                >
                  <td className="py-3.5 px-4">
                    <svg
                      className="w-4 h-4 transition-transform"
                      style={{ color: "#8B8378", transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-sm font-medium" style={{ color: "#E8E0D5" }}>
                      {b.name}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className="text-xs px-2.5 py-1 rounded-lg font-medium"
                      style={{ backgroundColor: "rgba(139,111,71,0.15)", color: "#C9A961" }}
                    >
                      {getTypeLabel(b.type)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="font-mono text-sm" style={{ color: "#E8E0D5" }}>
                      {formatCurrency(b.value.toNumber())}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                        style={{ backgroundColor: "rgba(139,111,71,0.2)", color: "#C9A961" }}
                      >
                        {b.member.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium" style={{ color: "#E8E0D5" }}>
                          {b.member.name}
                        </div>
                        <div className="text-xs" style={{ color: "#8B8378" }}>
                          {b.member.memberNo}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-sm font-mono" style={{ color: "#8B8378" }}>
                      {b.expireAt ? formatDate(b.expireAt) : "长期有效"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span
                      className="font-mono text-sm font-semibold"
                      style={{ color: statusStyle.color }}
                    >
                      {b.daysLeft === null ? "-" : b.daysLeft < 0 ? `${Math.abs(b.daysLeft)} 天前` : `${b.daysLeft} 天`}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className="text-xs px-2.5 py-1 rounded-lg font-medium"
                      style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
                    >
                      {statusStyle.label}
                    </span>
                  </td>
                </tr>
                {isExpanded && (
                  <tr key={`${b.id}-expand`} className="border-b" style={{ borderColor: "#2D2722", backgroundColor: "rgba(15,13,11,0.5)" }}>
                    <td colSpan={8} className="py-5 px-6">
                      <div className="space-y-5">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                          <div className="rounded-xl p-4" style={{ backgroundColor: "#1A1613", border: "1px solid #2D2722" }}>
                            <div className="text-xs font-medium mb-3" style={{ color: "#8B8378" }}>
                              会员信息
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span style={{ color: "#8B8378" }}>姓名</span>
                                <span style={{ color: "#E8E0D5" }}>{b.member.name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span style={{ color: "#8B8378" }}>会员号</span>
                                <span style={{ color: "#E8E0D5" }}>{b.member.memberNo}</span>
                              </div>
                              <div className="flex justify-between">
                                <span style={{ color: "#8B8378" }}>手机号</span>
                                <span style={{ color: "#E8E0D5" }}>{b.member.phone || "-"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span style={{ color: "#8B8378" }}>等级</span>
                                <span style={{ color: "#C9A961" }}>{b.member.level}</span>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-xl p-4" style={{ backgroundColor: "#1A1613", border: "1px solid #2D2722" }}>
                            <div className="text-xs font-medium mb-3" style={{ color: "#8B8378" }}>
                              添加注释
                            </div>
                            <div className="space-y-3">
                              <textarea
                                value={noteContents[b.id] || ""}
                                onChange={(e) => handleNoteChange(b.id, e.target.value)}
                                placeholder="输入跟进备注、联系记录..."
                                rows={3}
                                className="w-full rounded-lg p-3 text-sm resize-none outline-none focus:ring-1 transition-shadow"
                                style={{
                                  backgroundColor: "#0F0D0B",
                                  border: "1px solid #2D2722",
                                  color: "#E8E0D5",
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <button
                                type="button"
                                disabled={submitting[b.id] || !noteContents[b.id]?.trim()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSubmitNote(b);
                                }}
                                className="w-full py-2.5 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                  background: "linear-gradient(135deg, #8B6F47, #C9A961)",
                                  color: "#fff",
                                }}
                              >
                                {submitting[b.id] ? "提交中..." : "提交注释"}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-medium mb-3" style={{ color: "#8B8378" }}>
                            注释历史 ({displayNotes.length})
                          </div>
                          {displayNotes.length === 0 ? (
                            <div className="text-sm py-6 text-center rounded-xl" style={{ color: "#8B8378", backgroundColor: "#1A1613", border: "1px solid #2D2722" }}>
                              暂无注释记录
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {displayNotes.map((note) => (
                                <div
                                  key={note.id}
                                  className="rounded-xl p-4"
                                  style={{ backgroundColor: "#1A1613", border: "1px solid #2D2722" }}
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
                                        style={{ backgroundColor: "rgba(201,169,97,0.15)", color: "#C9A961" }}
                                      >
                                        {note.staff?.name.charAt(0) || "?"}
                                      </div>
                                      <span className="text-sm font-medium" style={{ color: "#E8E0D5" }}>
                                        {note.staff?.name || "未知员工"}
                                      </span>
                                    </div>
                                    <span className="text-xs font-mono" style={{ color: "#8B8378" }}>
                                      {formatDate(note.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: "#C4BCB0" }}>
                                    {note.content}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
