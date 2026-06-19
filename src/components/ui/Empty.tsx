import { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function Empty({
  icon,
  title = "暂无数据",
  description,
  className,
}: EmptyProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className
      )}
    >
      <div className="mb-4 text-neutral-300">
        {icon ?? <Inbox className="h-16 w-16" />}
      </div>
      <h3 className="text-lg font-medium text-neutral-700 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-neutral-500 max-w-sm">{description}</p>
      )}
    </div>
  );
}

export default Empty;
