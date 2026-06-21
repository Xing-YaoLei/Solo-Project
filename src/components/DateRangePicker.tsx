"use client";

import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  value: string;
  onChange: (value: string) => void;
  options?: { value: string; label: string }[];
}

const defaultOptions = [
  { value: "7d", label: "近7天" },
  { value: "30d", label: "近30天" },
  { value: "90d", label: "近90天" },
  { value: "month", label: "本月" },
];

export default function DateRangePicker({
  value,
  onChange,
  options = defaultOptions,
}: DateRangePickerProps) {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-md transition-colors",
            value === option.value
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:bg-gray-100"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
