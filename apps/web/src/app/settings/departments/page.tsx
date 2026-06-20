'use client';

import AppLayout from '@/components/layout/AppLayout';
import DepartmentTree from '@/components/settings/DepartmentTree';
import { Building2 } from 'lucide-react';

export default function DepartmentsPage() {
  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <div className="px-6 py-4 bg-white border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">
                责任归属配置
              </h1>
              <p className="text-xs text-slate-500">
                管理部门、岗位和人员的层级结构
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <DepartmentTree />
        </div>
      </div>
    </AppLayout>
  );
}
