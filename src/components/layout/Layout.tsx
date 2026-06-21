import * as React from 'react';
import { Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/Button';
import { ShareModal } from '@/components/share/ShareModal';
import { ExportModal } from '@/components/export/ExportModal';
import type { FilterParams } from '@/types';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
  showSidebar?: boolean;
  filters?: FilterParams;
  onFilterChange?: (filters: FilterParams) => void;
  onFilterReset?: () => void;
  onExport?: () => void;
  onShare?: () => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  className,
  showSidebar = true,
  filters = {},
  onFilterChange = () => {},
  onFilterReset = () => {},
  onExport,
  onShare,
}) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [showShareModal, setShowShareModal] = React.useState(false);
  const [showExportModal, setShowExportModal] = React.useState(false);

  const handleFilterChange = (newFilters: FilterParams) => {
    onFilterChange(newFilters);
  };

  const handleFilterReset = () => {
    onFilterReset();
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleShare = () => {
    if (onShare) {
      onShare();
    } else {
      setShowShareModal(true);
    }
  };

  const handleExport = () => {
    if (onExport) {
      onExport();
    } else {
      setShowExportModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onExport={handleExport} onShare={handleShare} />
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />

      <div className="flex">
        {showSidebar && (
          <Sidebar
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleFilterReset}
            isOpen={sidebarOpen}
            onToggle={toggleSidebar}
          />
        )}

        <main
          className={cn(
            'flex-1 min-w-0',
            showSidebar ? 'lg:ml-0' : '',
            className
          )}
        >
          {showSidebar && (
            <div className="lg:hidden sticky top-16 z-30 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSidebar}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                筛选
              </Button>
            </div>
          )}
          <div className="p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
};

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6',
        className
      )}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
};

interface ContentCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
  style?: React.CSSProperties;
}

const ContentCard: React.FC<ContentCardProps> = ({
  title,
  description,
  children,
  className,
  footer,
  style,
}) => {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card text-card-foreground shadow-sm',
        className
      )}
      style={style}
    >
      {(title || description) && (
        <div className="border-b border-border p-6">
          {title && (
            <h3 className="text-lg font-semibold leading-none tracking-tight">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-muted-foreground mt-2">{description}</p>
          )}
        </div>
      )}
      <div className="p-6">{children}</div>
      {footer && (
        <div className="border-t border-border p-6 pt-0">{footer}</div>
      )}
    </div>
  );
};

interface StatsGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: 2 | 3 | 4;
}

const StatsGrid: React.FC<StatsGridProps> = ({
  children,
  className,
  columns = 4,
}) => {
  const columnClasses = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div
      className={cn('grid gap-4 mb-6', columnClasses[columns], className)}
    >
      {children}
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon,
  className,
}) => {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div
      className={cn(
        'rounded-xl border bg-card text-card-foreground shadow-sm p-6',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {change !== undefined && (
            <p
              className={cn(
                'text-sm mt-1',
                isPositive ? 'text-green-600' : 'text-red-600'
              )}
            >
              {isPositive ? '↑' : '↓'} {Math.abs(change)}% 较上期
            </p>
          )}
        </div>
        {icon && (
          <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export { Layout, PageHeader, ContentCard, StatsGrid, StatCard };
