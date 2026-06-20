import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type TagColor = 'success' | 'warning' | 'danger' | 'info' | 'purple';

interface TagChipProps {
  color?: TagColor;
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md';
  pulse?: boolean;
}

const colorMap: Record<TagColor, { bg: string; border: string; text: string; glow: string; dot: string }> = {
  success: {
    bg: 'bg-green-success/15',
    border: 'border-green-success/40',
    text: 'text-green-success',
    glow: 'shadow-[0_0_10px_rgba(0,227,150,0.25)]',
    dot: 'bg-green-success',
  },
  warning: {
    bg: 'bg-orange-warning/15',
    border: 'border-orange-warning/40',
    text: 'text-orange-warning',
    glow: 'shadow-[0_0_10px_rgba(255,138,0,0.25)]',
    dot: 'bg-orange-warning',
  },
  danger: {
    bg: 'bg-red-danger/15',
    border: 'border-red-danger/40',
    text: 'text-red-danger',
    glow: 'shadow-[0_0_10px_rgba(255,61,87,0.3)]',
    dot: 'bg-red-danger',
  },
  info: {
    bg: 'bg-cyan-primary/15',
    border: 'border-cyan-primary/40',
    text: 'text-cyan-glow',
    glow: 'shadow-[0_0_10px_rgba(0,212,255,0.25)]',
    dot: 'bg-cyan-primary',
  },
  purple: {
    bg: 'bg-purple-sponsor/15',
    border: 'border-purple-sponsor/40',
    text: 'text-purple-sponsor',
    glow: 'shadow-[0_0_10px_rgba(139,92,246,0.25)]',
    dot: 'bg-purple-sponsor',
  },
};

export default function TagChip({
  color = 'info',
  children,
  className,
  size = 'md',
  pulse = false,
}: TagChipProps) {
  const c = colorMap[color];
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium border backdrop-blur-sm',
        sizeClass,
        c.bg,
        c.border,
        c.text,
        c.glow,
        className,
      )}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full',
          c.dot,
          pulse && 'animate-pulse',
        )}
      />
      {children}
    </span>
  );
}
