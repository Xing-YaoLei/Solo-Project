import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  hoverable?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, title, subtitle, hoverable = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl p-5 shadow-card backdrop-blur-md bg-white/70 border border-white/40",
          hoverable && "transition-all duration-300 hover:shadow-glass hover:-translate-y-0.5 hover:border-accent/30 cursor-pointer",
          className
        )}
        {...props}
      >
        {(title || subtitle) && (
          <div className="mb-4">
            {title && (
              <h3 className="text-lg font-semibold text-neutral-800">{title}</h3>
            )}
            {subtitle && (
              <p className="text-sm text-neutral-500 mt-1">{subtitle}</p>
            )}
          </div>
        )}
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export { Card };
export default Card;
