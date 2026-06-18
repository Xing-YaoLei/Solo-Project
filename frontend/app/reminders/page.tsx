"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  Clock,
  AlertTriangle,
  FileText,
  MessageSquare,
  CheckCircle,
  XCircle,
  Filter,
  ChevronDown,
  Calendar,
} from "lucide-react";
import { useApp } from "@/lib/context/AppContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  formatDate,
  formatRelativeDate,
} from "@/lib/utils";
import { Reminder } from "@/lib/types";

const typeConfig: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  OVERDUE: {
    label: "逾期提醒",
    icon: Clock,
    color: "text-red-600",
    bg: "bg-red-100",
  },
  MISSING_DOCUMENTS: {
    label: "资料缺失",
    icon: FileText,
    color: "text-orange-600",
    bg: "bg-orange-100",
  },
  PENDING_TASK: {
    label: "待办任务",
    icon: Bell,
    color: "text-yellow-600",
    bg: "bg-yellow-100",
  },
  DISPUTE: {
    label: "争议提醒",
    icon: AlertTriangle,
    color: "text-purple-600",
    bg: "bg-purple-100",
  },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  HIGH: { label: "高", color: "text-red-600" },
  MEDIUM: { label: "中", color: "text-orange-600" },
  LOW: { label: "低", color: "text-gray-500" },
};

export default function RemindersPage() {
  const { reminders, markReminderAsRead, markAllRemindersAsRead } = useApp();
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [readFilter, setReadFilter] = useState<string>("ALL");

  const filteredReminders = reminders.filter((reminder) => {
    const matchesType = typeFilter === "ALL" || reminder.type === typeFilter;
    const matchesRead =
      readFilter === "ALL" ||
      (readFilter === "UNREAD" && !reminder.isRead) ||
      (readFilter === "READ" && reminder.isRead);
    return matchesType && matchesRead;
  });

  const unreadCount = reminders.filter((r) => !r.isRead).length;

  const handleMarkAsRead = (reminder: Reminder) => {
    if (!reminder.isRead) {
      markReminderAsRead(reminder.id);
    }
  };

  const getLink = (reminder: Reminder) => {
    if (reminder.taskId) {
      return `/tasks/${reminder.taskId}`;
    }
    if (reminder.projectId) {
      return `/projects`;
    }
    return "#";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">提醒中心</h1>
          <p className="text-gray-500 mt-1">
            查看所有提醒和通知，共 {reminders.length} 条
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllRemindersAsRead}>
            <CheckCircle className="h-4 w-4 mr-2" />
            全部标记为已读
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {reminders.length}
                </p>
                <p className="text-xs text-gray-500">全部提醒</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <Clock className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {reminders.filter((r) => r.type === "OVERDUE").length}
                </p>
                <p className="text-xs text-gray-500">逾期提醒</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <FileText className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    reminders.filter((r) => r.type === "MISSING_DOCUMENTS")
                      .length
                  }
                </p>
                <p className="text-xs text-gray-500">资料缺失</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
                <p className="text-xs text-gray-500">未读</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>提醒列表</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="ALL">全部类型</option>
                  <option value="OVERDUE">逾期提醒</option>
                  <option value="MISSING_DOCUMENTS">资料缺失</option>
                  <option value="PENDING_TASK">待办任务</option>
                  <option value="DISPUTE">争议提醒</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={readFilter}
                  onChange={(e) => setReadFilter(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="ALL">全部状态</option>
                  <option value="UNREAD">未读</option>
                  <option value="READ">已读</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {filteredReminders.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">暂无匹配的提醒</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredReminders.map((reminder) => {
                const config = typeConfig[reminder.type];
                const priorityInfo = priorityConfig[reminder.priority];
                const Icon = config.icon;

                return (
                  <Link
                    key={reminder.id}
                    href={getLink(reminder)}
                    onClick={() => handleMarkAsRead(reminder)}
                    className={`flex gap-4 p-4 rounded-lg border transition-colors hover:bg-gray-50 ${
                      reminder.isRead
                        ? "bg-white border-gray-200"
                        : "bg-primary-50/50 border-primary-200"
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 p-3 rounded-lg ${config.bg}`}
                    >
                      <Icon className={`h-6 w-6 ${config.color}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3
                              className={`font-medium ${
                                reminder.isRead
                                  ? "text-gray-700"
                                  : "text-gray-900"
                              }`}
                            >
                              {reminder.title}
                            </h3>
                            {!reminder.isRead && (
                              <span className="inline-block w-2 h-2 rounded-full bg-primary-600" />
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {reminder.description}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <span
                            className={`text-xs font-medium ${priorityInfo.color}`}
                          >
                            {priorityInfo.label}优先级
                          </span>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatRelativeDate(reminder.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}
                        >
                          {config.label}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(reminder.createdAt, "yyyy-MM-dd HH:mm")}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
