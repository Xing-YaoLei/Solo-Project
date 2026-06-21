'use client';

import { useState } from 'react';
import { X, Copy, Check, Users, Clock, Link2 } from 'lucide-react';
import { UserRole } from '@prisma/client';
import { UserRoleLabels } from '@/types';
import { cn, formatDate } from '@/lib/utils';
import type { ShareLinkResponse } from '@/types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ isOpen, onClose }: ShareModalProps) {
  const [role, setRole] = useState<UserRole>(UserRole.operator);
  const [expiresInHours, setExpiresInHours] = useState(24);
  const [shareLink, setShareLink] = useState<ShareLinkResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/share/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          activityIds: [],
          expiresInHours,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShareLink(data.data);
      }
    } catch (error) {
      console.error('Failed to generate share link:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (shareLink) {
      await navigator.clipboard.writeText(shareLink.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setShareLink(null);
    setCopied(false);
    onClose();
  };

  const roleOptions = [
    { value: UserRole.admin, label: '系统管理员', desc: '查看所有数据，管理权限' },
    { value: UserRole.manager, label: '运营经理', desc: '查看全量活动数据' },
    { value: UserRole.operator, label: '运营专员', desc: '查看限定活动数据' },
    { value: UserRole.finance, label: '财务人员', desc: '查看支付相关数据' },
  ];

  const expireOptions = [1, 6, 12, 24, 72, 168];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl font-bold text-white">生成分享链接</h2>
            <button onClick={handleClose} className="rounded p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          {!shareLink ? (
            <div className="space-y-6">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-300">
                  <Users className="h-4 w-4" />
                  可见角色权限
                </label>
                <div className="space-y-2">
                  {roleOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setRole(opt.value)}
                      className={cn(
                        'w-full rounded-lg border p-3 text-left transition-all',
                        role === opt.value
                          ? 'border-primary bg-primary/10 text-white'
                          : 'border-neutral-700 bg-neutral-800/50 text-neutral-300 hover:border-neutral-600'
                      )}
                    >
                      <div className="font-medium">{opt.label}</div>
                      <div className="text-xs text-neutral-400">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-300">
                  <Clock className="h-4 w-4" />
                  链接有效期
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {expireOptions.map((hours) => (
                    <button
                      key={hours}
                      onClick={() => setExpiresInHours(hours)}
                      className={cn(
                        'rounded-lg border py-2 text-sm transition-all',
                        expiresInHours === hours
                          ? 'border-primary bg-primary/10 text-white'
                          : 'border-neutral-700 bg-neutral-800/50 text-neutral-300 hover:border-neutral-600'
                      )}
                    >
                      {hours < 24 ? `${hours}小时` : `${hours / 24}天`}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="btn-primary w-full"
              >
                {isGenerating ? '生成中...' : '生成分享链接'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-lg bg-success/10 border border-success/30 p-4">
                <div className="flex items-center gap-2 text-success mb-2">
                  <Link2 className="h-5 w-5" />
                  <span className="font-medium">链接已生成</span>
                </div>
                <div className="font-mono text-sm text-neutral-300 break-all">
                  {shareLink.url}
                </div>
                <div className="mt-2 text-xs text-neutral-400">
                  有效期至：{formatDate(shareLink.expiresAt)}
                </div>
                <div className="mt-1 text-xs text-neutral-400">
                  可见角色：{UserRoleLabels[shareLink.role]}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCopy}
                  className="btn-secondary flex-1 gap-2"
                >
                  {copied ? (
                    <><Check className="h-4 w-4" /> 已复制</>
                  ) : (
                    <><Copy className="h-4 w-4" /> 复制链接</>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShareLink(null);
                  }}
                  className="btn-ghost"
                >
                  重新生成
                </button>
              </div>

              <button onClick={handleClose} className="btn-ghost w-full">
                关闭
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
