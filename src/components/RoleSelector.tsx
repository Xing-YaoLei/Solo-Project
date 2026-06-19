"use client";

import { UserRole, roleNames } from "@/types";
import { Shield, ChevronDown } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

interface RoleSelectorProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  variant?: "header" | "compact";
}

const roleOrder: UserRole[] = [
  "director",
  "advisor",
  "technician",
  "parts",
  "external",
];

const roleColors: Record<UserRole, string> = {
  director: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  advisor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  technician: "bg-industrial-500/10 text-industrial-400 border-industrial-500/20",
  parts: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  external: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

export function RoleSelector({
  currentRole,
  onRoleChange,
  variant = "header",
}: RoleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (variant === "compact") {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={clsx(
            "px-3 py-1.5 text-xs font-medium rounded-lg border flex items-center gap-2",
            roleColors[currentRole]
          )}
        >
          <Shield className="w-3.5 h-3.5" />
          {roleNames[currentRole]}
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 top-full mt-2 z-20 py-1 bg-slate-800 border border-white/10 rounded-lg shadow-xl min-w-[140px]">
              {roleOrder.map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    onRoleChange(role);
                    setIsOpen(false);
                  }}
                  className={clsx(
                    "w-full px-3 py-2 text-left text-sm transition-colors",
                    currentRole === role
                      ? "bg-white/5 text-white"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  )}
                >
                  {roleNames[role]}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className={clsx("px-4 py-2 rounded-xl border", roleColors[currentRole])}>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4" />
          <span className="text-sm font-medium">{roleNames[currentRole]}</span>
          <span className="text-xs opacity-70">视图</span>
        </div>
      </div>

      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ChevronDown
            className={clsx("w-4 h-4 transition-transform", isOpen && "rotate-180")}
          />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 top-full mt-2 z-20 py-1 bg-slate-800 border border-white/10 rounded-lg shadow-xl min-w-[160px]">
              {roleOrder.map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    onRoleChange(role);
                    setIsOpen(false);
                  }}
                  className={clsx(
                    "w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center gap-2",
                    currentRole === role
                      ? "bg-white/5 text-white"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  )}
                >
                  <Shield className="w-4 h-4" />
                  {roleNames[currentRole]} 视图
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
