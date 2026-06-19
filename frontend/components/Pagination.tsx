import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from './Button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  const pages = getPageNumbers(currentPage, totalPages);

  if (totalPages <= 1) return null;

  return (
    <div className={cn('flex items-center justify-between', className)}>
      <p className="text-sm text-slate-500">
        第 <span className="font-medium">{currentPage}</span> 页，共{' '}
        <span className="font-medium">{totalPages}</span> 页
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...'}
            className={cn(
              'inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors',
              page === currentPage
                ? 'bg-primary-600 text-white'
                : page === '...'
                ? 'text-slate-400'
                : 'border border-slate-300 text-slate-600 hover:bg-slate-50'
            )}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  const pages: (number | '...')[] = [];

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
    return pages;
  }

  pages.push(1);

  if (current > 3) {
    pages.push('...');
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push('...');
  }

  pages.push(total);

  return pages;
}

export default Pagination;
