import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  outline?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-300',
  secondary:
    'bg-slate-200 text-slate-900 hover:bg-slate-300 focus:ring-slate-200',
  outline:
    'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-200',
  ghost:
    'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-200',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-300',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

const outlineVariantClasses: Record<ButtonVariant, string> = {
  primary:
    'border border-primary-600 text-primary-600 bg-transparent hover:bg-primary-50 focus:ring-primary-200',
  secondary:
    'border border-slate-400 text-slate-700 bg-transparent hover:bg-slate-50 focus:ring-slate-200',
  outline:
    'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-200',
  ghost:
    'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-200',
  danger:
    'border border-red-600 text-red-600 bg-transparent hover:bg-red-50 focus:ring-red-200',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  outline = false,
  className,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
        outline ? outlineVariantClasses[variant] : variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        (disabled || isLoading) && 'cursor-not-allowed opacity-50',
        className
      )}
      {...props}
    >
      {isLoading && (
        <svg
          className="mr-2 h-4 w-4 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {children}
    </button>
  );
}

export default Button;
