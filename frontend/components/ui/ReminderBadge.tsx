import { cn } from "@/lib/utils";
import { Bell } from "lucide-react";

interface ReminderBadgeProps {
  count: number;
  className?: string;
  showZero?: boolean;
}

export function ReminderBadge({
  count,
  className,
  showZero = false,
}: ReminderBadgeProps) {
  if (count === 0 && !showZero) {
    return (
      <Bell className={cn("h-5 w-5 text-gray-600", className)} />
    );
  }

  return (
    <div className="relative">
      <Bell className={cn("h-5 w-5 text-gray-600", className)} />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </div>
  );
}
