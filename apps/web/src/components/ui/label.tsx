import { Label as RadixLabel } from '@radix-ui/react-label'
import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

const Label = forwardRef<
  React.ElementRef<typeof RadixLabel>,
  React.ComponentPropsWithoutRef<typeof RadixLabel>
>(({ className, ...props }, ref) => (
  <RadixLabel
    ref={ref}
    className={cn(
      'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      className
    )}
    {...props}
  />
))
Label.displayName = RadixLabel.displayName

export { Label }
