import { Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyProps {
  icon?: React.ElementType
  message?: string
  className?: string
}

export default function Empty({ icon: Icon = Inbox, message = '暂无数据', className }: EmptyProps) {
  return (
    <div className={cn('flex h-full min-h-[200px] flex-col items-center justify-center gap-3 text-slate-400', className)}>
      <Icon size={40} strokeWidth={1.5} />
      <p className="text-sm">{message}</p>
    </div>
  )
}
