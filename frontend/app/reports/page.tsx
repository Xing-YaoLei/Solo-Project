"use client";

import {
  BarChart3,
  Clock,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useApp } from "@/lib/context/AppContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import {
  TASK_TYPE_LABELS,
} from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { TaskType } from "@/lib/types";

export default function ReportsPage() {
  const { statistics, tasks } = useApp();

  const reworkReasons = statistics.reworkReasons.filter((r) => r.count > 0);
  const maxReworkCount = Math.max(...reworkReasons.map((r) => r.count), 1);

  const confirmationTimeData = statistics.confirmationTimeByType;
  const maxConfirmationTime = Math.max(
    ...confirmationTimeData.map((d) => d.averageDays),
    1
  );

  const unconfirmedTasks = tasks.filter(
    (t) => t.amount && (t.status === "PENDING" || t.status === "DISPUTED")
  );
  const totalUnconfirmed = unconfirmedTasks.reduce(
    (sum, t) => sum + (t.amount || 0),
    0
  );

  const pendingAmount = tasks
    .filter((t) => t.status === "PENDING" && t.amount)
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const disputedAmount = tasks
    .filter((t) => t.status === "DISPUTED" && t.amount)
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">数据报表</h1>
        <p className="text-gray-500 mt-1">查看确认任务统计分析数据</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">平均确认耗时</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {statistics.averageConfirmationTime}
                  <span className="text-lg font-normal text-gray-500 ml-1">
                    天
                  </span>
                </p>
              </div>
              <div className="p-3 rounded-lg bg-primary-100">
                <Clock className="h-6 w-6 text-primary-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
              <TrendingDown className="h-3.5 w-3.5" />
              <span>较上周减少 0.5 天</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">未确认金额</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {formatCurrency(totalUnconfirmed)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-orange-100">
                <DollarSign className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-orange-600">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>较上周增加 15%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">返工次数</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {reworkReasons.reduce((sum, r) => sum + r.count, 0)}
                  <span className="text-lg font-normal text-gray-500 ml-1">
                    次
                  </span>
                </p>
              </div>
              <div className="p-3 rounded-lg bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>较上周增加 1 次</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">确认通过率</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {Math.round(
                    (statistics.approvedTasks / statistics.totalTasks) * 100
                  )}
                  <span className="text-lg font-normal text-gray-500 ml-1">
                    %
                  </span>
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>较上周提升 5%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary-600" />
              确认耗时统计
            </CardTitle>
            <CardDescription>按任务类型分类的平均确认天数</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {confirmationTimeData.map((item) => {
                const percentage = (item.averageDays / maxConfirmationTime) * 100;
                const typeColors: Record<TaskType, string> = {
                  [TaskType.NODE_ACCEPTANCE]: "bg-blue-500",
                  [TaskType.DESIGN_CHANGE]: "bg-purple-500",
                  [TaskType.MATERIAL_REPLACEMENT]: "bg-orange-500",
                  [TaskType.ADDITIONAL_QUOTE]: "bg-green-500",
                };

                return (
                  <div key={item.type}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-gray-700">
                        {TASK_TYPE_LABELS[item.type]}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {item.averageDays} 天
                      </span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${typeColors[item.type]}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              返工原因统计
            </CardTitle>
            <CardDescription>各类返工原因的出现频次</CardDescription>
          </CardHeader>
          <CardContent>
            {reworkReasons.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
                <p>暂无返工记录</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reworkReasons.map((item, index) => {
                  const percentage = (item.count / maxReworkCount) * 100;
                  const colors = [
                    "bg-red-500",
                    "bg-orange-500",
                    "bg-yellow-500",
                    "bg-blue-500",
                  ];

                  return (
                    <div key={item.reason}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-gray-700">
                          {item.reason}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {item.count} 次
                        </span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            colors[index % colors.length]
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            未确认金额统计
          </CardTitle>
          <CardDescription>
            待确认和有争议的增项报价金额分布
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-200">
                  <Clock className="h-5 w-5 text-yellow-700" />
                </div>
                <div>
                  <p className="text-sm text-yellow-700">待确认金额</p>
                  <p className="text-xl font-bold text-yellow-800">
                    {formatCurrency(pendingAmount)}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-200">
                  <AlertTriangle className="h-5 w-5 text-orange-700" />
                </div>
                <div>
                  <p className="text-sm text-orange-700">有争议金额</p>
                  <p className="text-xl font-bold text-orange-800">
                    {formatCurrency(disputedAmount)}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary-200">
                  <DollarSign className="h-5 w-5 text-primary-700" />
                </div>
                <div>
                  <p className="text-sm text-primary-700">未确认总计</p>
                  <p className="text-xl font-bold text-primary-800">
                    {formatCurrency(totalUnconfirmed)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {unconfirmedTasks.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                      项目名称
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                      任务名称
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                      类型
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                      状态
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                      金额
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {unconfirmedTasks.map((task) => (
                    <tr
                      key={task.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {task.project.name}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {task.title}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {TASK_TYPE_LABELS[task.type]}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            task.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {task.status === "PENDING" ? "待确认" : "有争议"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-right text-gray-900">
                        {formatCurrency(task.amount || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
