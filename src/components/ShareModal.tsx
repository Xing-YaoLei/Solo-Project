"use client";

import { useState } from "react";
import {
  X,
  Share2,
  Copy,
  Check,
  Clock,
  Shield,
  Users,
  UserCog,
  Wrench,
  Package,
  Globe,
} from "lucide-react";
import { UserRole, roleNames } from "@/types";
import clsx from "clsx";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
}

const roleIcons: Record<UserRole, React.ReactNode> = {
  director: <Shield className="w-5 h-5" />,
  advisor: <Users className="w-5 h-5" />,
  technician: <Wrench className="w-5 h-5" />,
  parts: <Package className="w-5 h-5" />,
  external: <Globe className="w-5 h-5" />,
};

const roleDescriptions: Record<UserRole, string> = {
  director: "查看全部数据，完整导出权限",
  advisor: "查看报价、车辆、诊断数据",
  technician: "查看质检、诊断，金额脱敏",
  parts: "查看车辆配件明细，可导出配件",
  external: "仅查看脱敏汇总数据",
};

export function ShareModal({ isOpen, onClose, currentRole }: ShareModalProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>("advisor");
  const [expiryDays, setExpiryDays] = useState<number>(7);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/share/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selectedRole,
          expiresIn: expiryDays,
        }),
      });
      const data = await response.json();
      setGeneratedLink(data.url);
    } catch (error) {
      console.error("Generate share link error:", error);
      setGeneratedLink(`${window.location.origin}/share/demo-token-${Date.now()}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (generatedLink) {
      try {
        await navigator.clipboard.writeText(generatedLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error("Copy error:", error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-industrial-500/10">
              <Share2 className="w-5 h-5 text-industrial-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white font-display">
                生成分享链接
              </h3>
              <p className="text-sm text-slate-400">
                按角色权限生成带有效期的分享链接
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="text-sm font-medium text-slate-300 mb-3 block">
              选择角色权限
            </label>
            <div className="space-y-2">
              {(Object.keys(roleNames) as UserRole[]).map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={clsx(
                    "w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
                    selectedRole === role
                      ? "bg-industrial-500/10 border-industrial-500/30"
                      : "bg-white/[0.02] border-white/5 hover:border-white/10"
                  )}
                >
                  <div
                    className={clsx(
                      "p-2.5 rounded-lg",
                      selectedRole === role
                        ? "bg-industrial-500/20 text-industrial-400"
                        : "bg-slate-700/50 text-slate-400"
                    )}
                  >
                    {roleIcons[role]}
                  </div>
                  <div className="flex-1">
                    <p
                      className={clsx(
                        "font-medium",
                        selectedRole === role
                          ? "text-white"
                          : "text-slate-300"
                      )}
                    >
                      {roleNames[role]}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {roleDescriptions[role]}
                    </p>
                  </div>
                  <div
                    className={clsx(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                      selectedRole === role
                        ? "border-industrial-500 bg-industrial-500"
                        : "border-slate-600"
                    )}
                  >
                    {selectedRole === role && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              链接有效期
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 3, 7, 30].map((days) => (
                <button
                  key={days}
                  onClick={() => setExpiryDays(days)}
                  className={clsx(
                    "py-2.5 text-sm font-medium rounded-lg transition-all",
                    expiryDays === days
                      ? "bg-industrial-500 text-white"
                      : "bg-slate-700/50 text-slate-400 hover:text-slate-200"
                  )}
                >
                  {days}天
                </button>
              ))}
            </div>
          </div>

          {generatedLink && (
            <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5">
              <label className="text-xs font-medium text-slate-400 mb-2 block">
                分享链接
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={generatedLink}
                  readOnly
                  className="flex-1 px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-slate-300 font-mono"
                />
                <button
                  onClick={handleCopy}
                  className={clsx(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                    copied
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-industrial-500 hover:bg-industrial-600 text-white"
                  )}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      复制
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/5 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            分享链接包含只读权限，敏感数据将按角色脱敏
          </p>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-6 py-2.5 bg-industrial-500 hover:bg-industrial-600 text-white font-medium rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                {generatedLink ? "重新生成" : "生成链接"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
