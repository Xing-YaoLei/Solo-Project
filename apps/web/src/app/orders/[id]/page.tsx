'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Clock, User, CreditCard, AlertTriangle, QrCode, ShieldAlert,
  History as HistoryIcon, ChevronRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { fmtMoney, fmtDateTime, STATUS_STYLES, LABELS } from '@/lib/utils';

const NEXT_STATUSES: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  PAID: ['CONFIRMED', 'CANCELLED', 'REFUNDING'],
  CONFIRMED: ['COMPLETED', 'REFUNDING', 'DISPUTED'],
  REFUNDING: ['REFUNDED', 'CONFIRMED'],
  DISPUTED: ['CONFIRMED', 'REFUNDED'],
};

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  const refresh = () => {
    api.get(`/orders/${params.id}`).then(setOrder);
    api.get(`/orders/${params.id}/history`).then(setHistory);
  };
  useEffect(() => { refresh(); }, [params.id]);

  const changeStatus = async (to: string) => {
    const note = prompt(`变更状态为「${LABELS.OrderStatus[to]}」，请填写变更说明（可选）`) || undefined;
    await api.put(`/orders/${params.id}/status`, { toStatus: to, note });
    refresh();
  };

  const pay = async () => {
    const method = prompt('支付方式', 'WECHAT') || 'WECHAT';
    await api.post(`/orders/${params.id}/pay`, { paymentMethod: method });
    refresh();
  };

  const raiseException = async () => {
    const type = 'REFUND_DISPUTE';
    const title = prompt('异常标题', '退票争议 - ' + order?.orderNo) || `退票争议 - ${order?.orderNo}`;
    const desc = prompt('描述', '客户要求退票，请核查原因') || '客户要求退票，请核查原因';
    const impact = prompt('影响范围', `涉及订单 ${order?.orderNo}`) || `涉及订单 ${order?.orderNo}`;
    await api.post('/exceptions', {
      orderId: params.id,
      activityId: order?.activityId,
      type, title, description: desc,
      severity: 'MEDIUM',
      impactScope: impact,
    });
    alert('异常单已创建，请前往异常处理模块跟进');
    refresh();
  };

  if (!order) return <div className="text-slate-500">加载中...</div>;

  const nextOps = NEXT_STATUSES[order.status] || [];

  return (
    <div className="space-y-6">
      <Link href="/orders" className="text-sm text-brand-600 hover:underline inline-flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> 返回订单列表
      </Link>

      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 font-mono">{order.orderNo}</h1>
              <span className={STATUS_STYLES[order.status] + ' text-sm'}>
                {LABELS.OrderStatus[order.status] || order.status}
              </span>
              {order.status === 'DISPUTED' && (
                <span className="badge bg-rose-50 text-rose-600 border border-rose-200">
                  <AlertTriangle className="w-3 h-3 mr-1" /> 存在争议
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-1">创建时间：{fmtDateTime(order.createdAt)}</div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {order.status === 'PENDING' && (
              <button className="btn-primary" onClick={pay}>
                <CreditCard className="w-4 h-4" /> 登记支付
              </button>
            )}
            {nextOps.map((st) => (
              <button key={st} className="btn-outline" onClick={() => changeStatus(st)}>
                {st === 'DISPUTED' ? <ShieldAlert className="w-4 h-4" /> : null}
                变更为：{LABELS.OrderStatus[st] || st}
              </button>
            ))}
            <button className="btn-secondary" onClick={raiseException}>
              <AlertTriangle className="w-4 h-4" /> 创建异常单
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="card p-5 col-span-1">
          <div className="section-title text-base">客户信息</div>
          <div className="space-y-3 text-sm">
            <InfoRow label="姓名" value={order.customerName} />
            <InfoRow label="手机" value={order.customerPhone} />
            <InfoRow label="邮箱" value={order.customerEmail || '-'} />
            <InfoRow label="来源渠道" value={order.sourceChannel || 'ONLINE'} />
            <InfoRow label="操作人" value={order.operatorId || '系统自动'} />
            {order.remark && <InfoRow label="备注" value={order.remark} />}
          </div>

          <div className="section-title text-base mt-8">金额信息</div>
          <div className="space-y-2 text-sm">
            <InfoRow label="原价合计" value={'¥ ' + fmtMoney(order.totalAmount)} />
            <InfoRow label="优惠金额" value={'¥ ' + fmtMoney(order.discountAmount)} />
            <InfoRow label="实际支付" value={'¥ ' + fmtMoney(order.paidAmount)} strong />
            {order.paidAt && <InfoRow label="支付时间" value={fmtDateTime(order.paidAt)} />}
            {order.confirmedAt && <InfoRow label="确认时间" value={fmtDateTime(order.confirmedAt)} />}
            {order.completedAt && <InfoRow label="完成时间" value={fmtDateTime(order.completedAt)} />}
            {order.cancelledAt && <InfoRow label="取消时间" value={fmtDateTime(order.cancelledAt)} />}
          </div>
        </div>

        <div className="card p-5 col-span-2">
          <div className="section-title text-base mb-4">
            订单明细（共 {order.orderItems?.length || 0} 项）
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>票种</th>
                <th>数量</th>
                <th>单价</th>
                <th>小计</th>
                <th>座位</th>
                <th>签到码</th>
              </tr>
            </thead>
            <tbody>
              {order.orderItems?.map((i: any) => (
                <tr key={i.id}>
                  <td>
                    <div className="font-medium text-slate-900">{i.ticketType?.name}</div>
                    {i.seatId && <div className="text-xs text-slate-500">对号入座</div>}
                  </td>
                  <td>× {i.quantity}</td>
                  <td>¥ {fmtMoney(i.unitPrice)}</td>
                  <td className="font-semibold">¥ {fmtMoney(i.subtotal)}</td>
                  <td>{i.seat?.label || '通票'}</td>
                  <td>
                    <Link href={`/check-in?orderId=${order.id}`} className="text-brand-600 hover:underline text-xs inline-flex items-center">
                      <QrCode className="w-3 h-3 mr-1" /> 查看签到码
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {(order.refunds?.length || 0) > 0 && (
            <div className="mt-8">
              <div className="section-title text-base mb-3">退款记录</div>
              <div className="space-y-2">
                {order.refunds.map((r: any) => (
                  <div key={r.id} className="p-3 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="font-mono text-sm">{r.refundNo}</div>
                      <div className="text-sm font-semibold text-rose-600">- ¥{fmtMoney(r.refundAmount)}</div>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      原因：{r.refundReason || '-'} · 申请时间 {fmtDateTime(r.appliedAt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8">
            <div className="section-title text-base mb-3 flex items-center gap-2">
              <HistoryIcon className="w-4 h-4" />
              状态变更历史（可追溯）
            </div>
            <div className="relative border-l-2 border-slate-200 pl-6 ml-2 space-y-5">
              {history.map((h: any) => (
                <div key={h.id} className="relative">
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-white bg-slate-400" />
                  <div className="flex items-center gap-2">
                    {h.fromStatus && (
                      <>
                        <span className={STATUS_STYLES[h.fromStatus]}>{LABELS.OrderStatus[h.fromStatus] || h.fromStatus}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                      </>
                    )}
                    <span className={STATUS_STYLES[h.toStatus]}>{LABELS.OrderStatus[h.toStatus] || h.toStatus}</span>
                  </div>
                  {h.changeNote && <div className="text-sm text-slate-700 mt-1">{h.changeNote}</div>}
                  {h.changeReason && <div className="text-xs text-slate-500">原因：{h.changeReason}</div>}
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                    <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{fmtDateTime(h.changedAt)}</span>
                    <span className="inline-flex items-center gap-1"><User className="w-3 h-3" />{h.changedBy || '系统'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-2">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className={strong ? 'font-semibold text-slate-900' : 'text-slate-800 text-right'}>{value}</span>
    </div>
  );
}
