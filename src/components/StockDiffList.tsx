"use client";

import React from "react";

interface StockDiff {
  id: string;
  siteId: string;
  materialId: string;
  systemQty: number;
  actualQty: number;
  diffQty: number;
  diffAmount: number;
  unitPrice: number;
  diffReason: string;
  rawSampleRef: string;
  materialName?: string;
  unit?: string;
  siteName?: string;
  hasRawSample?: boolean;
}

interface StockDiffListProps {
  items: StockDiff[];
  onDrilldown: (diff: StockDiff) => void;
}

export function StockDiffList({ items, onDrilldown }: StockDiffListProps) {
  const totalDiffAmount = items.reduce((s, i) => s + (i.diffAmount || 0), 0);
  const shortageItems = items.filter((i) => i.diffQty < 0).length;

  return (
    <div className="card h-full">
      <div className="card-header">
        <div>
          <div className="card-title flex items-center gap-2">
            盘点差异分析
            {items.length > 0 && (
              <span className="chip bg-warning-light text-warning-dark">{items.length} 条差异</span>
            )}
            {shortageItems > 0 && (
              <span className="chip bg-shortage text-white">{shortageItems} 项短缺</span>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            点击条目下钻至：安全库存 / 库存台账 / 原始样本，可直接写备注
          </div>
        </div>
        <div className="text-xs text-right">
          <div className="text-slate-500">累计差异金额</div>
          <div className={`text-lg font-bold ${totalDiffAmount > 0 ? "text-success-dark" : "text-shortage-dark"}`}>
            ¥{Math.abs(totalDiffAmount).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="overflow-auto max-h-[460px] scrollbar-thin">
        <table className="w-full">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="table-th">工地/材料</th>
              <th className="table-th text-right">系统数</th>
              <th className="table-th text-right">实盘数</th>
              <th className="table-th text-right">差异量</th>
              <th className="table-th text-right">差异金额</th>
              <th className="table-th">原因</th>
              <th className="table-th">样本</th>
            </tr>
          </thead>
          <tbody>
            {items.map((d) => (
              <tr
                key={d.id}
                onClick={() => onDrilldown(d)}
                className={`cursor-pointer transition-colors ${
                  d.diffQty < 0
                    ? "shortage-row"
                    : d.diffQty > 0
                    ? "bg-warning-light/50 hover:bg-warning-light"
                    : "hover:bg-slate-50"
                }`}
              >
                <td className="table-td">
                  <div className="font-medium text-slate-800">{d.materialName}</div>
                  <div className="text-xs text-slate-500">{d.siteName}</div>
                </td>
                <td className="table-td text-right text-slate-700 tabular-nums">
                  {d.systemQty} {d.unit}
                </td>
                <td className="table-td text-right text-slate-700 tabular-nums">
                  {d.actualQty} {d.unit}
                </td>
                <td className={`table-td text-right tabular-nums font-semibold ${
                  d.diffQty < 0 ? "text-shortage-dark" : "text-success-dark"
                }`}>
                  {d.diffQty > 0 ? "+" : ""}{d.diffQty} {d.unit}
                </td>
                <td className={`table-td text-right tabular-nums font-semibold ${
                  d.diffQty < 0 ? "text-shortage-dark" : "text-success-dark"
                }`}>
                  {d.diffQty < 0 ? "-" : "+"}¥{(d.diffAmount || 0).toLocaleString()}
                </td>
                <td className="table-td">
                  <span className={`chip ${d.diffQty < 0 ? "bg-shortage-light text-shortage-dark" : "bg-warning-light text-warning-dark"}`}>
                    {d.diffReason || "-"}
                  </span>
                </td>
                <td className="table-td">
                  {d.hasRawSample ? (
                    <span className="chip bg-primary-100 text-primary-700">📎 有样本</span>
                  ) : (
                    <span className="text-slate-400 text-xs">—</span>
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-400 text-sm">
                  ✅ 暂无盘点差异
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
