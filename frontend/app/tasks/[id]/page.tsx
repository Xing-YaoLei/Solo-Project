"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  User,
  Building2,
  Tag,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare,
  Image as ImageIcon,
  FileText,
  RefreshCw,
} from "lucide-react";
import { useApp } from "@/lib/context/AppContext";
import { useAuth } from "@/lib/context/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge, TaskTypeBadge, RoleBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { ImageGallery } from "@/components/task/ImageGallery";
import { ChatPanel } from "@/components/task/ChatPanel";
import { QuoteVersionList } from "@/components/task/QuoteVersionList";
import {
  formatDate,
  formatCurrency,
  formatRelativeDate,
} from "@/lib/utils";
import { TaskStatus, UserRole, TaskType } from "@/lib/types";
import { TASK_TYPE_LABELS } from "@/lib/constants";

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getTaskById, updateTaskStatus, addChatMessage } = useApp();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"images" | "quote" | "chat">(
    "images"
  );

  const taskId = params.id as string;
  const task = getTaskById(taskId);

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-gray-500 mb-4">任务不存在</p>
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
      </div>
    );
  }

  const handleSendMessage = (content: string) => {
    addChatMessage(task.id, content);
  };

  const canApprove =
    user?.role === UserRole.OWNER && task.status === TaskStatus.PENDING;
  const canReject =
    user?.role === UserRole.OWNER && task.status === TaskStatus.PENDING;
  const canRaiseDispute =
    (user?.role === UserRole.OWNER ||
      user?.role === UserRole.SUPERVISOR) &&
    (task.status === TaskStatus.PENDING ||
      task.status === TaskStatus.APPROVED);
  const canEdit =
    user?.role === UserRole.FOREMAN ||
    user?.role === UserRole.PROJECT_MANAGER ||
    user?.role === UserRole.DESIGNER;

  const handleApprove = () => {
    updateTaskStatus(task.id, TaskStatus.APPROVED);
  };

  const handleReject = () => {
    updateTaskStatus(task.id, TaskStatus.REJECTED);
  };

  const handleDispute = () => {
    updateTaskStatus(task.id, TaskStatus.DISPUTED);
  };

  const tabs = [
    { id: "images" as const, label: "图片资料", icon: ImageIcon },
    { id: "quote" as const, label: "报价版本", icon: FileText },
    { id: "chat" as const, label: "沟通记录", icon: MessageSquare },
  ];

  const showQuoteTab = task.type === TaskType.ADDITIONAL_QUOTE;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="p-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
            <StatusBadge status={task.status} />
            <TaskTypeBadge type={task.type} />
          </div>
          <p className="text-gray-500 mt-1">
            任务编号：{task.id}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              编辑
            </Button>
          )}
          {canApprove && (
            <Button variant="success" onClick={handleApprove}>
              <CheckCircle className="h-4 w-4 mr-2" />
              确认通过
            </Button>
          )}
          {canReject && (
            <Button variant="danger" onClick={handleReject}>
              <XCircle className="h-4 w-4 mr-2" />
              拒绝
            </Button>
          )}
          {canRaiseDispute && (
            <Button variant="warning" onClick={handleDispute}>
              <AlertTriangle className="h-4 w-4 mr-2" />
              提出争议
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>任务描述</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">
                {task.description}
              </p>

              {task.nodeName && (
                <div className="mt-4 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">节点：</span>
                  <span className="text-sm font-medium text-gray-900">
                    {task.nodeName}
                  </span>
                </div>
              )}

              {task.designChangeReason && (
                <div className="mt-4 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">变更原因：</span>
                  <span className="text-sm text-gray-900">
                    {task.designChangeReason}
                  </span>
                </div>
              )}

              {task.oldMaterial && task.newMaterial && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">原材料：</span>
                    <span className="text-sm text-gray-900">
                      {task.oldMaterial}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">新材料：</span>
                    <span className="text-sm font-medium text-primary-600">
                      {task.newMaterial}
                    </span>
                  </div>
                </div>
              )}

              {task.amount !== undefined && (
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-sm text-gray-600">报价金额：</span>
                  <span className="text-lg font-bold text-primary-600">
                    {formatCurrency(task.amount)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-0">
              <div className="flex items-center gap-4 border-b border-gray-200 -mx-6 px-6">
                {tabs
                  .filter((tab) => tab.id !== "quote" || showQuoteTab)
                  .map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 py-4 border-b-2 -mb-px transition-colors ${
                          isActive
                            ? "border-primary-600 text-primary-600 font-medium"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {tab.label}
                        {tab.id === "chat" && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {task.chatMessages.length}
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {activeTab === "images" && <ImageGallery images={task.images} />}

              {activeTab === "quote" && task.quoteVersions && (
                <QuoteVersionList versions={task.quoteVersions} />
              )}

              {activeTab === "chat" && (
                <ChatPanel
                  messages={task.chatMessages}
                  onSendMessage={handleSendMessage}
                  disabled={!user}
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">所属项目</p>
                  <p className="text-sm font-medium text-gray-900">
                    {task.project.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {task.project.address}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">创建人</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar
                      src={task.createdBy.avatar}
                      fallback={task.createdBy.name}
                      size="sm"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {task.createdBy.name}
                      </p>
                      <RoleBadge role={task.createdBy.role} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">创建时间</p>
                  <p className="text-sm text-gray-900">
                    {formatDate(task.createdAt)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatRelativeDate(task.createdAt)}
                  </p>
                </div>
              </div>

              {task.dueDate && (
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">截止时间</p>
                    <p className="text-sm text-gray-900">
                      {formatDate(task.dueDate)}
                    </p>
                    {task.status === TaskStatus.OVERDUE && (
                      <span className="text-xs text-red-500 font-medium">
                        已逾期
                      </span>
                    )}
                  </div>
                </div>
              )}

              {task.completedAt && (
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">完成时间</p>
                    <p className="text-sm text-gray-900">
                      {formatDate(task.completedAt)}
                    </p>
                  </div>
                </div>
              )}

              {task.reworkCount > 0 && (
                <div className="flex items-start gap-3">
                  <RefreshCw className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">返工次数</p>
                    <p className="text-sm font-medium text-orange-600">
                      {task.reworkCount} 次
                    </p>
                    {task.reworkReason && (
                      <p className="text-xs text-gray-500 mt-1">
                        原因：{task.reworkReason}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">参与人员</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {task.assignees.map((assignee) => (
                  <div
                    key={assignee.id}
                    className="flex items-center gap-3"
                  >
                    <Avatar
                      src={assignee.avatar}
                      fallback={assignee.name}
                      size="sm"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {assignee.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {assignee.email}
                      </p>
                    </div>
                    <RoleBadge role={assignee.role} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
