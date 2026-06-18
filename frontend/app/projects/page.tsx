"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  MapPin,
  User,
  DollarSign,
  Calendar,
  Search,
  ChevronDown,
  MoreHorizontal,
} from "lucide-react";
import { useApp } from "@/lib/context/AppContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusLabels: Record<string, { label: string; color: string }> = {
  IN_PROGRESS: { label: "进行中", color: "bg-green-100 text-green-700" },
  COMPLETED: { label: "已完成", color: "bg-blue-100 text-blue-700" },
  PAUSED: { label: "暂停", color: "bg-yellow-100 text-yellow-700" },
};

export default function ProjectsPage() {
  const { projects, tasks } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.ownerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getProjectTaskCount = (projectId: string) => {
    return tasks.filter((t) => t.projectId === projectId).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">项目管理</h1>
          <p className="text-gray-500 mt-1">查看和管理所有家装项目</p>
        </div>
        <Button>
          <Building2 className="h-4 w-4 mr-2" />
          新建项目
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索项目名称、地址、业主..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">全部状态</option>
            <option value="IN_PROGRESS">进行中</option>
            <option value="COMPLETED">已完成</option>
            <option value="PAUSED">暂停</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => {
          const taskCount = getProjectTaskCount(project.id);
          const progress = Math.round(
            (project.currentBudget / project.totalBudget) * 100
          );
          const statusInfo = statusLabels[project.status];

          return (
            <Card key={project.id} className="hover:shadow-card-hover transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}
                  >
                    {statusInfo.label}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate">{project.address}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {project.foreman && (
                      <Avatar
                        src={project.foreman.avatar}
                        fallback={project.foreman.name}
                        size="sm"
                        className="border-2 border-white"
                      />
                    )}
                    {project.designer && (
                      <Avatar
                        src={project.designer.avatar}
                        fallback={project.designer.name}
                        size="sm"
                        className="border-2 border-white"
                      />
                    )}
                    {project.supervisor && (
                      <Avatar
                        src={project.supervisor.avatar}
                        fallback={project.supervisor.name}
                        size="sm"
                        className="border-2 border-white"
                      />
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {taskCount} 个任务
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">工程进度</span>
                    <span className="font-medium text-gray-900">
                      {progress}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-600 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500">总预算</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(project.totalBudget)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">已支出</p>
                    <p className="text-sm font-semibold text-primary-600">
                      {formatCurrency(project.currentBudget)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {project.ownerName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(project.startDate, "yyyy-MM-dd")}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" size="sm">
                    查看详情
                  </Button>
                  <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <MoreHorizontal className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-16">
          <Building2 className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">暂无匹配的项目</p>
        </div>
      )}
    </div>
  );
}
