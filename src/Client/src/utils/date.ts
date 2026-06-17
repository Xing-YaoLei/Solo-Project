import dayjs from 'dayjs'

export function formatDate(date: Date | string, format: string = 'YYYY-MM-DD'): string {
  return dayjs(date).format(format)
}

export function formatDateTime(date: Date | string, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
  return dayjs(date).format(format)
}

export function getNow(): string {
  return dayjs().format('YYYY-MM-DD HH:mm:ss')
}
