'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, MapPin, CheckCircle2, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function NewActivityPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    description: '',
    startTime: '',
    endTime: '',
    venue: '',
    address: '',
    posterUrl: '',
    coverUrl: '',
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.name || !form.startTime || !form.endTime || !form.venue) {
      alert('请填写活动名称、起止时间和场馆');
      return;
    }
    setSaving(true);
    try {
      const body = {
        ...form,
        startTime: new Date(form.startTime),
        endTime: new Date(form.endTime),
      };
      const result = await api.post('/activities', body);
      alert('活动创建成功！');
      router.push('/');
    } catch (e: any) {
      alert('创建失败：' + (e.message || ''));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/" className="text-sm text-brand-600 hover:underline inline-flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> 返回仪表盘
      </Link>

      <div className="card p-6">
        <div className="section-title flex items-center gap-2">
          <Building2 className="w-5 h-5 text-brand-600" />
          新建活动
        </div>
        <p className="text-sm text-slate-500 mb-6">活动是票种、订单、座位图、签到码的顶级归属单元</p>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">活动名称 *</label>
            <input
              className="input text-base"
              placeholder="例如：2026 城市音乐节"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" /> 开始时间 *
            </label>
            <input
              type="datetime-local"
              className="input"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            />
          </div>
          <div>
            <label className="label flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" /> 结束时间 *
            </label>
            <input
              type="datetime-local"
              className="input"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            />
          </div>
          <div>
            <label className="label flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> 场馆名称 *
            </label>
            <input
              className="input"
              placeholder="例如：城市体育中心"
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
            />
          </div>
          <div>
            <label className="label">详细地址</label>
            <input
              className="input"
              placeholder="例如：市中心大道 888 号"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div className="col-span-2">
            <label className="label">活动描述</label>
            <textarea
              className="input min-h-[96px]"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-8 p-4 rounded-xl bg-sky-50 border border-sky-200 text-sm text-sky-800">
          <div className="font-medium mb-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> 创建后可配置：
          </div>
          <ul className="list-disc pl-5 space-y-0.5 text-sky-700">
            <li>票种规则（票价、库存、限购策略）</li>
            <li>座位图与分区布局</li>
            <li>赞助清单与权益配置</li>
            <li>所有状态变更将被自动记录</li>
          </ul>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Link href="/" className="btn-secondary">取消</Link>
          <button className="btn-primary min-w-[140px]" onClick={submit} disabled={saving}>
            {saving ? '保存中...' : '创建活动'}
          </button>
        </div>
      </div>
    </div>
  );
}
