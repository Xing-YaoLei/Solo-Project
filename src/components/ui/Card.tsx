import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  bordered?: boolean;
  glass?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  hover = false,
  bordered = true,
  glass = false,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'rounded-xl p-6',
        'bg-gray-800/80',
        bordered && 'border border-gray-700/50',
        glass && 'backdrop-blur-md',
        hover && 'transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary-500/10 hover:border-primary-500/30',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className }) => (
  <div className={cn('mb-4 pb-4 border-b border-gray-700/50', className)}>
    {children}
  </div>
);

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, className }) => (
  <h3 className={cn('text-xl font-bold text-white', className)}>{children}</h3>
);

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const CardDescription: React.FC<CardDescriptionProps> = ({ children, className }) => (
  <p className={cn('text-sm text-gray-400 mt-1', className)}>{children}</p>
);

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className }) => (
  <div className={cn('', className)}>{children}</div>
);

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className }) => (
  <div className={cn('mt-4 pt-4 border-t border-gray-700/50 flex justify-between items-center', className)}>
    {children}
  </div>
);
