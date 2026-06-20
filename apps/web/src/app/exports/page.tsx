'use client';

import { useEffect, useState } from 'react';
import {
  FileSpreadsheet, Download, TrendingUp, Info, Calendar, RefreshCw, CheckCircle2,
  Users, ShoppingBag, AlertTriangle, QrCode, BookOpen,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useActivityId } from '@/components/ActivitySelector';
import { fmtDateTime } from '@/lib/utils';

const EXPORT_TYPES = [
  {
    key: 'checkin_efficiency',
    name: '核销效率报表',
    desc: '签到码发放、已核销、待核销、过期、作废明细及核销率统计',
    icon: QrCode,
    color: 'from-emerald-500 to-teal-600',
  },
  {
    key: 'orders',
    name: '订单明细报表',
    desc: '所有订单的客户、金额、支付、退款明细及订单状态分布',
    icon: ShoppingBag,
    color: 'from-brand-500 to-brand-700',
  },
  {
    key: 'sales',
    name: '销售统计报表',
    desc: '按票种维度统计销售数量、金额、销售率，帮助评估定价策略',
    icon: TrendingUp,
    color: 'from-amber-500 to-orange-600',
  },
  {
    key: 'exceptions',
    name: '异常单报表',
    desc: '异常单分类、严重程度、责任归属、处理周期等管理分析数据',
    icon: AlertTriangle,
    color: 'from-rose-500 to-rose-600',
  },
];

export default function ExportsPage() {
  const activityId = useActivityId();
  const [tasks, setTasks] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>('checkin_efficiency');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [caliber, setCaliber] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  useEffect(() => {
    api.get('/exports/tasks', { activityId }).then(setTasks);
    api.get(`/exports/caliber/${selected}`).then((r: any) => setCaliber(r.caliberNotes || []));
  }, [activityId, selected]);

  const trigger = async () => {
    setProcessing(true);
    setLastResult(null);
    try {
      const r = await api.post('/exports', {
        exportType: selected,
        activityId,
        dateRangeFrom: dateFrom || undefined,
        dateRangeTo: dateTo || undefined,
      });
      setLastResult(r);
      api.get('/exports/tasks', { activityId }).then(setTasks);
    } finally {
      setProcessing(false);
    }
  };

  const currentType = EXPORT_TYPES.find((t) => t.key === selected)!;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FileSpreadsheet className="w-7 h-7 text-brand-600" />
          报表导出中心
        </h1>
        <p className="text-sm text-slate-500 mt-1">所有导出文件自带口径说明工作表，方便团队解读数据变化</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {EXPORT_TYPES.map((t) => {
          const active = selected === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setSelected(t.key)}
              className={`card p-5 text-left transition-all hover:shadow-md ${active ? 'ring-2 ring-brand-500 ring-offset-2' : ''}`}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${t.color} text-white flex items-center justify-center mb-3`}>
                <t.icon className="w-5 h-5" />
              </div>
              <div className="font-semibold text-slate-900">{t.name}</div>
              <div className="text-xs text-slate-500 mt-1 leading-relaxed">{t.desc}</div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="card p-6 col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="section-title !mb-0 flex items-center gap-2">
                <currentType.icon className="w-5 h-5 text-slate-500" />
                导出「{currentType.name}」
              </div>
              <div className="text-xs text-slate-500 mt-1">设置时间范围后点击生成报表</div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <BookOpen className="w-3.5 h-3.5" /> 附带口径说明 Sheet
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="label flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> 起始日期
              </label>
              <input type="date" className="input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="label flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> 结束日期
              </label>
              <input type="date" className="input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>

          <div className="mb-6">
            <div className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-slate-500" />
              口径预览（导出文件首 Sheet 将包含以下说明）
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200 space-y-1.5">
              {caliber.length === 0 && <div className="text-sm text-slate-400">加载中...</div>}
              {caliber.map((c, i) => (
                <div key={i} className="text-sm text-slate-700 leading-relaxed">
                  <span className="text-sky-600 font-mono mr-1.5">{String(i + 1).padStart(2, '0')}.</span>
                  {c.replace(/^(\d+)\.\s*/, '').replace(/^核销效率口径说明：|^订单导出口径说明：|^销售明细口径说明：|^异常单导出口径说明：/, '')}
                </div>
              ))}
            </div>
            <div className="text-xs text-slate-400 mt-2">
              💡 口径说明作用：统一团队对统计指标的理解，避免因统计口径不同造成数据解读差异
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="btn-primary min-w-[160px]"
              onClick={trigger}
              disabled={processing}
            >
              {processing ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> 生成中...</>
              ) : (
                <><Download className="w-4 h-4" /> 生成并下载报表</>
              )}
            </button>
            {lastResult && (
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm">生成成功！任务 ID：{lastResult.taskId.slice(0, 12)}...</span>
                {lastResult.fileUrl && !lastResult.fileUrl.startsWith('data:') && (
                  <a href={lastResult.fileUrl} target="_blank" className="underline ml-2 text-emerald-700">
                    打开文件
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="card p-5">
          <div className="section-title !mb-3 text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-500" />
            报表使用建议
          </div>
          <div className="space-y-3 text-sm">
            <Tip icon={QrCode} title="核销效率报表">
              建议活动结束后 24 小时内导出，与活动前预售规模对比，评估到场率。
            </Tip>
            <Tip icon={ShoppingBag} title="订单明细报表">
              每日运营例会前导出，作为订单对账和销售趋势分析的基础数据源。
            </Tip>
            <Tip icon={TrendingUp} title="销售统计报表">
              用于复盘票价策略，对比不同票种的销售率，指导下次活动定价。
            </Tip>
            <Tip icon={AlertTriangle} title="异常单报表">
              月度复盘会议使用，统计异常分布、处理周期，定位流程改进方向。
            </Tip>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="text-sm font-medium text-slate-700 mb-2">导出文件说明</div>
            <ul className="text-xs text-slate-500 space-y-1 list-disc pl-4">
              <li>Excel 格式 (XLSX)，多 Sheet 结构</li>
              <li>Sheet 1：口径说明（指标定义与统计规则）</li>
              <li>Sheet 2：汇总统计（高层视角关键指标）</li>
              <li>Sheet 3+：业务明细（可用于透视分析）</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="section-title !mb-3 text-base">最近导出任务</div>
        {tasks.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">暂无任务记录，点击上方按钮生成第一张报表</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>任务名称</th>
                <th>类型</th>
                <th>时间范围</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>下载</th>
              </tr>
            </thead>
            <tbody>
              {tasks.slice(0, 10).map((t) => (
                <tr key={t.id}>
                  <td className="font-medium">{t.taskName}</td>
                  <td>
                    {(() => {
                      const tp = EXPORT_TYPES.find((e) => e.key === t.exportType);
                      return tp ? (
                        <span className="inline-flex items-center gap-1.5">
                          <tp.icon className="w-3.5 h-3.5 text-slate-500" />
                          {tp.name}
                        </span>
                      ) : t.exportType;
                    })()}
                  </td>
                  <td className="text-sm text-slate-600">
                    {t.dateRangeFrom || t.dateRangeTo
                      ? `${t.dateRangeFrom?.toString().slice(0, 10) || '不限'} ~ ${t.dateRangeTo?.toString().slice(0, 10) || '不限'}`
                      : '全部'}
                  </td>
                  <td>
                    <span className={`badge ${t.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : t.status === 'PROCESSING' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                      {t.status === 'COMPLETED' ? '已完成' : t.status === 'PROCESSING' ? '处理中' : '失败'}
                    </span>
                  </td>
                  <td className="text-xs text-slate-500">{fmtDateTime(t.createdAt)}</td>
                  <td>
                    {t.fileUrl && t.status === 'COMPLETED' ? (
                      t.fileUrl.startsWith('data:') ? (
                        <a
                          href={t.fileUrl}
                          download={`${t.taskName}.xlsx`}
                          className="btn-primary !px-3 !py-1 text-xs inline-flex"
                        >
                          <Download className="w-3 h-3" /> 下载
                        </a>
                      ) : (
                        <a href={t.fileUrl} target="_blank" className="btn-primary !px-3 !py-1 text-xs inline-flex">
                          <Download className="w-3 h-3" /> 下载
                        </a>
                      )
                    ) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Tip({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-brand-600" />
        <span className="font-medium text-slate-800">{title}</span>
      </div>
      <div className="text-xs text-slate-600 leading-relaxed pl-6">{children}</div>
    </div>
  );
}
