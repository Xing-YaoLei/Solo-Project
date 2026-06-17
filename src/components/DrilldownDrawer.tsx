"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { NotePanel } from "./NotePanel";

interface StockDiffBasic {
  id: string;
  countId: string;
  siteId: string;
  materialId: string;
  systemQty: number;
  actualQty: number;
  diffQty: number;
  diffAmount: number;
  unitPrice: number;
  diffReason: string;
  materialName?: string;
  materialCode?: string;
  unit?: string;
  siteName?: string;
  standardDays?: number;
}

interface SafetyStock {
  id: string;
  materialId: string;
  siteId: string;
  minQty: number;
  maxQty: number;
  reorderQty: number;
  currentStock: number;
  materialName?: string;
  unit?: string;
  status?: string;
}

interface InventoryRecord {
  id: string;
  recordType: "INBOUND" | "OUTBOUND" | "ADJUSTMENT" | "RETURN";
  qty: number;
  unitPrice: number;
  occurredAt: string | Date;
  operator: string;
  remark: string;
  materialName?: string;
  unit?: string;
  siteName?: string;
}

interface RawSample {
  id: string;
  diffId: string;
  sampleNo: string;
  sampleData: Record<string, unknown> & {
    location?: string;
    condition?: string;
    quantity?: number;
    photosCount?: number;
  };
  photoUrl: string;
  takenBy: string;
  takenAt: string | Date;
}

interface NoteItem {
  id: string;
  content: string;
  author: string;
  createdAt: string | Date;
  stockDiffId: string | null;
}

interface DrilldownResult {
  diff: StockDiffBasic;
  safetyStock: SafetyStock | null;
  inventoryRecords: InventoryRecord[];
  rawSamples: RawSample[];
  notes: NoteItem[];
}

interface DrilldownDrawerProps {
  open: boolean;
  diffId: string | null;
  siteId?: string;
  onClose: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  INBOUND: "入库",
  OUTBOUND: "出库",
  ADJUSTMENT: "调整",
  RETURN: "退货",
};

const TYPE_STYLES: Record<string, string> = {
  INBOUND: "bg-success-light text-success-dark",
  OUTBOUND: "bg-primary-100 text-primary-700",
  ADJUSTMENT: "bg-warning-light text-warning-dark",
  RETURN: "bg-purple-100 text-purple-700",
};

export function DrilldownDrawer({ open, diffId, siteId, onClose }: DrilldownDrawerProps) {
  const [tab, setTab] = useState<"safety" | "ledger" | "samples">("safety");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DrilldownResult | null>(null);

  useEffect(() => {
    if (!open || !diffId) return;
    setLoading(true);
    fetch(`/api/inventory?action=drilldown&diffId=${diffId}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [open, diffId]);

  if (!open) return null;
  const d = data?.diff;
  const pct = d ? (d.systemQty > 0 ? Math.round(((d.diffQty || 0) / d.systemQty) * 1000) / 10 : 0) : 0;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto w-[min(1300px,94vw)] h-full bg-slate-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-800">盘点差异下钻分析</h2>
            <span className="chip bg-primary-100 text-primary-700">#{diffId?.slice(-6)}</span>
          </div>
          <button onClick={onClose} className="btn btn-secondary text-xs py-1.5">
            ✕ 关闭
          </button>
        </div>

        {loading && (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">加载中...</div>
        )}

        {!loading && !d && (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">未找到数据</div>
        )}

        {!loading && d && (
          <div className="flex-1 overflow-hidden grid grid-cols-[1fr_380px] gap-4 p-4">
            <div className="overflow-auto scrollbar-thin space-y-4 pr-1">
              <div className={`rounded-xl p-5 border ${d.diffQty < 0 ? "bg-shortage-light/50 border-shortage/30" : "bg-warning-light/50 border-warning/30"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">材料</div>
                    <div className="text-xl font-bold text-slate-900">{d.materialName}</div>
                    <div className="text-xs text-slate-500 mt-0.5">编码 {d.materialCode} · {d.siteName}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-3xl font-black ${d.diffQty < 0 ? "text-shortage-dark" : "text-warning-dark"}`}>
                      {d.diffQty > 0 ? "+" : ""}{d.diffQty} {d.unit}
                    </div>
                    <div className="text-sm text-slate-600 mt-1">
                      差异率 <b className={d.diffQty < 0 ? "text-shortage-dark" : "text-warning-dark"}>{pct > 0 ? "+" : ""}{pct}%</b> · 金额 <b>¥{Math.abs(d.diffAmount).toLocaleString()}</b>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-3 border-t border-white/60">
                  <div>
                    <div className="text-xs text-slate-500">系统账面</div>
                    <div className="text-lg font-semibold text-slate-800">{d.systemQty} {d.unit}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">实际盘点</div>
                    <div className="text-lg font-semibold text-slate-800">{d.actualQty} {d.unit}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">差异原因</div>
                    <div className={`chip ${d.diffQty < 0 ? "bg-shortage-light text-shortage-dark" : "bg-warning-light text-warning-dark"} mt-1`}>
                      {d.diffReason || "待确认"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200">
                <div className="flex border-b border-slate-100">
                  {([
                    ["safety", "🔒 安全库存"],
                    ["ledger", "📒 库存台账"],
                    ["samples", "🔍 原始样本"],
                  ] as const).map(([k, label]) => (
                    <button
                      key={k}
                      onClick={() => setTab(k)}
                      className={`px-5 py-3 text-sm font-medium transition-colors ${
                        tab === k
                          ? "text-primary-700 border-b-2 border-primary-600 bg-primary-50/40"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="p-5">
                  {tab === "safety" && (
                    <div>
                      {!data?.safetyStock ? (
                        <div className="text-center text-slate-400 text-sm py-10">未设置安全库存策略</div>
                      ) : (
                        <div className="space-y-5">
                          <div className="grid grid-cols-4 gap-4">
                            <Stat label="当前库存" value={data.safetyStock.currentStock} unit={d.unit || ""} />
                            <Stat label="最低保有" value={data.safetyStock.minQty} unit={d.unit || ""} tone="shortage" />
                            <Stat label="建议补货" value={data.safetyStock.reorderQty} unit={d.unit || ""} tone="warning" />
                            <Stat label="上限容量" value={data.safetyStock.maxQty} unit={d.unit || ""} tone="success" />
                          </div>

                          <div className="rounded-lg bg-slate-50 p-4">
                            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                              <span>库存健康度可视化</span>
                              <span>
                                {data.safetyStock.status === "不足" && "⚠️ 需要补货"}
                                {data.safetyStock.status === "过高" && "⚠️ 库存积压"}
                                {data.safetyStock.status === "正常" && "✅ 状态健康"}
                              </span>
                            </div>
                            <div className="relative h-8 rounded-lg overflow-hidden bg-slate-200">
                              <div
                                className="absolute top-0 bottom-0 bg-shortage/30"
                                style={{ left: 0, width: `${(data.safetyStock.minQty / data.safetyStock.maxQty) * 100}%` }}
                              />
                              <div
                                className="absolute top-0 bottom-0 bg-success/30"
                                style={{
                                  left: `${(data.safetyStock.minQty / data.safetyStock.maxQty) * 100}%`,
                                  width: `${((data.safetyStock.reorderQty - data.safetyStock.minQty) / data.safetyStock.maxQty) * 100}%`,
                                }}
                              />
                              <div
                                className="absolute top-0 bottom-0 bg-primary-400/30"
                                style={{
                                  left: `${(data.safetyStock.reorderQty / data.safetyStock.maxQty) * 100}%`,
                                  right: 0,
                                }}
                              />
                              <div
                                className={`absolute top-0 bottom-0 w-1.5 ${
                                  data.safetyStock.status === "不足" ? "bg-shortage" :
                                  data.safetyStock.status === "过高" ? "bg-warning-dark" : "bg-success"
                                } shadow-md`}
                                style={{
                                  left: `calc(${(Math.min(data.safetyStock.currentStock, data.safetyStock.maxQty) / data.safetyStock.maxQty) * 100}% - 3px)`,
                                }}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                              <span>0</span>
                              <span>下限 {data.safetyStock.minQty}</span>
                              <span>补货 {data.safetyStock.reorderQty}</span>
                              <span>上限 {data.safetyStock.maxQty}</span>
                            </div>
                          </div>

                          <div className="rounded-lg border border-slate-200 p-4 text-sm">
                            <div className="font-semibold text-slate-800 mb-2">📌 复盘建议</div>
                            {data.safetyStock.status === "不足" && (
                              <div className="text-slate-600">
                                当前库存 <b>{data.safetyStock.currentStock}</b> 低于安全线 <b>{data.safetyStock.minQty}</b>，
                                建议结合标准周转天数（{d.standardDays}天）立即发起补货申请，预计补 <b>{data.safetyStock.reorderQty - data.safetyStock.currentStock} {d.unit}</b>。
                              </div>
                            )}
                            {data.safetyStock.status === "过高" && (
                              <div className="text-slate-600">
                                当前库存 <b>{data.safetyStock.currentStock}</b> 超过上限 <b>{data.safetyStock.maxQty}</b>，
                                结合盘点差异原因「{d.diffReason}」，建议跨工地调拨或评估需求预测准确率。
                              </div>
                            )}
                            {data.safetyStock.status === "正常" && (
                              <div className="text-slate-600">
                                当前库存处于健康区间。结合本次盘点差异，建议核查近 7 天出入库台账中是否存在延迟录入。
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {tab === "ledger" && (
                    <div>
                      <div className="text-xs text-slate-500 mb-3">
                        近 {data?.inventoryRecords.length || 0} 条出入库记录（按时间倒序）
                      </div>
                      <div className="overflow-auto max-h-[420px] scrollbar-thin rounded-lg border border-slate-200">
                        <table className="w-full">
                          <thead className="sticky top-0 z-10">
                            <tr>
                              <th className="table-th">时间</th>
                              <th className="table-th">类型</th>
                              <th className="table-th text-right">数量</th>
                              <th className="table-th text-right">单价</th>
                              <th className="table-th">操作人</th>
                              <th className="table-th">备注</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(data?.inventoryRecords || []).map((r) => (
                              <tr key={r.id} className="hover:bg-slate-50">
                                <td className="table-td whitespace-nowrap text-slate-500 text-xs">
                                  {new Date(r.occurredAt).toLocaleString("zh-CN")}
                                </td>
                                <td className="table-td">
                                  <span className={`chip ${TYPE_STYLES[r.recordType]}`}>{TYPE_LABELS[r.recordType]}</span>
                                </td>
                                <td className={`table-td text-right tabular-nums font-medium ${
                                  r.recordType === "OUTBOUND" ? "text-shortage-dark" : "text-success-dark"
                                }`}>
                                  {r.recordType === "OUTBOUND" ? "-" : "+"}{r.qty} {r.unit}
                                </td>
                                <td className="table-td text-right tabular-nums text-slate-600">¥{r.unitPrice.toLocaleString()}</td>
                                <td className="table-td text-slate-600 text-xs">{r.operator}</td>
                                <td className="table-td text-slate-500 text-xs">{r.remark}</td>
                              </tr>
                            ))}
                            {(!data?.inventoryRecords?.length) && (
                              <tr>
                                <td colSpan={6} className="text-center py-10 text-slate-400 text-sm">暂无台账</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {tab === "samples" && (
                    <div>
                      <div className="text-xs text-slate-500 mb-3">
                        原始盘点样本（共 {data?.rawSamples.length || 0} 份）
                      </div>
                      {(data?.rawSamples?.length || 0) === 0 ? (
                        <div className="text-center text-slate-400 text-sm py-10">未上传原始样本</div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(data?.rawSamples || []).map((s) => (
                            <div key={s.id} className="rounded-lg border border-slate-200 overflow-hidden hover:border-primary-300 transition-colors">
                              <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                                {s.photoUrl && (
                                  <Image
                                    src={s.photoUrl}
                                    alt={s.sampleNo}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 33vw"
                                    className="object-cover"
                                  />
                                )}
                                <div className="absolute top-2 left-2 chip bg-black/60 text-white backdrop-blur-sm">
                                  #{s.sampleNo}
                                </div>
                              </div>
                              <div className="p-3 space-y-2 text-sm">
                                <div className="grid grid-cols-2 gap-2">
                                  <Info label="盘点位置" value={s.sampleData?.location} />
                                  <Info label="保存状态" value={s.sampleData?.condition} />
                                  <Info label="样本数量" value={s.sampleData?.quantity ? `${s.sampleData.quantity} ${d.unit}` : "-"} />
                                  <Info label="照片张数" value={s.sampleData?.photosCount ? `${s.sampleData.photosCount} 张` : "-"} />
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                                  <span>📷 {s.takenBy}</span>
                                  <span>{new Date(s.takenAt).toLocaleString("zh-CN")}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="h-full">
              <NotePanel
                siteId={siteId || d.siteId}
                stockDiffId={diffId}
                initialNotes={data?.notes || []}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, unit, tone }: { label: string; value: number; unit?: string; tone?: "shortage" | "warning" | "success" }) {
  const toneMap = {
    shortage: "bg-shortage-light text-shortage-dark border-shortage/30",
    warning: "bg-warning-light text-warning-dark border-warning/30",
    success: "bg-success-light text-success-dark border-success/30",
  };
  return (
    <div className={`rounded-lg p-4 border ${tone ? toneMap[tone as keyof typeof toneMap] : "bg-slate-50 border-slate-200 text-slate-800"}`}>
      <div className="text-xs opacity-80 mb-1">{label}</div>
      <div className="text-2xl font-bold tabular-nums">{value}<span className="text-sm font-medium opacity-80 ml-1">{unit}</span></div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</div>
      <div className="text-sm text-slate-800 font-medium">{value || "-"}</div>
    </div>
  );
}
