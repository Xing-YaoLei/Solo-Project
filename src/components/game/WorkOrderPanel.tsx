import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, MessageSquare, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { urgencyColors, urgencyLabels, workOrderTypeLabels } from '@/data/mockData';
import { useNumberKeys } from '@/hooks/useKeyboard';
import type { WorkOrder, WorkOrderOption } from '@/types';

interface WorkOrderPanelProps {
  order: WorkOrder;
  options?: WorkOrderOption[];
  timeout?: number;
  isRetrying?: boolean;
  onSelect: (optionId: string) => void;
  onRetry?: () => void;
  onResolve?: (optionId: string) => void;
}

export const WorkOrderPanel: React.FC<WorkOrderPanelProps> = ({
  order,
  options,
  timeout = 30,
  isRetrying = false,
  onSelect,
  onRetry,
  onResolve,
}) => {
  const [remainingTime, setRemainingTime] = useState(timeout);
  const displayOptions = options || order.options;
  const handleResolve = onResolve || onSelect;

  useEffect(() => {
    setRemainingTime(timeout);
  }, [order.id, timeout]);

  useEffect(() => {
    if (remainingTime <= 0) return;
    
    const timer = setInterval(() => {
      setRemainingTime((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingTime]);

  useNumberKeys(
    displayOptions.length,
    (index) => handleResolve(displayOptions[index].id),
    true
  );

  const urgencyColor = urgencyColors[order.urgency];
  const isUrgent = remainingTime <= Math.max(5, timeout * 0.2);

  const urgencyTextColor = urgencyColor.replace('bg-', 'text-');

  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 w-96 animate-slide-in-right">
      <div className="bg-gray-800/95 backdrop-blur-md border-l-4 border-t border-b border-gray-700/50 rounded-l-2xl shadow-2xl">
        <div className="p-4 border-b border-gray-700/50">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${urgencyColor}/20`}>
                <AlertTriangle className={`w-5 h-5 ${urgencyTextColor}`} />
              </div>
              <div>
                <h3 className="font-bold text-white">{order.title}</h3>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="px-2 py-0.5 bg-gray-700 rounded">
                    {workOrderTypeLabels[order.type]}
                  </span>
                  <span className={cn(
                    'px-2 py-0.5 rounded text-white font-medium',
                    urgencyColor
                  )}>
                    {urgencyLabels[order.urgency]}
                  </span>
                  {isRetrying && (
                    <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" />
                      重判
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-300 mb-3">{order.description}</p>

          <div className="flex items-center gap-2 mb-2">
            <Clock className={cn('w-4 h-4', isUrgent ? 'text-red-400 animate-pulse' : 'text-gray-400')} />
            <span className={cn(
              'text-sm font-mono',
              isUrgent ? 'text-red-400 font-bold' : 'text-gray-400'
            )}>
              剩余 {remainingTime} 秒
            </span>
          </div>

          <ProgressBar
            value={remainingTime}
            max={timeout}
            variant={isUrgent ? 'danger' : 'warning'}
            size="sm"
            striped
          />
        </div>

        <div className="p-4 space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">请选择处理方案:</span>
          </div>
          
          {displayOptions.map((option, index) => (
            <Button
              key={option.id}
              onClick={() => handleResolve(option.id)}
              variant={index === 0 ? 'accent' : 'secondary'}
              fullWidth
              className="justify-start text-left"
              keyboardShortcut={(index + 1).toString()}
            >
              <span className="flex-1">
                <span className="font-medium">{option.label}</span>
                <span className="block text-xs text-gray-400 mt-0.5">
                  {option.description}
                </span>
              </span>
            </Button>
          ))}

          {onRetry && (
            <div className="mt-4 pt-4 border-t border-gray-700/50">
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={onRetry}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                重新判断
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default WorkOrderPanel;
