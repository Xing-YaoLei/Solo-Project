'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Star, Phone, Bike, MapPin, Calendar, Loader2, Filter } from 'lucide-react';
import { riderApi } from '@/lib/api';
import {
  RIDER_STATUS_MAP,
  formatDate,
  cn,
} from '@/lib/utils';
import AuthGuard from '@/components/AuthGuard';

function RidersContent() {
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadRiders = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const data = await riderApi.list(params);
      setRiders(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRiders();
  }, [search, statusFilter]);

  const statusCounts = {
    ON_DELIVERY: riders.filter((r) => r.status === 'ON_DELIVERY').length,
    IDLE: riders.filter((r) => r.status === 'IDLE').length,
    ON_BREAK: riders.filter((r) => r.status === 'ON_BREAK').length,
    OFFLINE: riders.filter((r) => r.status === 'OFFLINE').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">骑手管理</h2>
          <p className="text-sm text-gray-500 mt-1">共 {riders.length} 名骑手</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(statusCounts).map(([key, count]) => {
          const status = RIDER_STATUS_MAP[key];
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(statusFilter === key ? '' : key)}
              className={cn(
                'card text-left transition-all',
                statusFilter === key && 'ring-2 ring-primary-500 border-primary-200',
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">{status.label}</span>
                <span className={cn('w-2 h-2 rounded-full bg-current', status.color)} />
              </div>
              <div className="text-3xl font-bold text-gray-900">{count}</div>
              <div className="text-xs text-gray-400 mt-1">点击{statusFilter === key ? '取消' : '查看'}</div>
            </button>
          );
        })}
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9"
              placeholder="搜索骑手姓名、编号..."
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input sm:w-48"
          >
            <option value="">全部状态</option>
            {Object.entries(RIDER_STATUS_MAP).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary-500" />
          </div>
        ) : riders.length === 0 ? (
          <div className="py-16 text-center text-gray-400">暂无骑手数据</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {riders.map((rider) => (
              <Link
                key={rider.id}
                href={`/riders/${rider.userId}`}
                className="group p-5 rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
                      {rider.user?.name?.charAt(0)}
                    </div>
                    <span
                      className={cn(
                        'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white bg-current',
                        RIDER_STATUS_MAP[rider.status].color,
                      )}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-lg">{rider.user?.name}</span>
                      <span className={cn('text-xs font-medium', RIDER_STATUS_MAP[rider.status].color)}>
                        ● {RIDER_STATUS_MAP[rider.status].label}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 font-mono">{rider.riderCode}</div>
                    <div className="flex items-center gap-1 mt-1.5">
                      <Star size={12} className="text-warning-500 fill-warning-500" />
                      <span className="text-sm font-medium text-gray-800">{rider.rating?.toFixed(1)}</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-500">{rider.totalOrders} 单</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-50 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Phone size={12} className="text-gray-400 shrink-0" />
                    <span className="truncate">{rider.user?.phone || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Bike size={12} className="text-gray-400 shrink-0" />
                    <span>{rider.vehicleType} · {rider.vehiclePlate || '无车牌'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Calendar size={12} className="text-gray-400 shrink-0" />
                    <span>入职 {formatDate(rider.joinDate, 'YYYY-MM-DD')}</span>
                  </div>
                  {rider.currentLat && rider.currentLng && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <MapPin size={12} className="text-primary-500 shrink-0" />
                      <span className="font-mono">
                        {rider.currentLat.toFixed(4)}, {rider.currentLng.toFixed(4)}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RidersPage() {
  return (
    <AuthGuard>
      <RidersContent />
    </AuthGuard>
  );
}
