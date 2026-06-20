import { useState, useEffect } from 'react';
import {
  getRefundDisputes,
  getSampleDetail,
  getCheckinCodeCaliber,
} from '@/api';
import type {
  RefundDispute,
  SampleDetail,
  CheckInCodeCaliber,
} from '@/types';

type StatusFilter = 'all' | 'pending' | 'processing' | 'resolved' | 'rejected';

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-400/15 text-yellow-400',
  processing: 'bg-cyan-400/15 text-cyan-400',
  resolved: 'bg-green-400/15 text-green-400',
  rejected: 'bg-red-400/15 text-red-400',
};

const STATUS_LABEL: Record<string, string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
  rejected: '已驳回',
};

export default function RefundDispute() {
  const [disputes, setDisputes] = useState<RefundDispute[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SampleDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [calibers, setCalibers] = useState<CheckInCodeCaliber[]>([]);
  const [caliberOpen, setCaliberOpen] = useState(false);
  const [caliberLoading, setCaliberLoading] = useState(true);
  const pageSize = 10;

  useEffect(() => {
    setLoading(true);
    getRefundDisputes({
      status: statusFilter === 'all' ? undefined : statusFilter,
      page,
      pageSize,
    })
      .then((res) => {
        setDisputes(res.data?.items ?? []);
        setTotal(res.data?.total ?? 0);
      })
      .catch(() => {
        setDisputes([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [statusFilter, page]);

  useEffect(() => {
    if (!selectedId) return;
    setDetailLoading(true);
    getSampleDetail(selectedId)
      .then((res) => setDetail(res.data ?? null))
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  }, [selectedId]);

  useEffect(() => {
    getCheckinCodeCaliber()
      .then((res) => setCalibers(res.data ?? []))
      .catch(() => setCalibers([]))
      .finally(() => setCaliberLoading(false));
  }, []);

  const totalPages = Math.ceil(total / pageSize);

  const closeDrawer = () => {
    setSelectedId(null);
    setDetail(null);
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-slate-100">退票争议</h1>

      <div className="flex gap-2">
        {(['all', 'pending', 'processing', 'resolved', 'rejected'] as StatusFilter[]).map(
          (s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                statusFilter === s
                  ? 'bg-cyan-400/15 text-cyan-400'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-300'
              }`}
            >
              {s === 'all' ? '全部' : STATUS_LABEL[s]}
            </button>
          )
        )}
      </div>

      {loading ? (
        <div className="glass-card flex h-64 items-center justify-center rounded-xl">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        </div>
      ) : (
        <div className="glass-card overflow-hidden rounded-xl border border-white/5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left text-slate-400">
                  <th className="px-4 py-3 font-medium">争议ID</th>
                  <th className="px-4 py-3 font-medium">订单ID</th>
                  <th className="px-4 py-3 font-medium">购票人</th>
                  <th className="px-4 py-3 font-medium">金额</th>
                  <th className="px-4 py-3 font-medium">原因</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                  <th className="px-4 py-3 font-medium">创建时间</th>
                </tr>
              </thead>
              <tbody>
                {disputes.map((d) => (
                  <tr
                    key={d.disputeId}
                    onClick={() => setSelectedId(d.disputeId)}
                    className="cursor-pointer border-b border-white/5 text-slate-300 transition-colors hover:bg-white/5"
                  >
                    <td className="px-4 py-3 font-mono text-xs">{d.disputeId}</td>
                    <td className="px-4 py-3 font-mono text-xs">{d.orderId}</td>
                    <td className="px-4 py-3">{d.buyerName}</td>
                    <td className="px-4 py-3">¥{d.amount.toFixed(2)}</td>
                    <td className="max-w-[200px] truncate px-4 py-3">{d.reason}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          STATUS_BADGE[d.status]
                        }`}
                      >
                        {STATUS_LABEL[d.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{d.createTime}</td>
                  </tr>
                ))}
                {disputes.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                      暂无争议记录
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-white/5 px-4 py-3">
              <span className="text-sm text-slate-400">
                共 {total} 条，第 {page}/{totalPages} 页
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-lg bg-white/5 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:bg-white/10 disabled:opacity-40"
                >
                  上一页
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
                  )
                  .map((p, i, arr) => (
                    <span key={p} className="flex items-center">
                      {i > 0 && arr[i - 1] !== p - 1 && (
                        <span className="px-1 text-slate-500">…</span>
                      )}
                      <button
                        onClick={() => setPage(p)}
                        className={`min-w-[2rem] rounded-lg px-2 py-1.5 text-sm transition-colors ${
                          page === p
                            ? 'bg-cyan-400/15 text-cyan-400'
                            : 'bg-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded-lg bg-white/5 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:bg-white/10 disabled:opacity-40"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedId && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={closeDrawer}
          />
          <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col glass-card border-l border-white/10">
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
              <h2 className="font-display text-lg font-semibold text-slate-100">
                争议详情
              </h2>
              <button
                onClick={closeDrawer}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {detailLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                </div>
              ) : detail ? (
                <div className="space-y-4">
                  <RecordCard
                    icon="💳"
                    color="cyan"
                    title="支付记录"
                    record={detail.paymentRecord}
                    render={(r) => (
                      <>
                        <DetailRow label="交易ID" value={r.transactionId} mono />
                        <DetailRow label="金额" value={`¥${r.amount.toFixed(2)}`} />
                        <DetailRow label="支付方式" value={r.payMethod} />
                        <DetailRow label="支付时间" value={r.payTime} />
                        <DetailRow label="状态" value={r.status} />
                      </>
                    )}
                  />
                  <RecordCard
                    icon="📡"
                    color="green"
                    title="签到记录"
                    record={detail.checkInRecord}
                    render={(r) => (
                      <>
                        <DetailRow label="签到码" value={r.checkInCode} mono />
                        <DetailRow label="扫描时间" value={r.scanTime} />
                        <DetailRow label="扫描人" value={r.scanner} />
                        <DetailRow label="位置" value={r.location} />
                        <DetailRow label="状态" value={r.status} />
                      </>
                    )}
                  />
                  <RecordCard
                    icon="🚪"
                    color="orange"
                    title="闸机记录"
                    record={detail.gateRecord}
                    render={(r) => (
                      <>
                        <DetailRow label="闸机码" value={r.gateCode} mono />
                        <DetailRow label="设备ID" value={r.deviceId} mono />
                        <DetailRow label="通行时间" value={r.passTime} />
                        <DetailRow
                          label="方向"
                          value={r.direction === 'in' ? '进场' : '出场'}
                        />
                      </>
                    )}
                  />
                </div>
              ) : (
                <p className="text-slate-500">无法加载详情</p>
              )}
            </div>
          </div>
        </>
      )}

      <div className="glass-card rounded-xl border border-white/5">
        <button
          onClick={() => setCaliberOpen(!caliberOpen)}
          className="flex w-full items-center justify-between px-6 py-4 text-left"
        >
          <h2 className="font-display text-lg font-semibold text-slate-100">
            签到码口径说明
          </h2>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`text-slate-400 transition-transform ${
              caliberOpen ? 'rotate-180' : ''
            }`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {caliberOpen && (
          <div className="border-t border-white/5 px-6 pb-6 pt-4">
            {caliberLoading ? (
              <div className="flex h-20 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
              </div>
            ) : (
              <div className="space-y-4">
                {calibers.map((c) => (
                  <div
                    key={c.version}
                    className="rounded-lg border border-white/5 bg-white/[0.02] p-4"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded bg-cyan-400/15 px-2 py-0.5 font-mono text-xs text-cyan-400">
                        {c.version}
                      </span>
                      <span className="font-medium text-slate-200">{c.name}</span>
                      <span className="text-xs text-slate-500">
                        {c.effectiveDate}
                      </span>
                    </div>
                    <div className="mb-2 rounded bg-black/30 px-3 py-2">
                      <code className="font-mono text-sm text-cyan-300">
                        {c.formula}
                      </code>
                    </div>
                    <p className="text-sm text-slate-400">{c.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-slate-400">{label}</span>
      <span className={mono ? 'font-mono text-xs' : ''}>{value}</span>
    </div>
  );
}

function RecordCard<T>({
  icon,
  color,
  title,
  record,
  render,
}: {
  icon: string;
  color: 'cyan' | 'green' | 'orange';
  title: string;
  record: T | null;
  render: (r: T) => React.ReactNode;
}) {
  const borderColor: Record<string, string> = {
    cyan: 'border-l-cyan-400',
    green: 'border-l-green-400',
    orange: 'border-l-orange-400',
  };
  return (
    <div
      className={`rounded-lg border border-white/5 border-l-4 ${borderColor[color]} bg-white/[0.02] p-4`}
    >
      <h3 className="mb-2 flex items-center gap-2 font-medium text-slate-200">
        <span>{icon}</span>
        {title}
      </h3>
      {record ? (
        <div className="space-y-0.5 text-sm text-slate-300">
          {render(record)}
        </div>
      ) : (
        <p className="text-sm text-slate-500">无记录</p>
      )}
    </div>
  );
}
