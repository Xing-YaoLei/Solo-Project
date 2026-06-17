import React from 'react';
import { cn } from '@/lib/utils';

interface GameContainerProps {
  children: React.ReactNode;
  className?: string;
  fullHeight?: boolean;
}

export const GameContainer: React.FC<GameContainerProps> = ({
  children,
  className,
  fullHeight = true,
}) => {
  return (
    <div className="relative w-full bg-gradient-to-br from-gray-900 via-primary-900 to-gray-900">
      <div
        className={cn(
          'absolute inset-0 opacity-30 pointer-events-none',
          'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))]',
          'from-primary-500/20 via-transparent to-transparent'
        )}
      />
      
      <div
        className={cn(
          'relative container mx-auto px-4',
          fullHeight ? 'min-h-screen' : '',
          className
        )}
      >
        {children}
      </div>
    </div>
  );
};

interface PhaseIndicatorProps {
  currentPhase: string;
  phases: { id: string; label: string; icon: React.ReactNode }[];
}

export const PhaseIndicator: React.FC<PhaseIndicatorProps> = ({
  currentPhase,
  phases,
}) => {
  const currentIndex = phases.findIndex((p) => p.id === currentPhase);

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {phases.map((phase, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isPending = index > currentIndex;

        return (
          <React.Fragment key={phase.id}>
            <div
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300',
                isCurrent && 'bg-primary-600 text-white shadow-lg shadow-primary-600/30',
                isCompleted && 'bg-green-600/20 text-green-400 border border-green-500/30',
                isPending && 'bg-gray-800/50 text-gray-500 border border-gray-700/50'
              )}
            >
              <span className={cn('w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold',
                isCurrent && 'bg-white/20',
                isCompleted && 'bg-green-500/20'
              )}>
                {isCompleted ? '✓' : index + 1}
              </span>
              <span className="text-sm font-medium hidden sm:inline">
                {phase.label}
              </span>
            </div>
            {index < phases.length - 1 && (
              <div
                className={cn(
                  'w-8 h-0.5',
                  index < currentIndex ? 'bg-green-500' : 'bg-gray-700'
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default GameContainer;
