"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { generateOrderDetail } from "@/lib/mockData";
import { formatCurrency, formatDuration } from "@/lib/utils";
import Link from "next/link";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("basic");

  useEffect(() => {
    if (params.id) {
      setOrder(generateOrderDetail(params.id as string));
    }
  }, [params.id]);

  if (!order) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  const tabs = [
    { id: "basic", label: "基本信息" },
    { id: "payment", label: "支付信息" },
    { id: "map", label: "地图路线" },
    { id: "subsidy", label: "补贴详情" },
    { id: "settlement", label: "结算信息" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          ← 返回
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">订单详情</h1>
          <p className="text-gray-500 mt-1">订单号：{order.orderNo}</p>
        </div>
        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
          {order.statusLabel}
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-100">
          <div className="flex gap-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === "basic" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-500">订单号</p>
                  <p className="text-gray-900 font-medium mt-1">{order.orderNo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">区域</p>
                  <p className="text-gray-900 font-medium mt-1">{order.regionName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">骑手</p>
                  <p className="text-gray-900 font-medium mt-1">{order.riderName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">物品类型</p>
                  <p className="text-gray-900 font-medium mt-1">{order.itemType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">物品价值</p>
                  <p className="text-gray-900 font-medium mt-1">{formatCurrency(order.itemValue)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">配送距离</p>
                  <p className="text-gray-900 font-medium mt-1">{order.distance} 公里</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">派单时长</p>
                  <p className="text-gray-900 font-medium mt-1">
                    {formatDuration(order.dispatchDuration || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">配送时长</p>
                  <p className="text-gray-900 font-medium mt-1">
                    {formatDuration(order.deliveryDuration || 0)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-2">取货地址</p>
                  <p className="text-gray-900 font-medium">{order.pickupAddress}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-2">送货地址</p>
                  <p className="text-gray-900 font-medium">{order.deliveryAddress}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-3">订单时间线</p>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">下单</p>
                      <p className="text-xs text-gray-500">{order.orderedAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">派单</p>
                      <p className="text-xs text-gray-500">{order.assignedAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">取件</p>
                      <p className="text-xs text-gray-500">{order.pickedUpAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">送达</p>
                      <p className="text-xs text-gray-500">{order.deliveredAt}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "payment" && order.payment && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-500">交易流水号</p>
                  <p className="text-gray-900 font-medium mt-1 font-mono text-sm">
                    {order.payment.transactionNo}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">支付方式</p>
                  <p className="text-gray-900 font-medium mt-1">
                    {order.payment.paymentMethod}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">支付金额</p>
                  <p className="text-gray-900 font-medium mt-1">
                    {formatCurrency(order.payment.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">支付时间</p>
                  <p className="text-gray-900 font-medium mt-1">{order.payment.paidAt}</p>
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-4">费用明细</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-blue-700">基础配送费</span>
                    <span className="text-blue-900 font-medium">
                      {formatCurrency(order.payment.baseFee)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">补贴金额</span>
                    <span className="text-green-600 font-medium">
                      - {formatCurrency(order.payment.subsidyAmount)}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-blue-200 flex justify-between">
                    <span className="text-blue-900 font-medium">实付金额</span>
                    <span className="text-blue-900 font-bold text-lg">
                      {formatCurrency(order.payment.amount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "map" && order.mapRecord && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-500">地图服务商</p>
                  <p className="text-gray-900 font-medium mt-1">
                    {order.mapRecord.mapProvider}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">路线距离</p>
                  <p className="text-gray-900 font-medium mt-1">
                    {order.mapRecord.routeDistance} 公里
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">预计时长</p>
                  <p className="text-gray-900 font-medium mt-1">
                    {formatDuration(order.mapRecord.estimatedDuration)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">实际时长</p>
                  <p className="text-gray-900 font-medium mt-1">
                    {formatDuration(order.mapRecord.actualDuration || 0)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-2">交通状况</p>
                  <p className="text-gray-900 font-medium">{order.mapRecord.trafficLevel}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-2">天气情况</p>
                  <p className="text-gray-900 font-medium">
                    {order.mapRecord.weatherCondition || "晴"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">同步时间</p>
                <p className="text-gray-900">{order.mapRecord.syncedAt}</p>
              </div>
            </div>
          )}

          {activeTab === "subsidy" && order.subsidy && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-500">补贴规则</p>
                  <p className="text-gray-900 font-medium mt-1">{order.subsidy.ruleName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">规则编码</p>
                  <p className="text-gray-900 font-medium mt-1 font-mono text-sm">
                    {order.subsidy.ruleCode}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">补贴日期</p>
                  <p className="text-gray-900 font-medium mt-1">{order.subsidy.subsidyDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">补贴总额</p>
                  <p className="text-green-600 font-bold mt-1 text-lg">
                    {formatCurrency(order.subsidy.amount)}
                  </p>
                </div>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="font-medium text-green-900 mb-4">补贴构成</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-green-700">基础补贴</span>
                    <span className="text-green-900 font-medium">
                      {formatCurrency(order.subsidy.baseAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">距离补贴</span>
                    <span className="text-green-900 font-medium">
                      {formatCurrency(order.subsidy.distanceBonus)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">时段补贴</span>
                    <span className="text-green-900 font-medium">
                      {formatCurrency(order.subsidy.timeBonus)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">其他补贴</span>
                    <span className="text-green-900 font-medium">
                      {formatCurrency(order.subsidy.otherBonus)}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-green-200 flex justify-between">
                    <span className="text-green-900 font-medium">合计</span>
                    <span className="text-green-900 font-bold text-lg">
                      {formatCurrency(order.subsidy.amount)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Link
                  href="/appeal"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  发起申诉
                </Link>
              </div>
            </div>
          )}

          {activeTab === "settlement" && order.settlement && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-500">结算单号</p>
                  <p className="text-gray-900 font-medium mt-1 font-mono text-sm">
                    {order.settlement.settlementNo}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">状态</p>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 inline-block mt-1">
                    {order.settlement.statusLabel}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">结算日期</p>
                  <p className="text-gray-900 font-medium mt-1">
                    {order.settlement.settlementDate}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">实发金额</p>
                  <p className="text-gray-900 font-bold mt-1 text-lg">
                    {formatCurrency(order.settlement.totalAmount)}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-4">结算明细</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">基础配送费</span>
                    <span className="text-gray-900 font-medium">
                      {formatCurrency(order.settlement.baseFee)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">补贴金额</span>
                    <span className="text-green-600 font-medium">
                      + {formatCurrency(order.settlement.subsidyAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">扣款</span>
                    <span className="text-red-600 font-medium">
                      - {formatCurrency(order.settlement.deductionAmount)}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-gray-200 flex justify-between">
                    <span className="text-gray-900 font-medium">实发合计</span>
                    <span className="text-gray-900 font-bold text-lg">
                      {formatCurrency(order.settlement.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {order.settlement.remark && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-yellow-700 mb-1">备注</p>
                  <p className="text-yellow-800 text-sm">{order.settlement.remark}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Link
          href="/settlement"
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
        >
          返回结算明细
        </Link>
        <Link
          href="/damage"
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
        >
          查看损坏记录
        </Link>
      </div>
    </div>
  );
}
