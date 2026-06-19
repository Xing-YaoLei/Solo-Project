'use client';

import React, { useState } from 'react';
import { X, Share2, Copy, CheckCircle2, Link2, Users, Calendar, Lock, Unlock } from 'lucide-react';
import { cn, generateToken } from '@/lib/utils';
import { ROLE_LABELS } from '@/lib/auth';
import type { UserRole } from '@/types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
}

const ROLE_OPTIONS: Array<{ role: UserRole; description: string }> = [
  { role: 'admin', description: '全量数据访问权限' },
  { role: 'manager', description: '指定门店全量数据访问' },
  { role: 'supervisor', description: '管辖区域保洁数据查看' },
  { role: 'investor', description: '汇总数据和关键指标查看' },
];

export function ShareModal({ isOpen, onClose, currentRole }: ShareModalProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>('investor');
  const [expiryDays, setExpiryDays] = useState<number | null>(7);
  const [requirePassword, setRequirePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      const expiresAt = expiryDays
        ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString()
        : undefined;

      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: selectedRole,
          expiresAt,
          password: requirePassword ? password : undefined,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setShareUrl(result.data.shareUrl);
      }
    } catch (error) {
      console.error('Generate share link failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setShareUrl(null);
    setSelectedRole('investor');
    setExpiryDays(7);
    setRequirePassword(false);
    setPassword('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg mx-4 glass-card p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">生成分享链接</h2>
            <p className="text-sm text-slate-400 mt-1">
              不同角色将看到不同的数据范围
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {shareUrl ? (
          <div className="space-y-6">
            <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
                <div>
                  <p className="font-semibold text-white">链接生成成功</p>
                  <p className="text-sm text-slate-400">
                    角色: {ROLE_LABELS[selectedRole]}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-600 text-slate-300 font-mono text-sm"
                />
                <button
                  onClick={handleCopy}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all",
                    copied
                      ? "bg-green-600 text-white"
                      : "bg-blue-600 hover:bg-blue-500 text-white"
                  )}
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
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

              {expiryDays && (
                <p className="text-sm text-slate-400 mt-3">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  链接将在 {expiryDays} 天后过期
                </p>
              )}
              {requirePassword && (
                <p className="text-sm text-slate-400 mt-1">
                  <Lock className="w-4 h-4 inline mr-1" />
                  访问密码: {password}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShareUrl(null)}
                className="flex-1 px-6 py-3 rounded-lg border border-slate-600 text-slate-300 font-medium hover:bg-slate-700/50 transition-colors"
              >
                重新生成
              </button>
              <button
                onClick={handleClose}
                className="flex-1 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all"
              >
                完成
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
                  <Users className="w-4 h-4" />
                  选择角色权限
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {ROLE_OPTIONS.map((option) => (
                    <button
                      key={option.role}
                      onClick={() => setSelectedRole(option.role)}
                      className={cn(
                        "p-4 rounded-xl border-2 text-left transition-all",
                        selectedRole === option.role
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                      )}
                    >
                      <p className="font-medium text-white">{ROLE_LABELS[option.role]}</p>
                      <p className="text-xs text-slate-400 mt-1">{option.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
                  <Calendar className="w-4 h-4" />
                  链接有效期
                </label>
                <div className="flex gap-3">
                  {[1, 7, 30, null].map((days) => (
                    <button
                      key={days ?? 'forever'}
                      onClick={() => setExpiryDays(days)}
                      className={cn(
                        "flex-1 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all",
                        expiryDays === days
                          ? "border-blue-500 bg-blue-500/10 text-blue-400"
                          : "border-slate-700 bg-slate-800/30 text-slate-400 hover:border-slate-600"
                      )}
                    >
                      {days === null ? '永久' : `${days}天`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <button
                  onClick={() => setRequirePassword(!requirePassword)}
                  className="flex items-center justify-between w-full p-4 rounded-xl border-2 border-slate-700 bg-slate-800/30 hover:border-slate-600 transition-all"
                >
                  <div className="flex items-center gap-2">
                    {requirePassword ? (
                      <Lock className="w-5 h-5 text-blue-400" />
                    ) : (
                      <Unlock className="w-5 h-5 text-slate-400" />
                    )}
                    <span className="font-medium text-white">访问密码保护</span>
                  </div>
                  <div className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    requirePassword ? "bg-blue-500" : "bg-slate-600"
                  )}>
                    <div className={cn(
                      "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                      requirePassword ? "right-1" : "left-1"
                    )} />
                  </div>
                </button>

                {requirePassword && (
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="设置访问密码"
                    className="w-full mt-3 px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 px-6 py-3 rounded-lg border border-slate-600 text-slate-300 font-medium hover:bg-slate-700/50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || (requirePassword && !password)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all",
                  isGenerating || (requirePassword && !password)
                    ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-500 text-white hover:shadow-lg hover:shadow-blue-500/25"
                )}
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    生成链接
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
