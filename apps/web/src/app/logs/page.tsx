// @ts-nocheck
'use client';

import React, { useEffect, useState } from 'react';
import { History, Filter, Search, Clock, User, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { apiEndpoints } from '@/lib/api';
import { formatDate, actionConfig, cn } from '@/lib/utils';
import { TimelineAction } from '@solo/shared';

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    operatorId: '',
    startDate: '',
    endDate: '',
    keyword: '',
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [operators, setOperators] = useState<any[]>([]);

  useEffect(() => {
    const fetchOperators = async () => {
      const res: any = await apiEndpoints.users.list();
      setOperators(res.items || []);
    };
    fetchOperators();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [filters, page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        action: filters.action || undefined,
        operatorId: filters.operatorId || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        keyword: filters.keyword || undefined,
        page,
        pageSize: 20,
      };
      const res: any = await apiEndpoints.timelines.list(params);
      setLogs(res.items || []);
      setTotal(res.total || 0);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionConfig = (action: string) => {
    return actionConfig[action as TimelineAction] || { label: action, icon: 'Circle', color: 'gray' };
  };

  const colorMap: Record<string, string> = {
    primary: 'bg-blue-100 text-blue-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    secondary: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">操作日志</h1>
          <p className="text-sm text-gray-500 mt-1">全系统操作记录，共 {total} 条</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px] max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="搜索备注、单号..."
                  value={filters.keyword}
                  onChange={(e) => {
                    setFilters({ ...filters, keyword: e.target.value });
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={filters.action}
              onChange={(e) => {
                setFilters({ ...filters, action: e.target.value });
                setPage(1);
              }}
              options={[
                { value: '', label: '全部动作' },
                ...Object.values(TimelineAction).map((a) => ({
                  value: a,
                  label: getActionConfig(a).label,
                })),
              ]}
              className="w-40"
            />
            <Select
              value={filters.operatorId}
              onChange={(e) => {
                setFilters({ ...filters, operatorId: e.target.value });
                setPage(1);
              }}
              options={[
                { value: '', label: '全部操作人' },
                ...operators.map((o) => ({ value: o.id, label: o.name })),
              ]}
              className="w-36"
            />
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => {
                  setFilters({ ...filters, startDate: e.target.value });
                  setPage(1);
                }}
                className="w-32"
              />
              <span className="text-gray-400">至</span>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => {
                  setFilters({ ...filters, endDate: e.target.value });
                  setPage(1);
                }}
                className="w-32"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无操作记录</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {logs.map((log) => {
                const config = getActionConfig(log.action);
                const colorClass = colorMap[config.color] || colorMap.secondary;

                return (
                  <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className={cn('p-2 rounded-full flex-shrink-0', colorClass)}>
                        <History className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Badge className={colorClass} size="sm">
                              {config.label}
                            </Badge>
                            {log.orderNo && (
                              <span className="font-medium text-primary-600 text-sm">
                                #{log.orderNo}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 flex items-center gap-1 flex-shrink-0">
                            <Clock className="h-3 w-3" />
                            {formatDate(log.createdAt)}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center gap-4 text-sm">
                          {log.operator && (
                            <span className="flex items-center gap-1 text-gray-600">
                              <User className="h-3.5 w-3.5" />
                              {log.operator.name}
                            </span>
                          )}
                          {(log.oldStatus || log.newStatus) && (
                            <span className="text-gray-600">
                              状态：{log.oldStatus || '-'} →{' '}
                              <span className="font-medium">{log.newStatus}</span>
                            </span>
                          )}
                          {(log.oldValue || log.newValue) && (
                            <span className="text-gray-600">
                              {log.fieldName || '值'}：{log.oldValue || '-'} →{' '}
                              <span className="font-medium">{log.newValue}</span>
                            </span>
                          )}
                        </div>

                        {log.note && (
                          <div className="mt-2 bg-gray-50 rounded-lg p-3">
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">
                              {log.note}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {total > 20 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
              <div className="text-sm text-gray-500">
                第 {page} / {Math.ceil(total / 20)} 页
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= Math.ceil(total / 20)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
