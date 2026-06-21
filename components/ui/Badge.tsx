import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'bg-primary/15 text-primary hover:bg-primary/25',
        secondary:
          'bg-secondary/50 text-secondary-foreground hover:bg-secondary/70',
        destructive:
          'bg-destructive/15 text-destructive hover:bg-destructive/25',
        accent:
          'bg-accent/15 text-accent hover:bg-accent/25',
        success:
          'bg-green-500/15 text-green-400 hover:bg-green-500/25',
        warning:
          'bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/25',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
