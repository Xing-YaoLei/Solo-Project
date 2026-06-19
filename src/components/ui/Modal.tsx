import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function Modal({
  open, onClose, title, children, footer, className }: ModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-lg mx-4 rounded-xl shadow-glass bg-white/90 backdrop-blur-lg border border-white/50 animate-scale-in",
          className
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200/60">
          {title && (
            <h2 className="text-lg font-semibold text-neutral-800">{title}</h2>
          )}
          <Button
            variant="secondary"
            size="sm"
            className="!h-8 !w-8 !p-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-neutral-200/60">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;
