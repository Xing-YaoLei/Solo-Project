'use client';

import React, { useState } from 'react';
import type { ComplaintEvidence } from '@/types';
import { formatDateTime, getSeverityColor, getStatusColor } from '@/lib/utils';
import {
  ChevronDown,
  ChevronUp,
  MessageSquare,
  User,
  Bot,
  AlertTriangle,
  CheckCircle,
  Clock,
  Link2,
  FileText,
  KeyRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComplaintTimelineProps {
  complaints: ComplaintEvidence[];
  height?: number;
}

export function ComplaintTimeline({ complaints, height = 400 }: ComplaintTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getSenderIcon = (sender: string) => {
    switch (sender) {
      case 'guest':
        return <User className="w-3 h-3" />;
      case 'staff':
        return <Bot className="w-3 h-3" />;
      default:
        return <MessageSquare className="w-3 h-3" />;
    }
  };

  const getSenderLabel = (sender: string) => {
    switch (sender) {
      case 'guest':
        return '客人';
      case 'staff':
        return '客服';
      default:
        return '系统';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-risk-high" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-risk-medium" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-risk-low" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-risk-low" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-risk-medium" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-risk-high" />;
    }
  };

  return (
    <div className="space-y-3 overflow-auto" style={{ maxHeight: height }}>
      {complaints.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>暂无客诉记录</p>
        </div>
      ) : (
        complaints.map((complaint, index) => (
          <div
            key={complaint.id}
            className={cn(
              "glass-card overflow-hidden transition-all duration-300",
              complaint.severity === 'high' && "border-risk-high/30"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <button
              onClick={() => setExpandedId(expandedId === complaint.id ? null : complaint.id)}
              className="w-full p-4 text-left hover:bg-slate-800/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                    complaint.severity === 'high' ? "bg-risk-high/20" :
                    complaint.severity === 'medium' ? "bg-risk-medium/20" : "bg-risk-low/20"
                  )}>
                    {getSeverityIcon(complaint.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-medium text-white truncate">
                        {complaint.complaintType}
                      </span>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium border",
                        getSeverityColor(complaint.severity)
                      )}>
                        {complaint.severity === 'high' ? '高' : complaint.severity === 'medium' ? '中' : '低'}
                      </span>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium",
                        getStatusColor(complaint.status)
                      )}>
                        {getStatusIcon(complaint.status)}
                        <span className="ml-1">
                          {complaint.status === 'open' ? '待处理' : complaint.status === 'processing' ? '处理中' : '已解决'}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span className="truncate">
                        <User className="w-3 h-3 inline mr-1" />
                        {complaint.guestName}
                      </span>
                      <span className="truncate">
                        <KeyRound className="w-3 h-3 inline mr-1" />
                        {complaint.orderId}
                      </span>
                      <span className="flex-shrink-0">{formatDateTime(complaint.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm text-slate-400">
                    {complaint.messages.length} 条消息
                  </span>
                  {expandedId === complaint.id ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </div>
            </button>

            {expandedId === complaint.id && (
              <div className="px-4 pb-4 border-t border-slate-700/50 animate-fade-in">
                <div className="py-4">
                  <div className="relative pl-6">
                    <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-slate-700" />
                    {complaint.messages.map((msg, msgIndex) => (
                      <div key={msg.id} className="relative mb-4 last:mb-0">
                        <div className={cn(
                          "absolute -left-1 w-3 h-3 rounded-full border-2",
                          msg.sender === 'guest' ? "bg-blue-600 border-blue-400" :
                          msg.sender === 'staff' ? "bg-green-600 border-green-400" :
                          "bg-slate-600 border-slate-400"
                        )} />
                        <div className="ml-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
                              msg.sender === 'guest' ? "bg-blue-600/20 text-blue-400" :
                              msg.sender === 'staff' ? "bg-green-600/20 text-green-400" :
                              "bg-slate-600/20 text-slate-400"
                            )}>
                              {getSenderIcon(msg.sender)}
                              {getSenderLabel(msg.sender)}
                            </span>
                            <span className="text-xs text-slate-500">
                              {formatDateTime(msg.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-slate-300 bg-slate-800/50 rounded-lg px-3 py-2">
                            {msg.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-3 border-t border-slate-700/50">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Link2 className="w-4 h-4" />
                    <span>关联记录:</span>
                    <span className="text-blue-400">
                      门锁记录 {complaint.relatedRecords.doorLockRecords.length} 条
                    </span>
                    <span className="text-slate-600">|</span>
                    <span className="text-orange-400">
                      保洁记录 {complaint.relatedRecords.cleaningRecords.length} 条
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
