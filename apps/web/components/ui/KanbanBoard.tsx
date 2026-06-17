"use client";

import { ReactNode } from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export interface KanbanColumn<T> {
  id: string;
  title: string;
  items: T[];
  color?: string;
}

export interface KanbanCardProps {
  children: ReactNode;
  className?: string;
  draggable?: boolean;
}

function KanbanCard({ children, className, draggable = true }: KanbanCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md",
        draggable && "cursor-grab active:cursor-grabbing",
        className
      )}
    >
      {draggable && (
        <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      {children}
    </div>
  );
}

interface KanbanBoardProps<T> {
  columns: KanbanColumn<T>[];
  renderCard: (item: T, columnId: string) => ReactNode;
  className?: string;
  onCardClick?: (item: T, columnId: string) => void;
}

export function KanbanBoard<T>({
  columns,
  renderCard,
  className,
  onCardClick,
}: KanbanBoardProps<T>) {
  return (
    <div className={cn("flex h-full gap-4 overflow-x-auto pb-4", className)}>
      {columns.map((column) => (
        <div
          key={column.id}
          className="flex h-full w-80 flex-shrink-0 flex-col rounded-lg bg-muted/30"
        >
          <div className="flex items-center justify-between p-4 pb-2">
            <div className="flex items-center gap-2">
              {column.color && (
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: column.color }}
              />
            )}
            <h3 className="font-semibold">{column.title}</h3>
            </div>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {column.items.length}
            </span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-2 pt-0">
            {column.items.length === 0 ? (
              <div className="flex h-20 items-center justify-center rounded-lg border-2 border-dashed border-muted text-sm text-muted-foreground">
                暂无内容
              </div>
            ) : (
              column.items.map((item, index) => (
                <div
                  key={index}
                  onClick={() => onCardClick?.(item, column.id)}
                >
                  <KanbanCard>{renderCard(item, column.id)}</KanbanCard>
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export { KanbanCard };
