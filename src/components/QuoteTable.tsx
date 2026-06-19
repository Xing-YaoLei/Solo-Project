'use client';

import { Fragment } from 'react';
import { ChevronDown, ChevronRight, ExternalLink, Banknote, CreditCard, ShieldCheck, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { useDashboardStore } from '@/store/dashboard';

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  draft: { label: '草稿', cls: 'bg-industrial-600/50 text-industrial-200' },
  approved: { label: '已确认', cls: 'bg-risk-info/20 text-risk-info' },
  completed: { label: '已完成', cls: 'bg-risk-success/20 text-risk-success' },
};

const INSURANCE_STATUS_LABEL: Record<string, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒赔',
  settled: '已结算',
};

export function QuoteTable() {
  const { quotes, expandedQuoteId, toggleQuoteExpand, isLoading } = useDashboardStore();

  if (isLoading || quotes.length === 0) {
    return (
      <div className="h-[340px] animate-pulse rounded-xl border border-industrial-700 bg-industrial-800" />
    );
  }

  return (
    <div className="rounded-xl border border-industrial-700 bg-gradient-to-br from-industrial-800/80 to-industrial-900/80">
      <div className="flex items-center justify-between border-b border-industrial-700 px-5 py-4">
        <div>
          <h3 className="font-display text-sm font-bold tracking-wide text-white">报价单明细</h3>
          <p className="mt-0.5 text-[11px] text-industrial-400">点击展开查看收款追溯、保险理赔与配件明细</p>
        </div>
        <span className="rounded-md bg-industrial-700/60 px-2 py-1 text-[11px] text-industrial-300">
          共 {quotes.length} 条
        </span>
      </div>

      <div className="max-h-[300px] overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-industrial-800/95 backdrop-blur">
            <tr className="text-left text-industrial-400">
              <th className="w-8 px-4 py-2.5 font-medium" />
              <th className="px-4 py-2.5 font-medium">报价单号</th>
              <th className="px-4 py-2.5 font-medium">客户</th>
              <th className="px-4 py-2.5 font-medium">车牌</th>
              <th className="px-4 py-2.5 font-medium text-right">应收</th>
              <th className="px-4 py-2.5 font-medium text-right">已付</th>
              <th className="px-4 py-2.5 font-medium text-right">欠款</th>
              <th className="px-4 py-2.5 font-medium">保险</th>
              <th className="px-4 py-2.5 font-medium">状态</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((q) => {
              const expanded = expandedQuoteId === q.id;
              const status = STATUS_MAP[q.status];
              const balance = (q.balance ?? 0);
              const totalPaid = (q.totalPaid ?? 0);
              const hasInsurance = (q.insurance?.claims?.length || 0) > 0;
              const insuranceRejected = q.insurance?.claims?.some((c: any) => c.status === 'rejected');
              const hasPartsGap = q.partTraceability?.some((p: any) => p.isGap);
              return (
                <Fragment key={q.id}>
                  <tr
                    onClick={() => toggleQuoteExpand(q.id)}
                    className="cursor-pointer border-t border-industrial-700/50 text-industrial-200 transition hover:bg-industrial-700/30"
                  >
                    <td className="px-4 py-3">
                      {expanded ? (
                        <ChevronDown className="h-3.5 w-3.5 text-industrial-400" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-industrial-400" />
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-white">
                      <div className="flex items-center gap-1">
                        {q.quoteNo}
                        {hasPartsGap && (
                          <span className="relative" title="含库存缺口配件">
                            <AlertCircle className="h-3 w-3 text-risk-danger" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">{q.customerName}</td>
                    <td className="px-4 py-3 font-mono">{q.vehiclePlate}</td>
                    <td className="px-4 py-3 text-right font-mono">¥{q.totalAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono text-risk-success">¥{totalPaid.toLocaleString()}</td>
                    <td className={`px-4 py-3 text-right font-mono font-semibold ${balance > 0 ? 'text-risk-danger' : 'text-industrial-400'}`}>
                      {balance > 0 ? `¥${balance.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {hasInsurance ? (
                        <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${insuranceRejected ? 'bg-risk-danger/20 text-risk-danger' : 'bg-risk-info/20 text-risk-info'}`}>
                          {insuranceRejected ? <XCircle className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                          ¥{(q.insurance?.totalClaim || 0).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-industrial-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${status.cls}`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                  {expanded && (
                    <tr className="bg-industrial-900/60">
                      <td colSpan={9} className="px-4 py-3">
                        <div className="space-y-3">
                          <div className="rounded-lg border border-industrial-700 bg-industrial-900/80 p-3">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-industrial-300">
                                📋 项目明细 · {q.items.length} 项
                              </span>
                            </div>
                            <div className="overflow-hidden rounded border border-industrial-700">
                              <table className="w-full text-[11px]">
                                <thead className="bg-industrial-800 text-industrial-400">
                                  <tr>
                                    <th className="px-3 py-1.5 text-left font-medium">项目描述</th>
                                    <th className="px-3 py-1.5 text-center font-medium">数量</th>
                                    <th className="px-3 py-1.5 text-right font-medium">单价</th>
                                    <th className="px-3 py-1.5 text-right font-medium">小计</th>
                                    <th className="px-3 py-1.5 text-left font-medium">配件追溯</th>
                                  </tr>
                                </thead>
                                <tbody className="text-industrial-200">
                                  {q.items.map((item) => (
                                    <tr key={item.id} className="border-t border-industrial-700/50">
                                      <td className="px-3 py-1.5">{item.description}</td>
                                      <td className="px-3 py-1.5 text-center font-mono">{item.quantity}</td>
                                      <td className="px-3 py-1.5 text-right font-mono">¥{item.unitPrice}</td>
                                      <td className="px-3 py-1.5 text-right font-mono font-medium">
                                        ¥{(item.quantity * item.unitPrice).toLocaleString()}
                                      </td>
                                      <td className="px-3 py-1.5">
                                        {item.partSku ? (
                                          <span className="inline-flex items-center gap-1 rounded bg-risk-info/10 px-1.5 py-0.5 font-mono text-[10px] text-risk-info">
                                            <ExternalLink className="h-2.5 w-2.5" />
                                            {item.partSku}
                                          </span>
                                        ) : (
                                          <span className="text-industrial-500">—</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {q.cashier && q.cashier.transactions.length > 0 && (
                            <div className="rounded-lg border border-industrial-700 bg-industrial-900/80 p-3">
                              <div className="mb-2 flex items-center gap-2">
                                <Banknote className="h-3.5 w-3.5 text-risk-success" />
                                <span className="text-[11px] font-semibold text-industrial-300">
                                  💰 收款追溯 · {q.cashier.transactions.length} 笔 · 合计 ¥{q.cashier.totalPaid.toLocaleString()}
                                </span>
                              </div>
                              <div className="overflow-hidden rounded border border-industrial-700">
                                <table className="w-full text-[11px]">
                                  <thead className="bg-industrial-800 text-industrial-400">
                                    <tr>
                                      <th className="px-3 py-1.5 text-left font-medium">时间</th>
                                      <th className="px-3 py-1.5 text-left font-medium">支付方式</th>
                                      <th className="px-3 py-1.5 text-left font-medium">流水号</th>
                                      <th className="px-3 py-1.5 text-right font-medium">金额</th>
                                    </tr>
                                  </thead>
                                  <tbody className="text-industrial-200">
                                    {q.cashier.transactions.map((tx: any) => (
                                      <tr key={tx.id} className="border-t border-industrial-700/50">
                                        <td className="px-3 py-1.5 font-mono">{new Date(tx.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                                        <td className="px-3 py-1.5">
                                          <span className="inline-flex items-center gap-1">
                                            {tx.type === 'cash' && <span className="h-2 w-2 rounded-full bg-risk-success" />}
                                            {tx.type === 'card' && <CreditCard className="h-3 w-3 text-risk-info" />}
                                            {tx.type === 'insurance' && <ShieldCheck className="h-3 w-3 text-risk-warning" />}
                                            {tx.type === 'cash' ? '现金' : tx.type === 'card' ? '刷卡' : tx.type === 'insurance' ? '保险理赔' : tx.type}
                                          </span>
                                        </td>
                                        <td className="px-3 py-1.5 font-mono text-industrial-400">{tx.reference || '—'}</td>
                                        <td className="px-3 py-1.5 text-right font-mono font-medium">¥{Number(tx.amount).toLocaleString()}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {q.insurance && q.insurance.claims.length > 0 && (
                            <div className="rounded-lg border border-industrial-700 bg-industrial-900/80 p-3">
                              <div className="mb-2 flex items-center gap-2">
                                <ShieldCheck className="h-3.5 w-3.5 text-risk-info" />
                                <span className="text-[11px] font-semibold text-industrial-300">
                                  🛡️ 保险理赔 · {q.insurance.claims.length} 笔 · 报案 ¥{q.insurance.totalClaim.toLocaleString()} · 已结算 ¥{q.insurance.settledAmount.toLocaleString()}
                                </span>
                              </div>
                              <div className="space-y-2">
                                {q.insurance.claims.map((claim: any) => (
                                  <div key={claim.id} className="rounded border border-industrial-700 bg-industrial-800/60 p-2">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-[11px] text-industrial-200">保单: {claim.policyNo}</span>
                                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                          claim.status === 'settled' ? 'bg-risk-success/20 text-risk-success' :
                                          claim.status === 'rejected' ? 'bg-risk-danger/20 text-risk-danger' :
                                          claim.status === 'approved' ? 'bg-risk-info/20 text-risk-info' :
                                          'bg-industrial-600/50 text-industrial-200'
                                        }`}>
                                          {claim.status === 'settled' ? <CheckCircle2 className="inline h-2.5 w-2.5 mr-0.5" /> :
                                           claim.status === 'rejected' ? <XCircle className="inline h-2.5 w-2.5 mr-0.5" /> : null}
                                          {INSURANCE_STATUS_LABEL[claim.status] || claim.status}
                                        </span>
                                      </div>
                                      <div className="flex gap-3 font-mono text-[11px] text-industrial-300">
                                        <span>报案: <span className="text-risk-warning">¥{Number(claim.claimAmount).toLocaleString()}</span></span>
                                        <span>核赔: <span className="text-risk-success">¥{Number(claim.approvedAmount).toLocaleString()}</span></span>
                                      </div>
                                    </div>
                                    {claim.materials && claim.materials.length > 0 && (
                                      <div className="mt-2 flex flex-wrap gap-1 border-t border-industrial-700/50 pt-2">
                                        {claim.materials.map((m: any, i: number) => (
                                          <span key={i} className="inline-flex items-center rounded bg-industrial-700/60 px-1.5 py-0.5 text-[10px] text-industrial-300">
                                            {m.name || m.item || `材料${i + 1}`} ¥{Number(m.price || 0).toLocaleString()} × {m.quantity || 1}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {q.partTraceability && q.partTraceability.length > 0 && (
                            <div className="rounded-lg border border-industrial-700 bg-industrial-900/80 p-3">
                              <div className="mb-2 flex items-center gap-2">
                                <ExternalLink className="h-3.5 w-3.5 text-risk-info" />
                                <span className="text-[11px] font-semibold text-industrial-300">
                                  🔗 配件追溯 · {q.partTraceability.length} 项
                                </span>
                              </div>
                              <div className="overflow-hidden rounded border border-industrial-700">
                                <table className="w-full text-[11px]">
                                  <thead className="bg-industrial-800 text-industrial-400">
                                    <tr>
                                      <th className="px-3 py-1.5 text-left font-medium">配件</th>
                                      <th className="px-3 py-1.5 text-left font-medium">分类</th>
                                      <th className="px-3 py-1.5 text-right font-medium">成本</th>
                                      <th className="px-3 py-1.5 text-right font-medium">报价</th>
                                      <th className="px-3 py-1.5 text-right font-medium">加价率</th>
                                      <th className="px-3 py-1.5 text-right font-medium">库存</th>
                                    </tr>
                                  </thead>
                                  <tbody className="text-industrial-200">
                                    {q.partTraceability.map((p: any) => (
                                      <tr key={p.partId} className="border-t border-industrial-700/50">
                                        <td className="px-3 py-1.5">
                                          <div className="flex items-center gap-1">
                                            <span className="font-mono text-[10px] text-risk-info">{p.partSku}</span>
                                            <span>{p.partName}</span>
                                          </div>
                                        </td>
                                        <td className="px-3 py-1.5 text-industrial-400">{p.category || '—'}</td>
                                        <td className="px-3 py-1.5 text-right font-mono">¥{p.unitValue.toLocaleString()}</td>
                                        <td className="px-3 py-1.5 text-right font-mono">¥{p.quoteUnitPrice.toLocaleString()}</td>
                                        <td className="px-3 py-1.5 text-right">
                                          <span className={`font-mono ${p.markup > 50 ? 'text-risk-warning' : 'text-industrial-300'}`}>
                                            {p.markup}%
                                          </span>
                                        </td>
                                        <td className="px-3 py-1.5 text-right">
                                          <span className={`font-mono ${p.isGap ? 'text-risk-danger font-semibold' : 'text-industrial-300'}`}>
                                            {p.inStock}/{p.minThreshold}
                                            {p.isGap && <span className="ml-1 text-[9px]">缺口</span>}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
