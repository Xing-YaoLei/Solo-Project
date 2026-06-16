"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Calendar,
  User,
  ChevronRight,
  X,
  MessageSquarePlus,
  Send,
  AlertCircle,
  FileText,
  Pill,
  Clock,
  UserCircle,
  Phone,
  ShieldAlert,
} from "lucide-react";
import {
  getFollowUpsByAssignee,
  getFollowUpDetail,
  addAnnotation,
} from "@/lib/mock-data";
import type { FollowUp } from "@/lib/mock-data";
import { useAuthStore } from "@/lib/auth-store";
import { cn, formatDate, getRiskLabel, getStatusLabel } from "@/lib/utils";

export default function FollowUpsPage() {
  const { user } = useAuthStore();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ReturnType<typeof getFollowUpDetail> | null>(null);
  const [detailTab, setDetailTab] = useState<"profile" | "prescription" | "medication" | "annotation">("profile");

  useEffect(() => {
    const assigneeId = user?.role === "staff" ? user.id : null;
    setFollowUps(getFollowUpsByAssignee(assigneeId));
  }, [user]);

  useEffect(() => {
    if (selectedId) {
      setDetail(getFollowUpDetail(selectedId));
    } else {
      setDetail(null);
    }
  }, [selectedId]);

  const filtered = followUps.filter((f) => {
    if (search && !f.memberName.includes(search)) return false;
    if (riskFilter && f.riskLevel !== riskFilter) return false;
    if (statusFilter && f.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="h-full flex gap-5">
      <div className={cn("transition-all duration-300", selectedId ? "flex-1 min-w-0" : "w-full")}>
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">回访明细</h1>
              <p className="text-sm text-slate-500 mt-1">
                {user?.role === "staff"
                  ? "查看本人负责的会员回访任务"
                  : "全部门店回访任务总览"}
                {" · "}
                共 <span className="font-medium text-slate-700">{filtered.length}</span> 条
              </p>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="搜索会员姓名"
                  className="input-field pl-9"
                />
              </div>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="input-field w-36"
              >
                <option value="">全部风险</option>
                <option value="high">高风险</option>
                <option value="medium">中风险</option>
                <option value="low">低风险</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field w-36"
              >
                <option value="">全部状态</option>
                <option value="pending">待回访</option>
                <option value="completed">已完成</option>
                <option value="annotated">已注释</option>
              </select>
            </div>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">
                    会员
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">
                    风险等级
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">
                    负责人
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">
                    计划日期
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">
                    状态
                  </th>
                  <th className="w-10 px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((f) => {
                  const risk = getRiskLabel(f.riskLevel);
                  const status = getStatusLabel(f.status);
                  return (
                    <tr
                      key={f.id}
                      className={cn(
                        "hover:bg-slate-50 transition-colors cursor-pointer",
                        selectedId === f.id && "bg-primary-50/50"
                      )}
                      onClick={() => setSelectedId(f.id)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-medium">
                            {f.memberName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{f.memberName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn("badge", risk.className)}>{risk.text}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-sm text-slate-700">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {f.assigneeName}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-sm text-slate-700">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatDate(f.scheduledDate)}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn("badge", status.className)}>{status.text}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-16 text-center text-slate-500 text-sm">暂无符合条件的回访记录</div>
            )}
          </div>
        </div>
      </div>

      {selectedId && detail && (
        <div className="w-[480px] bg-white rounded-xl shadow-card border border-slate-100 flex flex-col max-h-[calc(100vh-8rem)] animate-slide-right">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium">
                {detail.member?.name.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-slate-900">{detail.member?.name}</div>
                <div className="text-xs text-slate-500">
                  <span
                    className={cn(
                      "badge mr-1",
                      getRiskLabel(detail.followUp.riskLevel).className
                    )}
                  >
                    {getRiskLabel(detail.followUp.riskLevel).text}
                  </span>
                  {detail.member?.age}岁 · {detail.member?.gender}
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedId(null)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex border-b border-slate-200 px-5">
            {[
              { key: "profile", label: "会员档案", icon: UserCircle },
              { key: "prescription", label: "处方记录", icon: FileText },
              { key: "medication", label: "用药记录", icon: Pill },
              { key: "annotation", label: "注释/回访", icon: MessageSquarePlus },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setDetailTab(t.key as any)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                  detailTab === t.key
                    ? "border-primary-600 text-primary-700"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                )}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {detailTab === "profile" && detail.member && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-xs text-slate-500 mb-1">姓名</div>
                    <div className="font-medium text-slate-900">{detail.member.name}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-xs text-slate-500 mb-1">联系电话</div>
                    <div className="font-medium text-slate-900 flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {detail.member.phone}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-xs text-slate-500 mb-1">年龄/性别</div>
                    <div className="font-medium text-slate-900">
                      {detail.member.age}岁 · {detail.member.gender}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-xs text-slate-500 mb-1">注册日期</div>
                    <div className="font-medium text-slate-900">
                      {formatDate(detail.member.registeredAt)}
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-r from-warning-50 to-warning-50/30 rounded-lg border border-warning-200">
                  <div className="flex items-center gap-2 text-warning-700 font-medium mb-2">
                    <ShieldAlert className="w-4 h-4" />
                    慢病标签
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.member.chronicTypes.map((c) => (
                      <span
                        key={c}
                        className="px-2 py-0.5 rounded-full bg-white text-warning-700 text-xs border border-warning-200"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {detailTab === "prescription" && (
              <div className="space-y-3 animate-fade-in">
                {detail.prescriptions.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-lg border border-slate-200 hover:border-primary-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium text-slate-900">{p.drugName}</div>
                      {!p.isClear && (
                        <span className="badge bg-warning-100 text-warning-700 border border-warning-300 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          处方不清
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-600 space-y-1">
                      <div>用量：{p.dosage} {p.frequency}</div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>开具日期：{formatDate(p.issueDate)}</span>
                        <span>医生：{p.doctorName}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {detailTab === "medication" && (
              <div className="space-y-2 animate-fade-in">
                {detail.medications.map((m, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-200"
                  >
                    <div>
                      <div className="font-medium text-slate-900 text-sm">{m.drugName}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {formatDate(m.purchaseDate)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-slate-900 text-sm">× {m.quantity}</div>
                      <div className="text-xs text-slate-500 mt-0.5">¥{m.unitPrice}/盒</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {detailTab === "annotation" && (
              <AnnotationPanel
                followUpId={selectedId}
                prescriptions={detail.prescriptions}
                existing={detail.annotations}
                onAdd={(prescriptionId, content) => {
                  if (!user) return;
                  const newAnn = addAnnotation(selectedId, prescriptionId, content, user.id);
                  setDetail(getFollowUpDetail(selectedId));
                  return newAnn;
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AnnotationPanel({
  followUpId,
  prescriptions,
  existing,
  onAdd,
}: {
  followUpId: string;
  prescriptions: any[];
  existing: any[];
  onAdd: (prescriptionId: string | undefined, content: string) => any;
}) {
  const [content, setContent] = useState("");
  const [selectedPrescription, setSelectedPrescription] = useState<string>("");
  const { user } = useAuthStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onAdd(selectedPrescription || undefined, content.trim());
    setContent("");
    setSelectedPrescription("");
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <form onSubmit={handleSubmit} className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
        <div className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
          <MessageSquarePlus className="w-4 h-4 text-primary-600" />
          添加处方注释 / 回访记录
        </div>
        <select
          value={selectedPrescription}
          onChange={(e) => setSelectedPrescription(e.target.value)}
          className="input-field text-sm"
        >
          <option value="">关联处方（可选）</option>
          {prescriptions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.drugName} {!p.isClear && "（处方不清）"}
            </option>
          ))}
        </select>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="请输入处方注释或回访记录内容，如处方字迹不清等..."
          className="input-field text-sm min-h-[80px] resize-none"
        />
        <div className="flex justify-end">
          <button type="submit" className="btn-primary text-sm py-1.5" disabled={!content.trim()}>
            <Send className="w-3.5 h-3.5 mr-1.5" />
            提交记录
          </button>
        </div>
      </form>

      <div className="space-y-2">
        {existing.length === 0 && (
          <div className="text-center py-8 text-sm text-slate-500">
            暂无注释或回访记录
          </div>
        )}
        {existing.map((a) => (
          <div
            key={a.id}
            className="p-3 rounded-lg border-l-4 border-primary-500 bg-primary-50/30"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-700">
                {a.createdByName}
              </span>
              <span className="text-xs text-slate-500">{a.createdAt}</span>
            </div>
            <div className="text-sm text-slate-800 leading-relaxed">{a.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
