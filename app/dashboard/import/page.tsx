"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ROLES } from "@/lib/permissions";
import { formatDateTime, formatNumber } from "@/lib/utils";

type SourceType = "receipt" | "inventory" | "pos";
type BatchStatus = "pending" | "processing" | "completed" | "failed";

interface ImportBatch {
  id: string;
  sourceType: string;
  fileName: string | null;
  status: BatchStatus;
  totalRecords: number;
  successCount: number;
  errorCount: number;
  createdAt: string;
  store: { name: string } | null;
}

interface ImportRecord {
  id: string;
  recordType: string;
  rawData: string;
  isProcessed: boolean;
  errorMessage: string | null;
}

const sourceTypeLabels: Record<SourceType, string> = {
  receipt: "小票数据",
  inventory: "库存数据",
  pos: "POS流水",
};

const statusConfig: Record<BatchStatus, { label: string; color: string; bg: string }> = {
  completed: { label: "已完成", color: "#4A8B5C", bg: "rgba(74,139,92,0.1)" },
  processing: { label: "处理中", color: "#C9A961", bg: "rgba(201,169,97,0.1)" },
  pending: { label: "等待中", color: "#8B8378", bg: "rgba(139,131,120,0.1)" },
  failed: { label: "失败", color: "#B84A4A", bg: "rgba(184,74,74,0.1)" },
};

export default function ImportPage() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceType, setSourceType] = useState<SourceType>("receipt");
  const [storeId, setStoreId] = useState<string>("");
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);
  const [batchRecords, setBatchRecords] = useState<ImportRecord[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [user, setUser] = useState<{ role: string; storeId?: string | null } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = async () => {
      const res = await fetch("/api/auth/login");
      const data = await res.json();
      if (!data.user) redirect("/login");
      if (data.user.role !== ROLES.MANAGER) redirect("/dashboard");
      setUser(data.user);
      setStoreId(data.user.storeId || "");
    };
    init();
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      const storesRes = await fetch("/api/stores");
      if (storesRes.ok) {
        const storesData = await storesRes.json();
        setStores(storesData);
      } else {
        setStores([{ id: "", name: "全部门店" }]);
      }
      loadBatches();
    };
    loadData();
  }, [user]);

  const loadBatches = async () => {
    const url = storeId ? `/api/import/batches?storeId=${storeId}` : "/api/import/batches";
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setBatches(data);
    }
  };

  const loadBatchDetail = async (id: string) => {
    const res = await fetch(`/api/import/batches/${id}`);
    if (res.ok) {
      const data = await res.json();
      setBatchRecords(data.records || []);
    }
  };

  const handleToggleBatch = (id: string) => {
    if (expandedBatchId === id) {
      setExpandedBatchId(null);
      setBatchRecords([]);
    } else {
      setExpandedBatchId(id);
      loadBatchDetail(id);
    }
  };

  const handleFileSelect = (file: File) => {
    if (file.name.endsWith(".csv")) {
      setSelectedFile(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, []);

  const handleUpload = async () => {
    if (!selectedFile || !sourceType || !storeId) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("sourceType", sourceType);
      formData.append("storeId", storeId);
      const res = await fetch("/api/import/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        loadBatches();
      }
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl font-bold mb-1 gradient-text">数据导入与批次管理</h1>
        <p className="text-sm" style={{ color: "#8B8378" }}>
          批量导入小票、库存、POS流水数据，追踪处理状态与错误记录
        </p>
      </div>

      <div className="rounded-2xl p-6 card-glow" style={{ backgroundColor: "#1A1613" }}>
        <h2 className="font-display text-xl font-semibold mb-5" style={{ color: "#E8E0D5" }}>
          上传文件
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <div>
            <label className="block text-sm mb-2" style={{ color: "#8B8378" }}>
              导入类型
            </label>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value as SourceType)}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
              style={{ backgroundColor: "#12100D", color: "#E8E0D5", border: "1px solid #2D2722" }}
            >
              {(Object.keys(sourceTypeLabels) as SourceType[]).map((key) => (
                <option key={key} value={key}>
                  {sourceTypeLabels[key]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2" style={{ color: "#8B8378" }}>
              选择门店
            </label>
            <select
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
              style={{ backgroundColor: "#12100D", color: "#E8E0D5", border: "1px solid #2D2722" }}
            >
              <option value="">请选择门店</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all"
          style={{
            backgroundColor: isDragOver ? "rgba(201,169,97,0.05)" : "#12100D",
            borderColor: isDragOver ? "#C9A961" : "#2D2722",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "rgba(139,111,71,0.15)" }}
            >
              <svg className="w-7 h-7" style={{ color: "#C9A961" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            {selectedFile ? (
              <div>
                <div className="text-sm font-medium" style={{ color: "#E8E0D5" }}>
                  {selectedFile.name}
                </div>
                <div className="text-xs mt-1" style={{ color: "#8B8378" }}>
                  {(selectedFile.size / 1024).toFixed(1)} KB · 点击重新选择
                </div>
              </div>
            ) : (
              <div>
                <div className="text-sm font-medium" style={{ color: "#E8E0D5" }}>
                  拖拽 CSV 文件到此处，或点击选择
                </div>
                <div className="text-xs mt-1" style={{ color: "#8B8378" }}>
                  仅支持 CSV 格式
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={handleUpload}
            disabled={!selectedFile || !storeId || isUploading}
            className="px-6 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #8B6F47, #C9A961)", color: "#fff" }}
          >
            {isUploading ? "上传中..." : "开始导入"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl p-6 card-glow" style={{ backgroundColor: "#1A1613" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl font-semibold" style={{ color: "#E8E0D5" }}>
            批次列表
          </h2>
          <button
            onClick={loadBatches}
            className="text-sm px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: "#C9A961", backgroundColor: "rgba(201,169,97,0.1)" }}
          >
            刷新
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs" style={{ color: "#8B8378", borderBottom: "1px solid #2D2722" }}>
                <th className="text-left py-3 px-4 font-medium">批次号</th>
                <th className="text-left py-3 px-4 font-medium">类型</th>
                <th className="text-left py-3 px-4 font-medium">门店</th>
                <th className="text-left py-3 px-4 font-medium">文件名</th>
                <th className="text-left py-3 px-4 font-medium">状态</th>
                <th className="text-right py-3 px-4 font-medium">总记录</th>
                <th className="text-right py-3 px-4 font-medium">成功/失败</th>
                <th className="text-left py-3 px-4 font-medium">创建时间</th>
                <th className="text-right py-3 px-4 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch) => (
                <>
                  <tr
                    key={batch.id}
                    className="border-b last:border-0 hover:bg-white/5 cursor-pointer"
                    style={{ borderColor: "#2D2722" }}
                    onClick={() => handleToggleBatch(batch.id)}
                  >
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs" style={{ color: "#C9A961" }}>
                        {batch.id.slice(0, 10)}...
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-sm" style={{ color: "#E8E0D5" }}>
                        {sourceTypeLabels[batch.sourceType as SourceType] || batch.sourceType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-sm" style={{ color: "#E8E0D5" }}>
                        {batch.store?.name || "-"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-sm" style={{ color: "#8B8378" }}>
                        {batch.fileName || "-"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className="text-xs px-2.5 py-1 rounded-lg font-medium"
                        style={{
                          color: statusConfig[batch.status].color,
                          backgroundColor: statusConfig[batch.status].bg,
                        }}
                      >
                        {statusConfig[batch.status].label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-mono text-sm" style={{ color: "#E8E0D5" }}>
                        {formatNumber(batch.totalRecords)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-mono text-sm" style={{ color: "#4A8B5C" }}>
                        {formatNumber(batch.successCount)}
                      </span>
                      <span className="text-sm mx-1" style={{ color: "#8B8378" }}>
                        /
                      </span>
                      <span className="font-mono text-sm" style={{ color: "#B84A4A" }}>
                        {formatNumber(batch.errorCount)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-sm" style={{ color: "#8B8378" }}>
                        {formatDateTime(batch.createdAt)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <svg
                        className="w-4 h-4 inline-block transition-transform"
                        style={{
                          color: "#8B8378",
                          transform: expandedBatchId === batch.id ? "rotate(180deg)" : "none",
                        }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </td>
                  </tr>
                  {expandedBatchId === batch.id && (
                    <tr style={{ backgroundColor: "#12100D" }}>
                      <td colSpan={9} className="py-4 px-6">
                        <div className="space-y-3">
                          <div className="text-sm font-medium" style={{ color: "#E8E0D5" }}>
                            回查记录 ({batchRecords.length})
                          </div>
                          <div className="max-h-64 overflow-auto rounded-xl" style={{ border: "1px solid #2D2722" }}>
                            <table className="w-full text-xs">
                              <thead style={{ position: "sticky", top: 0, backgroundColor: "#1A1613" }}>
                                <tr style={{ color: "#8B8378" }}>
                                  <th className="text-left py-2.5 px-4 font-medium">记录ID</th>
                                  <th className="text-left py-2.5 px-4 font-medium">类型</th>
                                  <th className="text-left py-2.5 px-4 font-medium">处理状态</th>
                                  <th className="text-left py-2.5 px-4 font-medium">原始数据</th>
                                  <th className="text-left py-2.5 px-4 font-medium">错误信息</th>
                                </tr>
                              </thead>
                              <tbody>
                                {batchRecords.map((record) => (
                                  <tr key={record.id} className="border-t" style={{ borderColor: "#2D2722" }}>
                                    <td className="py-2.5 px-4">
                                      <span className="font-mono" style={{ color: "#C9A961" }}>
                                        {record.id.slice(0, 8)}...
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-4">
                                      <span style={{ color: "#E8E0D5" }}>{record.recordType}</span>
                                    </td>
                                    <td className="py-2.5 px-4">
                                      <span
                                        style={{
                                          color: record.isProcessed ? "#4A8B5C" : "#8B8378",
                                        }}
                                      >
                                        {record.isProcessed ? "已处理" : "未处理"}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-4">
                                      <div
                                        className="max-w-xs truncate font-mono"
                                        style={{ color: "#8B8378" }}
                                        title={record.rawData}
                                      >
                                        {record.rawData}
                                      </div>
                                    </td>
                                    <td className="py-2.5 px-4">
                                      <span style={{ color: "#B84A4A" }}>{record.errorMessage || "-"}</span>
                                    </td>
                                  </tr>
                                ))}
                                {batchRecords.length === 0 && (
                                  <tr>
                                    <td colSpan={5} className="py-6 text-center" style={{ color: "#8B8378" }}>
                                      暂无记录
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {batches.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center" style={{ color: "#8B8378" }}>
                    暂无批次记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
