import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PanelProps {
  title?: string;
  extra?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
  glow?: 'cyan' | 'purple' | 'none';
}

export default function Panel({
  title,
  extra,
  children,
  className,
  bodyClassName,
  headerClassName,
  glow = 'cyan',
}: PanelProps) {
  const glowClasses = {
    cyan: 'shadow-glow-cyan',
    purple: 'shadow-glow-purple',
    none: '',
  };

  return (
    <div
      className={cn(
        'relative rounded-xl overflow-hidden bg-panel-bg backdrop-blur-sm',
        'border border-panel-border',
        glowClasses[glow],
        className,
      )}
      style={{
        background:
          'linear-gradient(135deg, rgba(11,30,63,0.9) 0%, rgba(21,43,85,0.7) 100%)',
      }}
    >
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          padding: '1px',
          background:
            'linear-gradient(135deg, rgba(0,212,255,0.5) 0%, rgba(0,212,255,0.1) 40%, rgba(139,92,246,0.3) 100%)',
          WebkitMask:
            'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />

      {(title || extra) && (
        <div
          className={cn(
            'relative px-5 py-4 flex items-center justify-between border-b border-panel-border/60',
            headerClassName,
          )}
        >
          {title && (
            <h3 className="font-display font-semibold text-lg text-white tracking-wide flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-gradient-to-b from-cyan-primary to-cyan-primary/30" />
              {title}
            </h3>
          )}
          {extra}
        </div>
      )}

      <div className={cn('relative p-5', bodyClassName)}>{children}</div>
    </div>
  );
}
