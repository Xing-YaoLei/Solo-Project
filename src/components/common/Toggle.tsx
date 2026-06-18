import { cn } from '@/lib/utils'

interface ToggleProps {
  enabled: boolean
  onChange: (val: boolean) => void
  label: string
}

export default function Toggle({ enabled, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={() => onChange(!enabled)}
      className={cn(
        'relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a2e]',
        enabled ? 'bg-[#ff6b35]' : 'bg-[#2a2a4a]'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#f5f0e8] shadow-lg transition-transform duration-200 ease-in-out',
          enabled ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  )
}
