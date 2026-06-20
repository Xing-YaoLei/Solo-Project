'use client';

import * as Toast from '@radix-ui/react-toast';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { create } from 'zustand';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
  duration?: number;
}

interface ToastStore {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, toast.duration ?? 3000);
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export function toast(
  title: string,
  options?: { description?: string; type?: ToastType; duration?: number }
) {
  useToastStore.getState().addToast({
    title,
    description: options?.description,
    type: options?.type ?? 'info',
    duration: options?.duration,
  });
}

const IconMap = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const ColorMap = {
  success: 'text-success border-success/30 bg-success/5',
  error: 'text-danger border-danger/30 bg-danger/5',
  info: 'text-info border-info/30 bg-info/5',
  warning: 'text-warning border-warning/30 bg-warning/5',
};

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  return (
    <Toast.Provider>
      {toasts.map((t) => {
        const Icon = IconMap[t.type];
        return (
          <Toast.Root
            key={t.id}
            open
            onOpenChange={(open) => !open && removeToast(t.id)}
            className={cn(
              'fixed right-4 top-4 z-[100] w-80 rounded-lg border shadow-lg p-4',
              ColorMap[t.type]
            )}
            style={{ marginTop: `${toasts.indexOf(t) * 80}px` }}
          >
            <div className="flex gap-3">
              <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <Toast.Title className="text-sm font-medium">{t.title}</Toast.Title>
                {t.description && (
                  <Toast.Description className="mt-1 text-sm opacity-80">
                    {t.description}
                  </Toast.Description>
                )}
              </div>
              <Toast.Close className="opacity-70 hover:opacity-100">
                <X className="w-4 h-4" />
              </Toast.Close>
            </div>
          </Toast.Root>
        );
      })}
      <Toast.Viewport />
    </Toast.Provider>
  );
}
