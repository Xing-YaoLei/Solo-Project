import React from 'react';
import { DatePicker } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

interface DateRangePickerProps {
  value?: [Dayjs, Dayjs] | null;
  onChange?: (dates: [Dayjs, Dayjs] | null) => void;
  placeholder?: [string, string];
  allowClear?: boolean;
  style?: React.CSSProperties;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  placeholder = ['开始日期', '结束日期'],
  allowClear = true,
  style,
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
      format="YYYY-MM-DD"
    />
  );
};

export default DateRangePicker;
