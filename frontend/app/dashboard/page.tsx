"use client";

import { useMemo } from "react";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  DollarSign,
  ListTodo,
} from "lucide-react";
import { useApp } from "@/lib/context/AppContext";
import { useAuth } from "@/lib/context/AuthContext";
import { TaskKanban } from "@/components/task/TaskKanban";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import { USER_ROLE_LABELS } from "@/lib/constants";
import { TaskStatus } from "@/lib/types";

export default function DashboardPage() {
  const { tasks, statistics } = useApp();
  const { user } = useAuth();

  const stats = useMemo(() => {
    return {
      total: tasks.length,
      pending: tasks.filter((t) => t.status === TaskStatus.PENDING).length,
      approved: tasks.filter((t) => t.status === TaskStatus.APPROVED).length,
      rejected: tasks.filter((t) => t.status === TaskStatus.REJECTED).length,
      disputed: tasks.filter((t) => t.status === TaskStatus.DISPUTED).length,
      overdue: tasks.filter((t) => t.status === TaskStatus.OVERDUE).length,
    };
  }, [tasks]);

  const unconfirmedAmount = useMemo(() => {
    return tasks
      .filter(
        (t) =>
          t.status === TaskStatus.PENDING || t.status === TaskStatus.DISPUTED
      )
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [tasks]);

  const statCards = [
    {
      title: "全部任务",
      value: stats.total,
      icon: ListTodo,
      color: "bg-blue-50 text-blue-600",
      bgIcon: "bg-blue-100",
    },
    {
      title: "待确认",
      value: stats.pending,
      icon: Clock,
      color: "bg-yellow-50 text-yellow-600",
      bgIcon: "bg-yellow-100",
    },
    {
      title: "已确认",
      value: stats.approved,
      icon: CheckCircle,
      color: "bg-green-50 text-green-600",
      bgIcon: "bg-green-100",
    },
    {
      title: "已拒绝",
      value: stats.rejected,
      icon: XCircle,
      color: "bg-red-50 text-red-600",
      bgIcon: "bg-red-100",
    },
    {
      title: "有争议",
      value: stats.disputed,
      icon: AlertTriangle,
      color: "bg-orange-50 text-orange-600",
      bgIcon: "bg-orange-100",
    },
    {
      title: "已逾期",
      value: stats.overdue,
      icon: AlertCircle,
      color: "bg-gray-50 text-gray-600",
      bgIcon: "bg-gray-200",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">工作台</h1>
          <p className="text-gray-500 mt-1">
            欢迎回来，{user?.name}（{user?.role ? USER_ROLE_LABELS[user.role] : ""}）
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm text-gray-500">未确认金额</p>
            <p className="text-xl font-bold text-primary-600">
              {formatCurrency(unconfirmedAmount)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgIcon}`}>
                    <Icon className="h-6 w-6 text-gray-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>任务概览</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-400">图表占位 - 任务趋势</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">确认耗时</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary-100">
                  <TrendingUp className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {statistics.averageConfirmationTime}
                  </p>
                  <p className="text-sm text-gray-500">平均确认天数</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">未确认金额</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-orange-100">
                  <DollarSign className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(statistics.totalUnconfirmedAmount)}
                  </p>
                  <p className="text-sm text-gray-500">待确认金额</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">任务看板</h2>
        </div>
        <TaskKanban tasks={tasks} />
      </div>
    </div>
  );
}
