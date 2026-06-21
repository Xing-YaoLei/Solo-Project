"use client";

import { useState, useEffect } from "react";
import DateRangePicker from "@/components/DateRangePicker";
import { generateAppealList, generateYoYComparison } from "@/lib/mockData";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function AppealPage() {
  const [dateRange, setDateRange] = useState("30d");
  const [appeals, setAppeals] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedAppeal, setSelectedAppeal] = useState<any>(null);
  const [yoyData, setYoyData] = useState<any>(null);

  useEffect(() => {
    setAppeals(generateAppealList(20));
    setYoyData(generateYoYComparison());
  }, [dateRange]);

  const filteredAppeals = statusFilter === "ALL"
    ? appeals
    : appeals.filter((a) => a.status === statusFilter);

  const pendingCount = appeals.filter((a) => a.status === "PENDING").length;
  const approvedCount = appeals.filter((a) => a.status === "APPROVED").length;
  const rejectedCount = appeals.filter((a) => a.status === "REJECTED").length;

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">申诉证据</h1>
          <p className="text-gray-500 mt-1">补贴申诉管理与同环比分析</p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">申诉总数</p>
          <p className="text-2xl font-bold mt-2 text-gray-900">{appeals.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <p className="text-sm text-yellow-600 font-medium">待审核</p>
          <p className="text-2xl font-bold mt-2 text-yellow-600">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <p className="text-sm text-green-600 font-medium">已通过</p>
          <p className="text-2xl font-bold mt-2 text-green-600">{approvedCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <p className="text-sm text-red-600 font-medium">已驳回</p>
          <p className="text-2xl font-bold mt-2 text-red-600">{rejectedCount}</p>
        </div>
      </div>

      <div className="bg-blue-50 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-3">申诉同比分析</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-blue-600">本期申诉数</p>
            <p className="text-xl font-bold text-blue-800 mt-1">{appeals.length}</p>
          </div>
          <div>
            <p className="text-sm text-blue-600">去年同期</p>
            <p className="text-xl font-bold text-blue-800 mt-1">
              {Math.round(appeals.length * 0.8)}
            </p>
          </div>
          <div>
            <p className="text-sm text-blue-600">同比变化</p>
            <p className="text-xl font-bold text-blue-800 mt-1">
              {yoyData?.yoyRate > 0 ? "+" : ""}{(yoyData?.yoyRate || 0).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">申诉列表</h2>
          <div className="flex gap-2">
            {["ALL", "PENDING", "APPROVED", "REJECTED"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                  statusFilter === status
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {status === "ALL"
                  ? "全部"
                  : status === "PENDING"
                    ? "待审核"
                    : status === "APPROVED"
                      ? "已通过"
                      : "已驳回"}
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
                <th className="px-6 py-3 text-left font-medium text-gray-500">申诉原因</th>
                <th className="px-6 py-3 text-right font-medium text-gray-500">补贴金额</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">提交时间</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">状态</th>
                <th className="px-6 py-3 text-center font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAppeals.map((appeal) => (
                <tr key={appeal.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-900 font-medium">{appeal.orderNo}</td>
                  <td className="px-6 py-4 text-gray-600">{appeal.regionName}</td>
                  <td className="px-6 py-4 text-gray-600">{appeal.reason}</td>
                  <td className="px-6 py-4 text-right text-gray-900 font-medium">
                    {formatCurrency(appeal.subsidyAmount)}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{appeal.submittedAt}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full",
                      statusColors[appeal.status]
                    )}>
                      {appeal.statusLabel}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => setSelectedAppeal(appeal)}
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

      {selectedAppeal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">申诉详情</h3>
              <button
                onClick={() => setSelectedAppeal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">订单号</p>
                  <p className="text-gray-900 font-medium mt-1">{selectedAppeal.orderNo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">区域</p>
                  <p className="text-gray-900 font-medium mt-1">{selectedAppeal.regionName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">申诉补贴金额</p>
                  <p className="text-gray-900 font-medium mt-1">
                    {formatCurrency(selectedAppeal.subsidyAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">状态</p>
                  <span className={cn(
                    "px-2 py-1 text-xs font-medium rounded-full inline-block mt-1",
                    statusColors[selectedAppeal.status]
                  )}>
                    {selectedAppeal.statusLabel}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">申诉原因</p>
                <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">
                  {selectedAppeal.reason}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">证据材料</p>
                <div className="flex gap-3 flex-wrap">
                  {selectedAppeal.evidenceUrls.map((url: string, index: number) => (
                    <img
                      key={index}
                      src={url}
                      alt={`证据 ${index + 1}`}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">提交时间</p>
                  <p className="text-gray-900 font-medium mt-1">{selectedAppeal.submittedAt}</p>
                </div>
                {selectedAppeal.reviewedAt && (
                  <div>
                    <p className="text-sm text-gray-500">审核时间</p>
                    <p className="text-gray-900 font-medium mt-1">{selectedAppeal.reviewedAt}</p>
                  </div>
                )}
                {selectedAppeal.reviewedBy && (
                  <div>
                    <p className="text-sm text-gray-500">审核人</p>
                    <p className="text-gray-900 font-medium mt-1">{selectedAppeal.reviewedBy}</p>
                  </div>
                )}
              </div>

              {selectedAppeal.reviewNote && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-blue-700 mb-1">审核备注</p>
                  <p className="text-blue-800 text-sm">{selectedAppeal.reviewNote}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
