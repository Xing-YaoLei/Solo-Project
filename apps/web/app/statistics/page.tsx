"use client";

import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  FileText,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Package,
  Headphones,
  Activity,
  ChevronRight,
  Search,
  Filter,
  ArrowUpRight,
  Clock8,
  AlertCircle,
  Wrench,
  User,
} from "lucide-react";
import { MaterialDelayStatus, AfterSalesStatus } from "@/types";

const timeRanges = [
  { value: "day", label: "日" },
  { value: "week", label: "周" },
  { value: "month", label: "月" },
  { value: "quarter", label: "季" },
  { value: "year", label: "年" },
];

const durationStats = [
  { category: "按时完成", count: 68, color: "bg-green-500" },
  { category: "延期1-7天", count: 24, color: "bg-yellow-500" },
  { category: "延期8-30天", count: 12, color: "bg-orange-500" },
  { category: "延期30天以上", count: 5, color: "bg-red-500" },
];

const topDelayMaterials = [
  { id: "1", name: "实木地板", specification: "橡木 910x125mm", delayDays: 15, project: "阳光花园 3 栋 201" },
  { id: "2", name: "瓷砖", specification: "800x800mm 浅灰色", delayDays: 12, project: "中央公园 1 栋 502" },
  { id: "3", name: "木门", specification: "实木复合门 白色", delayDays: 10, project: "阳光花园 5 栋 101" },
  { id: "4", name: "橱柜", specification: "整体厨房 烤漆面板", delayDays: 8, project: "中央公园 2 栋 303" },
  { id: "5", name: "壁纸", specification: "无纺布 米黄色", delayDays: 6, project: "阳光花园 3 栋 401" },
];

const afterSalesStats = [
  { status: AfterSalesStatus.OPEN, label: "待处理", count: 8, color: "bg-red-500" },
  { status: AfterSalesStatus.IN_PROGRESS, label: "处理中", count: 12, color: "bg-blue-500" },
  { status: AfterSalesStatus.PENDING_REVIEW, label: "待复核", count: 5, color: "bg-yellow-500" },
  { status: AfterSalesStatus.RESOLVED, label: "已解决", count: 35, color: "bg-green-500" },
  { status: AfterSalesStatus.CLOSED, label: "已关闭", count: 42, color: "bg-gray-500" },
];

const recentActivities = [
  {
    id: "1",
    type: "change_order",
    title: "变更单 CO-2024-024 已完成",
    project: "阳光花园 3 栋 201",
    time: "10 分钟前",
    user: "张设计师",
    icon: CheckCircle2,
    iconColor: "text-green-600 bg-green-100",
  },
  {
    id: "2",
    type: "material_delay",
    title: "材料延期：实木地板延期 15 天",
    project: "中央公园 1 栋 502",
    time: "30 分钟前",
    user: "李工长",
    icon: AlertTriangle,
    iconColor: "text-red-600 bg-red-100",
  },
  {
    id: "3",
    type: "after_sales",
    title: "售后工单 AS-2024-018 已分配",
    project: "阳光花园 5 栋 101",
    time: "1 小时前",
    user: "王主管",
    icon: Headphones,
    iconColor: "text-blue-600 bg-blue-100",
  },
  {
    id: "4",
    type: "change_order",
    title: "变更单 CO-2024-023 待业主确认",
    project: "中央公园 2 栋 303",
    time: "2 小时前",
    user: "李设计师",
    icon: Clock,
    iconColor: "text-yellow-600 bg-yellow-100",
  },
  {
    id: "5",
    type: "material_delay",
    title: "材料延期：瓷砖已确认到货时间",
    project: "阳光花园 3 栋 401",
    time: "3 小时前",
    user: "张工长",
    icon: Package,
    iconColor: "text-purple-600 bg-purple-100",
  },
  {
    id: "6",
    type: "acceptance",
    title: "验收通过：卫生间防水工程",
    project: "阳光花园 3 栋 201",
    time: "昨天 16:30",
    user: "刘监理",
    icon: CheckCircle2,
    iconColor: "text-green-600 bg-green-100",
  },
  {
    id: "7",
    type: "after_sales",
    title: "售后工单 AS-2024-015 已解决",
    project: "中央公园 1 栋 502",
    time: "昨天 14:20",
    user: "王工长",
    icon: CheckCircle2,
    iconColor: "text-green-600 bg-green-100",
  },
];

export default function StatisticsPage() {
  const [timeRange, setTimeRange] = useState("month");
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);

  const maxDurationCount = Math.max(...durationStats.map((d) => d.count));
  const maxMaterialDelay = Math.max(...topDelayMaterials.map((m) => m.delayDays));
  const totalAfterSales = afterSalesStats.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">统计分析</h1>
          <p className="text-muted-foreground mt-1">查看项目数据统计和分析</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
          {timeRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                timeRange === range.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">总变更单</p>
              <p className="text-3xl font-bold mt-1">109</p>
              <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                较上月 +12%
              </p>
            </div>
            <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
              <FileText className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">已完成</p>
              <p className="text-3xl font-bold mt-1">68</p>
              <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                较上月 +8%
              </p>
            </div>
            <div className="bg-green-100 text-green-600 p-3 rounded-lg">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">进行中</p>
              <p className="text-3xl font-bold mt-1">28</p>
              <p className="text-sm text-yellow-600 mt-2 flex items-center gap-1">
                <Activity className="h-4 w-4" />
                当前进行中
              </p>
            </div>
            <div className="bg-purple-100 text-purple-600 p-3 rounded-lg">
              <Wrench className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">延期数</p>
              <p className="text-3xl font-bold mt-1">13</p>
              <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                较上月 +3
              </p>
            </div>
            <div className="bg-red-100 text-red-600 p-3 rounded-lg">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">成本增加</p>
              <p className="text-3xl font-bold mt-1">¥158.6K</p>
              <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                <TrendingDown className="h-4 w-4" />
                较上月 -8%
              </p>
            </div>
            <div className="bg-amber-100 text-amber-600 p-3 rounded-lg">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">工期偏差统计</h2>
                <p className="text-sm text-muted-foreground mt-1">按延期天数分布</p>
              </div>
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {durationStats.map((item) => (
                <div
                  key={item.category}
                  className={`cursor-pointer rounded-lg p-3 transition-colors ${
                    selectedDuration === item.category
                      ? "bg-muted ring-2 ring-primary"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() =>
                    setSelectedDuration(
                      selectedDuration === item.category ? null : item.category
                    )
                  }
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{item.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">{item.count}</span>
                      <span className="text-sm text-muted-foreground">
                        ({((item.count / 109) * 100).toFixed(1)}%)
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all`}
                      style={{
                        width: `${(item.count / maxDurationCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            {selectedDuration && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  点击查看「{selectedDuration}」的全部变更单列表
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-card">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">材料延期统计</h2>
                <p className="text-sm text-muted-foreground mt-1">当前材料延期情况</p>
              </div>
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">41</p>
                <p className="text-xs text-muted-foreground mt-1">总延期数</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">28</p>
                <p className="text-xs text-muted-foreground mt-1">已解决</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-amber-600">13</p>
                <p className="text-xs text-muted-foreground mt-1">未解决</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">6.8</p>
                <p className="text-xs text-muted-foreground mt-1">平均延期(天)</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-3">延期天数 Top 5 材料</h3>
              <div className="space-y-3">
                {topDelayMaterials.map((material, index) => (
                  <div
                    key={material.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        index === 0
                          ? "bg-red-500 text-white"
                          : index === 1
                          ? "bg-orange-500 text-white"
                          : index === 2
                          ? "bg-yellow-500 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{material.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {material.specification}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-red-600 font-bold">+{material.delayDays} 天</p>
                      <p className="text-xs text-muted-foreground">{material.project}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border bg-card">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">售后工单统计</h2>
                <p className="text-sm text-muted-foreground mt-1">各状态数量分布</p>
              </div>
              <Headphones className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-3xl font-bold">{totalAfterSales}</p>
                    <p className="text-xs text-muted-foreground">总工单数</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {afterSalesStats.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{item.count}</span>
                    <span className="text-xs text-muted-foreground">
                      ({((item.count / totalAfterSales) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-lg border bg-card">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">近期操作记录</h2>
                <p className="text-sm text-muted-foreground mt-1">最新动态一览</p>
              </div>
              <button className="text-sm text-primary hover:underline flex items-center gap-1">
                查看全部
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="divide-y">
            {recentActivities.map((activity) => {
              const IconComponent = activity.icon;
              return (
                <div
                  key={activity.id}
                  className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg ${activity.iconColor} flex-shrink-0`}
                    >
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{activity.title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {activity.project}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 justify-end">
                        <User className="h-3 w-3" />
                        {activity.user}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
