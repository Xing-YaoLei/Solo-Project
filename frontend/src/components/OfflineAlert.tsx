import { AlertTriangle, CheckCircle, X, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OfflineAlertProps {
  deviceName: string
  handled?: boolean
  remarks?: string
  onHandle?: () => void
  className?: string
}

export function OfflineAlert({ deviceName, handled, remarks, onHandle, className }: OfflineAlertProps) {
  if (handled) {
    return (
      <div className={cn(
        'flex items-start gap-3 p-4 rounded-lg border bg-green-50 border-green-200',
        className
      )}>
        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-green-800">
            设备「{deviceName}」离线异常已处理
          </p>
          {remarks && <p className="text-sm text-green-700 mt-1">{remarks}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      'flex items-start gap-3 p-4 rounded-lg border bg-red-50 border-red-200 animate-pulse',
      className
    )}>
      <div className="flex items-center gap-2 mt-0.5">
        <WifiOff className="w-5 h-5 text-red-600 flex-shrink-0" />
        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-red-800">
          设备异常：「{deviceName}」当前离线
        </p>
        <p className="text-sm text-red-700 mt-1">
          可能影响清洁数据采集，请检查设备网络连接或进行现场确认
        </p>
        {remarks && <p className="text-sm text-red-600 mt-1">备注：{remarks}</p>}
      </div>
      {onHandle && (
        <button
          onClick={onHandle}
          className="text-sm font-medium text-red-800 hover:text-red-900 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-md transition-colors"
        >
          标记已处理
        </button>
      )}
    </div>
  )
}
