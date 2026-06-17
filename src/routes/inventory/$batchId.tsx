import { useEffect, useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Package, MapPin, User, Calendar, Clock, AlertTriangle, TrendingUp, FileText } from 'lucide-react';
import { Timeline } from '@/components/Timeline';
import { StatusBadge } from '@/components/StatusBadge';
import { api } from '@/services/api';
import type { MaterialBatch, InventoryRecord, ShortageOrder, TimelineEvent } from '@/types';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/inventory/$batchId')({
  component: BatchDetailPage,
});

function BatchDetailPage() {
  const { batchId } = Route.useParams();
  const navigate = useNavigate();
  const [batch, setBatch] = useState<MaterialBatch | null>(null);
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [shortages, setShortages] = useState<ShortageOrder[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'records' | 'shortages'>('timeline');

  useEffect(() => {
    fetchData();
  }, [batchId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [batchData, recordsData, shortagesData, timelineData] = await Promise.all([
        api.getBatchById(batchId),
        api.getInventoryRecords(batchId),
        api.getShortagesByBatch(batchId),
        api.getBatchTimelineEvents(batchId),
      ]);
      setBatch(batchData);
      setRecords(recordsData);
      setShortages(shortagesData);
      setTimeline(timelineData);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !batch) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-100 rounded animate-pulse w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card h-24 animate-pulse" />
          ))}
        </div>
        <div className="card h-96 animate-pulse" />
      </div>
    );
  }

  const turnoverStatus = batch.actualTurnoverDays
    ? batch.actualTurnoverDays > batch.expectedTurnoverDays
      ? { label: '周转超时', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' }
      : { label: '周转正常', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' }
    : { label: '周转中', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };

  const tabs = [
    { key: 'timeline', label: '全链路追踪', icon: Clock },
    { key: 'records', label: '库存记录', icon: FileText },
    { key: 'shortages', label: '短缺工单', icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate({ to: '/inventory' })}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">批次详情</h1>
          <p className="text-gray-500 mt-1">
            <span className="font-mono text-primary-600">{batch.batchNo}</span>
            <span className="mx-2">·</span>
            {batch.materialName}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">材料信息</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{batch.materialName}</p>
              <p className="text-sm text-gray-500 mt-1">{batch.specification}</p>
            </div>
            <div className="p-2 bg-primary-50 rounded-lg">
              <Package className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">库存数量</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {batch.quantity}
                <span className="text-sm font-normal text-gray-500 ml-1">{batch.unit}</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">{batch.category}</p>
            </div>
            <div className="p-2 bg-green-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">区域 / 负责人</p>
              <p className="text-base font-medium text-gray-900 mt-1 flex items-center gap-1">
                <MapPin className="w-4 h-4 text-gray-400" />
                {batch.region}
              </p>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                <User className="w-4 h-4 text-gray-400" />
                {batch.responsiblePerson}
              </p>
            </div>
            <div className="p-2 bg-orange-50 rounded-lg">
              <User className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className={cn('card border', turnoverStatus.border)}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">周转天数</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                预计 {batch.expectedTurnoverDays} 天
              </p>
              {batch.actualTurnoverDays ? (
                <p className={cn('text-sm font-medium mt-1', turnoverStatus.color)}>
                  实际 {batch.actualTurnoverDays} 天
                  {batch.actualTurnoverDays > batch.expectedTurnoverDays
                    ? ` (超 ${batch.actualTurnoverDays - batch.expectedTurnoverDays} 天)`
                    : ` (快 ${batch.expectedTurnoverDays - batch.actualTurnoverDays} 天)`}
                </p>
              ) : (
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  入库: {batch.inDate}
                </p>
              )}
            </div>
            <div className={cn('p-2 rounded-lg', turnoverStatus.bg)}>
              <Clock className={cn('w-6 h-6', turnoverStatus.color)} />
            </div>
          </div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={cn(
                'flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 -mb-px',
                activeTab === tab.key
                  ? 'text-primary-600 border-primary-600 bg-primary-50/50'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.key === 'shortages' && shortages.length > 0 && (
                <span className="px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">
                  {shortages.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'timeline' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">全链路追踪</h3>
                  <p className="text-sm text-gray-500 mt-1">从入库到消耗的完整时间线</p>
                </div>
                <StatusBadge status={batch.status} />
              </div>
              <Timeline events={timeline} />
            </div>
          )}

          {activeTab === 'records' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">库存记录</h3>
                  <p className="text-sm text-gray-500 mt-1">共 {records.length} 条记录</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="table-header">类型</th>
                      <th className="table-header">数量</th>
                      <th className="table-header">操作人</th>
                      <th className="table-header">区域</th>
                      <th className="table-header">备注</th>
                      <th className="table-header">时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {records.map((record, index) => (
                      <tr
                        key={record.id}
                        className="hover:bg-gray-50 transition-colors"
                        style={{ animationDelay: `${index * 20}ms` }}
                      >
                        <td className="table-cell">
                          <span className={cn(
                            'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                            record.type === 'in' && 'bg-green-100 text-green-700',
                            record.type === 'out' && 'bg-red-100 text-red-700',
                            record.type === 'transfer' && 'bg-blue-100 text-blue-700',
                            record.type === 'adjust' && 'bg-gray-100 text-gray-700'
                          )}>
                            {record.type === 'in' ? '入库' : record.type === 'out' ? '领用' : record.type === 'transfer' ? '调拨' : '调整'}
                          </span>
                        </td>
                        <td className="table-cell">
                          <span className={cn(
                            'font-medium',
                            record.type === 'in' ? 'text-green-600' : 'text-red-600'
                          )}>
                            {record.type === 'in' ? '+' : '-'}{record.quantity}
                          </span>
                          <span className="text-gray-500 text-sm ml-1">{batch.unit}</span>
                        </td>
                        <td className="table-cell text-gray-600">{record.operator}</td>
                        <td className="table-cell text-gray-600">{record.region}</td>
                        <td className="table-cell text-gray-500 text-sm">{record.remark}</td>
                        <td className="table-cell text-gray-500 text-sm">
                          {new Date(record.createdAt).toLocaleString('zh-CN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'shortages' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">短缺工单</h3>
                  <p className="text-sm text-gray-500 mt-1">关联的短缺处理记录</p>
                </div>
              </div>
              {shortages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-gray-500">该批次暂无短缺记录</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {shortages.map((shortage, index) => (
                    <div
                      key={shortage.id}
                      className="p-4 border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50/30 transition-all"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm text-primary-600">{shortage.batchNo}</span>
                            <StatusBadge status={shortage.status} />
                            <span className={cn(
                              'px-2 py-0.5 text-xs font-medium rounded-full',
                              shortage.priority === 'high' && 'bg-red-100 text-red-700',
                              shortage.priority === 'medium' && 'bg-orange-100 text-orange-700',
                              shortage.priority === 'low' && 'bg-gray-100 text-gray-700'
                            )}>
                              {shortage.priority === 'high' ? '高优先级' : shortage.priority === 'medium' ? '中优先级' : '低优先级'}
                            </span>
                          </div>
                          <p className="text-gray-900 font-medium mt-2">
                            短缺数量: {shortage.shortageQuantity} {batch.unit}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            负责人: {shortage.responsiblePerson} · 截止日期: {shortage.dueDate}
                          </p>
                        </div>
                        <Link
                          to="/shortage/$id"
                          params={{ id: shortage.id }}
                          className="btn-secondary text-sm"
                        >
                          查看详情
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
