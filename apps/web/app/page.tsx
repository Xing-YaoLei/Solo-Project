"use client";

import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  ListTodo,
  FileText,
  Users,
  MapPin,
  ChevronRight,
  Bell,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ChangeOrderStatus, MaterialDelayStatus } from "@/types";
import Link from "next/link";

const currentUser = {
  name: "张经理",
  role: "项目经理",
  avatar: null,
};

const stats = [
  {
    title: "待处理",
    value: 12,
    icon: <Clock className="h-6 w-6" />,
    color: "warning" as const,
    trend: { value: 8, isPositive: false, label: "较昨日" },
  },
  {
    title: "进行中",
    value: 28,
    icon: <CheckCircle2 className="h-6 w-6" />,
    color: "primary" as const,
    trend: { value: 12, isPositive: true, label: "较昨日" },
  },
  {
    title: "已延期",
    value: 5,
    icon: <AlertTriangle className="h-6 w-6" />,
    color: "destructive" as const,
    trend: { value: 2, isPositive: false, label: "较昨日" },
  },
  {
    title: "本周新增",
    value: 18,
    icon: <PlusCircle className="h-6 w-6" />,
    color: "success" as const,
    trend: { value: 15, isPositive: true, label: "较上周" },
  },
];

const todoItems = [
  {
    id: "1",
    title: "审核变更单 CO-2024-015",
    description: "阳光花园3栋201 - 水电改造变更",
    priority: "high",
    deadline: "今天 17:00",
    type: "changeOrder",
  },
  {
    id: "2",
    title: "处理材料延期 MD-2024-008",
    description: "瓷砖供货延迟，需协调改期",
    priority: "high",
    deadline: "今天 16:00",
    type: "materialDelay",
  },
  {
    id: "3",
    title: "验收照片审核",
    description: "中央公园1栋502 - 木工吊顶验收",
    priority: "medium",
    deadline: "明天 12:00",
    type: "acceptance",
  },
  {
    id: "4",
    title: "售后工单跟进 AS-2024-003",
    description: "阳光花园5栋101 - 橱柜门关不严",
    priority: "low",
    deadline: "本周五",
    type: "afterSales",
  },
  {
    id: "5",
    title: "审核变更单 CO-2024-016",
    description: "中央公园2栋303 - 墙面配色变更",
    priority: "medium",
    deadline: "明天 17:00",
    type: "changeOrder",
  },
];

const recentChangeOrders = [
  {
    id: "1",
    orderNo: "CO-2024-015",
    title: "水电改造方案调整",
    project: "阳光花园 3 栋 201",
    status: ChangeOrderStatus.PENDING_REVIEW,
    submittedBy: "李设计师",
    createdAt: "2024-01-15 10:30",
  },
  {
    id: "2",
    orderNo: "CO-2024-014",
    title: "客厅吊顶造型变更",
    project: "中央公园 1 栋 502",
    status: ChangeOrderStatus.IN_PROGRESS,
    submittedBy: "王设计师",
    createdAt: "2024-01-14 14:00",
  },
  {
    id: "3",
    orderNo: "CO-2024-013",
    title: "卫生间防水升级",
    project: "阳光花园 5 栋 101",
    status: ChangeOrderStatus.OWNER_APPROVED,
    submittedBy: "张设计师",
    createdAt: "2024-01-13 09:00",
  },
  {
    id: "4",
    orderNo: "CO-2024-012",
    title: "厨房布局优化",
    project: "中央公园 2 栋 303",
    status: ChangeOrderStatus.ACCEPTED,
    submittedBy: "李设计师",
    createdAt: "2024-01-12 16:00",
  },
];

const materialDelays = [
  {
    id: "1",
    materialName: "抛光地砖 800x800",
    project: "阳光花园 3 栋 201",
    delayDays: 5,
    status: MaterialDelayStatus.CONFIRMED,
    reason: "供应商库存不足，需调货",
  },
  {
    id: "2",
    materialName: "实木复合地板",
    project: "中央公园 1 栋 502",
    delayDays: 3,
    status: MaterialDelayStatus.REPORTED,
    reason: "物流延误，预计后天到达",
  },
  {
    id: "3",
    materialName: "定制橱柜",
    project: "阳光花园 5 栋 101",
    delayDays: 7,
    status: MaterialDelayStatus.RESCHEDULED,
    reason: "生产周期延长，已重新排期",
  },
];

const todayCheckins = [
  {
    id: "1",
    workerName: "张师傅",
    workType: "水电工",
    project: "阳光花园 3 栋 201",
    checkinTime: "08:00",
    status: "工作中",
    location: "阳光花园小区",
  },
  {
    id: "2",
    workerName: "李师傅",
    workType: "瓦工",
    project: "阳光花园 5 栋 101",
    checkinTime: "07:30",
    status: "工作中",
    location: "阳光花园小区",
  },
  {
    id: "3",
    workerName: "王师傅",
    workType: "木工",
    project: "中央公园 1 栋 502",
    checkinTime: "08:30",
    status: "工作中",
    location: "中央公园小区",
  },
  {
    id: "4",
    workerName: "赵师傅",
    workType: "油漆工",
    project: "中央公园 2 栋 303",
    checkinTime: "09:00",
    status: "工作中",
    location: "中央公园小区",
  },
  {
    id: "5",
    workerName: "孙师傅",
    workType: "水电工",
    project: "阳光花园 3 栋 401",
    checkinTime: "08:00",
    status: "工作中",
    location: "阳光花园小区",
  },
  {
    id: "6",
    workerName: "周师傅",
    workType: "泥工",
    project: "阳光花园 3 栋 201",
    checkinTime: "08:00",
    checkinOut: "18:00",
    status: "已签退",
    location: "阳光花园小区",
  },
];

function getPriorityColor(priority: string) {
  switch (priority) {
    case "high":
      return "bg-red-500";
    case "medium":
      return "bg-amber-500";
    case "low":
      return "bg-green-500";
    default:
      return "bg-gray-500";
  }
}

export default function HomePage() {
  const pendingDelays = materialDelays.filter(
    (d) =>
      d.status === MaterialDelayStatus.CONFIRMED ||
      d.status === MaterialDelayStatus.REPORTED ||
      d.status === MaterialDelayStatus.RESCHEDULED
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            早上好，{currentUser.name}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {currentUser.role}
            </span>
          </h1>
          <p className="text-muted-foreground mt-1">
            今天是 2024年1月15日 星期一，您有 {stats[0].value} 项待处理任务
          </p>
        </div>
        <button className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            trend={stat.trend}
          />
        ))}
      </div>

      {pendingDelays > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
          <div className="p-4 border-b border-red-200 dark:border-red-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <h2 className="font-semibold text-red-900 dark:text-red-100">
                  材料延期预警
                </h2>
                <span className="inline-flex items-center rounded-full bg-red-600 px-2 py-0.5 text-xs font-medium text-white">
                  {pendingDelays} 项未解决
                </span>
              </div>
              <Link
                href="/material-delays"
                className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
              >
                查看全部
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {materialDelays.slice(0, 3).map((delay) => (
                <div
                  key={delay.id}
                  className="flex items-center justify-between rounded-lg bg-white dark:bg-red-900/20 p-3 border border-red-100 dark:border-red-800"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/50">
                      <Clock className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="font-medium text-red-900 dark:text-red-100">
                        {delay.materialName}
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        {delay.project}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        {delay.reason}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center rounded-full bg-red-600 text-white px-2.5 py-0.5 text-xs font-medium">
                      延期 {delay.delayDays} 天
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold">待办事项</h2>
            </div>
            <span className="text-sm text-muted-foreground">
              {todoItems.length} 项待处理
            </span>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {todoItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div
                    className={`mt-1.5 h-2.5 w-2.5 rounded-full flex-shrink-0 ${getPriorityColor(
                      item.priority
                    )}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.title}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {item.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      截止：{item.deadline}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold">近期变更单</h2>
            </div>
            <Link
              href="/change-orders"
              className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
            >
              查看全部
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {recentChangeOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-muted-foreground">
                        {order.orderNo}
                      </span>
                      <StatusBadge
                        status={order.status}
                        type="changeOrder"
                      />
                    </div>
                    <p className="font-medium mt-1 truncate">{order.title}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {order.project}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold">今日工人签到</h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              今日签到 <span className="font-semibold text-foreground">{todayCheckins.length}</span> 人
            </span>
            <Link
              href="/checkins"
              className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
            >
              查看全部
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <div className="p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {todayCheckins.map((checkin) => (
              <div
                key={checkin.id}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Users className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{checkin.workerName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {checkin.workType}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground truncate">
                      {checkin.location}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      checkin.status === "工作中"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {checkin.status}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {checkin.checkinTime} 签到
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
