"use client";

import { cn } from "@/lib/utils";

interface DataTableColumn<T> {
  key: keyof T | string;
  title: string;
  width?: string;
  render?: (row: T, index: number) => React.ReactNode;
  align?: "left" | "center" | "right";
  highlight?: (row: T) => boolean;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey?: keyof T;
  onRowClick?: (row: T) => void;
  expandable?: (row: T) => React.ReactNode;
  emptyText?: string;
  className?: string;
  maxHeight?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  rowKey,
  onRowClick,
  expandable,
  emptyText = "暂无数据",
  className,
  maxHeight = "600px",
}: DataTableProps<T>) {
  return (
    <div
      className={cn(
        "glass-card overflow-hidden",
        className
      )}
    >
      <div
        className="overflow-auto scrollbar-thin"
        style={{ maxHeight }}
      >
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-surface-100/95 backdrop-blur-sm border-b border-border">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={cn(
                    "px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider whitespace-nowrap",
                    col.align === "center" && "text-center",
                    col.align === "right" && "text-right",
                    col.width && `w-[${col.width}]`
                  )}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-muted"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              data.map((row, index) => {
                const key = rowKey
                  ? String(row[rowKey as keyof T])
                  : index.toString();
                return (
                  <RowWithExpand
                    key={key}
                    row={row}
                    index={index}
                    columns={columns}
                    rowKey={rowKey}
                    onRowClick={onRowClick}
                    expandable={expandable}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RowWithExpand<T extends Record<string, unknown>>({
  row,
  index,
  columns,
  rowKey,
  onRowClick,
  expandable,
}: {
  row: T;
  index: number;
  columns: DataTableColumn<T>[];
  rowKey?: keyof T;
  onRowClick?: (row: T) => void;
  expandable?: (row: T) => React.ReactNode;
}) {
  const hasExpand = !!expandable;

  return (
    <>
      <tr
        className={cn(
          "transition-colors",
          index % 2 === 0 ? "bg-transparent" : "bg-surface-100/30",
          onRowClick && "cursor-pointer hover:bg-surface-200/50",
          hasExpand && "group"
        )}
        onClick={() => onRowClick?.(row)}
      >
        {columns.map((col) => {
          const value = col.key in row ? row[col.key as keyof T] : undefined;
          const isHighlighted = col.highlight?.(row);
          return (
            <td
              key={String(col.key)}
              className={cn(
                "px-4 py-3 whitespace-nowrap",
                col.align === "center" && "text-center",
                col.align === "right" && "text-right",
                isHighlighted && "bg-danger/10 text-danger font-medium"
              )}
            >
              {col.render ? col.render(row, index) : String(value ?? "-")}
            </td>
          );
        })}
      </tr>
      {hasExpand && (
        <tr className="bg-surface-200/40">
          <td colSpan={columns.length} className="px-4 py-3">
            {expandable!(row)}
          </td>
        </tr>
      )}
    </>
  );
}
