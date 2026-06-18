"use client";

import { useApp } from "@/lib/context/AppContext";
import { TaskKanban } from "@/components/task/TaskKanban";

export default function TasksPage() {
  const { tasks } = useApp();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">任务列表</h1>
          <p className="text-gray-500 mt-1">查看和管理所有确认任务</p>
        </div>
      </div>

      <TaskKanban tasks={tasks} />
    </div>
  );
}
