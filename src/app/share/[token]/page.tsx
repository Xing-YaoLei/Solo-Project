'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Shield, AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { ROLE_LABELS } from '@/types';
import { WarningCards } from '@/components/WarningCards';
import { WorkorderTrendChart } from '@/components/WorkorderTrendChart';
import { InventoryPieChart } from '@/components/InventoryPieChart';
import { useDashboardStore } from '@/store/dashboard';

export default function ShareViewPage() {
  const params = useParams();
  const { loadAllData } = useDashboardStore();
  const [shareInfo, setShareInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAllData();
    const verify = async () => {
      try {
        const res = await fetch(`/api/share?token=${params.token}`);
        const data = await res.json();
        if (!data.valid) {
          setError(data.error || '无效的分享链接');
        } else {
          setShareInfo(data);
        }
      } catch {
        setError('验证分享链接失败');
      }
    };
    verify();
  }, [params.token, loadAllData]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-industrial-900 p-6">
        <div className="w-full max-w-md rounded-xl border border-risk-danger/30 bg-industrial-800 p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-risk-danger/20">
            <AlertTriangle className="h-7 w-7 text-risk-danger" />
          </div>
          <h2 className="mb-2 font-display text-lg font-bold text-white">分享链接不可用</h2>
          <p className="text-sm text-industrial-300">{error}</p>
          <a
            href="/"
            className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-risk-info px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-600"
          >
            返回首页 <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    );
  }

  if (!shareInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-industrial-900">
        <div className="animate-pulse text-industrial-400">正在验证分享权限...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-industrial-900">
      <header className="sticky top-0 z-40 border-b border-risk-warning/30 bg-gradient-to-r from-risk-warning/10 via-industrial-900/95 to-risk-warning/10 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-risk-info to-blue-700 font-display font-bold">
              维
            </div>
            <div>
              <h1 className="font-display text-base font-bold tracking-wide text-white">
                汽车维修风险监测 · 分享视图
              </h1>
              <p className="text-[10px] text-industrial-400">SHARED DASHBOARD VIEW</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-md border border-risk-warning/40 bg-risk-warning/10 px-3 py-1.5">
              <Shield className="h-3.5 w-3.5 text-risk-warning" />
              <span className="text-[11px] font-semibold text-risk-warning">
                {ROLE_LABELS[shareInfo.allowedRole as keyof typeof ROLE_LABELS] || '只读'} 权限
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-md border border-industrial-600 bg-industrial-800 px-3 py-1.5 text-[11px] text-industrial-300">
              <Clock className="h-3.5 w-3.5" />
              过期：{new Date(shareInfo.expiresAt).toLocaleString('zh-CN')}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-6 py-6">
        <div className="mb-5 rounded-xl border border-industrial-700 bg-industrial-800/50 p-4">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-risk-info" />
            <div className="text-[11px] leading-relaxed text-industrial-300">
              <p className="font-semibold text-white">此为受限分享视图</p>
              <p className="mt-1">
                您正在以「{ROLE_LABELS[shareInfo.allowedRole as keyof typeof ROLE_LABELS]}」权限查看数据。
                分享链接严格绑定角色权限，您仅能查看授权范围内的数据。导出、分享、质检编辑等功能已被禁用。
              </p>
              <p className="mt-1.5 font-mono text-industrial-400">
                授权范围: {shareInfo.scope.join(', ')}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <WarningCards />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <WorkorderTrendChart />
            <InventoryPieChart />
          </div>
        </div>
      </main>
    </div>
  );
}
