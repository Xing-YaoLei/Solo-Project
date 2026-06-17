"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  Tag,
  UserPlus,
  Download,
  ChevronDown,
} from "lucide-react";
import { ChangeOrderStatus, DesignChangeOrder, Project, User, UserRole } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataTable, Column } from "@/components/ui/DataTable";
import { KanbanBoard, KanbanColumn } from "@/components/ui/KanbanBoard";
import { ChangeOrderCard } from "@/components/ChangeOrderCard";
import { BatchOperationBar, BatchAction } from "@/components/BatchOperationBar";
import { cn } from "@/lib/utils";

type ViewMode = "kanban" | "list";

const mockProjects: Project[] = [
  {
    id: "p1",
    name: "阳光花园 3 栋 201",
    address: "阳光花园小区 3 栋 201 室",
    ownerId: "u1",
    designerId: "u2",
    status: "IN_PROGRESS",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-10"),
  },
  {
    id: "p2",
    name: "阳光花园 5 栋 101",
    address: "阳光花园小区 5 栋 101 室",
    ownerId: "u3",
    designerId: "u4",
    status: "IN_PROGRESS",
    createdAt: new Date("2024-01-02"),
    updatedAt: new Date("2024-01-11"),
  },
  {
    id: "p3",
    name: "中央公园 1 栋 502",
    address: "中央公园 1 栋 502 室",
    ownerId: "u5",
    designerId: "u6",
    status: "IN_PROGRESS",
    createdAt: new Date("2024-01-03"),
    updatedAt: new Date("2024-01-12"),
  },
  {
    id: "p4",
    name: "中央公园 2 栋 303",
    address: "中央公园 2 栋 303 室",
    ownerId: "u7",
    designerId: "u2",
    status: "COMPLETED",
    createdAt: new Date("2023-12-01"),
    updatedAt: new Date("2024-01-05"),
  },
  {
    id: "p5",
    name: "翠湖天地 6 栋 801",
    address: "翠湖天地 6 栋 801 室",
    ownerId: "u8",
    designerId: "u4",
    status: "IN_PROGRESS",
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-01-13"),
  },
];

const mockDesigners: User[] = [
  {
    id: "u2",
    email: "zhang@example.com",
    name: "张设计师",
    role: UserRole.DESIGNER,
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2023-01-01"),
  },
  {
    id: "u4",
    email: "li@example.com",
    name: "李设计师",
    role: UserRole.DESIGNER,
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2023-01-01"),
  },
  {
    id: "u6",
    email: "wang@example.com",
    name: "王设计师",
    role: UserRole.DESIGNER,
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2023-01-01"),
  },
  {
    id: "u9",
    email: "chen@example.com",
    name: "陈设计师",
    role: UserRole.DESIGNER,
    createdAt: new Date("2023-06-01"),
    updatedAt: new Date("2023-06-01"),
  },
];

const mockOrders: (DesignChangeOrder & {
  project?: Project;
  designer?: User | null;
  hasMaterialDelay?: boolean;
  materialDelayCount?: number;
})[] = [
  {
    id: "1",
    orderNo: "CO-2024-001",
    projectId: "p1",
    title: "客厅吊顶设计变更",
    description: "客户要求将原有的平顶吊顶改为层次感更强的造型吊顶",
    reason: "客户审美偏好变更",
    impactOnCost: 8500,
    impactOnSchedule: 3,
    status: ChangeOrderStatus.IN_PROGRESS,
    designerId: "u2",
    submittedById: "u2",
    deadline: new Date("2026-06-25"),
    createdAt: new Date("2026-06-10"),
    updatedAt: new Date("2026-06-15"),
    project: mockProjects[0],
    designer: mockDesigners[0],
    hasMaterialDelay: true,
    materialDelayCount: 2,
  },
  {
    id: "2",
    orderNo: "CO-2024-002",
    projectId: "p2",
    title: "卫生间防水方案调整",
    description: "增加防水层厚度，改用更高规格的防水材料",
    reason: "提升防水质量标准",
    impactOnCost: 3200,
    impactOnSchedule: 2,
    status: ChangeOrderStatus.PENDING_REVIEW,
    designerId: "u4",
    submittedById: "u4",
    deadline: new Date("2026-06-30"),
    createdAt: new Date("2026-06-12"),
    updatedAt: new Date("2026-06-12"),
    project: mockProjects[1],
    designer: mockDesigners[1],
    hasMaterialDelay: false,
  },
  {
    id: "3",
    orderNo: "CO-2024-003",
    projectId: "p3",
    title: "厨房橱柜布局优化",
    description: "调整橱柜布局，增加储物空间，优化操作动线",
    reason: "功能需求优化",
    impactOnCost: 5600,
    impactOnSchedule: 4,
    status: ChangeOrderStatus.DESIGNER_APPROVED,
    designerId: "u6",
    submittedById: "u6",
    deadline: new Date("2026-07-05"),
    createdAt: new Date("2026-06-08"),
    updatedAt: new Date("2026-06-14"),
    project: mockProjects[2],
    designer: mockDesigners[2],
    hasMaterialDelay: false,
  },
  {
    id: "4",
    orderNo: "CO-2024-004",
    projectId: "p4",
    title: "地板材质更换",
    description: "将复合地板更换为实木地板",
    reason: "客户提升装修品质",
    impactOnCost: 12000,
    impactOnSchedule: 5,
    status: ChangeOrderStatus.ACCEPTED,
    designerId: "u2",
    submittedById: "u2",
    deadline: new Date("2026-06-05"),
    createdAt: new Date("2026-05-20"),
    updatedAt: new Date("2026-06-03"),
    project: mockProjects[3],
    designer: mockDesigners[0],
    hasMaterialDelay: false,
  },
  {
    id: "5",
    orderNo: "CO-2024-005",
    projectId: "p1",
    title: "墙面涂料颜色调整",
    description: "主卧室墙面颜色由米白色改为浅灰色",
    reason: "客户颜色偏好变更",
    impactOnCost: 800,
    impactOnSchedule: 1,
    status: ChangeOrderStatus.DRAFT,
    designerId: null,
    submittedById: null,
    deadline: null,
    createdAt: new Date("2026-06-15"),
    updatedAt: new Date("2026-06-15"),
    project: mockProjects[0],
    designer: null,
    hasMaterialDelay: false,
  },
  {
    id: "6",
    orderNo: "CO-2024-006",
    projectId: "p5",
    title: "阳台封闭方案",
    description: "将开放式阳台改为封闭式阳光房",
    reason: "增加使用空间",
    impactOnCost: 18000,
    impactOnSchedule: 7,
    status: ChangeOrderStatus.OWNER_APPROVED,
    designerId: "u4",
    submittedById: "u4",
    deadline: new Date("2026-07-10"),
    createdAt: new Date("2026-06-06"),
    updatedAt: new Date("2026-06-16"),
    project: mockProjects[4],
    designer: mockDesigners[1],
    hasMaterialDelay: true,
    materialDelayCount: 1,
  },
  {
    id: "7",
    orderNo: "CO-2024-007",
    projectId: "p2",
    title: "水电点位增加",
    description: "客厅增加3个插座点位，卧室增加2个双控开关",
    reason: "使用便利性需求",
    impactOnCost: 2500,
    impactOnSchedule: 1,
    status: ChangeOrderStatus.PENDING_ACCEPTANCE,
    designerId: "u4",
    submittedById: "u4",
    deadline: new Date("2026-06-20"),
    createdAt: new Date("2026-06-02"),
    updatedAt: new Date("2026-06-17"),
    project: mockProjects[1],
    designer: mockDesigners[1],
    hasMaterialDelay: false,
  },
  {
    id: "8",
    orderNo: "CO-2024-008",
    projectId: "p3",
    title: "门窗样式更换",
    description: "将原有的平开窗改为推拉窗，增加通风面积",
    reason: "通风需求",
    impactOnCost: 6800,
    impactOnSchedule: 6,
    status: ChangeOrderStatus.PENDING_REVIEW,
    designerId: "u6",
    submittedById: "u6",
    deadline: new Date("2026-07-15"),
    createdAt: new Date("2026-06-13"),
    updatedAt: new Date("2026-06-13"),
    project: mockProjects[2],
    designer: mockDesigners[2],
    hasMaterialDelay: false,
  },
  {
    id: "9",
    orderNo: "CO-2024-009",
    projectId: "p1",
    title: "衣帽间设计调整",
    description: "优化衣帽间内部格局，增加抽屉和挂衣区",
    reason: "储物需求优化",
    impactOnCost: 4200,
    impactOnSchedule: 3,
    status: ChangeOrderStatus.IN_PROGRESS,
    designerId: "u2",
    submittedById: "u2",
    deadline: new Date("2026-06-28"),
    createdAt: new Date("2026-06-08"),
    updatedAt: new Date("2026-06-14"),
    project: mockProjects[0],
    designer: mockDesigners[0],
    hasMaterialDelay: false,
  },
  {
    id: "10",
    orderNo: "CO-2024-010",
    projectId: "p5",
    title: "中央空调品牌更换",
    description: "将原定的中央空调品牌从A品牌更换为B品牌",
    reason: "客户品牌偏好",
    impactOnCost: -3000,
    impactOnSchedule: 4,
    status: ChangeOrderStatus.DRAFT,
    designerId: null,
    submittedById: null,
    deadline: null,
    createdAt: new Date("2026-06-16"),
    updatedAt: new Date("2026-06-16"),
    project: mockProjects[4],
    designer: null,
    hasMaterialDelay: false,
  },
  {
    id: "11",
    orderNo: "CO-2024-011",
    projectId: "p4",
    title: "背景墙造型设计",
    description: "电视背景墙采用大理石材质，增加整体奢华感",
    reason: "提升装修档次",
    impactOnCost: 15000,
    impactOnSchedule: 5,
    status: ChangeOrderStatus.ACCEPTED,
    designerId: "u2",
    submittedById: "u2",
    deadline: new Date("2026-06-10"),
    createdAt: new Date("2026-05-25"),
    updatedAt: new Date("2026-06-08"),
    project: mockProjects[3],
    designer: mockDesigners[0],
    hasMaterialDelay: false,
  },
  {
    id: "12",
    orderNo: "CO-2024-012",
    projectId: "p2",
    title: "地暖区域扩展",
    description: "将原只在客厅铺设的地暖扩展到所有卧室",
    reason: "提升居住舒适度",
    impactOnCost: 22000,
    impactOnSchedule: 8,
    status: ChangeOrderStatus.OWNER_APPROVED,
    designerId: "u4",
    submittedById: "u4",
    deadline: new Date("2026-07-20"),
    createdAt: new Date("2026-06-04"),
    updatedAt: new Date("2026-06-15"),
    project: mockProjects[1],
    designer: mockDesigners[1],
    hasMaterialDelay: true,
    materialDelayCount: 3,
  },
  {
    id: "13",
    orderNo: "CO-2024-013",
    projectId: "p3",
    title: "智能家居系统集成",
    description: "增加智能灯光控制、智能窗帘和安防系统",
    reason: "智能化升级",
    impactOnCost: 28000,
    impactOnSchedule: 10,
    status: ChangeOrderStatus.PENDING_ACCEPTANCE,
    designerId: "u6",
    submittedById: "u6",
    deadline: new Date("2026-06-22"),
    createdAt: new Date("2026-06-01"),
    updatedAt: new Date("2026-06-18"),
    project: mockProjects[2],
    designer: mockDesigners[2],
    hasMaterialDelay: false,
  },
  {
    id: "14",
    orderNo: "CO-2024-014",
    projectId: "p5",
    title: "楼梯扶手更换",
    description: "将木质扶手更换为玻璃+金属扶手",
    reason: "美观和安全考虑",
    impactOnCost: 9500,
    impactOnSchedule: 4,
    status: ChangeOrderStatus.DESIGNER_APPROVED,
    designerId: "u4",
    submittedById: "u4",
    deadline: new Date("2026-07-08"),
    createdAt: new Date("2026-06-10"),
    updatedAt: new Date("2026-06-17"),
    project: mockProjects[4],
    designer: mockDesigners[1],
    hasMaterialDelay: false,
  },
];

const displayStatuses = [
  ChangeOrderStatus.DRAFT,
  ChangeOrderStatus.PENDING_REVIEW,
  ChangeOrderStatus.DESIGNER_APPROVED,
  ChangeOrderStatus.OWNER_APPROVED,
  ChangeOrderStatus.IN_PROGRESS,
  ChangeOrderStatus.PENDING_ACCEPTANCE,
  ChangeOrderStatus.ACCEPTED,
];

const statusLabels: Record<string, string> = {
  [ChangeOrderStatus.DRAFT]: "草稿",
  [ChangeOrderStatus.PENDING_REVIEW]: "待审核",
  [ChangeOrderStatus.DESIGNER_APPROVED]: "设计师已批",
  [ChangeOrderStatus.OWNER_APPROVED]: "业主已批",
  [ChangeOrderStatus.IN_PROGRESS]: "进行中",
  [ChangeOrderStatus.PENDING_ACCEPTANCE]: "待验收",
  [ChangeOrderStatus.ACCEPTED]: "已验收",
  [ChangeOrderStatus.REJECTED]: "已拒绝",
  [ChangeOrderStatus.CANCELLED]: "已取消",
};

const statusColors: Record<string, string> = {
  [ChangeOrderStatus.DRAFT]: "#6b7280",
  [ChangeOrderStatus.PENDING_REVIEW]: "#f59e0b",
  [ChangeOrderStatus.DESIGNER_APPROVED]: "#3b82f6",
  [ChangeOrderStatus.OWNER_APPROVED]: "#10b981",
  [ChangeOrderStatus.IN_PROGRESS]: "#8b5cf6",
  [ChangeOrderStatus.PENDING_ACCEPTANCE]: "#f97316",
  [ChangeOrderStatus.ACCEPTED]: "#22c55e",
};

export default function ChangeOrdersPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showFilterSidebar, setShowFilterSidebar] = useState(false);
  const [filterProject, setFilterProject] = useState<string | null>(null);
  const [filterDesigner, setFilterDesigner] = useState<string | null>(null);

  const filteredOrders = useMemo(() => {
    return mockOrders.filter((order) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !order.orderNo.toLowerCase().includes(query) &&
          !order.title.toLowerCase().includes(query) &&
          !order.project?.name.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      if (selectedStatus && order.status !== selectedStatus) {
        return false;
      }

      if (filterProject && order.projectId !== filterProject) {
        return false;
      }

      if (filterDesigner && order.designerId !== filterDesigner) {
        return false;
      }

      return true;
    });
  }, [searchQuery, selectedStatus, filterProject, filterDesigner]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    displayStatuses.forEach((status) => {
      counts[status] = mockOrders.filter((o) => o.status === status).length;
    });
    return counts;
  }, []);

  const kanbanColumns: KanbanColumn<
    (typeof mockOrders)[0]
  >[] = useMemo(() => {
    return displayStatuses.map((status) => ({
      id: status,
      title: statusLabels[status],
      color: statusColors[status],
      items: filteredOrders.filter((o) => o.status === status),
    }));
  }, [filteredOrders]);

  const tableColumns: Column<(typeof mockOrders)[0]>[] = [
    {
      key: "orderNo",
      title: "变更单号",
      render: (row) => (
        <span className="font-mono text-sm">{row.orderNo}</span>
      ),
      sortable: true,
    },
    {
      key: "title",
      title: "标题",
      render: (row) => (
        <div className="max-w-xs">
          <p className="truncate font-medium">{row.title}</p>
          {row.hasMaterialDelay && (
            <span className="text-xs text-amber-600">
              ⚠ 材料延期
            </span>
          )}
        </div>
      ),
    },
    {
      key: "project",
      title: "项目",
      render: (row) => row.project?.name || "-",
    },
    {
      key: "designer",
      title: "设计师",
      render: (row) => row.designer?.name || "未分配",
    },
    {
      key: "status",
      title: "状态",
      render: (row) => (
        <StatusBadge status={row.status} type="changeOrder" />
      ),
    },
    {
      key: "deadline",
      title: "截止日期",
      render: (row) =>
        row.deadline
          ? new Date(row.deadline).toLocaleDateString("zh-CN")
          : "-",
      sortable: true,
    },
    {
      key: "createdAt",
      title: "创建时间",
      render: (row) =>
        new Date(row.createdAt).toLocaleDateString("zh-CN"),
      sortable: true,
    },
  ];

  const batchActions: BatchAction[] = [
    {
      label: "批量状态变更",
      icon: <Tag className="h-4 w-4" />,
      onClick: () => {
        alert(`批量状态变更: 选中 ${selectedIds.length} 项`);
      },
      variant: "default",
    },
    {
      label: "批量分配",
      icon: <UserPlus className="h-4 w-4" />,
      onClick: () => {
        alert(`批量分配: 选中 ${selectedIds.length} 项`);
      },
      variant: "default",
    },
    {
      label: "导出",
      icon: <Download className="h-4 w-4" />,
      onClick: () => {
        alert(`导出: 选中 ${selectedIds.length} 项`);
      },
      variant: "default",
    },
  ];

  const handleCardClick = (order: (typeof mockOrders)[0]) => {
    console.log("点击变更单:", order.orderNo);
  };

  const handleStatusClick = (status: string) => {
    if (selectedStatus === status) {
      setSelectedStatus(null);
    } else {
      setSelectedStatus(status);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedStatus(null);
    setFilterProject(null);
    setFilterDesigner(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">设计变更任务分派台</h1>
          <p className="mt-1 text-muted-foreground">
            管理所有设计变更单的状态流转和任务分派
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          新建变更单
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="搜索变更单号、标题、项目名称..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          onClick={() => setShowFilterSidebar(!showFilterSidebar)}
          className={cn(
            "inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors",
            showFilterSidebar
              ? "bg-primary/10 border-primary text-primary"
              : "hover:bg-muted"
          )}
        >
          <Filter className="h-4 w-4" />
          筛选
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              showFilterSidebar && "rotate-180"
            )}
          />
        </button>
        <div className="flex items-center rounded-lg border p-1">
          <button
            onClick={() => setViewMode("kanban")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              viewMode === "kanban"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
            看板视图
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              viewMode === "list"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="h-4 w-4" />
            列表视图
          </button>
        </div>
      </div>

      {showFilterSidebar && (
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">筛选条件</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              清除全部
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                项目
              </label>
              <select
                value={filterProject || ""}
                onChange={(e) =>
                  setFilterProject(e.target.value || null)
                }
                className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">全部项目</option>
                {mockProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                设计师
              </label>
              <select
                value={filterDesigner || ""}
                onChange={(e) =>
                  setFilterDesigner(e.target.value || null)
                }
                className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">全部设计师</option>
                {mockDesigners.map((designer) => (
                  <option key={designer.id} value={designer.id}>
                    {designer.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                时间范围
              </label>
              <select className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">全部时间</option>
                <option value="today">今天</option>
                <option value="week">本周</option>
                <option value="month">本月</option>
                <option value="quarter">本季度</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-7 gap-3">
        {displayStatuses.map((status) => (
          <button
            key={status}
            onClick={() => handleStatusClick(status)}
            className={cn(
              "rounded-lg border p-3 text-left transition-all hover:shadow-md",
              selectedStatus === status
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "bg-card hover:border-primary/50"
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: statusColors[status] }}
              />
              <span className="text-sm font-medium">
                {statusLabels[status]}
              </span>
            </div>
            <p className="text-2xl font-bold">{statusCounts[status]}</p>
          </button>
        ))}
      </div>

      {viewMode === "list" && (
        <BatchOperationBar
          selectedCount={selectedIds.length}
          totalCount={filteredOrders.length}
          onClear={() => setSelectedIds([])}
          actions={batchActions}
        />
      )}

      <div className="rounded-lg border bg-card">
        {viewMode === "kanban" ? (
          <div className="p-4" style={{ height: "calc(100vh - 380px)" }}>
            <KanbanBoard
              columns={kanbanColumns}
              renderCard={(item) => (
                <ChangeOrderCard
                  order={item}
                  hasMaterialDelay={item.hasMaterialDelay}
                  materialDelayCount={item.materialDelayCount}
                />
              )}
              onCardClick={handleCardClick}
            />
          </div>
        ) : (
          <div className="p-4">
            <DataTable
              columns={tableColumns}
              data={filteredOrders}
              rowKey="id"
              selectable={true}
              selectedKeys={selectedIds}
              onSelectionChange={setSelectedIds}
              onRowClick={handleCardClick}
            />
          </div>
        )}

        {viewMode === "kanban" && (
          <div className="flex items-center justify-between border-t p-4">
            <p className="text-sm text-muted-foreground">
              共 {filteredOrders.length} 条变更单
            </p>
            <div className="text-xs text-muted-foreground">
              点击卡片查看详情
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
