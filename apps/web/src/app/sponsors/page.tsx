'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit3, Trash2, HandCoins, Crown, Building, Briefcase, Users, Award, Star } from 'lucide-react';
import { api } from '@/lib/api';
import { useActivityId } from '@/components/ActivitySelector';
import { fmtMoney, fmtDateTime, LABELS } from '@/lib/utils';

const TYPE_ICONS: Record<string, any> = {
  TITLE_SPONSOR: Crown, PLATINUM: Award, GOLD: Star, SILVER: Building, BRONZE: Briefcase, OFFICIAL_PARTNER: Users,
};
const TYPE_STYLES: Record<string, string> = {
  TITLE_SPONSOR: 'from-amber-500 to-orange-600',
  PLATINUM: 'from-slate-400 to-slate-600',
  GOLD: 'from-yellow-400 to-amber-500',
  SILVER: 'from-slate-300 to-slate-500',
  BRONZE: 'from-orange-400 to-orange-600',
  OFFICIAL_PARTNER: 'from-brand-500 to-brand-700',
};

export default function SponsorsPage() {
  const activityId = useActivityId();
  const [list, setList] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  const refresh = () => {
    api.get('/sponsors', { activityId }).then(setList);
    api.get('/sponsors/summary', { activityId }).then(setSummary);
  };
  useEffect(() => { refresh(); }, [activityId]);

  const openNew = () => {
    setEditing(null);
    setFormData({ activityId, name: '', type: 'GOLD', amount: '', contactName: '', contactPhone: '', status: 'ACTIVE' });
    setShowForm(true);
  };
  const openEdit = (s: any) => {
    setEditing(s);
    setFormData({ ...s, amount: s.amount?.toNumber?.() || s.amount });
    setShowForm(true);
  };

  const submit = async () => {
    const body = { ...formData, amount: formData.amount ? Number(formData.amount) : undefined };
    if (editing) await api.put(`/sponsors/${editing.id}`, body);
    else await api.post('/sponsors', body);
    setShowForm(false);
    refresh();
  };

  const remove = async (s: any) => {
    if (!confirm(`删除赞助商「${s.name}」？`)) return;
    await api.del(`/sponsors/${s.id}`);
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">赞助清单</h1>
          <p className="text-sm text-slate-500 mt-1">统一管理赞助商、合作方信息和赞助权益</p>
        </div>
        <button className="btn-primary" onClick={openNew}>
          <Plus className="w-4 h-4" /> 添加赞助
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '赞助商总数', value: summary.count || 0, color: 'from-brand-500 to-brand-700', icon: HandCoins },
          { label: '赞助总金额', value: fmtMoney(summary.totalAmount || 0) + ' 元', color: 'from-amber-500 to-orange-600', icon: Crown },
          {
            label: '冠名/铂金级',
            value: (summary.typeCount?.TITLE_SPONSOR || 0) + (summary.typeCount?.PLATINUM || 0),
            color: 'from-violet-500 to-purple-600', icon: Award,
          },
          {
            label: '其他级别',
            value: (summary.count || 0) - (summary.typeCount?.TITLE_SPONSOR || 0) - (summary.typeCount?.PLATINUM || 0),
            color: 'from-slate-500 to-slate-700', icon: Building,
          },
        ].map((k) => (
          <div key={k.label} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-slate-500">{k.label}</div>
                <div className="mt-2 text-2xl font-bold text-slate-900">{k.value}</div>
              </div>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${k.color} text-white flex items-center justify-center`}>
                <k.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {list.map((s) => {
          const IconCmp = TYPE_ICONS[s.type] || HandCoins;
          return (
            <div key={s.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${TYPE_STYLES[s.type] || TYPE_STYLES.OFFICIAL_PARTNER} text-white flex items-center justify-center shrink-0`}>
                    <IconCmp className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{s.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{LABELS.SponsorType[s.type] || s.type}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="btn-outline !px-2 !py-1 text-xs" onClick={() => openEdit(s)}>
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button className="btn-outline !px-2 !py-1 text-xs text-rose-600 hover:bg-rose-50 border-rose-200" onClick={() => remove(s)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                {s.amount && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">赞助金额</span>
                    <span className="font-semibold text-amber-600">¥ {fmtMoney(s.amount)}</span>
                  </div>
                )}
                {s.contractNo && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">合同编号</span>
                    <span className="font-mono text-xs">{s.contractNo}</span>
                  </div>
                )}
                {s.contactName && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">联系人</span>
                    <span>{s.contactName} {s.contactPhone && <span className="text-slate-400">· {s.contactPhone}</span>}</span>
                  </div>
                )}
                <div className="text-xs text-slate-400 pt-2 border-t border-slate-100">
                  添加于 {fmtDateTime(s.createdAt)}
                </div>
              </div>
            </div>
          );
        })}
        {list.length === 0 && (
          <div className="col-span-3 card p-10 text-center text-slate-400">
            <HandCoins className="w-12 h-12 mx-auto mb-3 opacity-40" />
            暂无赞助商，点击右上角添加
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-6" onClick={() => setShowForm(false)}>
          <div className="card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-semibold">{editing ? '编辑赞助' : '添加赞助'}</div>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">名称</label>
                <input className="input" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">级别</label>
                  <select className="input" value={formData.type || 'GOLD'} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                    {Object.entries(LABELS.SponsorType).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">金额 (元)</label>
                  <input type="number" className="input" value={formData.amount || ''} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">合同编号</label>
                <input className="input" value={formData.contractNo || ''} onChange={(e) => setFormData({ ...formData, contractNo: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">联系人</label>
                  <input className="input" value={formData.contactName || ''} onChange={(e) => setFormData({ ...formData, contactName: e.target.value })} />
                </div>
                <div>
                  <label className="label">联系电话</label>
                  <input className="input" value={formData.contactPhone || ''} onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">官网 URL</label>
                <input className="input" value={formData.websiteUrl || ''} onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })} />
              </div>
              <div>
                <label className="label">状态</label>
                <select className="input" value={formData.status || 'ACTIVE'} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                  <option value="ACTIVE">合作中</option>
                  <option value="INACTIVE">已结束</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button className="btn-secondary" onClick={() => setShowForm(false)}>取消</button>
              <button className="btn-primary" onClick={submit}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
