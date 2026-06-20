'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Minus, ShoppingCart, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useActivityId } from '@/components/ActivitySelector';
import { fmtMoney, LABELS, STATUS_STYLES } from '@/lib/utils';

interface CartItem {
  ticketTypeId: string;
  quantity: number;
}

export default function NewOrderPage() {
  const router = useRouter();
  const activityId = useActivityId();
  const [ticketTypes, setTicketTypes] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '' });
  const [channel, setChannel] = useState('ONLINE');
  const [remark, setRemark] = useState('');

  useEffect(() => {
    api.get('/ticket-types', { activityId }).then((data: any[]) =>
      setTicketTypes(data.filter((t) => t.status === 'ACTIVE' || t.status === 'DRAFT')),
    );
  }, [activityId]);

  const qtyOf = (id: string) => cart.find((c) => c.ticketTypeId === id)?.quantity || 0;
  const setQty = (id: string, q: number, maxLimit: number) => {
    const actual = Math.max(0, Math.min(q, maxLimit));
    setCart((prev) => {
      const exists = prev.find((c) => c.ticketTypeId === id);
      if (actual === 0) return prev.filter((c) => c.ticketTypeId !== id);
      if (exists) return prev.map((c) => (c.ticketTypeId === id ? { ...c, quantity: actual } : c));
      return [...prev, { ticketTypeId: id, quantity: actual }];
    });
  };

  const totalQty = cart.reduce((s, c) => s + c.quantity, 0);
  const totalAmt = cart.reduce((s, c) => {
    const tt = ticketTypes.find((t) => t.id === c.ticketTypeId);
    return s + (tt?.price?.toNumber?.() || tt?.price || 0) * c.quantity;
  }, 0);

  const submit = async () => {
    if (!customer.name || !customer.phone) {
      alert('请填写客户姓名和手机号');
      return;
    }
    if (cart.length === 0) {
      alert('请至少选择一个票种');
      return;
    }
    try {
      const order = await api.post('/orders', {
        activityId,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email || undefined,
        items: cart.map((c) => ({ ticketTypeId: c.ticketTypeId, quantity: c.quantity })),
        sourceChannel: channel,
        remark: remark || undefined,
      });
      alert('订单创建成功！');
      router.push(`/orders/${order.id}`);
    } catch (e: any) {
      alert('创建失败：' + (e.message || ''));
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <Link href="/orders" className="text-sm text-brand-600 hover:underline inline-flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> 返回订单列表
      </Link>

      <div className="card p-6">
        <h1 className="text-2xl font-bold text-slate-900">新建购票订单</h1>
        <p className="text-sm text-slate-500 mt-1">选择票种与数量，录入客户信息后快速创建订单</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="card p-5 col-span-2">
          <div className="section-title text-base mb-4 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-slate-500" />
            选择票种
          </div>
          <div className="space-y-3">
            {ticketTypes.length === 0 && <div className="py-10 text-center text-slate-400">当前活动下无在售票种</div>}
            {ticketTypes.map((t) => {
              const left = Math.max(0, t.totalStock - t.soldCount);
              const q = qtyOf(t.id);
              return (
                <div key={t.id} className="p-4 rounded-xl border border-slate-200 hover:border-brand-300 transition-colors">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="font-semibold text-slate-900">{t.name}</div>
                        <span className={STATUS_STYLES[t.status]}>{LABELS.TicketTypeStatus[t.status]}</span>
                      </div>
                      {t.description && <div className="text-xs text-slate-500 mt-0.5">{t.description}</div>}
                      <div className="mt-2 flex items-center gap-3 text-xs text-slate-600">
                        <span>库存 <strong className="text-slate-900">{t.totalStock}</strong></span>
                        <span>已售 <strong className="text-slate-900">{t.soldCount}</strong></span>
                        <span>剩余 <strong className={left < t.perLimit ? 'text-amber-600' : 'text-emerald-600'}>{left}</strong></span>
                        <span>每人限购 <strong>{t.perLimit}</strong> 张</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xl font-bold text-brand-600">¥ {fmtMoney(t.price)}</div>
                      {t.originalPrice && (
                        <div className="text-xs text-slate-400 line-through">¥ {fmtMoney(t.originalPrice)}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center disabled:opacity-40"
                        disabled={q === 0}
                        onClick={() => setQty(t.id, q - 1, t.perLimit)}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <div className="w-12 text-center font-semibold text-slate-900">{q}</div>
                      <button
                        className="w-9 h-9 rounded-lg bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center disabled:opacity-40"
                        disabled={q >= t.perLimit || q >= left}
                        onClick={() => setQty(t.id, q + 1, t.perLimit)}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {q > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-sm">
                      <span className="text-slate-500">小计</span>
                      <span className="font-semibold text-slate-900">
                        ¥ {fmtMoney((t.price?.toNumber?.() || t.price) * q)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <div className="section-title text-base mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              客户信息
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <label className="label">客户姓名 *</label>
                <input className="input" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
              </div>
              <div>
                <label className="label">手机号 *</label>
                <input className="input" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
              </div>
              <div>
                <label className="label">邮箱 (选填)</label>
                <input className="input" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />
              </div>
              <div>
                <label className="label">来源渠道</label>
                <select className="input" value={channel} onChange={(e) => setChannel(e.target.value)}>
                  <option value="ONLINE">线上官方</option>
                  <option value="OFFLINE">线下柜台</option>
                  <option value="PARTNER">合作渠道</option>
                  <option value="GROUP">团体购票</option>
                  <option value="VIP">贵宾通道</option>
                </select>
              </div>
              <div>
                <label className="label">备注</label>
                <textarea className="input min-h-[72px]" value={remark} onChange={(e) => setRemark(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="card p-5 sticky top-24">
            <div className="section-title text-base mb-4">订单汇总</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">票种数</span>
                <span className="font-medium">{cart.length} 种</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">总数量</span>
                <span className="font-medium">{totalQty} 张</span>
              </div>
              <div className="flex justify-between pt-3 mt-3 border-t border-slate-100">
                <span className="text-slate-700 font-medium">应付金额</span>
                <span className="text-2xl font-bold text-brand-600">¥ {fmtMoney(totalAmt)}</span>
              </div>
            </div>
            <button
              className="btn-primary w-full mt-5"
              onClick={submit}
              disabled={cart.length === 0 || !customer.name || !customer.phone}
            >
              <ShoppingCart className="w-4 h-4" /> 确认创建订单
            </button>
            <div className="mt-3 text-xs text-slate-400 text-center">
              订单创建后初始状态为「待支付」，可在订单详情中登记支付
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
