import { HTMLAttributes } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type TagColor = "primary" | "success" | "danger" | "warning" | "info";

interface TagProps extends Omit<HTMLAttributes<HTMLSpanElement>, "onClick"> {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  color?: TagColor;
}

const baseColorClasses: Record<TagColor, string> = {
  primary:
    "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20",
  success:
    "bg-success/10 text-success-dark border-success/20 hover:bg-success/20",
  danger:
    "bg-danger/10 text-danger-dark border-danger/20 hover:bg-danger/20",
  warning:
    "bg-warning/10 text-warning-dark border-warning/20 hover:bg-warning/20",
  info: "bg-info/10 text-info-dark border-info/20 hover:bg-info/20",
};

const selectedColorClasses: Record<TagColor, string> = {
  primary: "bg-primary text-white border-primary",
  success: "bg-success text-white border-success",
  danger: "bg-danger text-white border-danger",
  warning: "bg-warning text-white border-warning",
  info: "bg-info text-white border-info",
};

export function Tag({
  label,
  selected = false,
  onClick,
  color = "primary",
  className,
  ...props
}: TagProps) {
  const clickable = !!onClick;

  return (
    <span
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (clickable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={cn(
        "inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border transition-all duration-200",
        selected
          ? selectedColorClasses[color]
          : baseColorClasses[color],
        clickable && "cursor-pointer select-none",
        className
      )}
      {...props}
    >
      {selected && <Check className="h-3.5 w-3.5" />}
      {label}
    </span>
  );
}

export default Tag;
