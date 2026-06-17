"use client";

import React from "react";
import { SYNC_TASK_LABELS, SYNC_STATUS_LABELS } from "@/lib/constants";

interface SyncTask {
  id: string;
  taskType: "SUPERVISOR_PHOTO" | "PAYMENT_RECORD" | "PURCHASE_ORDER";
  status: "NOT_SYNCED" | "SYNCING" | "SYNCED" | "FAILED";
  totalCount: number;
  successCount: number;
  failedCount: number;
  lastRun: string | Date;
}

interface SyncPanelProps {
  tasks: SyncTask[];
  onRunSync: (type: SyncTask["taskType"]) => void;
  running: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  NOT_SYNCED: "bg-slate-100 text-slate-600",
  SYNCING: "bg-primary-100 text-primary-700",
  SYNCED: "bg-success-light text-success-dark",
  FAILED: "bg-shortage-light text-shortage-dark",
};

const TASK_ICONS: Record<string, string> = {
  SUPERVISOR_PHOTO: "📷",
  PAYMENT_RECORD: "💰",
  PURCHASE_ORDER: "📋",
};

export function SyncPanel({ tasks, onRunSync, running }: SyncPanelProps) {
  const totalAll = tasks.reduce((s, t) => s + t.totalCount, 0);
  const okAll = tasks.reduce((s, t) => s + t.successCount, 0);
  const failAll = tasks.reduce((s, t) => s + t.failedCount, 0);

  return (
    <div className="card h-full">
      <div className="card-header">
        <div>
          <div className="card-title">同步任务监控</div>
          <div className="text-xs text-slate-500 mt-0.5">覆盖监理照片、收款记录、采购单</div>
        </div>
        <button
          className="btn btn-secondary text-xs"
          onClick={() => onRunSync("ALL" as unknown as SyncTask["taskType"])}
          disabled={running}
        >
          {running ? "同步中..." : "一键同步全部"}
        </button>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-slate-50 p-3 text-center">
            <div className="text-xs text-slate-500">总数</div>
            <div className="text-xl font-bold text-slate-800">{totalAll.toLocaleString()}</div>
          </div>
          <div className="rounded-lg bg-success-light p-3 text-center">
            <div className="text-xs text-success-dark">成功</div>
            <div className="text-xl font-bold text-success-dark">{okAll.toLocaleString()}</div>
          </div>
          <div className="rounded-lg bg-shortage-light p-3 text-center">
            <div className="text-xs text-shortage-dark">异常</div>
            <div className="text-xl font-bold text-shortage-dark">{failAll.toLocaleString()}</div>
          </div>
        </div>

        <div className="space-y-3">
          {tasks.map((t) => {
            const progress = t.totalCount > 0 ? Math.round((t.successCount / t.totalCount) * 100) : 0;
            return (
              <div key={t.id} className="rounded-lg border border-slate-200 p-3 hover:border-primary-300 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{TASK_ICONS[t.taskType]}</span>
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{SYNC_TASK_LABELS[t.taskType]}</div>
                      <div className="text-xs text-slate-500">
                        共 {t.totalCount} · 成 {t.successCount} · 败 {t.failedCount}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`chip ${STATUS_STYLES[t.status]}`}>
                      {SYNC_STATUS_LABELS[t.status]}
                    </span>
                    <button
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      onClick={() => onRunSync(t.taskType)}
                      disabled={running}
                    >
                      重新同步
                    </button>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${t.failedCount > 0 ? "bg-gradient-to-r from-success to-warning" : "bg-success"}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>进度 {progress}%</span>
                  <span>上次：{new Date(t.lastRun).toLocaleString("zh-CN")}</span>
                </div>
              </div>
            );
          })}
        </div>

        {failAll > 0 && (
          <div className="rounded-lg bg-shortage-light border border-shortage/30 p-3 text-xs text-shortage-dark">
            ⚠️ 检测到 <b>{failAll}</b> 条同步失败记录，相关数据已自动进入异常清单，建议点击【重新同步】或联系系统管理员。
          </div>
        )}
      </div>
    </div>
  );
}
