'use client';

import { useState } from 'react';
import { Clock, TrendingUp, MessageSquare, Settings } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import DeadlineManager from './DeadlineManager';
import UpgradeTimeline from './UpgradeTimeline';
import VisitResultForm from './VisitResultForm';
import SupplementForm from './SupplementForm';
import RejectForm from './RejectForm';
import ReassignForm from './ReassignForm';
import type { Complaint } from '@scenic/shared';

interface OperationPanelProps {
  complaint: Complaint | null;
}

export default function OperationPanel({ complaint }: OperationPanelProps) {
  const [activeAction, setActiveAction] = useState<'supplement' | 'reject' | 'reassign' | null>(null);

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
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-3 text-xs font-medium text-slate-500 border-b-2 border-transparent data-[state=active]:text-primary data-[state=active]:border-primary transition-colors"
          >
            <Clock className="w-4 h-4" />
            时限
          </Tabs.Trigger>
          <Tabs.Trigger
            value="upgrade"
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-3 text-xs font-medium text-slate-500 border-b-2 border-transparent data-[state=active]:text-primary data-[state=active]:border-primary transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            升级
          </Tabs.Trigger>
          <Tabs.Trigger
            value="visit"
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-3 text-xs font-medium text-slate-500 border-b-2 border-transparent data-[state=active]:text-primary data-[state=active]:border-primary transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            回访
          </Tabs.Trigger>
          <Tabs.Trigger
            value="actions"
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-3 text-xs font-medium text-slate-500 border-b-2 border-transparent data-[state=active]:text-primary data-[state=active]:border-primary transition-colors"
          >
            <Settings className="w-4 h-4" />
            操作
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
          <Tabs.Content value="actions" className="p-4">
            <div className="space-y-3">
              {activeAction === 'supplement' ? (
                <div>
                  <button
                    onClick={() => setActiveAction(null)}
                    className="text-xs text-primary mb-3 hover:underline"
                  >
                    ← 返回操作列表
                  </button>
                  <SupplementForm
                    complaint={complaint}
                    onSuccess={() => setActiveAction(null)}
                  />
                </div>
              ) : activeAction === 'reject' ? (
                <div>
                  <button
                    onClick={() => setActiveAction(null)}
                    className="text-xs text-primary mb-3 hover:underline"
                  >
                    ← 返回操作列表
                  </button>
                  <RejectForm
                    complaint={complaint}
                    onSuccess={() => setActiveAction(null)}
                  />
                </div>
              ) : activeAction === 'reassign' ? (
                <div>
                  <button
                    onClick={() => setActiveAction(null)}
                    className="text-xs text-primary mb-3 hover:underline"
                  >
                    ← 返回操作列表
                  </button>
                  <ReassignForm
                    complaint={complaint}
                    onSuccess={() => setActiveAction(null)}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveAction('supplement')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-md bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">补充材料</p>
                      <p className="text-xs text-slate-500">要求处理人补充材料</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveAction('reject')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg border border-slate-200 hover:border-red-300 hover:bg-red-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-md bg-red-100 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">驳回重提</p>
                      <p className="text-xs text-slate-500">驳回工单要求重新提交</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveAction('reassign')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-md bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Settings className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">重新分派</p>
                      <p className="text-xs text-slate-500">转派给其他处理人</p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </Tabs.Content>
        </div>
      </Tabs.Root>
    </aside>
  );
}
