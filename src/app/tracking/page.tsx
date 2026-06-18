"use client";

import { useState, useMemo } from "react";
import { useDashboardStore } from "@/store/dashboard";
import { Search, MessageSquare, X, Check, Package, Clock, Building2, CalendarDays } from "lucide-react";
import clsx from "clsx";

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  ARRIVED: { label: "已进场", color: "text-blue-700", bg: "bg-blue-50" },
  IN_STOCK: { label: "在库", color: "text-emerald-700", bg: "bg-emerald-50" },
  RECLAIMED: { label: "已领用", color: "text-slate-700", bg: "bg-slate-100" },
  EXPIRED: { label: "已过期", color: "text-red-700", bg: "bg-red-50" },
};

const sourceMap: Record<string, string> = {
  PAYMENT: "收款记录",
  DESIGN_EXPORT: "设计导出",
  PHOTO: "监理照片",
  MANUAL: "手工录入",
};

function calculateTurnoverDays(entry: any): number {
  if (entry.turnoverDays !== undefined && entry.turnoverDays !== null) {
    return entry.turnoverDays;
  }

  const entryDate = new Date(entry.entryDate);
  const now = new Date();

  if (entry.status === "RECLAIMED") {
    if (entry.requisitionDate) {
      const reqDate = new Date(entry.requisitionDate);
      return Math.ceil((reqDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
    }
  }

  return Math.ceil((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
}

export default function TrackingPage() {
  const {
    materialEntries,
    batches,
    currentUserRole,
    assignedProjectIds,
    addShortageNote,
    fetchMaterialEntries,
  } = useDashboardStore();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceTab, setSourceTab] = useState<"ALL" | "PAYMENT" | "DESIGN_EXPORT" | "PHOTO">("ALL");
  const [noteModal, setNoteModal] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [sortBy, setSortBy] = useState<"date" | "turnover">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const categories = useMemo(
    () => Array.from(new Set(materialEntries.map((e) => e.category))),
    [materialEntries]
  );

  const filtered = useMemo(() => {
    let result = materialEntries.filter((e) => {
      if (search && !e.materialName.includes(search) && !e.supplierName.includes(search)) return false;
      if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (sourceTab !== "ALL") {
        const batch = batches.find((b) => b.id === e.batchId);
        if (batch && batch.importSource !== sourceTab) return false;
      }
      return true;
    });

    result = result.sort((a, b) => {
      if (sortBy === "date") {
        const dateA = new Date(a.entryDate).getTime();
        const dateB = new Date(b.entryDate).getTime();
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      } else {
        const daysA = calculateTurnoverDays(a);
        const daysB = calculateTurnoverDays(b);
        return sortOrder === "desc" ? daysB - daysA : daysA - daysB;
      }
    });

    return result;
  }, [materialEntries, batches, search, categoryFilter, statusFilter, sourceTab, sortBy, sortOrder]);

  const handleSaveNote = async () => {
    if (noteModal && noteText.trim()) {
      setSavingNote(true);
      try {
        await addShortageNote(noteModal, noteText.trim());
        setNoteModal(null);
        setNoteText("");
      } finally {
        setSavingNote(false);
      }
    }
  };

  const toggleSort = (field: "date" | "turnover") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-navy-900">
              材料进场追踪
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {currentUserRole === "ADMIN"
                ? "全项目进场记录、批次管理与短缺注释"
                : `您负责范围内的 ${assignedProjectIds.length} 个项目进场记录明细`}
            </p>
          </div>
          {currentUserRole === "STAFF" && (
            <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-xs font-medium text-blue-700 flex items-center gap-1.5">
                <Building2 size={12} />
                仅查看负责项目
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 border border-slate-100 card-shadow">
          <div className="text-2xl font-bold text-navy-900">{filtered.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">总记录数</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 card-shadow">
          <div className="text-2xl font-bold text-emerald-600">
            {filtered.filter((e) => e.status === "IN_STOCK").length}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">在库数量</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 card-shadow">
          <div className="text-2xl font-bold text-amber-600">
            {Math.round(
              filtered.filter((e) => e.status !== "EXPIRED").reduce((s, e) => s + calculateTurnoverDays(e), 0) /
                Math.max(filtered.filter((e) => e.status !== "EXPIRED").length, 1)
            )}
            <span className="text-sm font-normal text-slate-400 ml-1">天</span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">平均周转天数</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 card-shadow">
          <div className="text-2xl font-bold text-red-600">
            {filtered.filter((e) => e.shortageNote).length}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">短缺记录</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-[360px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="搜索材料名称或供应商..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-colors"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-9 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        >
          <option value="all">全部类别</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        >
          <option value="all">全部状态</option>
          <option value="ARRIVED">已进场</option>
          <option value="IN_STOCK">在库</option>
          <option value="RECLAIMED">已领用</option>
          <option value="EXPIRED">已过期</option>
        </select>
      </div>

      <div className="flex gap-2">
        {(["ALL", "PAYMENT", "DESIGN_EXPORT", "PHOTO"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSourceTab(tab)}
            className={clsx(
              "px-4 py-1.5 text-xs font-medium rounded-lg transition-colors",
              sourceTab === tab
                ? "bg-amber-500 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            )}
          >
            {tab === "ALL" ? "全部来源" : sourceMap[tab]}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-100 card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  材料名称
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  类别
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  数量
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  供应商
                </th>
                {currentUserRole === "ADMIN" && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    项目
                  </th>
                )}
                <th
                  className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none"
                  onClick={() => toggleSort("date")}
                >
                  <span className="flex items-center gap-1">
                    <CalendarDays size={12} />
                    进场日期
                    {sortBy === "date" && (
                      <span className="text-amber-500">{sortOrder === "desc" ? "↓" : "↑"}</span>
                    )}
                  </span>
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none"
                  onClick={() => toggleSort("turnover")}
                >
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    周转天数
                    {sortBy === "turnover" && (
                      <span className="text-amber-500">{sortOrder === "desc" ? "↓" : "↑"}</span>
                    )}
                  </span>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  短缺注释
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.slice(0, 20).map((entry) => {
                const status = statusMap[entry.status];
                const turnoverDays = calculateTurnoverDays(entry);
                const batch = batches.find((b) => b.id === entry.batchId);

                const turnoverColor =
                  entry.status === "RECLAIMED"
                    ? "text-slate-500"
                    : turnoverDays > 60
                    ? "text-red-600"
                    : turnoverDays > 30
                    ? "text-amber-600"
                    : "text-emerald-600";

                return (
                  <tr
                    key={entry.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Package size={14} className="text-slate-400" />
                        <span className="font-medium text-navy-900">
                          {entry.materialName}
                        </span>
                      </div>
                      {entry.specification && (
                        <span className="text-[10px] text-slate-400 ml-5">
                          {entry.specification}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{entry.category}</td>
                    <td className="px-4 py-3 font-medium text-navy-900">
                      {entry.quantity} {entry.unit}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {entry.supplierName}
                    </td>
                    {currentUserRole === "ADMIN" && (
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        <span className="inline-flex items-center gap-1">
                          <Building2 size={10} />
                          {batch?.projectName || "-"}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {entry.entryDate}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={clsx(
                          "inline-flex items-center gap-1 font-medium",
                          turnoverColor
                        )}
                      >
                        <Clock size={12} />
                        {turnoverDays} 天
                      </span>
                      {turnoverDays > 60 && entry.status !== "RECLAIMED" && (
                        <span className="ml-2 text-[10px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                          超期
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={clsx(
                          "px-2 py-0.5 rounded-full text-[10px] font-medium",
                          status.color,
                          status.bg
                        )}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {entry.shortageNote ? (
                        <span
                          className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded cursor-help"
                          title={entry.shortageNote}
                        >
                          {entry.shortageNote.slice(0, 15)}...
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setNoteModal(entry.id);
                          setNoteText(entry.shortageNote || "");
                        }}
                        className="p-1.5 rounded-md hover:bg-amber-50 text-amber-600 transition-colors"
                        title="添加短缺注释"
                      >
                        <MessageSquare size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
          <span>
            显示 {Math.min(filtered.length, 20)} / {filtered.length} 条记录
          </span>
          <span className="text-slate-400">
            点击表头可排序
          </span>
        </div>
      </div>

      {noteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] animate-fade-in">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-navy-900">
                短缺注释
              </h3>
              <button
                onClick={() => setNoteModal(null)}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X size={16} className="text-slate-400" />
              </button>
            </div>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="请输入短缺原因及说明..."
              className="w-full h-28 p-3 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setNoteModal(null)}
                className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveNote}
                disabled={savingNote || !noteText.trim()}
                className="px-4 py-2 text-sm text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingNote ? (
                  <>
                    <Clock size={14} className="animate-spin" />
                    保存中
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    保存注释
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
