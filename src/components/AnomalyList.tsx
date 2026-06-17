"use client";

import React, { useState } from "react";
import { ANOMALY_TYPE_LABELS, SEVERITY_LABELS, ANOMALY_STATUS_LABELS } from "@/lib/constants";

interface AnomalyItem {
  id: string;
  anomalyType: string;
  severity: string;
  siteId: string;
  arrivalId: string | null;
  title: string;
  description: string;
  status: string;
  assignee: string | null;
  createdAt: string | Date;
  siteName?: string;
  projectNo?: string;
  materialName?: string;
  batchNo?: string;
}

interface AnomalyListProps {
  items: AnomalyItem[];
  onViewArrival?: (arrivalId: string) => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-warning-light text-warning-dark",
  HIGH: "bg-shortage-light text-shortage-dark",
  CRITICAL: "bg-purple-100 text-purple-700",
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-shortage-light text-shortage-dark",
  IN_PROGRESS: "bg-warning-light text-warning-dark",
  RESOLVED: "bg-success-light text-success-dark",
  IGNORED: "bg-slate-100 text-slate-600",
};

export function AnomalyList({ items, onViewArrival }: AnomalyListProps) {
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const filtered = items.filter((i) => {
    if (typeFilter && i.anomalyType !== typeFilter) return false;
    if (statusFilter && i.status !== statusFilter) return false;
    return true;
  });

  const openCount = items.filter((i) => i.status === "OPEN" || i.status === "IN_PROGRESS").length;
  const shortageCount = items.filter((i) => i.anomalyType === "BATCH_SHORTAGE").length;

  return (
    <div className="card h-full">
      <div className="card-header">
        <div>
          <div className="card-title flex items-center gap-2">
            异常清单
            {openCount > 0 && (
              <span className="chip bg-shortage text-white">{openCount} 待处理</span>
            )}
            {shortageCount > 0 && (
              <span className="chip bg-warning-dark text-white">{shortageCount} 批次短缺</span>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">同步任务 + 材料进场校验异常汇总，复盘可直接引用</div>
        </div>
        <div className="flex gap-2">
          <select
            className="input text-xs py-1.5"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">全部类型</option>
            {Object.entries(ANOMALY_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            className="input text-xs py-1.5"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">全部状态</option>
            {Object.entries(ANOMALY_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-auto max-h-[460px] scrollbar-thin">
        <table className="w-full">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="table-th">类型/严重度</th>
              <th className="table-th">标题</th>
              <th className="table-th">关联工地/批次</th>
              <th className="table-th">状态/处理人</th>
              <th className="table-th">创建时间</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr
                key={a.id}
                className={`hover:bg-slate-50 transition-colors ${
                  a.anomalyType === "BATCH_SHORTAGE" ? "shortage-row" : ""
                }`}
              >
                <td className="table-td">
                  <div className="flex flex-col gap-1">
                    <span className="chip bg-slate-100 text-slate-700 w-fit">
                      {ANOMALY_TYPE_LABELS[a.anomalyType as keyof typeof ANOMALY_TYPE_LABELS]}
                    </span>
                    <span className={`chip w-fit ${SEVERITY_COLORS[a.severity]}`}>
                      {SEVERITY_LABELS[a.severity as keyof typeof SEVERITY_LABELS]}级
                    </span>
                  </div>
                </td>
                <td className="table-td">
                  <div className="font-medium text-slate-800">{a.title}</div>
                  <div className="text-xs text-slate-500 mt-1 line-clamp-2 max-w-[320px]">{a.description}</div>
                  {a.arrivalId && onViewArrival && (
                    <button
                      className="text-xs text-primary-600 hover:underline mt-1"
                      onClick={() => onViewArrival(a.arrivalId!)}
                    >
                      查看进场批次 →
                    </button>
                  )}
                </td>
                <td className="table-td">
                  <div className="text-slate-700">{a.siteName || "-"}</div>
                  <div className="text-xs text-slate-500">
                    {a.projectNo} {a.batchNo && `· ${a.batchNo}`}
                  </div>
                  {a.materialName && (
                    <div className="text-xs text-slate-500">{a.materialName}</div>
                  )}
                </td>
                <td className="table-td">
                  <div className="flex flex-col gap-1">
                    <span className={`chip w-fit ${STATUS_COLORS[a.status]}`}>
                      {ANOMALY_STATUS_LABELS[a.status as keyof typeof ANOMALY_STATUS_LABELS]}
                    </span>
                    <span className="text-xs text-slate-500">
                      {a.assignee ? `→ ${a.assignee}` : "未分配"}
                    </span>
                  </div>
                </td>
                <td className="table-td text-slate-500 text-xs whitespace-nowrap">
                  {new Date(a.createdAt).toLocaleString("zh-CN")}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-10 text-slate-400 text-sm">
                  🎉 当前没有异常，干得漂亮！
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
