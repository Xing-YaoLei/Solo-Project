import * as React from 'react';
import { cn } from '@/lib/utils';
import { Calendar } from 'lucide-react';

export interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ className, label, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            id={inputId}
            type="date"
            ref={ref}
            className={cn(
              'flex h-9 w-full items-center rounded-md border border-input bg-transparent px-3 py-2 pl-10 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
              className
            )}
            {...props}
          />
        </div>
      </div>
    );
  }
);
DatePicker.displayName = 'DatePicker';

export interface DateRangePickerProps {
  startDate?: string;
  endDate?: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  className?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className,
}) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <DatePicker
        value={startDate || ''}
        onChange={(e) => onStartDateChange(e.target.value)}
        placeholder="开始日期"
      />
      <span className="text-muted-foreground text-sm">至</span>
      <DatePicker
        value={endDate || ''}
        onChange={(e) => onEndDateChange(e.target.value)}
        placeholder="结束日期"
      />
    </div>
  );
};

export { DatePicker, DateRangePicker };
