import { useEffect, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { AlertTriangle, Clock, User, MapPin, Filter, CheckCircle, ArrowRight } from 'lucide-react';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { api } from '@/services/api';
import type { ShortageOrder } from '@/types';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/shortage/')({
  component: ShortageListPage,
});

function ShortageListPage() {
  const [shortages, setShortages] = useState<ShortageOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.getShortages();
      setShortages(data);
    } finally {
      setLoading(false);
    }
  };

  const filteredShortages = shortages.filter(s => {
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    const matchPriority = filterPriority === 'all' || s.priority === filterPriority;
    const matchKeyword = searchKeyword === '' || 
      s.materialName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      s.batchNo.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      s.responsiblePerson.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchStatus && matchPriority && matchKeyword;
  });

  const stats = {
    total: shortages.length,
    pending: shortages.filter(s => s.status === 'pending').length,
    processing: shortages.filter(s => s.status === 'processing').length,
    completed: shortages.filter(s => s.status === 'closed' || s.status === 'supplemented').length,
    highPriority: shortages.filter(s => s.priority === 'high' && (s.status === 'pending' || s.status === 'processing')).length,
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date(new Date().toDateString());
  };

  const getDueDateStatus = (dueDate: string, status: string) => {
    if (status === 'closed' || status === 'supplemented') return { color: 'text-gray-400', label: '已完成' };
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { color: 'text-red-600', label: `逾期 ${Math.abs(diffDays)} 天` };
    if (diffDays === 0) return { color: 'text-orange-600', label: '今日截止' };
    if (diffDays <= 2) return { color: 'text-orange-500', label: `还剩 ${diffDays} 天` };
    return { color: 'text-gray-500', label: `还剩 ${diffDays} 天` };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">短缺待办</h1>
          <p className="text-gray-500 mt-1">批次短缺触发后进入负责人待办，处理后留下完整记录</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">全部工单</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="p-2 bg-gray-100 rounded-lg">
              <Filter className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="card border-red-100 bg-red-50/50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-red-600">高优先级</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.highPriority}</p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">待处理</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{stats.pending}</p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">处理中</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.processing}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">已完成</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <input
                type="text"
                placeholder="搜索材料名称、批次号、负责人..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="input pl-10"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input w-auto"
          >
            <option value="all">全部状态</option>
            <option value="pending">待处理</option>
            <option value="processing">处理中</option>
            <option value="supplemented">已补录</option>
            <option value="retried">已重试</option>
            <option value="closed">已关闭</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="input w-auto"
          >
            <option value="all">全部优先级</option>
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>
        </div>

        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
            ))
          ) : filteredShortages.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">暂无短缺工单</p>
            </div>
          ) : (
            filteredShortages.map((shortage, index) => {
              const dueStatus = getDueDateStatus(shortage.dueDate, shortage.status);
              const overdue = isOverdue(shortage.dueDate) && shortage.status !== 'closed' && shortage.status !== 'supplemented';
              
              return (
                <div
                  key={shortage.id}
                  className={cn(
                    'p-5 border rounded-xl transition-all group hover:shadow-md',
                    overdue ? 'border-red-200 bg-red-50/50' : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50/30'
                  )}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono text-sm text-primary-600 font-medium">
                          {shortage.batchNo}
                        </span>
                        <StatusBadge status={shortage.status} />
                        <PriorityBadge priority={shortage.priority} />
                        {overdue && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            已逾期
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mt-3">
                        {shortage.materialName}
                        <span className="text-red-600 ml-2">
                          短缺 {shortage.shortageQuantity} 单位
                        </span>
                      </h3>

                      <div className="flex items-center gap-6 mt-3 text-sm text-gray-500 flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <User className="w-4 h-4" />
                          负责人: {shortage.responsiblePerson}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          关联批次
                        </span>
                        <span className={cn('inline-flex items-center gap-1 font-medium', dueStatus.color)}>
                          <Clock className="w-4 h-4" />
                          {dueStatus.label} · 截止 {shortage.dueDate}
                        </span>
                      </div>
                    </div>

                    <Link
                      to="/shortage/$id"
                      params={{ id: shortage.id }}
                      className="flex items-center gap-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                    >
                      处理
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
