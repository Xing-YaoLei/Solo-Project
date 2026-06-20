'use client';

import { Clock, TrendingUp, MessageSquare } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import DeadlineManager from './DeadlineManager';
import UpgradeTimeline from './UpgradeTimeline';
import VisitResultForm from './VisitResultForm';
import type { Complaint } from '@scenic/shared';

interface OperationPanelProps {
  complaint: Complaint | null;
}

export default function OperationPanel({ complaint }: OperationPanelProps) {
  if (!complaint) {
    return (
      <aside className="w-80 h-full bg-white border-l border-slate-200 flex items-center justify-center">
        <div className="text-center text-slate-400">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">请选择一个工单查看详情</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-80 h-full bg-white border-l border-slate-200 flex flex-col">
      <div className="p-4 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-800 mb-1">
          操作面板
        </h3>
        <p className="text-xs text-slate-400 font-mono">{complaint.code}</p>
      </div>

      <Tabs.Root defaultValue="deadline" className="flex-1 flex flex-col">
        <Tabs.List className="flex border-b border-slate-100 px-2">
          <Tabs.Trigger
            value="deadline"
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium text-slate-500 border-b-2 border-transparent data-[state=active]:text-primary data-[state=active]:border-primary transition-colors"
          >
            <Clock className="w-4 h-4" />
            处理时限
          </Tabs.Trigger>
          <Tabs.Trigger
            value="upgrade"
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium text-slate-500 border-b-2 border-transparent data-[state=active]:text-primary data-[state=active]:border-primary transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            升级记录
          </Tabs.Trigger>
          <Tabs.Trigger
            value="visit"
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium text-slate-500 border-b-2 border-transparent data-[state=active]:text-primary data-[state=active]:border-primary transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            回访结果
          </Tabs.Trigger>
        </Tabs.List>

        <div className="flex-1 overflow-y-auto">
          <Tabs.Content value="deadline" className="p-4">
            <DeadlineManager complaint={complaint} />
          </Tabs.Content>
          <Tabs.Content value="upgrade" className="p-4">
            <UpgradeTimeline records={complaint.upgradeRecords} />
          </Tabs.Content>
          <Tabs.Content value="visit" className="p-4">
            <VisitResultForm complaint={complaint} />
          </Tabs.Content>
        </div>
      </Tabs.Root>
    </aside>
  );
}
