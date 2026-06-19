import { cn } from "@/lib/utils";

interface TabItem {
  key: string;
  label: string;
  disabled?: boolean;
}

interface TabProps {
  tabs: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
}

export function Tab({ tabs, activeKey, onChange, className }: TabProps) {
  return (
    <div
      className={cn(
        "flex gap-1 p-1 rounded-xl bg-neutral-100",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onChange(tab.key)}
            className={cn(
              "flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
              isActive
                ? "bg-white text-primary shadow-sm"
                : "text-neutral-500 hover:text-neutral-800",
              tab.disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default Tab;
