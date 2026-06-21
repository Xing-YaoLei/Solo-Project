'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CaseType, MaterialType } from '@legal/shared';
import type { CaseDelegationDTO, MaterialUploadDTO } from '@legal/shared';
import api from '@/lib/api';
import MaterialUpload from '@/components/MaterialUpload';

const caseTypeLabels: Record<CaseType, string> = {
  [CaseType.CIVIL]: '民事',
  [CaseType.CRIMINAL]: '刑事',
  [CaseType.ADMINISTRATIVE]: '行政',
  [CaseType.ARBITRATION]: '仲裁',
  [CaseType.LABOR]: '劳动',
  [CaseType.INTELLECTUAL_PROPERTY]: '知识产权',
  [CaseType.CONTRACT]: '合同',
  [CaseType.TORT]: '侵权',
  [CaseType.FAMILY]: '家事',
  [CaseType.REAL_ESTATE]: '房产',
  [CaseType.CORPORATE]: '公司',
  [CaseType.OTHER]: '其他',
};

export default function NewCasePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [materials, setMaterials] = useState<MaterialUploadDTO[]>([]);
  const [form, setForm] = useState({
    title: '',
    caseType: CaseType.CIVIL,
    description: '',
    clientName: '',
    clientIdNumber: '',
    clientPhone: '',
    clientEmail: '',
    opposingPartyName: '',
    opposingPartyIdNumber: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: CaseDelegationDTO = {
        ...form,
        materials,
      };
      await api.post('/cases', payload);
      router.push('/cases');
    } catch {
      alert('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">新建委托</h1>
        <p className="text-sm text-slate-500 mt-1">填写案件委托信息并提交</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-800">案件基本信息</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                案件名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => updateForm('title', e.target.value)}
                placeholder="请输入案件名称"
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                案件类型 <span className="text-red-500">*</span>
              </label>
              <select
                value={form.caseType}
                onChange={(e) => updateForm('caseType', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Object.entries(caseTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                案件描述 <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
                placeholder="请详细描述案件情况"
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-800">委托人信息</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.clientName}
                  onChange={(e) => updateForm('clientName', e.target.value)}
                  placeholder="请输入委托人姓名"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  身份证号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.clientIdNumber}
                  onChange={(e) => updateForm('clientIdNumber', e.target.value)}
                  placeholder="请输入身份证号"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  联系电话 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={form.clientPhone}
                  onChange={(e) => updateForm('clientPhone', e.target.value)}
                  placeholder="请输入联系电话"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">电子邮箱</label>
                <input
                  type="email"
                  value={form.clientEmail}
                  onChange={(e) => updateForm('clientEmail', e.target.value)}
                  placeholder="请输入电子邮箱"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-800">对方当事人</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.opposingPartyName}
                  onChange={(e) => updateForm('opposingPartyName', e.target.value)}
                  placeholder="请输入对方当事人姓名"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">身份证号</label>
                <input
                  type="text"
                  value={form.opposingPartyIdNumber}
                  onChange={(e) => updateForm('opposingPartyIdNumber', e.target.value)}
                  placeholder="请输入身份证号（选填）"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-800">材料上传</h2>
          </div>
          <div className="p-6">
            <MaterialUpload materials={materials} onChange={setMaterials} />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '提交中...' : '提交委托'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="border border-slate-300 text-slate-700 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
