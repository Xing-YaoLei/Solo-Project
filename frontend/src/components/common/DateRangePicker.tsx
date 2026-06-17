import React from 'react';
import { DatePicker, DatePickerProps } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

interface DateRangePickerProps {
  value?: [Dayjs, Dayjs] | null;
  onChange?: (dates: [Dayjs, Dayjs] | null) => void;
  placeholder?: [string, string];
  allowClear?: boolean;
  style?: React.CSSProperties;
  presets?: DatePickerProps['presets'];
}

const defaultPresets: DatePickerProps['presets'] = [
  {
    label: '今天',
    value: [dayjs(), dayjs()],
  },
  {
    label: '本周',
    value: [dayjs().startOf('week'), dayjs().endOf('week')],
  },
  {
    label: '本月',
    value: [dayjs().startOf('month'), dayjs().endOf('month')],
  },
  {
    label: '本季度',
    value: [dayjs().startOf('quarter'), dayjs().endOf('quarter')],
  },
  {
    label: '今年',
    value: [dayjs().startOf('year'), dayjs().endOf('year')],
  },
  {
    label: '近7天',
    value: [dayjs().subtract(6, 'day'), dayjs()],
  },
  {
    label: '近30天',
    value: [dayjs().subtract(29, 'day'), dayjs()],
  },
  {
    label: '近90天',
    value: [dayjs().subtract(89, 'day'), dayjs()],
  },
];

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  placeholder = ['开始日期', '结束日期'],
  allowClear = true,
  style,
  presets = defaultPresets,
}) => {
  const handleChange = (dates: unknown) => {
    if (onChange) {
      const dayjsDates = dates as [Dayjs, Dayjs] | null;
      onChange(dayjsDates || null);
    }
  };

  return (
    <RangePicker
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      allowClear={allowClear}
      style={style}
      presets={presets}
      format="YYYY-MM-DD"
    />
  );
};

export default DateRangePicker;
