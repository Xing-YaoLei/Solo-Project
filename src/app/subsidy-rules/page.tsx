"use client";

import { useState, useEffect } from "react";
import { getSubsidyRules, generateYoYComparison, generateMoMComparison } from "@/lib/mockData";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function SubsidyRulesPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [yoyData, setYoyData] = useState<any>(null);
  const [momData, setMomData] = useState<any>(null);
  const [selectedRule, setSelectedRule] = useState<any>(null);

  useEffect(() => {
    setRules(getSubsidyRules());
    setYoyData(generateYoYComparison());
    setMomData(generateMoMComparison());
  }, []);

  const subsidyTypeLabels: Record<string, string> = {
    DISTANCE: "距离补贴",
    TIME: "时段补贴",
    WEATHER: "天气补贴",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">补贴规则</h1>
        <p className="text-gray-500 mt-1">补贴规则管理与同环比分析</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">同比分析</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">本期补贴总额</span>
              <span className="font-bold text-gray-900">
                {formatCurrency(yoyData?.current?.totalAmount || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">去年同期</span>
              <span className="text-gray-500">
                {formatCurrency(yoyData?.lastYear?.totalAmount || 0)}
              </span>
            </div>
            <div className="pt-3 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">同比增长率</span>
                <span className={cn(
                  "text-xl font-bold",
                  yoyData?.yoyRate >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {yoyData?.yoyRate >= 0 ? "+" : ""}{yoyData?.yoyRate?.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-600">本期订单数</p>
                <p className="text-lg font-bold text-blue-700">{yoyData?.current?.orderCount}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-xs text-green-600">本期单均</p>
                <p className="text-lg font-bold text-green-700">
                  {formatCurrency(yoyData?.current?.avgAmount || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">环比分析</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">本期补贴总额</span>
              <span className="font-bold text-gray-900">
                {formatCurrency(momData?.current?.totalAmount || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">上月同期</span>
              <span className="text-gray-500">
                {formatCurrency(momData?.lastMonth?.totalAmount || 0)}
              </span>
            </div>
            <div className="pt-3 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">环比增长率</span>
                <span className={cn(
                  "text-xl font-bold",
                  momData?.momRate >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {momData?.momRate >= 0 ? "+" : ""}{momData?.momRate?.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-600">上月订单数</p>
                <p className="text-lg font-bold text-blue-700">{momData?.lastMonth?.orderCount}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-xs text-green-600">上月单均</p>
                <p className="text-lg font-bold text-green-700">
                  {formatCurrency(momData?.lastMonth?.avgAmount || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">补贴规则列表</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => setSelectedRule(rule)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">{rule.ruleName}</h3>
                    <span className={cn(
                      "px-2 py-0.5 text-xs font-medium rounded-full",
                      rule.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    )}>
                      {rule.isActive ? "生效中" : "已停用"}
                    </span>
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                      {subsidyTypeLabels[rule.subsidyType] || rule.subsidyType}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mt-1">{rule.ruleCode}</p>
                  <p className="text-gray-600 text-sm mt-2">{rule.description}</p>
                </div>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  查看详情 →
                </button>
              </div>
              <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
                <div>
                  <p className="text-gray-500">基础金额</p>
                  <p className="font-medium text-gray-900 mt-1">{formatCurrency(rule.baseAmount)}</p>
                </div>
                <div>
                  <p className="text-gray-500">距离系数</p>
                  <p className="font-medium text-gray-900 mt-1">
                    {rule.distanceMultiplier ? `${rule.distanceMultiplier}x` : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">最低金额</p>
                  <p className="font-medium text-gray-900 mt-1">
                    {rule.minAmount ? formatCurrency(rule.minAmount) : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">最高金额</p>
                  <p className="font-medium text-gray-900 mt-1">
                    {rule.maxAmount ? formatCurrency(rule.maxAmount) : "无上限"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedRule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full mx-4">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{selectedRule.ruleName}</h3>
              <button
                onClick={() => setSelectedRule(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">规则编码</p>
                  <p className="text-gray-900 font-medium mt-1">{selectedRule.ruleCode}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">补贴类型</p>
                  <p className="text-gray-900 font-medium mt-1">
                    {subsidyTypeLabels[selectedRule.subsidyType]}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">生效时间</p>
                  <p className="text-gray-900 font-medium mt-1">
                    {formatDate(selectedRule.effectiveFrom)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">失效时间</p>
                  <p className="text-gray-900 font-medium mt-1">
                    {selectedRule.effectiveTo ? formatDate(selectedRule.effectiveTo) : "长期有效"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">规则描述</p>
                <p className="text-gray-900 mt-1">{selectedRule.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">基础金额</p>
                  <p className="text-gray-900 font-medium mt-1">
                    {formatCurrency(selectedRule.baseAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">距离系数</p>
                  <p className="text-gray-900 font-medium mt-1">
                    {selectedRule.distanceMultiplier
                      ? `${selectedRule.distanceMultiplier}x`
                      : "不适用"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">时间系数</p>
                  <p className="text-gray-900 font-medium mt-1">
                    {selectedRule.timeMultiplier
                      ? `${selectedRule.timeMultiplier}x`
                      : "不适用"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">状态</p>
                  <span className={cn(
                    "px-2 py-0.5 text-xs font-medium rounded-full inline-block mt-1",
                    selectedRule.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  )}>
                    {selectedRule.isActive ? "生效中" : "已停用"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
