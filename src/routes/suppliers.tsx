import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Plus, Edit, Trash2, Star, Phone, User, Tag, CheckCircle, XCircle } from 'lucide-react';
import { api } from '@/services/api';
import type { Supplier } from '@/types';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/suppliers')({
  component: SuppliersPage,
});

function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.getSuppliers();
      setSuppliers(data);
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter(s => {
    const matchLevel = filterLevel === 'all' || s.level === filterLevel;
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    const matchKeyword = searchKeyword === '' || 
      s.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      s.contact.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      s.phone.includes(searchKeyword);
    return matchLevel && matchStatus && matchKeyword;
  });

  const stats = {
    total: suppliers.length,
    active: suppliers.filter(s => s.status === 'active').length,
    levelA: suppliers.filter(s => s.level === 'A').length,
    avgOnTime: suppliers.length > 0 
      ? Math.round(suppliers.reduce((sum, s) => sum + s.onTimeRate, 0) / suppliers.length * 10) / 10 
      : 0,
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'A': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'B': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'C': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600';
    if (score >= 4.0) return 'text-blue-600';
    if (score >= 3.5) return 'text-orange-600';
    return 'text-red-600';
  };

  const getOnTimeColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 90) return 'text-blue-600';
    if (rate >= 85) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">供应商管理</h1>
          <p className="text-gray-500 mt-1">维护供应商信息字典，管理合作评级</p>
        </div>
        <button className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          新增供应商
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">供应商总数</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              <p className="text-xs text-gray-400 mt-1">合作中 {stats.active} 家</p>
            </div>
            <div className="p-2 bg-primary-50 rounded-lg">
              <Tag className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">A级供应商</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.levelA}</p>
              <p className="text-xs text-gray-400 mt-1">
                占比 {stats.total > 0 ? Math.round(stats.levelA / stats.total * 100) : 0}%
              </p>
            </div>
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">平均准时率</p>
              <p className={cn('text-2xl font-bold mt-1', getOnTimeColor(stats.avgOnTime))}>
                {stats.avgOnTime}%
              </p>
              <p className="text-xs text-gray-400 mt-1">近30天交货表现</p>
            </div>
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">平均质量分</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {suppliers.length > 0 
                  ? (suppliers.reduce((sum, s) => sum + s.qualityScore, 0) / suppliers.length).toFixed(1)
                  : '0.0'
                }
              </p>
              <p className="text-xs text-gray-400 mt-1">满分 5.0</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <Star className="w-6 h-6 text-blue-600" />
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
                placeholder="搜索供应商名称、联系人、电话..."
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
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="input w-auto"
          >
            <option value="all">全部等级</option>
            <option value="A">A级</option>
            <option value="B">B级</option>
            <option value="C">C级</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input w-auto"
          >
            <option value="all">全部状态</option>
            <option value="active">合作中</option>
            <option value="inactive">已停用</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="table-header">供应商名称</th>
                <th className="table-header">供应品类</th>
                <th className="table-header">联系人</th>
                <th className="table-header">联系电话</th>
                <th className="table-header">信用等级</th>
                <th className="table-header">准时率</th>
                <th className="table-header">质量分</th>
                <th className="table-header">状态</th>
                <th className="table-header text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="table-cell">
                        <div className="h-5 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="table-cell text-center py-12 text-gray-500">
                    <Tag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>暂无供应商数据</p>
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier, index) => (
                  <tr
                    key={supplier.id}
                    className="hover:bg-gray-50 transition-colors"
                    style={{ animationDelay: `${index * 20}ms` }}
                  >
                    <td className="table-cell">
                      <div className="font-medium text-gray-900">{supplier.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        合作自 {new Date(supplier.createdAt).toLocaleDateString('zh-CN')}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex flex-wrap gap-1">
                        {supplier.categories.map((cat, i) => (
                          <span key={i} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="inline-flex items-center gap-1 text-gray-600">
                        <User className="w-3 h-3" />
                        {supplier.contact}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="inline-flex items-center gap-1 text-gray-600">
                        <Phone className="w-3 h-3" />
                        {supplier.phone}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border',
                        getLevelColor(supplier.level)
                      )}>
                        <Star className="w-3 h-3" />
                        {supplier.level}级
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={cn('font-medium', getOnTimeColor(supplier.onTimeRate))}>
                        {supplier.onTimeRate}%
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={cn('font-medium', getQualityColor(supplier.qualityScore))}>
                        {supplier.qualityScore.toFixed(1)}
                      </span>
                    </td>
                    <td className="table-cell">
                      {supplier.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm">合作中</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-400">
                          <XCircle className="w-4 h-4" />
                          <span className="text-sm">已停用</span>
                        </span>
                      )}
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-primary-600">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-gray-500 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
