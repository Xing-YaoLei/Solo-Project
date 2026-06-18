"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, FileSpreadsheet, Camera, Clock, CheckCircle2, Loader2, AlertTriangle, X, Plus, Trash2 } from "lucide-react";
import { useDashboardStore } from "@/store/dashboard";
import { parsePaymentFile, parseDesignFile } from "@/lib/file-upload";
import clsx from "clsx";

const sourceMap: Record<string, string> = {
  PAYMENT: "收款记录",
  DESIGN_EXPORT: "设计软件导出",
  PHOTO: "监理照片",
};

interface PhotoItem {
  id: string;
  file: File | null;
  batchNo: string;
  projectName: string;
  previewUrl?: string;
}

export default function ImportPage() {
  const {
    importBatches,
    batches,
    lastImportBatchId,
    setLastImportBatchId,
    fetchAllData,
    fetchImportBatches,
  } = useDashboardStore();

  const [activeSource, setActiveSource] = useState<"PAYMENT" | "DESIGN_EXPORT" | "PHOTO">("PAYMENT");
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    details?: string[];
    importBatchId?: string;
    batchNo?: string;
  } | null>(null);

  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [selectedImportBatchId, setSelectedImportBatchId] = useState<string>("");

  const [photoItems, setPhotoItems] = useState<PhotoItem[]>([
    { id: "1", file: null, batchNo: "", projectName: "" },
  ]);

  const paymentFileRef = useRef<HTMLInputElement>(null);
  const designFileRef = useRef<HTMLInputElement>(null);
  const photoFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchImportBatches();
  }, [fetchImportBatches]);

  const handlePaymentFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPaymentFile(file);
    setUploadResult(null);
  };

  const handleDesignFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDesignFile(file);
    setUploadResult(null);
  };

  const handlePhotoFileSelect = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setPhotoItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, file, previewUrl } : item
      )
    );
  };

  const addPhotoItem = () => {
    setPhotoItems((prev) => [
      ...prev,
      { id: String(Date.now()), file: null, batchNo: "", projectName: "" },
    ]);
  };

  const removePhotoItem = (index: number) => {
    if (photoItems.length <= 1) return;
    setPhotoItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePhotoBatchNo = (index: number, value: string) => {
    setPhotoItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, batchNo: value } : item))
    );
  };

  const updatePhotoProjectName = (index: number, value: string) => {
    setPhotoItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, projectName: value } : item))
    );
  };

  const handlePaymentUpload = async () => {
    if (!paymentFile) {
      setUploadResult({ success: false, message: "请先选择收款记录文件" });
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append("source", "PAYMENT");
      formData.append("file", paymentFile);

      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "导入失败");
      }

      const result = await response.json();
      setLastImportBatchId(result.importBatchId);

      setUploadResult({
        success: true,
        message: `成功导入 ${result.mergedCount} 条收款记录`,
        details: [
          `新建记录: ${result.newEntries} 条`,
          `更新记录: ${result.updatedEntries} 条`,
          `批次号: ${result.batchNo || "已生成"}`,
          ...(result.warnings || []),
        ],
        importBatchId: result.importBatchId,
        batchNo: result.batchNo,
      });

      await fetchAllData();
    } catch (error) {
      setUploadResult({
        success: false,
        message: (error as Error).message,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDesignUpload = async () => {
    if (!designFile) {
      setUploadResult({ success: false, message: "请先选择设计导出文件" });
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append("source", "DESIGN_EXPORT");
      formData.append("file", designFile);

      if (selectedImportBatchId) {
        formData.append("importBatchId", selectedImportBatchId);
      }

      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "导入失败");
      }

      const result = await response.json();

      setUploadResult({
        success: true,
        message: `成功合并 ${result.mergedCount} 条设计导出记录`,
        details: [
          `新建记录: ${result.newEntries} 条`,
          `匹配更新: ${result.updatedEntries} 条`,
          ...(result.warnings || []),
        ],
        importBatchId: result.importBatchId,
      });

      await fetchAllData();
    } catch (error) {
      setUploadResult({
        success: false,
        message: (error as Error).message,
      });
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoUpload = async () => {
    const validPhotos = photoItems.filter((p) => p.file && p.batchNo);
    if (validPhotos.length === 0) {
      setUploadResult({ success: false, message: "请至少上传一张照片并填写批次号" });
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append("source", "PHOTO");

      validPhotos.forEach((photo, index) => {
        if (photo.file) {
          formData.append("files", photo.file);
          formData.append("batchNos", photo.batchNo);
          formData.append("projectNames", photo.projectName || "默认项目");
        }
      });

      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "上传失败");
      }

      const result = await response.json();

      setUploadResult({
        success: true,
        message: `成功关联 ${result.mergedCount} 张监理照片`,
        details: [
          `成功关联: ${result.updatedEntries} 张`,
          ...(result.warnings || []),
        ],
        importBatchId: result.importBatchId,
      });

      await fetchAllData();
    } catch (error) {
      setUploadResult({
        success: false,
        message: (error as Error).message,
      });
    } finally {
      setUploading(false);
    }
  };

  const sourceConfig = {
    PAYMENT: {
      icon: <FileSpreadsheet size={32} />,
      title: "收款记录导入",
      desc: "上传收款记录文件，系统自动解析加工为材料进场数据",
      accept: ".xlsx,.csv",
      color: "amber",
      colorHex: "#F59E0B",
      bgLight: "#FFFBEB",
    },
    DESIGN_EXPORT: {
      icon: <FileSpreadsheet size={32} />,
      title: "设计软件导出合并",
      desc: "导入设计软件材料清单，与收款记录自动匹配",
      accept: ".xlsx,.csv,.json",
      color: "blue",
      colorHex: "#3B82F6",
      bgLight: "#EFF6FF",
    },
    PHOTO: {
      icon: <Camera size={32} />,
      title: "监理照片关联",
      desc: "上传监理照片，与进场批次关联归档",
      accept: "image/*",
      color: "emerald",
      colorHex: "#10B981",
      bgLight: "#ECFDF5",
    },
  };

  const config = sourceConfig[activeSource];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-xl font-bold text-navy-900">数据导入</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          收款记录处理、设计软件导出合并、监理照片关联
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {(["PAYMENT", "DESIGN_EXPORT", "PHOTO"] as const).map((source) => {
          const sc = sourceConfig[source];
          return (
            <button
              key={source}
              onClick={() => {
                setActiveSource(source);
                setUploadResult(null);
              }}
              className={clsx(
                "p-5 rounded-xl border-2 text-left transition-all duration-200",
                activeSource === source
                  ? "bg-slate-50"
                  : "border-slate-100 bg-white hover:border-slate-200"
              )}
              style={
                activeSource === source
                  ? { borderColor: sc.colorHex, backgroundColor: sc.bgLight }
                  : {}
              }
            >
              <div className="mb-3" style={{ color: sc.colorHex }}>
                {sc.icon}
              </div>
              <h3 className="font-display font-semibold text-navy-900 text-sm mb-1">
                {sc.title}
              </h3>
              <p className="text-xs text-slate-500">{sc.desc}</p>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-100 card-shadow">
        {activeSource === "PAYMENT" && (
          <div className="space-y-5">
            <div>
              <h3 className="font-display font-semibold text-navy-900 text-sm mb-2">
                收款记录导入
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                上传 .xlsx 或 .csv 格式的收款记录，系统将自动解析材料、数量、供应商等信息并生成带时间戳的导入批次
              </p>
            </div>

            <div
              className="border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer hover:border-amber-400 hover:bg-amber-50"
              style={{
                borderColor: paymentFile ? "#F59E0B" : "#E2E8F0",
                backgroundColor: paymentFile ? "#FFFBEB" : "#FAFAFA",
              }}
              onClick={() => paymentFileRef.current?.click()}
            >
              <input
                ref={paymentFileRef}
                type="file"
                accept=".xlsx,.csv"
                className="hidden"
                onChange={handlePaymentFileSelect}
              />
              {paymentFile ? (
                <>
                  <FileSpreadsheet size={40} className="mx-auto text-amber-500 mb-3" />
                  <p className="font-display font-semibold text-amber-700 text-sm">
                    {paymentFile.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {(paymentFile.size / 1024).toFixed(1)} KB · 点击重新选择
                  </p>
                </>
              ) : (
                <>
                  <Upload size={40} className="mx-auto text-slate-300 mb-3" />
                  <p className="font-display font-semibold text-navy-900 text-sm">
                    点击选择收款记录文件
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    支持 .xlsx, .csv 格式
                  </p>
                </>
              )}
            </div>

            <button
              onClick={handlePaymentUpload}
              disabled={!paymentFile || uploading}
              className="w-full py-3 rounded-lg font-display font-semibold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#F59E0B" }}
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  正在导入...
                </span>
              ) : (
                "开始导入"
              )}
            </button>
          </div>
        )}

        {activeSource === "DESIGN_EXPORT" && (
          <div className="space-y-5">
            <div>
              <h3 className="font-display font-semibold text-navy-900 text-sm mb-2">
                设计软件导出合并
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                导入设计软件导出的材料清单，系统将自动与现有收款记录匹配合并
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                合并到指定导入批次（可选）
              </label>
              <select
                value={selectedImportBatchId}
                onChange={(e) => setSelectedImportBatchId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">新建导入批次</option>
                {importBatches
                  .filter((b) => b.source === "PAYMENT")
                  .map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.batchNo} ({batch.importedAt})
                    </option>
                  ))}
              </select>
            </div>

            <div
              className="border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer hover:border-blue-400 hover:bg-blue-50"
              style={{
                borderColor: designFile ? "#3B82F6" : "#E2E8F0",
                backgroundColor: designFile ? "#EFF6FF" : "#FAFAFA",
              }}
              onClick={() => designFileRef.current?.click()}
            >
              <input
                ref={designFileRef}
                type="file"
                accept=".xlsx,.csv,.json"
                className="hidden"
                onChange={handleDesignFileSelect}
              />
              {designFile ? (
                <>
                  <FileSpreadsheet size={40} className="mx-auto text-blue-500 mb-3" />
                  <p className="font-display font-semibold text-blue-700 text-sm">
                    {designFile.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {(designFile.size / 1024).toFixed(1)} KB · 点击重新选择
                  </p>
                </>
              ) : (
                <>
                  <Upload size={40} className="mx-auto text-slate-300 mb-3" />
                  <p className="font-display font-semibold text-navy-900 text-sm">
                    点击选择设计导出文件
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    支持 .xlsx, .csv, .json 格式
                  </p>
                </>
              )}
            </div>

            <button
              onClick={handleDesignUpload}
              disabled={!designFile || uploading}
              className="w-full py-3 rounded-lg font-display font-semibold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#3B82F6" }}
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  正在合并...
                </span>
              ) : (
                "开始合并"
              )}
            </button>
          </div>
        )}

        {activeSource === "PHOTO" && (
          <div className="space-y-5">
            <div>
              <h3 className="font-display font-semibold text-navy-900 text-sm mb-2">
                监理照片关联
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                上传监理现场照片，填写对应批次号进行关联归档
              </p>
            </div>

            <div className="space-y-3">
              {photoItems.map((item, index) => (
                <div
                  key={item.id}
                  className="p-4 rounded-lg border border-slate-200 bg-slate-50"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 flex-shrink-0 overflow-hidden"
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.onchange = (e: any) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const previewUrl = URL.createObjectURL(file);
                            setPhotoItems((prev) =>
                              prev.map((it, i) =>
                                i === index ? { ...it, file, previewUrl } : it
                              )
                            );
                          }
                        };
                        input.click();
                      }}
                    >
                      {item.previewUrl ? (
                        <img
                          src={item.previewUrl}
                          alt="预览"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera size={24} className="text-slate-400" />
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          批次号
                        </label>
                        <input
                          type="text"
                          value={item.batchNo}
                          onChange={(e) => updatePhotoBatchNo(index, e.target.value)}
                          placeholder="如：BATCH-2025-001"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          项目名称
                        </label>
                        <input
                          type="text"
                          value={item.projectName}
                          onChange={(e) => updatePhotoProjectName(index, e.target.value)}
                          placeholder="如：杭州湾样板房"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    {photoItems.length > 1 && (
                      <button
                        onClick={() => removePhotoItem(index)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addPhotoItem}
              className="w-full py-2.5 rounded-lg border-2 border-dashed border-slate-200 text-slate-500 text-sm font-medium hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              添加更多照片
            </button>

            <button
              onClick={handlePhotoUpload}
              disabled={uploading}
              className="w-full py-3 rounded-lg font-display font-semibold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#10B981" }}
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  正在上传...
                </span>
              ) : (
                "上传并关联批次"
              )}
            </button>
          </div>
        )}

        {uploadResult && (
          <div
            className={`mt-5 p-4 rounded-lg ${
              uploadResult.success
                ? "bg-emerald-50 border border-emerald-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <div className="flex items-start gap-3">
              {uploadResult.success ? (
                <CheckCircle2
                  size={20}
                  className="text-emerald-500 flex-shrink-0 mt-0.5"
                />
              ) : (
                <AlertTriangle
                  size={20}
                  className="text-red-500 flex-shrink-0 mt-0.5"
                />
              )}
              <div className="flex-1">
                <p
                  className={`font-display font-semibold text-sm ${
                    uploadResult.success ? "text-emerald-700" : "text-red-700"
                  }`}
                >
                  {uploadResult.message}
                </p>
                {uploadResult.details && uploadResult.details.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {uploadResult.details.map((detail, i) => (
                      <li key={i} className="text-xs text-slate-600">
                        • {detail}
                      </li>
                    ))}
                  </ul>
                )}
                {uploadResult.batchNo && (
                  <p className="mt-2 text-xs text-emerald-600 font-medium">
                    批次号：{uploadResult.batchNo}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl p-5 border border-slate-100 card-shadow">
        <h3 className="font-display font-semibold text-navy-900 text-sm mb-4">
          导入批次历史
        </h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {importBatches.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-8">
              暂无导入记录
            </p>
          ) : (
            importBatches.map((batch) => (
              <div
                key={batch.id}
                className={clsx(
                  "flex items-center gap-4 p-3 rounded-lg transition-colors",
                  lastImportBatchId === batch.id
                    ? "bg-amber-50 border border-amber-200"
                    : "bg-slate-50 hover:bg-slate-100"
                )}
              >
                <div className="p-2 rounded-lg bg-white">
                  {batch.source === "PHOTO" ? (
                    <Camera size={16} className="text-emerald-500" />
                  ) : (
                    <FileSpreadsheet size={16} className="text-amber-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-navy-900">
                      {batch.batchNo}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-medium">
                      {sourceMap[batch.source]}
                    </span>
                    {lastImportBatchId === batch.id && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
                        最新
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock size={10} />
                      {batch.importedAt}
                    </span>
                    <span className="text-xs text-slate-500">
                      {batch.recordCount} 条记录
                    </span>
                  </div>
                </div>
                {batch.fileUrl && (
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-medium">
                    已归档
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
