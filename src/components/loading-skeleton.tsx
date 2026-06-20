"use client";

import clsx from "clsx";

interface LoadingSkeletonProps {
  variant: "card" | "table" | "chart";
  count?: number;
}

function CardSkeleton() {
  return (
    <div className="card animate-pulse space-y-4">
      <div className="h-4 w-1/3 rounded bg-[hsl(var(--muted))]" />
      <div className="h-8 w-1/2 rounded bg-[hsl(var(--muted))]" />
      <div className="h-3 w-2/3 rounded bg-[hsl(var(--muted))]" />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="mb-4 h-5 w-1/4 rounded bg-[hsl(var(--muted))]" />
      <div className="space-y-3">
        <div className="flex gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 flex-1 rounded bg-[hsl(var(--muted))]" />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            {Array.from({ length: 6 }).map((_, j) => (
              <div key={j} className="h-4 flex-1 rounded bg-[hsl(var(--muted))]/60" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="card animate-pulse space-y-4">
      <div className="h-4 w-1/4 rounded bg-[hsl(var(--muted))]" />
      <div className="flex items-end gap-2 h-48">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-[hsl(var(--muted))]"
            style={{ height: `${30 + Math.random() * 70}%` }}
          />
        ))}
      </div>
      <div className="flex gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-3 flex-1 rounded bg-[hsl(var(--muted))]" />
        ))}
      </div>
    </div>
  );
}

export default function LoadingSkeleton({ variant, count = 1 }: LoadingSkeletonProps) {
  const Component = variant === "card" ? CardSkeleton : variant === "table" ? TableSkeleton : ChartSkeleton;

  return (
    <div className={clsx(variant === "card" && "grid gap-4 md:grid-cols-2 lg:grid-cols-3")}>
      {Array.from({ length: variant === "table" || variant === "chart" ? 1 : count }).map((_, i) => (
        <Component key={i} />
      ))}
    </div>
  );
}
