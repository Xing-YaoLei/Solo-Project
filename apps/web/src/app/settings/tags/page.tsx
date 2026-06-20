'use client';

import AppLayout from '@/components/layout/AppLayout';
import TagManager from '@/components/settings/TagManager';
import { Tags } from 'lucide-react';

export default function TagsPage() {
  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <div className="px-6 py-4 bg-white border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
              <Tags className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">
                问题标签管理
              </h1>
              <p className="text-xs text-slate-500">
                管理工单的分类标签
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <TagManager />
        </div>
      </div>
    </AppLayout>
  );
}
