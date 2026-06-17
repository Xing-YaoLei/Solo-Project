import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  level: number
  label: string
  id?: string
}

interface DrilldownBreadcrumbProps {
  levels: BreadcrumbItem[]
  onNavigate: (levelIndex: number) => void
}

export default function DrilldownBreadcrumb({ levels, onNavigate }: DrilldownBreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1 text-sm py-3">
      {levels.map((item, index) => {
        const isLast = index === levels.length - 1
        return (
          <div key={item.level} className="flex items-center gap-1">
            {index > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            )}
            <button
              type="button"
              onClick={() => !isLast && onNavigate(index)}
              disabled={isLast}
              className={cn(
                'px-1.5 py-0.5 rounded transition-colors whitespace-nowrap',
                isLast
                  ? 'font-semibold text-teal-600 cursor-default'
                  : 'text-gray-500 hover:text-teal-600 hover:bg-teal-50 cursor-pointer',
              )}
            >
              {item.label}
            </button>
          </div>
        )
      })}
    </nav>
  )
}
