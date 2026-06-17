"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Calendar,
  FileText,
  Clock,
  ChevronLeft,
  ChevronRight,
  Building2,
  Package,
  AlertCircle,
} from "lucide-react";
import { MaterialDelayStatus } from "@/types";

const statusTabs = [
  { value: "all", label: "全部" },
  { value: MaterialDelayStatus.REPORTED, label: "已上报" },
  { value: MaterialDelayStatus.CONFIRMED, label: "已确认" },
  { value: MaterialDelayStatus.RESCHEDULED, label: "已改期" },
  { value: MaterialDelayStatus.RESOLVED, label: "已解决" },
  { value: MaterialDelayStatus.CLOSED, label: "已关闭" },
];

const statusColors: Record<string, string> = {
  [MaterialDelayStatus.REPORTED]: "bg-yellow-100 text-yellow-700 border-yellow-200",
  [MaterialDelayStatus.CONFIRMED]: "bg-blue-100 text-blue-700 border-blue-200",
  [MaterialDelayStatus.RESCHEDULED]: "bg-purple-100 text-purple-700 border-purple-200",
  [MaterialDelayStatus.RESOLVED]: "bg-green-100 text-green-700 border-green-200",
  [MaterialDelayStatus.CLOSED]: "bg-gray-100 text-gray-700 border-gray-200",
};

const statusLabels: Record<string, string> = {
  [MaterialDelayStatus.REPORTED]: "已上报",
  [MaterialDelayStatus.CONFIRMED]: "已确认",
  [MaterialDelayStatus.RESCHEDULED]: "已改期",
  [MaterialDelayStatus.RESOLVED]: "已解决",
  [MaterialDelayStatus.CLOSED]: "已关闭",
};

const projects = [
  { id: "all", name: "全部项目" },
  { id: "1", name: "阳光花园 3 栋 201" },
  { id: "2", name: "阳光花园 5 栋 101" },
  { id: "3", name: "阳光花园 3 栋 401" },
  { id: "4", name: "中央公园 1 栋 502" },
  { id: "5", name: "中央公园 2 栋 303" },
];

const mockDelays = [
  {
    id: "1",
    materialName: "实木地板",
    specification: "橡木 910x125mm 原木色",
    project: "阳光花园 3 栋 201",
    quantity: 85,
    unit: "㎡",
    originalDate: "2024-01-15",
    estimatedDate: "2024-01-30",
    delayDays: 15,
    status: MaterialDelayStatus.RESCHEDULED,
    reason: "厂家原材料供应紧张，生产周期延长",
    impact: "导致地面铺装工序延后，可能影响整体工期 10 天",
    changeOrder: "CO-2024-008",
    changeOrderTitle: "客厅地面材料升级",
    reportedBy: "李工长",
    reportedAt: "2024-01-10 14:30",
  },
  {
    id: "2",
    materialName: "瓷砖",
    specification: "800x800mm 浅灰色 通体砖",
    project: "中央公园 1 栋 502",
    quantity: 120,
    unit: "㎡",
    originalDate: "2024-01-12",
    estimatedDate: "2024-01-24",
    delayDays: 12,
    status: MaterialDelayStatus.CONFIRMED,
    reason: "热销型号库存不足，需从外地仓库调货",
    impact: "瓦工工序需等待，可能造成工期延误",
    changeOrder: "CO-2024-012",
    changeOrderTitle: "卫生间瓷砖款式更换",
    reportedBy: "王工长",
    reportedAt: "2024-01-08 09:15",
  },
  {
    id: "3",
    materialName: "木门",
    specification: "实木复合门 白色烤漆 5 套",
    project: "阳光花园 5 栋 101",
    quantity: 5,
    unit: "樘",
    originalDate: "2024-01-20",
    estimatedDate: "2024-01-30",
    delayDays: 10,
    status: MaterialDelayStatus.REPORTED,
    reason: "厂家生产排期紧张，需延后交付",
    impact: "可能影响门套安装和后续油漆工序",
    changeOrder: null,
    changeOrderTitle: null,
    reportedBy: "张工长",
    reportedAt: "2024-01-15 16:45",
  },
  {
    id: "4",
    materialName: "橱柜",
    specification: "整体厨房 烤漆面板 石英石台面",
    project: "中央公园 2 栋 303",
    quantity: 1,
    unit: "套",
    originalDate: "2024-01-18",
    estimatedDate: "2024-01-26",
    delayDays: 8,
    status: MaterialDelayStatus.RESCHEDULED,
    reason: "台面尺寸复测后重新加工",
    impact: "厨房安装延后，影响水电收尾",
    changeOrder: "CO-2024-015",
    changeOrderTitle: "厨房布局调整",
    reportedBy: "李工长",
    reportedAt: "2024-01-12 11:20",
  },
  {
    id: "5",
    materialName: "壁纸",
    specification: "无纺布 米黄色 欧式花纹",
    project: "阳光花园 3 栋 401",
    quantity: 30,
    unit: "卷",
    originalDate: "2024-01-10",
    estimatedDate: "2024-01-16",
    delayDays: 6,
    status: MaterialDelayStatus.RESOLVED,
    reason: "物流途中延误，已安排加急配送",
    impact: "已协调施工顺序，影响较小",
    changeOrder: null,
    changeOrderTitle: null,
    reportedBy: "张工长",
    reportedAt: "2024-01-08 10:00",
  },
  {
    id: "6",
    materialName: "乳胶漆",
    specification: "多乐士 五合一 白色",
    project: "阳光花园 3 栋 201",
    quantity: 20,
    unit: "桶",
    originalDate: "2024-01-08",
    estimatedDate: "2024-01-10",
    delayDays: 2,
    status: MaterialDelayStatus.RESOLVED,
    reason: "临时缺货，已从就近门店调配",
    impact: "工期影响较小，已赶工追回",
    changeOrder: null,
    changeOrderTitle: null,
    reportedBy: "李工长",
    reportedAt: "2024-01-06 15:30",
  },
  {
    id: "7",
    materialName: "集成吊顶",
    specification: "铝扣板 300x300mm 银灰色",
    project: "中央公园 1 栋 502",
    quantity: 15,
    unit: "㎡",
    originalDate: "2024-01-22",
    estimatedDate: null,
    delayDays: null,
    status: MaterialDelayStatus.REPORTED,
    reason: "供应商反馈产能不足，交付时间待定",
    impact: "可能影响厨卫吊顶安装进度",
    changeOrder: "CO-2024-018",
    changeOrderTitle: "卫生间吊顶升级",
    reportedBy: "王工长",
    reportedAt: "2024-01-16 09:00",
  },
  {
    id: "8",
    materialName: "淋浴房",
    specification: "钢化玻璃 一字型 银色边框",
    project: "阳光花园 5 栋 101",
    quantity: 1,
    unit: "套",
    originalDate: "2024-01-05",
    estimatedDate: "2024-01-15",
    delayDays: 10,
    status: MaterialDelayStatus.CLOSED,
    reason: "定制尺寸有误，返厂重新制作",
    impact: "已解决，对整体工期影响已消化",
    changeOrder: null,
    changeOrderTitle: null,
    reportedBy: "张工长",
    reportedAt: "2024-01-03 14:00",
  },
];

export default function MaterialDelaysPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const filteredDelays = mockDelays.filter((delay) => {
    const matchesTab = activeTab === "all" || delay.status === activeTab;
    const matchesSearch =
      delay.materialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delay.specification.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject =
      selectedProject === "all" || delay.project === projects.find((p) => p.id === selectedProject)?.name;
    return matchesTab && matchesSearch && matchesProject;
  });

  const totalPages = Math.ceil(filteredDelays.length / pageSize);
  const paginatedDelays = filteredDelays.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const unresolvedCount = mockDelays.filter(
    (d) => d.status !== MaterialDelayStatus.RESOLVED && d.status !== MaterialDelayStatus.CLOSED
  ).length;

  const totalDelayDays = mockDelays.reduce((sum, d) => sum + (d.delayDays || 0), 0);

  const impactedChangeOrders = mockDelays.filter((d) => d.changeOrder !== null).length;

  const getDelayDaysColor = (days: number | null, status: string) => {
    if (status === MaterialDelayStatus.RESOLVED || status === MaterialDelayStatus.CLOSED) {
      return "text-green-600";
    }
    if (!days) return "text-gray-400";
    if (days >= 10) return "text-red-600";
    if (days >= 5) return "text-orange-600";
    return "text-amber-600";
  };

  const getDelayDaysBg = (days: number | null, status: string) => {
    if (status === MaterialDelayStatus.RESOLVED || status === MaterialDelayStatus.CLOSED) {
      return "bg-green-50 border-green-200";
    }
    if (!days) return "bg-gray-50 border-gray-200";
    if (days >= 10) return "bg-red-50 border-red-200";
    if (days >= 5) return "bg-orange-50 border-orange-200";
    return "bg-amber-50 border-amber-200";
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">材料延期管理</h1>
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
            <AlertTriangle className="h-3 w-3" />
            独立管理
          </span>
        </div>
        <p className="text-muted-foreground mt-1">
          材料延期独立于变更单状态管理，实时跟踪材料到货情况，确保项目进度可控
        </p>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {statusTabs.map((tab) => {
          const count =
            tab.value === "all"
              ? mockDelays.length
              : mockDelays.filter((d) => d.status === tab.value).length;
          return (
            <button
              key={tab.value}
              onClick={() => {
                setActiveTab(tab.value);
                setCurrentPage(1);
              }}
              className={`flex-shrink-0 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border text-muted-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
              <span
                className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  activeTab === tab.value
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">未解决延期数</p>
              <p className="text-3xl font-bold mt-1 text-red-600">{unresolvedCount}</p>
              <p className="text-sm text-muted-foreground mt-2">需要跟进处理</p>
            </div>
            <div className="bg-red-100 text-red-600 p-3 rounded-lg">
              <AlertCircle className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">总延期天数</p>
              <p className="text-3xl font-bold mt-1">{totalDelayDays}</p>
              <p className="text-sm text-muted-foreground mt-2">累计延期天数</p>
            </div>
            <div className="bg-amber-100 text-amber-600 p-3 rounded-lg">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">影响变更单数</p>
              <p className="text-3xl font-bold mt-1">{impactedChangeOrders}</p>
              <p className="text-sm text-muted-foreground mt-2">关联变更单数量</p>
            </div>
            <div className="bg-purple-100 text-purple-600 p-3 rounded-lg">
              <FileText className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="搜索材料名称或规格..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 w-64 rounded-lg border bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={selectedProject}
                onChange={(e) => {
                  setSelectedProject(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 w-48 rounded-lg border bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            上报延期
          </button>
        </div>

        <div className="divide-y">
          {paginatedDelays.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">暂无符合条件的材料延期记录</p>
            </div>
          ) : (
            paginatedDelays.map((delay) => (
              <div
                key={delay.id}
                className="p-5 hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex-shrink-0 w-20 h-20 rounded-lg border flex flex-col items-center justify-center ${getDelayDaysBg(
                      delay.delayDays,
                      delay.status
                    )}`}
                  >
                    <span
                      className={`text-2xl font-bold ${getDelayDaysColor(
                        delay.delayDays,
                        delay.status
                      )}`}
                    >
                      {delay.delayDays ? `+${delay.delayDays}` : "?"}
                    </span>
                    <span className="text-xs text-muted-foreground mt-0.5">延期天数</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-lg">{delay.materialName}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {delay.specification} · {delay.quantity}
                          {delay.unit}
                        </p>
                      </div>
                      <span
                        className={`flex-shrink-0 inline-flex items-center border rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          statusColors[delay.status]
                        }`}
                      >
                        {statusLabels[delay.status]}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">原定日期</p>
                        <p className="text-sm font-medium flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {delay.originalDate}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">预计到货</p>
                        <p className="text-sm font-medium flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {delay.estimatedDate || "待定"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">所属项目</p>
                        <p className="text-sm font-medium flex items-center gap-1 mt-0.5">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          {delay.project}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">关联变更单</p>
                        <p className="text-sm font-medium flex items-center gap-1 mt-0.5">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          {delay.changeOrder ? (
                            <span className="text-primary hover:underline">
                              {delay.changeOrder}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">无</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">影响说明：</span>
                          {delay.impact}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        延期原因：{delay.reason}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {delay.reportedBy} · {delay.reportedAt}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between p-4 border-t">
          <p className="text-sm text-muted-foreground">
            共 {filteredDelays.length} 条记录，当前第 {currentPage} / {totalPages || 1} 页
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors ${
                  currentPage === page
                    ? "bg-primary text-primary-foreground"
                    : "border hover:bg-muted"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
