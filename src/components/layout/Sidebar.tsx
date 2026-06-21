import * as React from 'react';
import { Filter, Calendar, FileText, Users, Activity, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { DateRangePicker } from '@/components/ui/DatePicker';
import { caseTypes, mockLawyers } from '@/utils/mockData';
import { CASE_STATUS_LABELS } from '@/utils/format';
import type { FilterParams } from '@/types';

interface SidebarProps {
  className?: string;
  filters: FilterParams;
  onFilterChange: (filters: FilterParams) => void;
  onReset: () => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  className,
  filters,
  onFilterChange,
  onReset,
  isOpen = true,
  onToggle,
}) => {
  const [localFilters, setLocalFilters] = React.useState<FilterParams>(filters);

  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleDateChange = (field: 'start_date' | 'end_date', value: string) => {
    const newFilters = {
      ...localFilters,
      date_range: {
        ...localFilters.date_range,
        [field]: value || undefined,
      },
    };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSelectChange = (field: keyof FilterParams, value: string) => {
    const newFilters = {
      ...localFilters,
      [field]: value || undefined,
    };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const emptyFilters: FilterParams = {};
    setLocalFilters(emptyFilters);
    onReset();
  };

  const caseTypeOptions = caseTypes.map((type) => ({ value: type, label: type }));
  const lawyerOptions = mockLawyers.map((lawyer) => ({
    value: lawyer.id,
    label: lawyer.name,
  }));
  const statusOptions = Object.entries(CASE_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const hasActiveFilters =
    localFilters.date_range?.start_date ||
    localFilters.date_range?.end_date ||
    localFilters.case_type ||
    localFilters.lawyer_id ||
    localFilters.status;

  const sidebarContent = (
    <div
      className={cn(
        'w-72 flex-shrink-0 border-r border-border bg-background h-full overflow-y-auto',
        className
      )}
    >
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">筛选条件</h3>
          </div>
          {onToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={handleReset} className="w-full">
            重置筛选
          </Button>
        )}
      </div>

      <div className="p-4 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>时间范围</span>
          </div>
          <DateRangePicker
            startDate={localFilters.date_range?.start_date}
            endDate={localFilters.date_range?.end_date}
            onStartDateChange={(date) => handleDateChange('start_date', date)}
            onEndDateChange={(date) => handleDateChange('end_date', date)}
            className="flex-col items-stretch"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>案件类型</span>
          </div>
          <Select
            options={caseTypeOptions}
            placeholder="全部类型"
            value={localFilters.case_type || ''}
            onChange={(e) => handleSelectChange('case_type', e.target.value)}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>负责律师</span>
          </div>
          <Select
            options={lawyerOptions}
            placeholder="全部律师"
            value={localFilters.lawyer_id || ''}
            onChange={(e) => handleSelectChange('lawyer_id', e.target.value)}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Activity className="h-4 w-4" />
            <span>案件状态</span>
          </div>
          <Select
            options={statusOptions}
            placeholder="全部状态"
            value={localFilters.status || ''}
            onChange={(e) => handleSelectChange('status', e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block">{sidebarContent}</aside>

      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={onToggle}
            aria-hidden="true"
          />
          <aside className="fixed left-0 top-0 h-full z-50 animate-in slide-in-from-left">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};

export { Sidebar };
