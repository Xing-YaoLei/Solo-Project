'use client';

import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import { cn } from '@/lib/utils';

type ConfirmType = 'warning' | 'danger' | 'success' | 'info';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmType;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const typeConfig: Record<ConfirmType, { icon: React.ComponentType<{ className?: string }>; iconClass: string; confirmVariant: 'primary' | 'danger' }> = {
  warning: {
    icon: AlertTriangle,
    iconClass: 'bg-amber-100 text-amber-600',
    confirmVariant: 'primary',
  },
  danger: {
    icon: XCircle,
    iconClass: 'bg-red-100 text-red-600',
    confirmVariant: 'danger',
  },
  success: {
    icon: CheckCircle,
    iconClass: 'bg-green-100 text-green-600',
    confirmVariant: 'primary',
  },
  info: {
    icon: Info,
    iconClass: 'bg-blue-100 text-blue-600',
    confirmVariant: 'primary',
  },
};

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  type = 'warning',
  isLoading = false,
  size = 'sm',
}: ConfirmModalProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={size}>
      <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
        <div
          className={cn(
            'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full',
            config.iconClass
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="mt-4 flex-1 sm:ml-4 sm:mt-0">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="mt-2 text-sm text-slate-600">{message}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          {cancelText}
        </Button>
        <Button
          variant={config.confirmVariant}
          onClick={handleConfirm}
          isLoading={isLoading}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}

export default ConfirmModal;
