'use client';

import * as Tabs from '@radix-ui/react-tabs';
import dayjs from 'dayjs';
import {
  FileText,
  User,
  MapPin,
  Ticket,
  Clock,
  History,
  Paperclip,
  MessageSquare,
  UserCheck,
} from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';
import PriorityBadge from '@/components/common/PriorityBadge';
import CountdownTimer from '@/components/common/CountdownTimer';
import Timeline, { type TimelineItem } from './Timeline';
import AttachmentList from './AttachmentList';
import type { Complaint, OperationLog } from '@scenic/shared';
import { SOURCE_LABELS } from '@scenic/shared';
import { formatPhone } from '@/lib/utils';

interface ComplaintDetailProps {
  complaint: Complaint;
}

export default function ComplaintDetail({ complaint }: ComplaintDetailProps) {

  const timelineItems: TimelineItem[] = complaint.operationLogs.map((log: OperationLog) => ({
    id: log.id,
    title: log.action,
    description: log.detail,
    time: log.createdAt,
  }));

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-slate-100 bg-white">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-slate-400">
                  {complaint.code}
                </span>
                <StatusBadge status={complaint.status} />
                <PriorityBadge priority={complaint.priority} />
              </div>
              <h2 className="text-base font-semibold text-slate-800">
                {complaint.title}
              </h2>
            </div>
          </div>
          <CountdownTimer deadline={complaint.deadlineAt} />
        </div>
        <p className="text-sm text-slate-600">{complaint.content}</p>
      </div>

      <Tabs.Root defaultValue="info" className="flex-1 flex flex-col overflow-hidden">
        <Tabs.List className="flex border-b border-slate-100 bg-white px-4">
          <Tabs.Trigger
            value="info"
            className="px-4 py-3 text-sm font-medium text-slate-500 border-b-2 border-transparent data-[state=active]:text-primary data-[state=active]:border-primary transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" />
            基本信息
          </Tabs.Trigger>
          <Tabs.Trigger
            value="timeline"
            className="px-4 py-3 text-sm font-medium text-slate-500 border-b-2 border-transparent data-[state=active]:text-primary data-[state=active]:border-primary transition-colors flex items-center gap-1.5"
          >
            <History className="w-4 h-4" />
            操作记录
          </Tabs.Trigger>
          <Tabs.Trigger
            value="attachments"
            className="px-4 py-3 text-sm font-medium text-slate-500 border-b-2 border-transparent data-[state=active]:text-primary data-[state=active]:border-primary transition-colors flex items-center gap-1.5"
          >
            <Paperclip className="w-4 h-4" />
            附件 ({complaint.attachments.length})
          </Tabs.Trigger>
        </Tabs.List>

        <div className="flex-1 overflow-y-auto bg-slate-50">
          <Tabs.Content value="info" className="p-4 outline-none">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-white">
                <h4 className="text-xs font-medium text-slate-500 uppercase mb-3 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  游客信息
                </h4>
                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">姓名</span>
                    <span className="font-medium text-slate-700">
                      {complaint.visitorName}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">手机号</span>
                    <span className="font-medium text-slate-700">
                      {formatPhone(complaint.visitorPhone)}
                    </span>
                  </div>
                  {complaint.visitorIdCard && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">身份证</span>
                      <span className="font-medium text-slate-700">
                        {complaint.visitorIdCard}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-white">
                <h4 className="text-xs font-medium text-slate-500 uppercase mb-3 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  投诉信息
                </h4>
                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">来源</span>
                    <span className="font-medium text-slate-700">
                      {SOURCE_LABELS[complaint.source]}
                    </span>
                  </div>
                  {complaint.location && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">发生地点</span>
                      <span className="font-medium text-slate-700">
                        {complaint.location}
                      </span>
                    </div>
                  )}
                  {complaint.ticketNo && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Ticket className="w-3 h-3" />
                        票号
                      </span>
                      <span className="font-medium text-slate-700 font-mono">
                        {complaint.ticketNo}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-white">
                <h4 className="text-xs font-medium text-slate-500 uppercase mb-3 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  责任归属
                </h4>
                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">责任部门</span>
                    <span className="font-medium text-slate-700">
                      {complaint.department?.name || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">负责人</span>
                    <span className="font-medium text-slate-700">
                      {complaint.owner?.name || '-'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-white">
                <h4 className="text-xs font-medium text-slate-500 uppercase mb-3 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  时间信息
                </h4>
                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">创建时间</span>
                    <span className="font-medium text-slate-700">
                      {dayjs(complaint.createdAt).format('YYYY-MM-DD HH:mm')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">处理时限</span>
                    <span className="font-medium text-slate-700">
                      {dayjs(complaint.deadlineAt).format('YYYY-MM-DD HH:mm')}
                    </span>
                  </div>
                  {complaint.closedAt && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">关闭时间</span>
                      <span className="font-medium text-slate-700">
                        {dayjs(complaint.closedAt).format('YYYY-MM-DD HH:mm')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {complaint.tags.length > 0 && (
              <div className="mt-4 p-4 rounded-lg bg-white">
                <h4 className="text-xs font-medium text-slate-500 uppercase mb-3 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  问题标签
                </h4>
                <div className="flex flex-wrap gap-2">
                  {complaint.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center px-2.5 py-1 rounded text-xs"
                      style={{
                        backgroundColor: `${tag.color}15`,
                        color: tag.color,
                        border: `1px solid ${tag.color}30`,
                      }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Tabs.Content>

          <Tabs.Content value="timeline" className="p-4 outline-none">
            <div className="p-4 rounded-lg bg-white">
              <Timeline items={timelineItems} />
            </div>
          </Tabs.Content>

          <Tabs.Content value="attachments" className="p-4 outline-none">
            <div className="p-4 rounded-lg bg-white">
              <AttachmentList attachments={complaint.attachments} />
            </div>
          </Tabs.Content>
        </div>
      </Tabs.Root>
    </div>
  );
}
