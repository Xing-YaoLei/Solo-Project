"use client";

import { useEffect, useState } from "react";
import {
  Database,
  Upload,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  Clock,
  User,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  RefreshCw,
  Eye,
} from "lucide-react";
import { getImportBatches, getImportBatchDetail } from "@/lib/mock-data";
import type { ImportBatch, ImportRecord } from "@/lib/mock-data";
import { cn, formatDateTime, getSourceLabel, getStatusLabel } from "@/lib/utils";

export default function ImportsPage() {
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [sourceFilter, setSourceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ReturnType<typeof getImportBatchDetail> | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    setBatches(getImportBatches({ source: sourceFilter || undefined, status: statusFilter || undefined }));
  }, [sourceFilter, statusFilter]);

  useEffect(() => {
    if (expandedId) {
      setDetail(getImportBatchDetail(expandedId));
    } else {
      setDetail(null);
    }
  }, [expandedId]);

  const filtered = batches.filter(
    (b) => !search || (b.fileName || "").toLowerCase().includes(search.toLowerCase())
  );

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-risk-low" />;
      case "processing":
        return <Loader2 className="w-4 h-4 text-info-500 animate-spin" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-risk-high" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-6 h-6 text-primary-600" />
            数据导入批次
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            管理收银系统、会员记录、库存表、医保流水的数据导入批次，支持全链路回查
          </p>
        </div>
        <button onClick={() => setShowNewModal(true)} className="btn-primary">
          <Upload className="w-4 h-4 mr-2" />
          新建导入
        </button>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索批次文件名"
              className="input-field pl-9"
            />
          </div>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="input-field w-40"
          >
            <option value="">全部来源</option>
            <option value="pos">收银系统</option>
            <option value="member">会员记录</option>
            <option value="inventory">库存表</option>
            <option value="insurance">医保流水</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-36"
          >
            <option value="">全部状态</option>
            <option value="pending">待处理</option>
            <option value="processing">处理中</option>
            <option value="completed">已完成</option>
            <option value="failed">失败</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="w-10" />
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">
                  批次号
                </th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">
                  来源系统
                </th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">
                  文件
                </th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">
                  导入结果
                </th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">
                  操作人
                </th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">
                  导入时间
                </th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">
                  状态
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((b) => {
                const status = getStatusLabel(b.status);
                const isExpanded = expandedId === b.id;
                return (
                  <>
                    <tr
                      key={b.id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : b.id)}
                    >
                      <td className="px-4 py-3">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <code className="text-xs font-mono text-primary-700 bg-primary-50 px-2 py-1 rounded">
                          {b.id}
                        </code>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-medium text-slate-800">
                          {getSourceLabel(b.source)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-slate-700 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          {b.fileName || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-risk-low font-medium">
                            成功 {b.successCount}
                          </span>
                          <span className="text-slate-300">/</span>
                          <span className="text-slate-600">总计 {b.totalRecords}</span>
                          {b.errorCount > 0 && (
                            <>
                              <span className="text-slate-300">/</span>
                              <span className="text-risk-high font-medium flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                失败 {b.errorCount}
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-slate-700 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {b.importedByName}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-slate-600 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {formatDateTime(b.importedAt)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn("badge flex items-center gap-1", status.className)}>
                          <StatusIcon status={b.status} />
                          {status.text}
                        </span>
                      </td>
                    </tr>
                    {isExpanded && detail && detail.batch.id === b.id && (
                      <tr className="bg-slate-50">
                        <td colSpan={8} className="px-5 py-4">
                          <div className="space-y-4 animate-fade-in">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                <Eye className="w-4 h-4 text-primary-600" />
                                批次明细回查
                              </h4>
                              {b.status === "failed" && (
                                <button className="btn-secondary text-xs py-1">
                                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                                  重试导入
                                </button>
                              )}
                            </div>
                            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                              <table className="w-full text-xs">
                                <thead className="bg-slate-50">
                                  <tr>
                                    <th className="text-left font-medium text-slate-500 px-4 py-2">
                                      行号
                                    </th>
                                    <th className="text-left font-medium text-slate-500 px-4 py-2">
                                      原始数据
                                    </th>
                                    <th className="text-left font-medium text-slate-500 px-4 py-2">
                                      状态
                                    </th>
                                    <th className="text-left font-medium text-slate-500 px-4 py-2">
                                      错误信息
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {detail.records.slice(0, 10).map((r, i) => (
                                    <tr key={r.id} className="hover:bg-slate-50">
                                      <td className="px-4 py-2 text-slate-500">#{i + 1}</td>
                                      <td className="px-4 py-2">
                                        <code className="text-[11px] bg-slate-100 px-2 py-0.5 rounded">
                                          {JSON.stringify(r.rawData)}
                                        </code>
                                      </td>
                                      <td className="px-4 py-2">
                                        <span
                                          className={cn(
                                            "badge",
                                            r.status === "success"
                                              ? "bg-risk-low/10 text-risk-low"
                                              : "bg-risk-high/10 text-risk-high"
                                          )}
                                        >
                                          {r.status === "success" ? "成功" : "失败"}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2 text-risk-high">
                                        {r.errorMsg || "—"}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              {detail.records.length > 10 && (
                                <div className="px-4 py-2 text-center text-xs text-slate-500 border-t border-slate-100">
                                  仅展示前 10 条，共 {detail.records.length} 条记录
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
        {filtered.length === 0 && (
          <div className="py-16 text-center text-slate-500 text-sm">
            暂无符合条件的导入批次
          </div>
        )}
      </div>

      {showNewModal && (
        <NewImportModal onClose={() => setShowNewModal(false)} />
      )}
    </div>
  );
}

function NewImportModal({ onClose }: { onClose: () => void }) {
  const [source, setSource] = useState("pos");
  const [fileName, setFileName] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">新建数据导入</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              数据来源
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="input-field"
            >
              <option value="pos">收银系统</option>
              <option value="member">会员记录</option>
              <option value="inventory">库存表</option>
              <option value="insurance">医保流水</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              上传文件
            </label>
            <div
              className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-primary-400 hover:bg-primary-50/30 transition-colors cursor-pointer"
              onClick={() => setFileName("sample_import_file.csv")}
            >
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <div className="text-sm text-slate-700 font-medium">
                {fileName || "点击或拖拽文件到此处上传"}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                支持 CSV / Excel 格式，最大 50MB
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">
            取消
          </button>
          <button onClick={onClose} className="btn-primary">
            开始导入
          </button>
        </div>
      </div>
    </div>
  );
}
