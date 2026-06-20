'use client';

import { useEffect, useState } from 'react';
import { QrCode, CheckCircle, XCircle, Search, Scan, LogIn, LogOut, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { useActivityId } from '@/components/ActivitySelector';
import { fmtDateTime, STATUS_STYLES, LABELS, fmtPercent } from '@/lib/utils';

export default function CheckInPage() {
  const activityId = useActivityId();
  const [stats, setStats] = useState<any>({});
  const [list, setList] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [statusFilter, setStatusFilter] = useState('');
  const [keyword, setKeyword] = useState('');

  const [verifyCode, setVerifyCode] = useState('');
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [verifyError, setVerifyError] = useState('');

  useEffect(() => {
    api.get('/check-in/stats/by-activity', { activityId }).then(setStats);
    api.get('/check-in', { activityId, status: statusFilter, keyword, page, pageSize })
      .then((d: any) => setList(d.list || []));
  }, [activityId, statusFilter, keyword, page]);

  const verify = async () => {
    setVerifyError('');
    setVerifyResult(null);
    try {
      const r = await api.get(`/check-in/${encodeURIComponent(verifyCode)}/verify`);
      setVerifyResult(r);
    } catch (e: any) {
      setVerifyError(e.message || '验证失败');
    }
  };

  const doCheckIn = async () => {
    if (!verifyResult) return;
    try {
      await api.post(`/check-in/${encodeURIComponent(verifyResult.code)}/check-in`);
      alert('核销成功！');
      setVerifyCode('');
      setVerifyResult(null);
      api.get('/check-in/stats/by-activity', { activityId }).then(setStats);
      api.get('/check-in', { activityId, status: statusFilter, keyword, page, pageSize })
        .then((d: any) => setList(d.list || []));
    } catch (e: any) {
      alert('核销失败：' + (e.message || ''));
    }
  };

  const STAT_CARDS = [
    { label: '发放总数', value: stats.total || 0, color: 'from-brand-500 to-brand-700', icon: QrCode },
    { label: '待核销', value: stats.pending || 0, color: 'from-amber-500 to-orange-600', icon: Scan },
    { label: '已入场', value: stats.checkedIn || 0, color: 'from-emerald-500 to-teal-600', icon: LogIn },
    { label: '核销率', value: fmtPercent(stats.rate || 0), color: 'from-violet-500 to-purple-600', icon: CheckCircle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">签到核销台</h1>
        <p className="text-sm text-slate-500 mt-1">验证签到码有效性并快速完成入场核销</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {STAT_CARDS.map((c) => (
          <div key={c.label} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-slate-500">{c.label}</div>
                <div className="mt-2 text-2xl font-bold text-slate-900">{c.value}</div>
              </div>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} text-white flex items-center justify-center`}>
                <c.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="card p-6 col-span-2">
          <div className="section-title">扫码核销</div>
          <div className="space-y-4">
            <div>
              <label className="label">签到码</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Scan className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    className="input pl-9"
                    placeholder="输入或扫描签到码（例如 CIORD...）"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && verify()}
                  />
                </div>
                <button className="btn-primary" onClick={verify}>
                  <Search className="w-4 h-4" /> 验证
                </button>
              </div>
            </div>

            {verifyError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2">
                <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium">验证失败</div>
                  <div className="text-sm mt-0.5">{verifyError}</div>
                </div>
              </div>
            )}

            {verifyResult && (
              <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white border border-emerald-200 flex items-center justify-center">
                      <QrCode className="w-7 h-7 text-emerald-600" />
                    </div>
                    <div>
                      <div className="font-bold text-emerald-800">签到码有效</div>
                      <div className="text-xs text-emerald-600 mt-0.5 font-mono">{verifyResult.code}</div>
                    </div>
                  </div>
                  <button className="btn-primary" onClick={doCheckIn}>
                    <CheckCircle className="w-4 h-4" /> 确认入场核销
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
                  <InfoCell label="票种" value={verifyResult.ticketName} />
                  <InfoCell label="客户姓名" value={verifyResult.customerName} />
                  <InfoCell label="座位" value={verifyResult.seatLabel || '无'} />
                  <InfoCell label="关联订单" value={verifyResult.order?.orderNo || '-'} />
                  <InfoCell label="状态" value={<span className={STATUS_STYLES[verifyResult.status]}>{LABELS.CheckInStatus[verifyResult.status]}</span>} />
                  <InfoCell label="过期时间" value={fmtDateTime(verifyResult.expireAt)} />
                </div>
              </div>
            )}

            {!verifyResult && !verifyError && (
              <div className="p-8 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 text-center text-slate-500">
                <Scan className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <div className="text-sm">请输入或扫描签到码开始验证</div>
                <div className="text-xs mt-2 text-slate-400">支持扫码枪直接输入，输入后回车即可验证</div>
              </div>
            )}
          </div>
        </div>

        <div className="card p-5">
          <div className="section-title !mb-3 text-base">核销效率</div>
          <div className="space-y-4">
            <EfficiencyBar label="待核销" value={stats.pending || 0} total={stats.total || 0} color="bg-amber-500" />
            <EfficiencyBar label="已入场" value={stats.checkedIn || 0} total={stats.total || 0} color="bg-emerald-500" />
            <EfficiencyBar label="已离场" value={stats.checkedOut || 0} total={stats.total || 0} color="bg-sky-500" />
            <EfficiencyBar label="已过期" value={stats.expired || 0} total={stats.total || 0} color="bg-slate-400" />
            <EfficiencyBar label="已作废" value={stats.invalid || 0} total={stats.total || 0} color="bg-rose-400" />
          </div>
          {stats.total > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="text-xs text-slate-500 mb-1">整体核销进度</div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all"
                  style={{ width: `${((stats.rate || 0) * 100).toFixed(1)}%` }}
                />
              </div>
              <div className="mt-2 text-right text-sm font-semibold text-slate-700">{fmtPercent(stats.rate || 0)}</div>
            </div>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              className="input pl-9"
              placeholder="搜索签到码 / 客户 / 票种"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <select className="input !w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">全部状态</option>
            {Object.entries(LABELS.CheckInStatus).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>签到码</th>
              <th>票种</th>
              <th>客户</th>
              <th>手机号</th>
              <th>关联订单</th>
              <th>座位</th>
              <th>状态</th>
              <th>核销时间</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan={8} className="text-center py-10 text-slate-400">暂无数据</td></tr>}
            {list.map((c: any) => (
              <tr key={c.id}>
                <td className="font-mono text-sm">{c.code}</td>
                <td>{c.ticketName}</td>
                <td className="font-medium">{c.customerName}</td>
                <td className="text-slate-600">{c.order?.customerPhone || '-'}</td>
                <td className="font-mono text-xs text-brand-600">{c.order?.orderNo || '-'}</td>
                <td>{c.seatLabel || '-'}</td>
                <td>
                  <span className={STATUS_STYLES[c.status]}>{LABELS.CheckInStatus[c.status] || c.status}</span>
                </td>
                <td className="text-xs text-slate-500">{fmtDateTime(c.checkInAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-xs text-slate-500 mb-0.5">{label}</div>
      <div className="text-slate-900">{value}</div>
    </div>
  );
}

function EfficiencyBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total ? value / total : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-600">{label}</span>
        <span className="text-slate-900 font-medium">{value} ({fmtPercent(pct, 0)})</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${(pct * 100).toFixed(1)}%` }} />
      </div>
    </div>
  );
}
