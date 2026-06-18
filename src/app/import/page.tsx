"use client";

import { useState } from "react";
import { Upload, FileSpreadsheet, Camera, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { useDashboardStore } from "@/store/dashboard";
import clsx from "clsx";

const sourceMap: Record<string, string> = {
  PAYMENT: "收款记录",
  DESIGN_EXPORT: "设计软件导出",
  PHOTO: "监理照片",
};

export default function ImportPage() {
  const { importBatches } = useDashboardStore();
  const [activeSource, setActiveSource] = useState<"PAYMENT" | "DESIGN_EXPORT" | "PHOTO">("PAYMENT");
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const handleUpload = () => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setUploaded(true);
      setTimeout(() => setUploaded(false), 2000);
    }, 1500);
  };

  const sourceConfig = {
    PAYMENT: {
      icon: <FileSpreadsheet size={32} />,
      title: "收款记录导入",
      desc: "上传收款记录文件，系统自动解析加工为材料进场数据",
      accept: ".xlsx,.csv",
      color: "amber",
    },
    DESIGN_EXPORT: {
      icon: <FileSpreadsheet size={32} />,
      title: "设计软件导出合并",
      desc: "导入设计软件材料清单，与收款记录自动匹配",
      accept: ".xlsx,.csv,.json",
      color: "blue",
    },
    PHOTO: {
      icon: <Camera size={32} />,
      title: "监理照片关联",
      desc: "上传监理照片，与进场批次关联归档",
      accept: "image/*",
      color: "emerald",
    },
  };

  const config = sourceConfig[activeSource];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-xl font-bold text-navy-900">数据导入</h2>
        <p className="text-sm text-slate-500 mt-0.5">收款记录处理、设计软件导出合并、监理照片关联</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {(["PAYMENT", "DESIGN_EXPORT", "PHOTO"] as const).map((source) => {
          const sc = sourceConfig[source];
          return (
            <button
              key={source}
              onClick={() => setActiveSource(source)}
              className={clsx(
                "p-5 rounded-xl border-2 text-left transition-all duration-200",
                activeSource === source
                  ? `border-${sc.color}-500 bg-${sc.color}-50`
                  : "border-slate-100 bg-white hover:border-slate-200"
              )}
              style={
                activeSource === source
                  ? { borderColor: sc.color === "amber" ? "#F59E0B" : sc.color === "blue" ? "#3B82F6" : "#10B981", backgroundColor: sc.color === "amber" ? "#FFFBEB" : sc.color === "blue" ? "#EFF6FF" : "#ECFDF5" }
                  : {}
              }
            >
              <div className="mb-3" style={{ color: sc.color === "amber" ? "#F59E0B" : sc.color === "blue" ? "#3B82F6" : "#10B981" }}>
                {sc.icon}
              </div>
              <h3 className="font-display font-semibold text-navy-900 text-sm mb-1">{sc.title}</h3>
              <p className="text-xs text-slate-500">{sc.desc}</p>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-100 card-shadow">
        <div
          className="border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer"
          style={{ borderColor: uploaded ? "#10B981" : "#E2E8F0", backgroundColor: uploaded ? "#ECFDF5" : "#FAFAFA" }}
          onClick={handleUpload}
        >
          {uploading ? (
            <>
              <Loader2 size={40} className="mx-auto text-amber-500 mb-3 animate-spin" />
              <p className="font-display font-semibold text-navy-900 text-sm">正在导入处理中...</p>
              <p className="text-xs text-slate-500 mt-1">系统正在解析并加工数据</p>
            </>
          ) : uploaded ? (
            <>
              <CheckCircle2 size={40} className="mx-auto text-emerald-500 mb-3" />
              <p className="font-display font-semibold text-emerald-700 text-sm">导入成功</p>
              <p className="text-xs text-slate-500 mt-1">批次号已自动生成并记录时间戳</p>
            </>
          ) : (
            <>
              <Upload size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="font-display font-semibold text-navy-900 text-sm">
                拖拽文件到此处，或点击上传
              </p>
              <p className="text-xs text-slate-500 mt-1">
                支持 {config.accept} 格式文件
              </p>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 border border-slate-100 card-shadow">
        <h3 className="font-display font-semibold text-navy-900 text-sm mb-4">导入批次历史</h3>
        <div className="space-y-2">
          {importBatches.map((batch) => (
            <div
              key={batch.id}
              className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
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
                  <span className="text-sm font-medium text-navy-900">{batch.batchNo}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-medium">
                    {sourceMap[batch.source]}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock size={10} />
                    {batch.importedAt}
                  </span>
                  <span className="text-xs text-slate-500">{batch.recordCount} 条记录</span>
                </div>
              </div>
              {batch.fileUrl && (
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-medium">
                  已归档
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
