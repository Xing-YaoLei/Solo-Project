"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  Filter,
  User,
  Clock,
  Building2,
  AlertCircle,
  ChevronRight,
  X,
} from "lucide-react";
import { AfterSalesStatus } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";

const mockTickets = [
  {
    id: "1",
    ticketNo: "AS-2024-001",
    title: "卫生间漏水",
    description: "主卫生间淋浴区漏水，导致楼下天花板渗水",
    project: "阳光花园 3 栋 201",
    status: AfterSalesStatus.IN_PROGRESS,
    priority: "HIGH",
    reporter: "王业主",
    reporterPhone: "138****1234",
    assignee: "李工长",
    assigneeAvatar: null,
    createdAt: "2024-01-15 09:00",
    updatedAt: "2024-01-15 14:30",
  },
  {
    id: "2",
    ticketNo: "AS-2024-002",
    title: "墙面开裂",
    description: "客厅墙面有多处细小裂纹，需要处理",
    project: "中央公园 1 栋 502",
    status: AfterSalesStatus.OPEN,
    priority: "NORMAL",
    reporter: "张业主",
    reporterPhone: "139****5678",
    assignee: null,
    assigneeAvatar: null,
    createdAt: "2024-01-16 10:30",
    updatedAt: "2024-01-16 10:30",
  },
  {
    id: "3",
    ticketNo: "AS-2024-003",
    title: "橱柜门关不严",
    description: "厨房橱柜门有一扇关不严，有缝隙",
    project: "阳光花园 5 栋 101",
    status: AfterSalesStatus.PENDING_REVIEW,
    priority: "LOW",
    reporter: "李业主",
    reporterPhone: "137****9012",
    assignee: "王工长",
    assigneeAvatar: null,
    createdAt: "2024-01-14 14:00",
    updatedAt: "2024-01-15 16:00",
  },
  {
    id: "4",
    ticketNo: "AS-2024-004",
    title: "水龙头滴水",
    description: "厨房水龙头关紧后仍然滴水",
    project: "中央公园 2 栋 303",
    status: AfterSalesStatus.RESOLVED,
    priority: "NORMAL",
    reporter: "陈业主",
    reporterPhone: "136****3456",
    assignee: "张工长",
    assigneeAvatar: null,
    createdAt: "2024-01-10 08:00",
    updatedAt: "2024-01-11 11:00",
  },
  {
    id: "5",
    ticketNo: "AS-2024-005",
    title: "地板起翘",
    description: "卧室木地板有几处起翘现象，踩上去有声音",
    project: "阳光花园 3 栋 401",
    status: AfterSalesStatus.CLOSED,
    priority: "HIGH",
    reporter: "刘业主",
    reporterPhone: "135****7890",
    assignee: "李工长",
    assigneeAvatar: null,
    createdAt: "2024-01-08 11:00",
    updatedAt: "2024-01-12 15:00",
  },
  {
    id: "6",
    ticketNo: "AS-2024-006",
    title: "开关接触不良",
    description: "客厅灯开关接触不良，有时按了没反应",
    project: "阳光花园 3 栋 201",
    status: AfterSalesStatus.OPEN,
    priority: "LOW",
    reporter: "王业主",
    reporterPhone: "138****1234",
    assignee: null,
    assigneeAvatar: null,
    createdAt: "2024-01-16 14:00",
    updatedAt: "2024-01-16 14:00",
  },
  {
    id: "7",
    ticketNo: "AS-2024-007",
    title: "瓷砖空鼓",
    description: "厨房墙面瓷砖有两块空鼓，需要检查处理",
    project: "中央公园 1 栋 502",
    status: AfterSalesStatus.IN_PROGRESS,
    priority: "NORMAL",
    reporter: "张业主",
    reporterPhone: "139****5678",
    assignee: "王工长",
    assigneeAvatar: null,
    createdAt: "2024-01-15 16:00",
    updatedAt: "2024-01-16 09:00",
  },
];

const statusTabs = [
  { value: "all", label: "全部", count: mockTickets.length },
  { value: AfterSalesStatus.OPEN, label: "待处理", count: mockTickets.filter((t) => t.status === AfterSalesStatus.OPEN).length },
  { value: AfterSalesStatus.IN_PROGRESS, label: "处理中", count: mockTickets.filter((t) => t.status === AfterSalesStatus.IN_PROGRESS).length },
  { value: AfterSalesStatus.PENDING_REVIEW, label: "待复核", count: mockTickets.filter((t) => t.status === AfterSalesStatus.PENDING_REVIEW).length },
  { value: AfterSalesStatus.RESOLVED, label: "已解决", count: mockTickets.filter((t) => t.status === AfterSalesStatus.RESOLVED).length },
  { value: AfterSalesStatus.CLOSED, label: "已关闭", count: mockTickets.filter((t) => t.status === AfterSalesStatus.CLOSED).length },
];

const priorityOptions = [
  { value: "all", label: "全部优先级" },
  { value: "HIGH", label: "高优先级" },
  { value: "NORMAL", label: "中优先级" },
  { value: "LOW", label: "低优先级" },
];

const projects = [
  { id: "all", name: "全部项目" },
  { id: "1", name: "阳光花园 3 栋 201" },
  { id: "2", name: "阳光花园 5 栋 101" },
  { id: "3", name: "阳光花园 3 栋 401" },
  { id: "4", name: "中央公园 1 栋 502" },
  { id: "5", name: "中央公园 2 栋 303" },
];

function getPriorityInfo(priority: string) {
  switch (priority) {
    case "HIGH":
      return {
        label: "高",
        className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        dotColor: "bg-red-500",
      };
    case "NORMAL":
      return {
        label: "中",
        className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        dotColor: "bg-blue-500",
      };
    case "LOW":
      return {
        label: "低",
        className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
        dotColor: "bg-gray-500",
      };
    default:
      return {
        label: priority,
        className: "bg-gray-100 text-gray-700",
        dotColor: "bg-gray-500",
      };
  }
}

export default function AfterSalesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [selectedProject, setSelectedProject] = useState("all");

  const filteredTickets = mockTickets.filter((ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.ticketNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === "all" || ticket.status === selectedStatus;
    const matchesPriority = selectedPriority === "all" || ticket.priority === selectedPriority;
    const matchesProject =
      selectedProject === "all" || ticket.project === projects.find((p) => p.id === selectedProject)?.name;
    return matchesSearch && matchesStatus && matchesPriority && matchesProject;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">售后工单</h1>
          <p className="text-muted-foreground mt-1">处理和跟踪售后问题</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          创建工单
        </button>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="border-b">
          <div className="flex items-center gap-1 px-2">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setSelectedStatus(tab.value)}
                className={cn(
                  "relative inline-flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap",
                  selectedStatus === tab.value
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                    selectedStatus === tab.value
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {tab.count}
                </span>
                {selectedStatus === tab.value && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-b flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="搜索工单编号、标题、描述..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>

          {(selectedPriority !== "all" ||
            selectedProject !== "all" ||
            searchQuery) && (
            <button
              onClick={() => {
                setSelectedPriority("all");
                setSelectedProject("all");
                setSearchQuery("");
              }}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
              清除筛选
            </button>
          )}
        </div>

        <div className="divide-y">
          {filteredTickets.map((ticket) => {
            const priorityInfo = getPriorityInfo(ticket.priority);
            return (
              <div
                key={ticket.id}
                className="p-4 hover:bg-muted/30 transition-colors cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-sm text-muted-foreground">
                        {ticket.ticketNo}
                      </span>
                      <StatusBadge status={ticket.status} type="afterSales" />
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          priorityInfo.className
                        )}
                      >
                        <span
                          className={cn(
                            "mr-1.5 h-1.5 w-1.5 rounded-full",
                            priorityInfo.dotColor
                          )}
                        />
                        {priorityInfo.label}优先级
                      </span>
                    </div>
                    <h3 className="font-medium mt-2 group-hover:text-primary transition-colors">
                      {ticket.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {ticket.description}
                    </p>
                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5" />
                        <span>{ticket.project}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="h-3.5 w-3.5" />
                        <span>报修人：{ticket.reporter}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>创建于 {ticket.createdAt}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">处理人</p>
                      {ticket.assignee ? (
                        <div className="flex items-center gap-2 mt-1 justify-end">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                            <User className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium">{ticket.assignee}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 mt-1 text-amber-600">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span className="text-xs">未分配</span>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredTickets.length === 0 && (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-sm font-semibold">没有找到工单</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              尝试调整筛选条件或搜索关键词
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
