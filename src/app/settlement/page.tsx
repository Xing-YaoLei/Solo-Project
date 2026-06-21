"use client";

import { useState, useEffect } from "react";
import DateRangePicker from "@/components/DateRangePicker";
import { generateSettlementDetails } from "@/lib/mockData";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function SettlementPage() {
  const [dateRange, setDateRange] = useState("30d");
  const [settlements, setSettlements] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    setSettlements(generateSettlementDetails(30));
  }, [dateRange]);

  const filteredSettlements = statusFilter === "ALL"
    ? settlements
    : settlements.filter((s) => s.status === statusFilter);

  const totalAmount = filteredSettlements.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalSubsidy = filteredSettlements.reduce((sum, s) => sum + s.subsidyAmount, 0);

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    SETTLED: "bg-green-100 text-green-700",
    ADJUSTED: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">结算明细</h1>
          <p className="text-gray-500 mt-1">查看结算明细，可跳转至订单详情</p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">结算单数</p>
          <p className="text-2xl font-bold mt-2 text-gray-900">{filteredSettlements.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">结算总金额</p>
          <p className="text-2xl font-bold mt-2 text-gray-900">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">补贴总额</p>
          <p className="text-2xl font-bold mt-2 text-blue-600">{formatCurrency(totalSubsidy)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">待结算</p>
          <p className="text-2xl font-bold mt-2 text-yellow-600">
            {settlements.filter((s) => s.status === "PENDING").length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">结算明细列表</h2>
          <div className="flex gap-2">
            {["ALL", "PENDING", "SETTLED", "ADJUSTED"].map((status) => (
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
                    ? "待结算"
                    : status === "SETTLED"
                      ? "已结算"
                      : "已调整"}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500">结算单号</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">订单号</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">区域</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">骑手</th>
                <th className="px-6 py-3 text-right font-medium text-gray-500">基础费用</th>
                <th className="px-6 py-3 text-right font-medium text-gray-500">补贴金额</th>
                <th className="px-6 py-3 text-right font-medium text-gray-500">扣款</th>
                <th className="px-6 py-3 text-right font-medium text-gray-500">实发金额</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">状态</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">结算日期</th>
                <th className="px-6 py-3 text-center font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSettlements.map((settlement) => (
                <tr key={settlement.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-900 font-medium">
                    {settlement.settlementNo}
                  </td>
                  <td className="px-6 py-4 text-blue-600 hover:text-blue-800 cursor-pointer">
                    <Link href={`/order/${settlement.orderId}`}>
                      {settlement.orderNo}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{settlement.regionName}</td>
                  <td className="px-6 py-4 text-gray-600">{settlement.riderName}</td>
                  <td className="px-6 py-4 text-right text-gray-900">
                    {formatCurrency(settlement.baseFee)}
                  </td>
                  <td className="px-6 py-4 text-right text-blue-600 font-medium">
                    {formatCurrency(settlement.subsidyAmount)}
                  </td>
                  <td className="px-6 py-4 text-right text-red-600">
                    {settlement.deductionAmount > 0 ? `-${formatCurrency(settlement.deductionAmount)}` : "-"}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-900 font-medium">
                    {formatCurrency(settlement.totalAmount)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full",
                      statusColors[settlement.status]
                    )}>
                      {settlement.statusLabel}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{settlement.settlementDate}</td>
                  <td className="px-6 py-4 text-center">
                    <Link
                      href={`/order/${settlement.orderId}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      查看订单
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
