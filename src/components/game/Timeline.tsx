import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HistoryEntry, Tenant, ContractDecision, ApprovalOption } from '@/types';

interface TimelineProps {
  entries?: HistoryEntry[];
  tenants?: Tenant[];
  decisions?: (ContractDecision | null)[];
  currentIndex?: number;
  onSelect?: (index: number) => void;
  approvalOptions?: ApprovalOption[];
  correctAnswers?: Record<string, string>;
}

interface TimelineItemProps {
  entry: HistoryEntry;
  index: number;
  isLast: boolean;
}

interface ContractTimelineItemProps {
  tenant: Tenant;
  decision: ContractDecision | null;
  index: number;
  isLast: boolean;
  isCurrent: boolean;
  approvalOptions: ApprovalOption[];
  correctAnswer?: string;
  onClick: () => void;
}

const phaseLabels: Record<string, string> = {
  inspection: '巡检阶段',
  contract: '合同审批',
  meter: '水电核算',
  workOrder: '工单处理',
};

const ContractTimelineItem: React.FC<ContractTimelineItemProps> = ({
  tenant,
  decision,
  index,
  isLast,
  isCurrent,
  approvalOptions,
  correctAnswer,
  onClick,
}) => {
  const option = decision ? approvalOptions.find((o) => o.id === decision.optionId) : null;
  const isCorrect = decision && correctAnswer ? decision.optionId === correctAnswer : null;

  return (
    <div className="relative pl-8 pb-4">
      {!isLast && (
        <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-gray-700" />
      )}
      
      <div
        className="absolute left-0 top-0 cursor-pointer transition-transform hover:scale-110"
        onClick={onClick}
      >
        {decision ? (
          isCorrect ? (
            <div className="w-6 h-6 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
              <CheckCircle className="w-3 h-3 text-green-500" />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center">
              <XCircle className="w-3 h-3 text-red-500" />
            </div>
          )
        ) : isCurrent ? (
          <div className="w-6 h-6 rounded-full bg-accent-500/20 border-2 border-accent-500 flex items-center justify-center animate-pulse">
            <div className="w-2 h-2 rounded-full bg-accent-500" />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-gray-700/50 border-2 border-gray-600 flex items-center justify-center">
            <span className="text-xs text-gray-500">{index + 1}</span>
          </div>
        )}
      </div>

      <div
        className={cn(
          'ml-2 cursor-pointer rounded-lg p-2 -mr-2 transition-all',
          isCurrent && 'bg-primary-500/10 border border-primary-500/30',
          decision && !isCurrent && isCorrect !== null && (
            isCorrect ? 'bg-green-500/5' : 'bg-red-500/5'
          )
        )}
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-500">#{index + 1}</span>
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-white font-medium">{tenant.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {option && (
              <span className={cn(
                'px-2 py-0.5 text-xs rounded',
                option.type === 'approve' && 'bg-green-500/20 text-green-400',
                option.type === 'reject' && 'bg-red-500/20 text-red-400',
                option.type === 'negotiate' && 'bg-yellow-500/20 text-yellow-400',
                option.type === 'escalate' && 'bg-purple-500/20 text-purple-400',
              )}>
                {option.label}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const TimelineItem: React.FC<TimelineItemProps> = ({ entry, index, isLast }) => {
  const [expanded, setExpanded] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const hasDetails = entry.details && Object.keys(entry.details).length > 0;

  return (
    <div className="relative pl-8 pb-6">
      {!isLast && (
        <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-gray-700" />
      )}
      
      <div className="absolute left-0 top-0">
        {entry.correct ? (
          <div className="w-6 h-6 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
            <CheckCircle className="w-3 h-3 text-green-500" />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center">
            <XCircle className="w-3 h-3 text-red-500" />
          </div>
        )}
      </div>

      <div className="ml-2">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => hasDetails && setExpanded(!expanded)}
        >
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-gray-500">
              #{index + 1}
            </span>
            <span className="px-2 py-0.5 text-xs bg-primary-500/20 text-primary-400 rounded">
              {phaseLabels[entry.phase] || entry.phase}
            </span>
            <span className="text-sm text-white">{entry.action}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              {formatTime(entry.time)}
            </div>
            {hasDetails && (
              expanded ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )
            )}
          </div>
        </div>

        {expanded && hasDetails && (
          <div className="mt-2 p-3 bg-gray-900/50 rounded-lg border border-gray-700/50">
            <dl className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(entry.details).map(([key, value]) => (
                <div key={key} className="col-span-1">
                  <dt className="text-gray-400 text-xs capitalize">{key}</dt>
                  <dd className="text-white font-medium">{String(value)}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
};

export const Timeline: React.FC<TimelineProps> = ({
  entries,
  tenants,
  decisions,
  currentIndex = 0,
  onSelect,
  approvalOptions = [],
  correctAnswers = {},
}) => {
  if (tenants && decisions) {
    const correctCount = decisions.filter(
      (d, i) => d && correctAnswers[tenants[i].id] === d.optionId
    ).length;
    const decidedCount = decisions.filter((d) => d !== null).length;
    const accuracy = decidedCount > 0 
      ? Math.round((correctCount / decidedCount) * 100) 
      : 0;

    return (
      <div>
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700/50">
          <div>
            <h3 className="text-lg font-bold text-white">审批进度</h3>
            <p className="text-sm text-gray-400">共 {tenants.length} 份合同</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{accuracy}%</p>
            <p className="text-sm text-gray-400">准确率</p>
          </div>
        </div>

        <div className="space-y-0">
          {tenants.map((tenant, index) => (
            <ContractTimelineItem
              key={tenant.id}
              tenant={tenant}
              decision={decisions[index]}
              index={index}
              isLast={index === tenants.length - 1}
              isCurrent={index === currentIndex}
              approvalOptions={approvalOptions}
              correctAnswer={correctAnswers[tenant.id]}
              onClick={() => onSelect && onSelect(index)}
            />
          ))}
        </div>
      </div>
    );
  }

  const historyEntries = entries || [];

  if (historyEntries.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>暂无决策记录</p>
      </div>
    );
  }

  const correctCount = historyEntries.filter((e) => e.correct).length;
  const accuracy = historyEntries.length > 0 
    ? Math.round((correctCount / historyEntries.length) * 100) 
    : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700/50">
        <div>
          <h3 className="text-lg font-bold text-white">决策时间线</h3>
          <p className="text-sm text-gray-400">共 {historyEntries.length} 项决策</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">{accuracy}%</p>
          <p className="text-sm text-gray-400">准确率</p>
        </div>
      </div>

      <div className="space-y-0">
        {historyEntries.map((entry, index) => (
          <TimelineItem
            key={index}
            entry={entry}
            index={index}
            isLast={index === historyEntries.length - 1}
          />
        ))}
      </div>
    </div>
  );
};

export default Timeline;
