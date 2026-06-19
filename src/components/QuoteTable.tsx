'use client';

import { Fragment } from 'react';
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { useDashboardStore } from '@/store/dashboard';

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  draft: { label: '草稿', cls: 'bg-industrial-600/50 text-industrial-200' },
  approved: { label: '已确认', cls: 'bg-risk-info/20 text-risk-info' },
  completed: { label: '已完成', cls: 'bg-risk-success/20 text-risk-success' },
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
          <p className="mt-0.5 text-[11px] text-industrial-400">点击展开查看配件追溯明细</p>
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
              <th className="px-4 py-2.5 font-medium text-right">金额</th>
              <th className="px-4 py-2.5 font-medium">状态</th>
              <th className="px-4 py-2.5 font-medium">日期</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((q) => {
              const expanded = expandedQuoteId === q.id;
              const status = STATUS_MAP[q.status];
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
                    <td className="px-4 py-3 font-mono font-medium text-white">{q.quoteNo}</td>
                    <td className="px-4 py-3">{q.customerName}</td>
                    <td className="px-4 py-3 font-mono">{q.vehiclePlate}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-risk-success">
                      ¥{q.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${status.cls}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-industrial-400">
                      {q.createdAt.slice(0, 10)}
                    </td>
                  </tr>
                  {expanded && (
                    <tr className="bg-industrial-900/60">
                      <td colSpan={7} className="px-4 py-3">
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
