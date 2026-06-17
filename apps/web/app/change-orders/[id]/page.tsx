'use client';

import { useState } from "react";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Clock,
  User,
  Calendar,
  Package,
  Image as ImageIcon,
  FileText,
  MessageSquare,
  Send,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MoreHorizontal,
  ChevronDown,
  Building2,
  HardHat,
  History,
  Undo2,
} from "lucide-react";
import Link from "next/link";
import { ChangeOrderStatus, MaterialDelayStatus, AcceptanceStatus } from "@/types";

const statusColors: Record<string, string> = {
  [ChangeOrderStatus.DRAFT]: "bg-gray-100 text-gray-700",
  [ChangeOrderStatus.PENDING_REVIEW]: "bg-yellow-100 text-yellow-700",
  [ChangeOrderStatus.DESIGNER_APPROVED]: "bg-blue-100 text-blue-700",
  [ChangeOrderStatus.OWNER_APPROVED]: "bg-green-100 text-green-700",
  [ChangeOrderStatus.IN_PROGRESS]: "bg-purple-100 text-purple-700",
  [ChangeOrderStatus.PENDING_ACCEPTANCE]: "bg-orange-100 text-orange-700",
  [ChangeOrderStatus.ACCEPTED]: "bg-green-100 text-green-700",
  [ChangeOrderStatus.REJECTED]: "bg-red-100 text-red-700",
  [ChangeOrderStatus.CANCELLED]: "bg-gray-100 text-gray-700",
};

const statusLabels: Record<string, string> = {
  [ChangeOrderStatus.DRAFT]: "草稿",
  [ChangeOrderStatus.PENDING_REVIEW]: "待审核",
  [ChangeOrderStatus.DESIGNER_APPROVED]: "设计师已批准",
  [ChangeOrderStatus.OWNER_APPROVED]: "业主已批准",
  [ChangeOrderStatus.IN_PROGRESS]: "进行中",
  [ChangeOrderStatus.PENDING_ACCEPTANCE]: "待验收",
  [ChangeOrderStatus.ACCEPTED]: "已验收",
  [ChangeOrderStatus.REJECTED]: "已拒绝",
  [ChangeOrderStatus.CANCELLED]: "已取消",
};

const materialDelayStatusColors: Record<string, string> = {
  [MaterialDelayStatus.REPORTED]: "bg-yellow-100 text-yellow-700",
  [MaterialDelayStatus.CONFIRMED]: "bg-blue-100 text-blue-700",
  [MaterialDelayStatus.RESCHEDULED]: "bg-purple-100 text-purple-700",
  [MaterialDelayStatus.RESOLVED]: "bg-green-100 text-green-700",
  [MaterialDelayStatus.CLOSED]: "bg-gray-100 text-gray-700",
};

const materialDelayStatusLabels: Record<string, string> = {
  [MaterialDelayStatus.REPORTED]: "已上报",
  [MaterialDelayStatus.CONFIRMED]: "已确认",
  [MaterialDelayStatus.RESCHEDULED]: "已改期",
  [MaterialDelayStatus.RESOLVED]: "已解决",
  [MaterialDelayStatus.CLOSED]: "已关闭",
};

const acceptanceStatusColors: Record<string, string> = {
  [AcceptanceStatus.PENDING]: "bg-yellow-100 text-yellow-700",
  [AcceptanceStatus.PASSED]: "bg-green-100 text-green-700",
  [AcceptanceStatus.FAILED]: "bg-red-100 text-red-700",
  [AcceptanceStatus.RE_INSPECTED]: "bg-blue-100 text-blue-700",
};

const acceptanceStatusLabels: Record<string, string> = {
  [AcceptanceStatus.PENDING]: "待审核",
  [AcceptanceStatus.PASSED]: "已通过",
  [AcceptanceStatus.FAILED]: "未通过",
  [AcceptanceStatus.RE_INSPECTED]: "复检中",
};

const mockOrder = {
  id: "1",
  orderNo: "CO-2024-001",
  title: "客厅吊顶设计变更",
  project: "阳光花园 3 栋 201",
  status: ChangeOrderStatus.IN_PROGRESS,
  designer: "张设计师",
  foreman: "李工长",
  submittedBy: "李工长",
  description:
    "根据业主要求，对客厅吊顶设计进行调整。原设计为平面吊顶，现改为二级吊顶，并增加灯带设计。",
  reason: "业主希望提升客厅层次感和灯光效果",
  originalDesign: "平面石膏板吊顶，无灯带",
  newDesign: "二级吊顶，四周暗藏灯带，中央预留吊灯位",
  impactOnSchedule: 3,
  impactOnCost: 5800,
  deadline: "2024-01-20",
  createdAt: "2024-01-10 10:00",
  approvedAt: "2024-01-12 11:00",
};

const statusHistory = [
  { status: ChangeOrderStatus.DRAFT, time: "2024-01-10 10:00", operator: "李工长", remark: "创建变更单" },
  { status: ChangeOrderStatus.PENDING_REVIEW, time: "2024-01-10 14:30", operator: "李工长", remark: "提交审核" },
  { status: ChangeOrderStatus.DESIGNER_APPROVED, time: "2024-01-11 09:15", operator: "张设计师", remark: "设计方案确认无误" },
  { status: ChangeOrderStatus.OWNER_APPROVED, time: "2024-01-12 11:00", operator: "王业主", remark: "同意变更，费用确认" },
  { status: ChangeOrderStatus.IN_PROGRESS, time: "2024-01-13 08:00", operator: "李工长", remark: "开始施工" },
];

const materialDelays = [
  {
    id: "1",
    materialName: "石膏板",
    specification: "9.5mm 标准纸面石膏板",
    quantity: 50,
    originalDate: "2024-01-14",
    estimatedDate: "2024-01-17",
    delayDays: 3,
    status: MaterialDelayStatus.CONFIRMED,
    reason: "厂家库存不足，需从外地调货",
    reportedBy: "李工长",
  },
  {
    id: "2",
    materialName: "灯带",
    specification: "LED 暖白光 5050",
    quantity: 30,
    originalDate: "2024-01-15",
    estimatedDate: "2024-01-18",
    delayDays: 3,
    status: MaterialDelayStatus.REPORTED,
    reason: "物流延误",
    reportedBy: "李工长",
  },
  {
    id: "3",
    materialName: "龙骨",
    specification: "轻钢龙骨 50 系列",
    quantity: 100,
    originalDate: "2024-01-12",
    estimatedDate: null,
    actualDate: "2024-01-12",
    delayDays: 0,
    status: MaterialDelayStatus.RESOLVED,
    reason: "临时缺货，已调配其他型号",
    reportedBy: "李工长",
  },
];

const acceptancePhotos = [
  {
    id: "1",
    photoUrl: "https://picsum.photos/400/300?random=1",
    phase: "基层处理",
    uploader: "李工长",
    uploadTime: "2024-01-14 10:30",
    status: AcceptanceStatus.PASSED,
    description: "吊顶基层龙骨安装完成",
    reviewRemark: "龙骨间距符合规范，安装牢固",
    reviewer: "张设计师",
    reviewTime: "2024-01-14 15:00",
  },
  {
    id: "2",
    photoUrl: "https://picsum.photos/400/300?random=2",
    phase: "封板施工",
    uploader: "李工长",
    uploadTime: "2024-01-15 14:00",
    status: AcceptanceStatus.PENDING,
    description: "石膏板封板完成",
    reviewRemark: "",
    reviewer: "",
    reviewTime: "",
  },
  {
    id: "3",
    photoUrl: "https://picsum.photos/400/300?random=3",
    phase: "灯带安装",
    uploader: "李工长",
    uploadTime: "2024-01-13 09:00",
    status: AcceptanceStatus.FAILED,
    description: "灯带预埋位置",
    reviewRemark: "灯带位置偏移，需调整后重新验收",
    reviewer: "张设计师",
    reviewTime: "2024-01-13 14:00",
  },
  {
    id: "4",
    photoUrl: "https://picsum.photos/400/300?random=4",
    phase: "灯带安装（复检）",
    uploader: "李工长",
    uploadTime: "2024-01-14 11:00",
    status: AcceptanceStatus.RE_INSPECTED,
    description: "调整后的灯带位置",
    reviewRemark: "",
    reviewer: "",
    reviewTime: "",
  },
];

const operationLogs = [
  {
    id: "1",
    type: "创建",
    operator: "李工长",
    time: "2024-01-10 10:00",
    description: "创建设计变更单",
    originalContent: null,
    newContent: '{"title": "客厅吊顶设计变更", "status": "DRAFT"}',
  },
  {
    id: "2",
    type: "编辑",
    operator: "李工长",
    time: "2024-01-10 12:30",
    description: "更新变更描述和原设计方案",
    originalContent: '{"description": "", "originalDesign": ""}',
    newContent: '{"description": "根据业主要求...", "originalDesign": "平面石膏板吊顶"}',
  },
  {
    id: "3",
    type: "提交审核",
    operator: "李工长",
    time: "2024-01-10 14:30",
    description: "提交变更单等待审核",
    originalContent: '{"status": "DRAFT"}',
    newContent: '{"status": "PENDING_REVIEW"}',
  },
  {
    id: "4",
    type: "审核通过",
    operator: "张设计师",
    time: "2024-01-11 09:15",
    description: "设计师审核通过",
    originalContent: '{"status": "PENDING_REVIEW"}',
    newContent: '{"status": "DESIGNER_APPROVED"}',
    remark: "设计方案确认无误",
  },
  {
    id: "5",
    type: "确认",
    operator: "王业主",
    time: "2024-01-12 11:00",
    description: "业主确认同意变更",
    originalContent: '{"status": "DESIGNER_APPROVED"}',
    newContent: '{"status": "OWNER_APPROVED"}',
    remark: "同意变更，费用确认",
  },
  {
    id: "6",
    type: "开始施工",
    operator: "李工长",
    time: "2024-01-13 08:00",
    description: "变更项目开始施工",
    originalContent: '{"status": "OWNER_APPROVED"}',
    newContent: '{"status": "IN_PROGRESS"}',
  },
  {
    id: "7",
    type: "上传照片",
    operator: "李工长",
    time: "2024-01-14 10:30",
    description: "上传基层处理验收照片",
    originalContent: null,
    newContent: '{"photoId": "1", "phase": "基层处理"}',
  },
  {
    id: "8",
    type: "审核照片",
    operator: "张设计师",
    time: "2024-01-14 15:00",
    description: "基层处理照片审核通过",
    originalContent: '{"photoStatus": "PENDING"}',
    newContent: '{"photoStatus": "PASSED"}',
    remark: "龙骨间距符合规范，安装牢固",
  },
];

const comments = [
  {
    id: "1",
    author: "张设计师",
    role: "设计师",
    time: "2024-01-10 16:00",
    content: "这个变更方案合理，建议增加灯带变压器的预留位置。",
    isOffline: false,
    isRecalled: false,
  },
  {
    id: "2",
    author: "李工长",
    role: "工长",
    time: "2024-01-11 08:30",
    content: "收到，施工时会注意预留变压器位置。另外想问一下，灯带的色温是否有指定？",
    isOffline: false,
    isRecalled: false,
  },
  {
    id: "3",
    author: "张设计师",
    role: "设计师",
    time: "2024-01-11 09:00",
    content: "灯带使用 3000K 暖白光，和客厅主灯色温一致。",
    isOffline: false,
    isRecalled: false,
  },
  {
    id: "4",
    author: "王业主",
    role: "业主",
    time: "2024-01-11 10:00",
    content: "同意方案，费用方面请帮忙控制在预算内。",
    isOffline: false,
    isRecalled: false,
  },
  {
    id: "5",
    author: "李工长",
    role: "工长",
    time: "2024-01-12 14:00",
    content: "【线下补充说明】业主现场确认吊顶高度为 2.75 米，比原设计降低 5cm。",
    isOffline: true,
    isRecalled: false,
  },
];

type TabKey = "details" | "materials" | "photos" | "logs" | "comments";

const tabs = [
  { key: "details" as TabKey, label: "详情信息", icon: FileText },
  { key: "materials" as TabKey, label: "材料延期", icon: Package },
  { key: "photos" as TabKey, label: "验收照片", icon: ImageIcon },
  { key: "logs" as TabKey, label: "操作日志", icon: History },
  { key: "comments" as TabKey, label: "补充说明", icon: MessageSquare },
];

export default function ChangeOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("details");
  const [commentText, setCommentText] = useState("");
  const [isOfflineComment, setIsOfflineComment] = useState(false);

  const unresolvedDelays = materialDelays.filter(
    (d) => d.status !== MaterialDelayStatus.RESOLVED && d.status !== MaterialDelayStatus.CLOSED
  ).length;

  const pendingPhotos = acceptancePhotos.filter(
    (p) => p.status === AcceptanceStatus.PENDING || p.status === AcceptanceStatus.RE_INSPECTED
  ).length;

  const renderActions = () => {
    const actions: { label: string; variant: "primary" | "secondary" | "danger" }[] = [];

    switch (mockOrder.status) {
      case ChangeOrderStatus.DRAFT:
        actions.push({ label: "提交审核", variant: "primary" });
        actions.push({ label: "编辑", variant: "secondary" });
        actions.push({ label: "删除", variant: "danger" });
        break;
      case ChangeOrderStatus.PENDING_REVIEW:
        actions.push({ label: "审核通过", variant: "primary" });
        actions.push({ label: "驳回", variant: "danger" });
        actions.push({ label: "撤回", variant: "secondary" });
        break;
      case ChangeOrderStatus.DESIGNER_APPROVED:
        actions.push({ label: "业主确认", variant: "primary" });
        actions.push({ label: "编辑", variant: "secondary" });
        break;
      case ChangeOrderStatus.OWNER_APPROVED:
        actions.push({ label: "开始施工", variant: "primary" });
        actions.push({ label: "编辑", variant: "secondary" });
        break;
      case ChangeOrderStatus.IN_PROGRESS:
        actions.push({ label: "提交验收", variant: "primary" });
        actions.push({ label: "上传照片", variant: "secondary" });
        break;
      case ChangeOrderStatus.PENDING_ACCEPTANCE:
        actions.push({ label: "验收通过", variant: "primary" });
        actions.push({ label: "验收不通过", variant: "danger" });
        break;
      default:
        actions.push({ label: "编辑", variant: "secondary" });
    }

    return actions;
  };

  const actions = renderActions();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/change-orders"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            返回列表
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{mockOrder.title}</h1>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  statusColors[mockOrder.status]
                }`}
              >
                {statusLabels[mockOrder.status]}
              </span>
            </div>
            <p className="text-muted-foreground mt-1">
              {mockOrder.orderNo} · {mockOrder.project}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {actions.map((action, index) => (
            <button
              key={action.label}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                action.variant === "primary"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : action.variant === "danger"
                  ? "border text-red-600 hover:bg-red-50"
                  : "border hover:bg-muted"
              }`}
            >
              {action.label}
            </button>
          ))}
          <button className="inline-flex items-center justify-center rounded-lg border p-2 hover:bg-muted transition-colors">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-lg border bg-card">
            <div className="flex border-b overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                let badge = 0;
                if (tab.key === "materials") badge = unresolvedDelays;
                if (tab.key === "photos") badge = pendingPhotos;

                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      isActive
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    {badge > 0 && (
                      <span
                        className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-medium ${
                          isActive
                            ? "bg-primary/20 text-primary"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-6">
              {activeTab === "details" && (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground">
                        变更原因
                      </h3>
                      <p className="text-sm">{mockOrder.reason}</p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground">
                        变更描述
                      </h3>
                      <p className="text-sm">{mockOrder.description}</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-2 w-2 rounded-full bg-gray-400" />
                        <h3 className="text-sm font-medium">原设计方案</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {mockOrder.originalDesign}
                      </p>
                    </div>
                    <div className="rounded-lg border p-4 border-primary/30 bg-primary/5">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <h3 className="text-sm font-medium text-primary">新设计方案</h3>
                      </div>
                      <p className="text-sm">{mockOrder.newDesign}</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg bg-muted/50 p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">工期影响</span>
                      </div>
                      <p className="text-2xl font-bold">
                        +{mockOrder.impactOnSchedule} 天
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <span className="text-sm">费用影响</span>
                      </div>
                      <p className="text-2xl font-bold">
                        +¥{mockOrder.impactOnCost.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border">
                    <div className="p-4 border-b">
                      <h3 className="font-semibold">状态流转</h3>
                    </div>
                    <div className="p-4">
                      <div className="space-y-4">
                        {statusHistory.map((item, index) => (
                          <div key={index} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div
                                className={`h-3 w-3 rounded-full ${
                                  index === statusHistory.length - 1
                                    ? "bg-primary"
                                    : "bg-gray-300"
                                }`}
                              />
                              {index < statusHistory.length - 1 && (
                                <div className="w-px flex-1 bg-border" />
                              )}
                            </div>
                            <div className="pb-4 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                    statusColors[item.status]
                                  }`}
                                >
                                  {statusLabels[item.status]}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {item.time}
                                </span>
                              </div>
                              <p className="text-sm mt-1">
                                操作人：
                                <span className="font-medium">{item.operator}</span>
                              </p>
                              {item.remark && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {item.remark}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "materials" && (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border bg-card p-4">
                      <p className="text-sm text-muted-foreground">关联材料</p>
                      <p className="text-2xl font-bold mt-1">
                        {materialDelays.length}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-card p-4">
                      <p className="text-sm text-muted-foreground">未解决</p>
                      <p className="text-2xl font-bold mt-1 text-red-600">
                        {unresolvedDelays}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-card p-4">
                      <p className="text-sm text-muted-foreground">已解决</p>
                      <p className="text-2xl font-bold mt-1 text-green-600">
                        {materialDelays.length - unresolvedDelays}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {materialDelays.map((delay) => {
                      const isUnresolved =
                        delay.status !== MaterialDelayStatus.RESOLVED &&
                        delay.status !== MaterialDelayStatus.CLOSED;

                      return (
                        <div
                          key={delay.id}
                          className={`rounded-lg border p-4 transition-colors ${
                            isUnresolved
                              ? "border-red-200 bg-red-50/50"
                              : "bg-card"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <h4 className="font-medium">
                                  {delay.materialName}
                                </h4>
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                    materialDelayStatusColors[delay.status]
                                  }`}
                                >
                                  {materialDelayStatusLabels[delay.status]}
                                </span>
                                {isUnresolved && (
                                  <span className="inline-flex items-center gap-1 text-xs text-red-600">
                                    <AlertTriangle className="h-3 w-3" />
                                    待处理
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {delay.specification}
                              </p>
                              <div className="flex items-center gap-4 mt-3 text-sm">
                                <div>
                                  <span className="text-muted-foreground">
                                    原定日期：
                                  </span>
                                  <span>{delay.originalDate}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    预计到货：
                                  </span>
                                  <span>{delay.estimatedDate || "-"}</span>
                                </div>
                                {delay.delayDays !== null &&
                                  delay.delayDays > 0 && (
                                    <div className="text-red-600 font-medium">
                                      延期 {delay.delayDays} 天
                                    </div>
                                  )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-2">
                                原因：{delay.reason}
                              </p>
                            </div>
                            <div className="text-right text-sm text-muted-foreground">
                              <p>上报人：{delay.reportedBy}</p>
                              <p className="mt-1">数量：{delay.quantity} 件</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === "photos" && (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-4">
                    {Object.entries(acceptanceStatusLabels).map(
                      ([value, label]) => (
                        <div
                          key={value}
                          className="rounded-lg border bg-card p-4"
                        >
                          <p className="text-sm text-muted-foreground">{label}</p>
                          <p className="text-2xl font-bold mt-1">
                            {
                              acceptancePhotos.filter(
                                (p) => p.status === value
                              ).length
                            }
                          </p>
                        </div>
                      )
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {acceptancePhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className="group rounded-lg border overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div className="aspect-[4/3] relative bg-muted">
                          <img
                            src={photo.photoUrl}
                            alt={photo.description}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                acceptanceStatusColors[photo.status]
                              }`}
                            >
                              {acceptanceStatusLabels[photo.status]}
                            </span>
                          </div>
                          <div className="absolute top-2 left-2">
                            <span className="inline-flex items-center rounded-full bg-black/50 px-2 py-0.5 text-xs font-medium text-white">
                              {photo.phase}
                            </span>
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="font-medium text-sm line-clamp-1">
                            {photo.description}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              {photo.uploader}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {photo.uploadTime}
                            </span>
                          </div>
                          {photo.reviewRemark && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-xs text-muted-foreground mb-1">
                                审核备注：
                              </p>
                              <p className="text-sm">{photo.reviewRemark}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                — {photo.reviewer} {photo.reviewTime}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "logs" && (
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                    <div className="space-y-4">
                      {operationLogs.map((log, index) => (
                        <div key={log.id} className="flex gap-4 relative">
                          <div className="z-10 flex items-center justify-center h-8 w-8 rounded-full border bg-card">
                            {log.type.includes("创建") ||
                            log.type.includes("开始") ? (
                              <FileText className="h-4 w-4 text-blue-500" />
                            ) : log.type.includes("审核") ||
                              log.type.includes("通过") ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : log.type.includes("驳回") ||
                              log.type.includes("不通过") ? (
                              <XCircle className="h-4 w-4 text-red-500" />
                            ) : log.type.includes("编辑") ||
                              log.type.includes("更新") ? (
                              <Edit className="h-4 w-4 text-yellow-500" />
                            ) : (
                              <History className="h-4 w-4 text-gray-500" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">
                                {log.type}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {log.time}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              操作人：{log.operator}
                            </p>
                            <p className="text-sm mt-2">{log.description}</p>
                            {log.remark && (
                              <div className="mt-2 rounded-lg bg-muted/50 p-3">
                                <p className="text-sm">
                                  <span className="text-muted-foreground">
                                    备注：
                                  </span>
                                  {log.remark}
                                </p>
                              </div>
                            )}
                            {(log.originalContent || log.newContent) && (
                              <div className="mt-2 grid gap-2 md:grid-cols-2">
                                {log.originalContent && (
                                  <div className="rounded-lg border p-3">
                                    <p className="text-xs text-muted-foreground mb-1">
                                      变更前
                                    </p>
                                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-all">
                                      {log.originalContent}
                                    </pre>
                                  </div>
                                )}
                                {log.newContent && (
                                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                                    <p className="text-xs text-muted-foreground mb-1">
                                      变更后
                                    </p>
                                    <pre className="text-xs whitespace-pre-wrap break-all">
                                      {log.newContent}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "comments" && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className={`rounded-lg border p-4 ${
                          comment.isRecalled
                            ? "opacity-60"
                            : comment.isOffline
                            ? "border-orange-200 bg-orange-50/50"
                            : ""
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">
                                  {comment.author}
                                </span>
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                  {comment.role}
                                </span>
                                {comment.isOffline && (
                                  <span className="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                                    线下补充
                                  </span>
                                )}
                                {comment.isRecalled && (
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                    已收回
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {comment.time}
                              </p>
                            </div>
                          </div>
                          {!comment.isRecalled && (
                            <button className="text-xs text-muted-foreground hover:text-red-500 flex items-center gap-1 transition-colors">
                              <Undo2 className="h-3 w-3" />
                              收回
                            </button>
                          )}
                        </div>
                        <div className="mt-3 pl-12">
                          <p
                            className={`text-sm ${
                              comment.isRecalled
                                ? "text-muted-foreground line-through"
                                : ""
                            }`}
                          >
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-sm">发表补充说明</h4>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isOfflineComment}
                          onChange={(e) =>
                            setIsOfflineComment(e.target.checked)
                          }
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-muted-foreground">
                          标记为线下补充说明
                        </span>
                      </label>
                    </div>
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="请输入补充说明内容..."
                      className="w-full min-h-[100px] rounded-lg border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-xs text-muted-foreground">
                        {isOfflineComment
                          ? "线下补充说明将被标记，用于记录线下沟通内容"
                          : "所有相关人员都能看到此补充说明"}
                      </p>
                      <button
                        disabled={!commentText.trim()}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="h-4 w-4" />
                        发表
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border bg-card">
            <div className="p-4 border-b">
              <h2 className="font-semibold">基本信息</h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-start gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">所属项目</p>
                  <p className="text-sm font-medium">{mockOrder.project}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">设计师</p>
                  <p className="text-sm font-medium">{mockOrder.designer}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <HardHat className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">工长</p>
                  <p className="text-sm font-medium">{mockOrder.foreman}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">创建时间</p>
                  <p className="text-sm font-medium">{mockOrder.createdAt}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">截止日期</p>
                  <p className="text-sm font-medium">{mockOrder.deadline}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card">
            <div className="p-4 border-b">
              <h2 className="font-semibold">快速统计</h2>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">关联材料延期</span>
                <span
                  className={`text-sm font-medium ${
                    unresolvedDelays > 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {materialDelays.length} 项（{unresolvedDelays} 项待处理）
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">验收照片</span>
                <span
                  className={`text-sm font-medium ${
                    pendingPhotos > 0 ? "text-yellow-600" : "text-green-600"
                  }`}
                >
                  {acceptancePhotos.length} 张（{pendingPhotos} 张待审核）
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">操作记录</span>
                <span className="text-sm font-medium">
                  {operationLogs.length} 条
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">补充说明</span>
                <span className="text-sm font-medium">
                  {comments.length} 条
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card">
            <div className="p-4 border-b">
              <h2 className="font-semibold">快捷操作</h2>
            </div>
            <div className="p-2 space-y-1">
              <button className="w-full text-left rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2">
                <Edit className="h-4 w-4 text-muted-foreground" />
                编辑变更单
              </button>
              <button className="w-full text-left rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                关联材料延期
              </button>
              <button className="w-full text-left rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                上传验收照片
              </button>
              <button className="w-full text-left rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                导出变更单
              </button>
              <button className="w-full text-left rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2 text-red-600">
                <Trash2 className="h-4 w-4" />
                删除变更单
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
