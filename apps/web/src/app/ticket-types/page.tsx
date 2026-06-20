'use client';

import { useEffect, useState } from 'react';
import { Plus, History, Edit3, Trash2, AlertCircle, Layers } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { fmtMoney, fmtDateTime, fmtPercent, cn, STATUS_STYLES, LABELS } from '@/lib/utils';
import { useActivityId } from '@/components/ActivitySelector';

export default function TicketTypesPage() {
  const activityId = useActivityId();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  const refresh = () => {
    setLoading(true);
    api.get('/ticket-types', { activityId })
      .then(setList)
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, [activityId]);

  const openNew = () => {
    setEditing(null);
    setFormData({ activityId, name: '', price: '', totalStock: '', status: 'DRAFT', perLimit: 10 });
    setShowForm(true);
  };
  const openEdit = (t: any) => {
    setEditing(t);
    setFormData({ ...t, price: t.price?.toNumber?.() || t.price, originalPrice: t.originalPrice?.toNumber?.() || t.originalPrice });
    setShowForm(true);
  };

  const submit = async () => {
    const body = { ...formData, price: Number(formData.price), originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined, totalStock: Number(formData.totalStock), perLimit: Number(formData.perLimit) };
    if (editing) await api.put(`/ticket-types/${editing.id}`, body);
    else await api.post('/ticket-types', body);
    setShowForm(false);
    refresh();
  };

  const remove = async (t: any) => {
    if (!confirm(`确认删除票种「${t.name}」？`)) return;
    try {
      await api.del(`/ticket-types/${t.id}`);
      refresh();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const totalStock = list.reduce((s, t) => s + t.totalStock, 0);
  const totalSold = list.reduce((s, t) => s + t.soldCount, 0);
  const totalRevenue = list.reduce((s, t) => s + t.soldCount * (t.price?.toNumber?.() || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">票种规则</h1>
          <p className="text-sm text-slate-500 mt-1">定义票价、库存、售卖规则，状态变更全程留痕</p>
        </div>
        <button className="btn-primary" onClick={openNew}>
          <Plus className="w-4 h-4" /> 新建票种
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '票种数', value: list.length, unit: '个', color: 'from-brand-500 to-brand-700' },
          { label: '总库存', value: totalStock.toLocaleString(), unit: '张', color: 'from-blue-500 to-indigo-600' },
          { label: '已售出', value: totalSold.toLocaleString() + ' 张', unit: fmtPercent(totalStock ? totalSold / totalStock : 0), color: 'from-emerald-500 to-teal-600' },
          { label: '预计收入', value: fmtMoney(totalRevenue), unit: '元', color: 'from-amber-500 to-orange-600' },
        ].map((k) => (
          <div key={k.label} className="card p-5">
            <div className="text-sm text-slate-500">{k.label}</div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-900">{k.value}</span>
              <span className="text-xs text-slate-500">{k.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>票种</th>
              <th>票价</th>
              <th>库存</th>
              <th>销售进度</th>
              <th>每人限购</th>
              <th>状态</th>
              <th>创建时间</th>
              <th className="text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={8} className="text-center py-8 text-slate-400">加载中...</td></tr>}
            {!loading && list.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-slate-400">暂无票种，点击右上角新建</td></tr>}
            {list.map((t) => {
              const soldRate = t.totalStock ? t.soldCount / t.totalStock : 0;
              const left = Math.max(0, t.totalStock - t.soldCount);
              return (
                <tr key={t.id}>
                  <td>
                    <div className="font-medium text-slate-900">
                      {t.hasSeat && <Layers className="w-3.5 h-3.5 inline mr-1 text-brand-600" />}
                      {t.name}
                    </div>
                    {t.description && <div className="text-xs text-slate-500 mt-0.5">{t.description}</div>}
                  </td>
                  <td>
                    <div className="font-semibold text-slate-900">¥ {fmtMoney(t.price)}</div>
                    {t.originalPrice && (
                      <div className="text-xs text-slate-400 line-through">¥ {fmtMoney(t.originalPrice)}</div>
                    )}
                  </td>
                  <td>{t.totalStock.toLocaleString()} 张</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            soldRate > 0.9 ? 'bg-rose-500' : soldRate > 0.6 ? 'bg-amber-500' : 'bg-emerald-500',
                          )}
                          style={{ width: `${(soldRate * 100).toFixed(0)}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-600 whitespace-nowrap">
                        {t.soldCount}/{t.totalStock} ({fmtPercent(soldRate, 0)})
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">剩余 {left.toLocaleString()} 张</div>
                  </td>
                  <td>{t.perLimit} 张</td>
                  <td>
                    <span className={STATUS_STYLES[t.status]}>
                      {LABELS.TicketTypeStatus[t.status] || t.status}
                    </span>
                  </td>
                  <td className="text-slate-500 text-xs">{fmtDateTime(t.createdAt)}</td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/ticket-types/${t.id}`} className="btn-secondary !px-2 !py-1 text-xs" title="查看状态历史">
                        <History className="w-3.5 h-3.5" />
                      </Link>
                      <button className="btn-outline !px-2 !py-1 text-xs" onClick={() => openEdit(t)}>
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button className="btn-outline !px-2 !py-1 text-xs text-rose-600 hover:bg-rose-50 border-rose-200" onClick={() => remove(t)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-6" onClick={() => setShowForm(false)}>
          <div className="card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-semibold">{editing ? '编辑票种' : '新建票种'}</div>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">票种名称</label>
                <input className="input" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="例如：VIP 贵宾票" />
              </div>
              <div>
                <label className="label">描述</label>
                <textarea className="input min-h-[64px]" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">售价 (元)</label>
                  <input type="number" className="input" value={formData.price || ''} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                </div>
                <div>
                  <label className="label">原价 (元，选填)</label>
                  <input type="number" className="input" value={formData.originalPrice || ''} onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">总库存</label>
                  <input type="number" className="input" value={formData.totalStock || ''} onChange={(e) => setFormData({ ...formData, totalStock: e.target.value })} />
                </div>
                <div>
                  <label className="label">每人限购</label>
                  <input type="number" className="input" value={formData.perLimit || ''} onChange={(e) => setFormData({ ...formData, perLimit: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">状态</label>
                  <select className="input" value={formData.status || 'DRAFT'} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                    <option value="DRAFT">草稿</option>
                    <option value="ACTIVE">在售</option>
                    <option value="SUSPENDED">停售</option>
                    <option value="CLOSED">关闭</option>
                  </select>
                </div>
                <div>
                  <label className="label">是否对号入座</label>
                  <select className="input" value={formData.hasSeat ? 'true' : 'false'} onChange={(e) => setFormData({ ...formData, hasSeat: e.target.value === 'true' })}>
                    <option value="false">否（通票）</option>
                    <option value="true">是</option>
                  </select>
                </div>
              </div>
              {(editing?.soldCount || 0) > 0 && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  该票种已有销售记录，库存调整建议参考剩余量，不建议直接减少低于已售数量。
                </div>
              )}
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
