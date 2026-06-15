import { useEffect, ReactNode } from 'react'

interface ModalProps {
  visible: boolean
  title?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  width?: string | number
  maskClosable?: boolean
}

export default function Modal({
  visible,
  title,
  onClose,
  children,
  footer,
  width = 480,
  maskClosable = true,
}: ModalProps) {
  useEffect(() => {
    if (visible) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [visible])

  if (!visible) return null

  const handleMaskClick = () => {
    if (maskClosable) {
      onClose()
    }
  }

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleMaskClick}
    >
      <div
        className="bg-white rounded-lg shadow-2xl flex flex-col max-h-full"
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          maxWidth: '100%',
        }}
        onClick={handleContentClick}
      >
        {title !== undefined && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
              aria-label="关闭"
            >
              ×
            </button>
          </div>
        )}

        <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>

        {footer !== undefined && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
