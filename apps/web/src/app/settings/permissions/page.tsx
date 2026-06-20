'use client';

import AppLayout from '@/components/layout/AppLayout';
import SensitiveFieldConfig from '@/components/settings/SensitiveFieldConfig';
import { ShieldCheck } from 'lucide-react';

export default function PermissionsPage() {
  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <div className="px-6 py-4 bg-white border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">
                敏感字段配置
              </h1>
              <p className="text-xs text-slate-500">
                配置敏感字段的查看权限和掩码规则
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <SensitiveFieldConfig />
        </div>
      </div>
    </AppLayout>
  );
}
