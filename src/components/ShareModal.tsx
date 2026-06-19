'use client';

import { useState } from 'react';
import { X, Shield, Copy, CheckCircle2, Clock, Link2 } from 'lucide-react';
import { useDashboardStore } from '@/store/dashboard';
import { UserRole, ROLE_LABELS } from '@/types';
import { hasPermission, ROLE_PERMISSIONS } from '@/lib/constants';

export function ShareModal() {
  const { isShareModalOpen, setShareModalOpen } = useDashboardStore();
  const [allowedRole, setAllowedRole] = useState<UserRole>('viewer');
  const [expiresIn, setExpiresIn] = useState(86400);
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isShareModalOpen) return null;

  const availableRoles: UserRole[] = ['viewer', 'dispatcher', 'inspector'];

  const handleGenerate = async () => {
    setSharing(true);
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allowedRole,
          scope: ROLE_PERMISSIONS[allowedRole],
          expiresIn,
        }),
      });
      const data = await res.json();
      setShareUrl(`${window.location.origin}${data.url}`);
    } finally {
      setSharing(false);
    }
  };

  const handleCopy = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-industrial-700 bg-industrial-800 shadow-2xl">
        <div className="flex items-center justify-between border-b border-industrial-700 px-5 py-4">
          <h3 className="font-display text-base font-bold text-white">生成分享链接</h3>
          <button
            onClick={() => {
              setShareModalOpen(false);
              setShareUrl(null);
            }}
            className="rounded p-1 text-industrial-400 transition hover:bg-industrial-700 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="rounded-lg border border-risk-warning/30 bg-risk-warning/5 p-3">
            <div className="flex items-start gap-2">
              <Shield className="mt-0.5 h-4 w-4 text-risk-warning" />
              <div className="text-[11px] leading-relaxed text-industrial-300">
                <p className="font-semibold text-risk-warning">权限绑定说明</p>
                <p className="mt-1">
                  分享链接将严格绑定所选角色的权限，无法绕过。接收方仅能查看被授权的数据范围。
                </p>
              </div>
            </div>
          </div>

          {!shareUrl ? (
            <>
              <div>
                <label className="mb-2 block text-xs font-semibold text-industrial-200">
                  绑定角色权限
                </label>
                <div className="space-y-1.5">
                  {availableRoles.map((role) => (
                    <button
                      key={role}
                      onClick={() => setAllowedRole(role)}
                      className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition ${
                        allowedRole === role
                          ? 'border-risk-info bg-risk-info/10'
                          : 'border-industrial-700 bg-industrial-900 hover:border-industrial-500'
                      }`}
                    >
                      <div>
                        <p className={`text-sm font-semibold ${allowedRole === role ? 'text-risk-info' : 'text-white'}`}>
                          {ROLE_LABELS[role]}
                        </p>
                        <p className="text-[10px] text-industrial-400">
                          {ROLE_PERMISSIONS[role].length} 项权限
                        </p>
                      </div>
                      <div className="flex flex-wrap justify-end gap-1">
                        {ROLE_PERMISSIONS[role].slice(0, 3).map((p) => (
                          <span
                            key={p}
                            className="rounded bg-industrial-700/80 px-1.5 py-0.5 text-[9px] text-industrial-300"
                          >
                            {p.split(':')[0]}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-industrial-200">
                  <Clock className="mr-1 inline h-3 w-3" />
                  有效期
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { v: 3600, l: '1 小时' },
                    { v: 86400, l: '1 天' },
                    { v: 604800, l: '7 天' },
                  ].map((opt) => (
                    <button
                      key={opt.v}
                      onClick={() => setExpiresIn(opt.v)}
                      className={`rounded-lg border p-2 text-xs transition ${
                        expiresIn === opt.v
                          ? 'border-risk-info bg-risk-info/10 font-semibold text-risk-info'
                          : 'border-industrial-700 bg-industrial-900 text-industrial-300 hover:border-industrial-500'
                      }`}
                    >
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={sharing}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-risk-info py-2.5 text-xs font-semibold text-white transition hover:bg-blue-600 disabled:opacity-50"
              >
                <Link2 className="h-4 w-4" />
                {sharing ? '生成中...' : '生成分享链接'}
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold text-industrial-200">分享链接</label>
                <div className="flex rounded-lg border border-industrial-600 bg-industrial-900">
                  <input
                    readOnly
                    value={shareUrl}
                    className="flex-1 truncate bg-transparent px-3 py-2.5 font-mono text-xs text-industrial-200 outline-none"
                  />
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 border-l border-industrial-600 px-3 text-xs font-semibold text-risk-info transition hover:bg-industrial-700"
                  >
                    {copied ? (
                      <><CheckCircle2 className="h-3.5 w-3.5" /> 已复制</>
                    ) : (
                      <><Copy className="h-3.5 w-3.5" /> 复制</>
                    )}
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-industrial-700 bg-industrial-900 p-3">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <p className="text-industrial-400">绑定角色</p>
                    <p className="font-semibold text-white">{ROLE_LABELS[allowedRole]}</p>
                  </div>
                  <div>
                    <p className="text-industrial-400">权限数量</p>
                    <p className="font-semibold text-white">
                      {ROLE_PERMISSIONS[allowedRole].length} 项
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setShareUrl(null);
                }}
                className="w-full rounded-lg border border-industrial-600 bg-industrial-800 py-2 text-xs font-semibold text-industrial-200 transition hover:bg-industrial-700"
              >
                生成新链接
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
