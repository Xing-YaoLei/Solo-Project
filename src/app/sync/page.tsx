"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

interface SyncBatch {
  id: string;
  batchNumber: string;
  source: string;
  status: string;
  totalCount: number;
  successCount: number;
  failedCount: number;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

interface BatchStats {
  payment: { count: number; latest: SyncBatch | null };
  order: { count: number; latest: SyncBatch | null };
  map: { count: number; latest: SyncBatch | null };
}

export default function SyncPage() {
  const [batches, setBatches] = useState<SyncBatch[]>([]);
  const [stats, setStats] = useState<BatchStats | null>(null);
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [selectedBatch, setSelectedBatch] = useState<SyncBatch | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (sourceFilter !== "ALL") {
        params.set("source", sourceFilter);
      }
      const response = await fetch(`/api/sync/batches?${params.toString()}`);
      const result = await response.json();
      if (result.success) {
        setBatches(result.data.batches);
        setStats(result.data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch sync batches:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [sourceFilter]);

  const statusColors: Record<string, string> = {
    SUCCESS: "bg-green-100 text-green-700",
    FAILED: "bg-red-100 text-red-700",
    PARTIAL: "bg-yellow-100 text-yellow-700",
    RUNNING: "bg-blue-100 text-blue-700",
    PENDING: "bg-gray-100 text-gray-700",
  };

  const statusLabels: Record<string, string> = {
    SUCCESS: "成功",
    FAILED: "失败",
    PARTIAL: "部分成功",
    RUNNING: "运行中",
    PENDING: "等待中",
  };

  const sourceLabels: Record<string, string> = {
    PAYMENT_SYSTEM: "支付系统",
    ORDER_SYSTEM: "订单系统",
    MAP_API: "地图接口",
  };

  const sourceIcons: Record<string, string> = {
    PAYMENT_SYSTEM: "💳",
    ORDER_SYSTEM: "📦",
    MAP_API: "🗺️",
  };

  const paymentCount = stats?.payment.count || 0;
  const orderCount = stats?.order.count || 0;
  const mapCount = stats?.map.count || 0;

  const getLatestStatus = (latest: SyncBatch | null) => {
    if (!latest) return "-";
    return statusLabels[latest.status] || "-";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">数据同步</h1>
        <p className="text-gray-500 mt-1">
          取数链路同步批次记录：支付流水、订单系统、地图接口
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-3xl">💳</span>
            <div>
              <p className="text-sm text-gray-500 font-medium">支付系统同步</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {paymentCount} 批次
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              最新状态：
              <span className="text-green-600 font-medium ml-1">
                {getLatestStatus(stats?.payment.latest || null)}
              </span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📦</span>
            <div>
              <p className="text-sm text-gray-500 font-medium">订单系统同步</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {orderCount} 批次
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              最新状态：
              <span className="text-green-600 font-medium ml-1">
                {getLatestStatus(stats?.order.latest || null)}
              </span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🗺️</span>
            <div>
              <p className="text-sm text-gray-500 font-medium">地图接口同步</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {mapCount} 批次
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              最新状态：
              <span className="text-green-600 font-medium ml-1">
                {getLatestStatus(stats?.map.latest || null)}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-3">📊 取数链路说明</h3>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
            <div>
              <p className="font-medium text-gray-900">支付流水</p>
              <p className="text-xs text-gray-500">从支付系统同步交易数据</p>
            </div>
          </div>
          <span className="text-gray-400 text-2xl hidden md:block">→</span>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
            <div>
              <p className="font-medium text-gray-900">订单系统</p>
              <p className="text-xs text-gray-500">同步订单状态和详情</p>
            </div>
          </div>
          <span className="text-gray-400 text-2xl hidden md:block">→</span>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
            <div>
              <p className="font-medium text-gray-900">地图接口</p>
              <p className="text-xs text-gray-500">获取路线和时长数据</p>
            </div>
          </div>
          <span className="text-gray-400 text-2xl hidden md:block">→</span>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">4</div>
            <div>
              <p className="font-medium text-gray-900">补贴计算</p>
              <p className="text-xs text-gray-500">根据规则生成补贴记录</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">同步批次记录</h2>
          <div className="flex gap-2">
            {["ALL", "PAYMENT_SYSTEM", "ORDER_SYSTEM", "MAP_API"].map((source) => (
              <button
                key={source}
                onClick={() => setSourceFilter(source)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                  sourceFilter === source
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {source === "ALL"
                  ? "全部"
                  : source === "PAYMENT_SYSTEM"
                    ? "支付系统"
                    : source === "ORDER_SYSTEM"
                      ? "订单系统"
                      : "地图接口"}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500">批次号</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">数据来源</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">状态</th>
                <th className="px-6 py-3 text-right font-medium text-gray-500">总数</th>
                <th className="px-6 py-3 text-right font-medium text-gray-500">成功</th>
                <th className="px-6 py-3 text-right font-medium text-gray-500">失败</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">开始时间</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">完成时间</th>
                <th className="px-6 py-3 text-center font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    加载中...
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    暂无同步批次记录
                  </td>
                </tr>
              ) : (
                batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-900 font-mono text-xs">
                      {batch.batchNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span>{sourceIcons[batch.source]}</span>
                        <span className="text-gray-900">{sourceLabels[batch.source]}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 text-xs font-medium rounded-full",
                        statusColors[batch.status]
                      )}>
                        {statusLabels[batch.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-900">{batch.totalCount}</td>
                    <td className="px-6 py-4 text-right text-green-600 font-medium">
                      {batch.successCount}
                    </td>
                    <td className="px-6 py-4 text-right text-red-600 font-medium">
                      {batch.failedCount}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {batch.startedAt ? formatDate(new Date(batch.startedAt)) : "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {batch.completedAt ? formatDate(new Date(batch.completedAt)) : "-"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedBatch(batch)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        查看详情
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">同步批次详情</h3>
              <button
                onClick={() => setSelectedBatch(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">批次号</p>
                  <p className="text-gray-900 font-mono text-xs mt-1">
                    {selectedBatch.batchNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">数据来源</p>
                  <p className="text-gray-900 font-medium mt-1">
                    {sourceLabels[selectedBatch.source]}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">状态</p>
                  <span className={cn(
                    "px-2 py-1 text-xs font-medium rounded-full inline-block mt-1",
                    statusColors[selectedBatch.status]
                  )}>
                    {statusLabels[selectedBatch.status]}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">创建时间</p>
                  <p className="text-gray-900 font-medium mt-1">
                    {formatDate(new Date(selectedBatch.createdAt))}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-500">总数</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">
                    {selectedBatch.totalCount}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-green-600">成功</p>
                  <p className="text-xl font-bold text-green-600 mt-1">
                    {selectedBatch.successCount}
                  </p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-red-600">失败</p>
                  <p className="text-xl font-bold text-red-600 mt-1">
                    {selectedBatch.failedCount}
                  </p>
                </div>
              </div>

              {selectedBatch.errorMessage && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-red-700 mb-1">错误信息</p>
                  <p className="text-red-800 text-sm">{selectedBatch.errorMessage}</p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={() => setSelectedBatch(null)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
