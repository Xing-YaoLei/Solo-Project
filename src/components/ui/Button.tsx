import { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "success" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-light shadow-button hover:shadow-button-hover focus:outline-none focus:ring-2 focus:ring-accent/50",
  secondary:
    "bg-neutral-50 text-neutral-800 border border-neutral-200 hover:border-accent hover:text-primary shadow-button hover:shadow-button-hover focus:outline-none focus:ring-2 focus:ring-accent/30",
  success:
    "bg-success text-white hover:bg-success-light shadow-button hover:shadow-button-hover focus:outline-none focus:ring-2 focus:ring-success/50",
  danger:
    "bg-danger text-white hover:bg-danger-light shadow-button hover:shadow-button-hover focus:outline-none focus:ring-2 focus:ring-danger/50",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-5 text-base gap-2",
  lg: "h-12 px-7 text-lg gap-2.5",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-button",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
export default Button;
