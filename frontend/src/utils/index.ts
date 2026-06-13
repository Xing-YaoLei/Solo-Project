import dayjs from 'dayjs'

export function formatDateTime(val?: string | null): string {
  if (!val) return '-'
  return dayjs(val).format('YYYY-MM-DD HH:mm:ss')
}

export function formatDate(val?: string | null): string {
  if (!val) return '-'
  return dayjs(val).format('YYYY-MM-DD')
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

export function formatTemp(val?: number): string {
  if (val === undefined || val === null) return '-'
  return `${val.toFixed(1)}°C`
}

export function formatPercent(val?: number): string {
  if (val === undefined || val === null) return '-'
  return `${(val * 100).toFixed(1)}%`
}

export function classNames(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
