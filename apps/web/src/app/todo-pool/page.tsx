'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as Tabs from '@radix-ui/react-tabs';
import AppLayout from '@/components/layout/AppLayout';
import TodoList from '@/components/todo/TodoList';
import {
  getOverdueTasks,
  getSupplementingTasks,
  getRejectedTasks,
} from '@/lib/api/todo-pool';
import { AlertTriangle, FileQuestion, RotateCcw, ListTodo } from 'lucide-react';

type TabType = 'overdue' | 'supplementing' | 'rejected';

export default function TodoPoolPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overdue');

  const { data: overdueTasks = [], isLoading: overdueLoading } = useQuery({
    queryKey: ['todo-overdue'],
    queryFn: getOverdueTasks,
  });

  const { data: supplementingTasks = [], isLoading: supplementingLoading } = useQuery({
    queryKey: ['todo-supplementing'],
    queryFn: getSupplementingTasks,
  });

  const { data: rejectedTasks = [], isLoading: rejectedLoading } = useQuery({
    queryKey: ['todo-rejected'],
    queryFn: getRejectedTasks,
  });

  const tabConfig = [
    {
      value: 'overdue' as TabType,
      label: '超时任务',
      icon: AlertTriangle,
      count: overdueTasks.length,
      data: overdueTasks,
      loading: overdueLoading,
    },
    {
      value: 'supplementing' as TabType,
      label: '待补材料',
      icon: FileQuestion,
      count: supplementingTasks.length,
      data: supplementingTasks,
      loading: supplementingLoading,
    },
    {
      value: 'rejected' as TabType,
      label: '驳回重提',
      icon: RotateCcw,
      count: rejectedTasks.length,
      data: rejectedTasks,
      loading: rejectedLoading,
    },
  ];

  tabConfig;

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center">
              <ListTodo className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">待办池</h1>
              <p className="text-xs text-slate-500">
                共 {overdueTasks.length + supplementingTasks.length + rejectedTasks.length} 条待办
              </p>
            </div>
          </div>
        </div>

        <Tabs.Root
          defaultValue="overdue"
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as TabType)}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <Tabs.List className="flex bg-white border-b border-slate-200 px-4 gap-1">
            {tabConfig.map((tab) => {
              const Icon = tab.icon;
              return (
                <Tabs.Trigger
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 border-transparent text-slate-500 data-[state=active]:text-primary data-[state=active]:border-primary transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      tab.value === activeTab
                        ? 'bg-primary/10 text-primary'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {tab.count}
                  </span>
                </Tabs.Trigger>
              );
            })}
          </Tabs.List>

          <div className="flex-1 overflow-y-auto p-4">
            {tabConfig.map((tab) => (
              <Tabs.Content
                key={tab.value}
                value={tab.value}
                className="outline-none"
              >
                <TodoList
                  complaints={tab.data}
                  loading={tab.loading}
                  type={tab.value}
                />
              </Tabs.Content>
            ))}
          </div>
        </Tabs.Root>
      </div>
    </AppLayout>
  );
}
