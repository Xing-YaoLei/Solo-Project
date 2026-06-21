"use client";

import { useState, useEffect } from "react";
import DateRangePicker from "@/components/DateRangePicker";
import { generateDamageRecords } from "@/lib/mockData";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function DamagePage() {
  const [dateRange, setDateRange] = useState("30d");
  const [damageRecords, setDamageRecords] = useState<any[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [severityFilter, setSeverityFilter] = useState("ALL");

  useEffect(() => {
    setDamageRecords(generateDamageRecords(30));
  }, [dateRange]);

  const filteredRecords = severityFilter === "ALL"
      ? damageRecords
      : damageRecords.filter((r) => r.severity === severityFilter);

  const totalLoss = filteredRecords.reduce((sum, r) => sum + r.estimatedLoss, 0);
  const withCompensation = filteredRecords.filter((r) => r.compensation).length;

  const severityColors: Record<string, string> = {
    MINOR: "bg-green-100 text-green-700",
    MODERATE: "bg-yellow-100 text-yellow-700",
    SEVERE: "bg-orange-100 text-orange-700",
    TOTAL_LOSS: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">物品损坏明细</h1>
          <p className="text-gray-500 mt-1">查看物品损坏样本明细和赔付情况</p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">损坏订单数</p>
          <p className="text-2xl font-bold mt-2 text-gray-900">{filteredRecords.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">预估损失</p>
          <p className="text-2xl font-bold mt-2 text-gray-900">{formatCurrency(totalLoss)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">已赔付</p>
          <p className="text-2xl font-bold mt-2 text-gray-900">{withCompensation} 单</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">赔付率</p>
          <p className="text-2xl font-bold mt-2 text-gray-900">
            {filteredRecords.length > 0 ? ((withCompensation / filteredRecords.length) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">损坏记录列表</h2>
          <div className="flex gap-2">
            {["ALL", "MINOR", "MODERATE", "SEVERE", "TOTAL_LOSS"].map((severity) => (
              <button
                key={severity}
                onClick={() => setSeverityFilter(severity)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                  severityFilter === severity
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {severity === "ALL" ? "全部" : severity === "MINOR" ? "轻微" : severity === "MODERATE" ? "中度" : severity === "SEVERE" ? "严重" : "全损"}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500">订单号</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">区域</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">物品种类</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">严重程度</th>
                <th className="px-6 py-3 text-right font-medium text-gray-500">预估损失</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">上报时间</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">赔付状态</th>
                <th className="px-6 py-3 text-center font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-900 font-medium">{record.orderNo}</td>
                  <td className="px-6 py-4 text-gray-600">{record.regionName}</td>
                  <td className="px-6 py-4 text-gray-600">{record.damageItems}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full",
                      severityColors[record.severity]
                    )}>
                      {record.severityLabel}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-900 font-medium">
                    {formatCurrency(record.estimatedLoss)}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{record.reportedAt}</td>
                  <td className="px-6 py-4">
                    {record.compensation ? (
                      <span className="text-green-600 text-sm">已赔付</span>
                    ) : (
                      <span className="text-gray-400 text-sm">未赔付</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => setSelectedRecord(record)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      查看详情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">损坏明细</h3>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">订单号</p>
                  <p className="text-gray-900 font-medium mt-1">{selectedRecord.orderNo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">区域</p>
                  <p className="text-gray-900 font-medium mt-1">{selectedRecord.regionName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">物品种类</p>
                  <p className="text-gray-900 font-medium mt-1">{selectedRecord.damageItems}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">严重程度</p>
                  <span className={cn(
                    "px-2 py-1 text-xs font-medium rounded-full inline-block mt-1",
                    severityColors[selectedRecord.severity]
                  )}>
                    {selectedRecord.severityLabel}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">预估损失</p>
                  <p className="text-gray-900 font-medium mt-1">{formatCurrency(selectedRecord.estimatedLoss)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">上报人</p>
                  <p className="text-gray-900 font-medium mt-1">{selectedRecord.reportedBy}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">损坏描述</p>
                <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{selectedRecord.description}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">损坏照片</p>
                <div className="flex gap-3">
                  {selectedRecord.photoUrls.map((url: string, index: number) => (
                    <img
                      key={index}
                      src={url}
                      alt={`损坏照片 ${index + 1}`}
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>

              {selectedRecord.compensation && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-green-700 mb-2">赔付信息</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-green-600">赔付金额</p>
                      <p className="text-green-800 font-medium mt-1">
                        {formatCurrency(selectedRecord.compensation.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-green-600">赔付类型</p>
                      <p className="text-green-800 font-medium mt-1">
                        {selectedRecord.compensation.compensationType}
                      </p>
                    </div>
                    <div>
                      <p className="text-green-600">赔付时间</p>
                      <p className="text-green-800 font-medium mt-1">
                        {selectedRecord.compensation.paidAt}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <p className="text-green-600 text-sm">赔付口径说明</p>
                    <p className="text-green-800 text-sm mt-1">
                      {selectedRecord.compensation.caliberNote}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <Link
                  href={`/order/${selectedRecord.orderId}`}
                  className="flex-1 text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  查看订单详情
                </Link>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
