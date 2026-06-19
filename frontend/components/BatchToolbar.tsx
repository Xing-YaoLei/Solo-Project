'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, CheckSquare, Users, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from './Button';

interface BatchAction {
  key: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  onClick: () => void;
  disabled?: boolean;
}

interface BatchDropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface BatchToolbarProps {
  selectedCount: number;
  totalCount?: number;
  actions?: BatchAction[];
  statusOptions?: BatchDropdownOption[];
  technicianOptions?: BatchDropdownOption[];
  onStatusChange?: (status: string) => void;
  onTechnicianChange?: (technicianId: string) => void;
  onClearSelection?: () => void;
  className?: string;
}

export function BatchToolbar({
  selectedCount,
  totalCount,
  actions = [],
  statusOptions,
  technicianOptions,
  onStatusChange,
  onTechnicianChange,
  onClearSelection,
  className,
}: BatchToolbarProps) {
  const [statusOpen, setStatusOpen] = useState(false);
  const [technicianOpen, setTechnicianOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const technicianRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setStatusOpen(false);
      }
      if (technicianRef.current && !technicianRef.current.contains(e.target as Node)) {
        setTechnicianOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (selectedCount === 0) return null;

  const handleStatusSelect = (value: string) => {
    onStatusChange?.(value);
    setStatusOpen(false);
  };

  const handleTechnicianSelect = (value: string) => {
    onTechnicianChange?.(value);
    setTechnicianOpen(false);
  };

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary-200 bg-primary-50 px-4 py-3',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <CheckSquare className="h-5 w-5 text-primary-600" />
        <span className="text-sm font-medium text-primary-900">
          已选择 {selectedCount} 项
          {totalCount !== undefined && ` / 共 ${totalCount} 项`}
        </span>
        {onClearSelection && (
          <button
            onClick={onClearSelection}
            className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
          >
            取消选择
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {statusOptions && (
          <div ref={statusRef} className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusOpen(!statusOpen)}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              批量改状态
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
            {statusOpen && (
              <div className="absolute right-0 z-20 mt-1 w-40 rounded-lg border border-slate-200 bg-white shadow-lg">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => !option.disabled && handleStatusSelect(option.value)}
                    disabled={option.disabled}
                    className={cn(
                      'block w-full px-4 py-2 text-left text-sm transition-colors first:rounded-t-lg last:rounded-b-lg',
                      option.disabled
                        ? 'cursor-not-allowed text-slate-300'
                        : 'hover:bg-slate-50 text-slate-700'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {technicianOptions && (
          <div ref={technicianRef} className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTechnicianOpen(!technicianOpen)}
            >
              <Users className="mr-2 h-4 w-4" />
              批量分派技师
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
            {technicianOpen && (
              <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-slate-200 bg-white shadow-lg">
                {technicianOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => !option.disabled && handleTechnicianSelect(option.value)}
                    disabled={option.disabled}
                    className={cn(
                      'block w-full px-4 py-2 text-left text-sm transition-colors first:rounded-t-lg last:rounded-b-lg',
                      option.disabled
                        ? 'cursor-not-allowed text-slate-300'
                        : 'hover:bg-slate-50 text-slate-700'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.key}
              variant={action.variant || 'primary'}
              size="sm"
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {Icon && <Icon className="mr-2 h-4 w-4" />}
              {action.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

export default BatchToolbar;
