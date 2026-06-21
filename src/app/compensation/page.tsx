"use client";

import { useState, useEffect } from "react";
import DateRangePicker from "@/components/DateRangePicker";
import { generateCompensationRecords, generateYoYComparison } from "@/lib/mockData";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function CompensationPage() {
  const [dateRange, setDateRange] = useState("30d");
  const [records, setRecords] = useState<any[]>([]);
  const [yoyData, setYoyData] = useState<any>(null);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  useEffect(() => {
    setRecords(generateCompensationRecords(30));
    setYoyData(generateYoYComparison());
  }, [dateRange]);

  const totalAmount = records.reduce((sum, r) => sum + r.amount, 0);
  const avgAmount = records.length > 0 ? totalAmount / records.length : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">赔付记录</h1>
          <p className="text-gray-500 mt-1">赔付记录与口径解释说明</p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">赔付总数</p>
          <p className="text-2xl font-bold mt-2 text-gray-900">{records.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">赔付总金额</p>
          <p className="text-2xl font-bold mt-2 text-red-600">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">平均赔付</p>
          <p className="text-2xl font-bold mt-2 text-gray-900">{formatCurrency(avgAmount)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">同比变化</p>
          <p className={cn(
            "text-2xl font-bold mt-2",
            (yoyData?.yoyRate || 0) >= 0 ? "text-red-600" : "text-green-600"
          )}>
            {(yoyData?.yoyRate || 0) >= 0 ? "+" : ""}{(yoyData?.yoyRate || 0).toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h3 className="font-semibold text-amber-900 mb-2">赔付口径说明</h3>
            <div className="text-sm text-amber-800 space-y-1">
              <p>• <strong>物品赔付</strong>：按照物品价值的70%进行赔付，单票最高不超过500元</p>
              <p>• <strong>服务补偿</strong>：因服务质量问题给予用户的补偿，根据情节轻重确定金额</p>
              <p>• <strong>运费减免</strong>：下次订单运费减免，有效期30天</p>
              <p>• 所有赔付需提供相关证据材料，经审核通过后执行</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">赔付记录列表</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500">订单号</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">区域</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">物品种类</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">严重程度</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">赔付类型</th>
                <th className="px-6 py-3 text-right font-medium text-gray-500">赔付金额</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">赔付时间</th>
                <th className="px-6 py-3 text-center font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-900 font-medium">{record.orderNo}</td>
                  <td className="px-6 py-4 text-gray-600">{record.regionName}</td>
                  <td className="px-6 py-4 text-gray-600">{record.damageItems}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full",
                      record.severity === "轻微"
                        ? "bg-green-100 text-green-700"
                        : record.severity === "中度"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                    )}>
                      {record.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{record.compensationType}</td>
                  <td className="px-6 py-4 text-right text-red-600 font-medium">
                    {formatCurrency(record.amount)}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{record.paidAt}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => setSelectedRecord(record)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      查看口径
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
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">赔付口径详情</h3>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">订单号</p>
                  <p className="text-gray-900 font-medium mt-1">{selectedRecord.orderNo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">赔付金额</p>
                  <p className="text-red-600 font-medium mt-1 text-lg">
                    {formatCurrency(selectedRecord.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">赔付类型</p>
                  <p className="text-gray-900 font-medium mt-1">
                    {selectedRecord.compensationType}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">赔付时间</p>
                  <p className="text-gray-900 font-medium mt-1">{selectedRecord.paidAt}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">赔付描述</p>
                <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">
                  {selectedRecord.description}
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-700 mb-2">📋 赔付口径说明</p>
                <p className="text-blue-800 text-sm">{selectedRecord.caliberNote}</p>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={() => setSelectedRecord(null)}
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
