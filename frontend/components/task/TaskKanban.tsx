"use client";

import { useState } from "react";
import { Task, TaskStatus, TaskType } from "@/lib/types";
import { KANBAN_COLUMNS, TASK_STATUS_LABELS, TASK_TYPE_LABELS } from "@/lib/constants";
import { TaskCard } from "./TaskCard";
import {
  ChevronDown,
  Filter,
  Search,
  LayoutGrid,
  List,
} from "lucide-react";

interface TaskKanbanProps {
  tasks: Task[];
}

export function TaskKanban({ tasks }: TaskKanbanProps) {
  const [filterType, setFilterType] = useState<TaskType | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  const filteredTasks = tasks.filter((task) => {
    const matchesType =
      filterType === "ALL" || task.type === filterType;
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.project.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getTasksByStatus = (status: TaskStatus) => {
    return filteredTasks.filter((task) => task.status === status);
  };

  const columnColors: Record<string, { bg: string; border: string; text: string }> = {
    yellow: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700" },
    green: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700" },
    red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700" },
    orange: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700" },
    gray: { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-700" },
  };

  if (viewMode === "list") {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-1 gap-3 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索任务..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as TaskType | "ALL")}
                className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="ALL">全部类型</option>
                {Object.entries(TASK_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("kanban")}
              className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className="p-2 rounded-lg bg-primary-50 border border-primary-200 text-primary-600"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  任务
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  类型
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  项目
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  负责人
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">
                      {task.title}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">
                      {TASK_TYPE_LABELS[task.type]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">
                      {task.project.name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        {
                          PENDING: "bg-yellow-100 text-yellow-700",
                          APPROVED: "bg-green-100 text-green-700",
                          REJECTED: "bg-red-100 text-red-700",
                          DISPUTED: "bg-orange-100 text-orange-700",
                          OVERDUE: "bg-gray-100 text-gray-700",
                        }[task.status]
                      }`}
                    >
                      {TASK_STATUS_LABELS[task.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex -space-x-2">
                      {task.assignees.slice(0, 2).map((assignee) => (
                        <img
                          key={assignee.id}
                          src={assignee.avatar}
                          alt={assignee.name}
                          className="h-8 w-8 rounded-full border-2 border-white"
                        />
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-3 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索任务..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as TaskType | "ALL")}
              className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="ALL">全部类型</option>
              {Object.entries(TASK_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("kanban")}
            className="p-2 rounded-lg bg-primary-50 border border-primary-200 text-primary-600"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((column) => {
          const columnTasks = getTasksByStatus(column.status);
          const colors = columnColors[column.color as keyof typeof columnColors];

          return (
            <div
              key={column.status}
              className="flex-shrink-0 w-80"
            >
              <div
                className={`rounded-t-lg px-4 py-3 border-l-4 border-r border-t ${colors.border} ${colors.bg}`}
              >
                <div className="flex items-center justify-between">
                  <h3 className={`font-semibold ${colors.text}`}>
                    {column.label}
                  </h3>
                  <span
                    className={`inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}
                  >
                    {columnTasks.length}
                  </span>
                </div>
              </div>

              <div
                className={`flex-1 rounded-b-lg border-l-4 border-r border-b border-t-0 ${colors.border} ${colors.bg} p-3 min-h-[500px]`}
              >
                <div className="space-y-3">
                  {columnTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                  {columnTasks.length === 0 && (
                    <div className="py-8 text-center text-gray-400 text-sm">
                      暂无任务
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
