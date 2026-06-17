import { useEffect, useState } from 'react';
import {
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  Building2,
} from 'lucide-react';
import ChartCard from '../components/ChartCard';
import { api, formatDateTime, formatAmount } from '../utils/api';
import { useCurrentRole, useCurrentArea } from '../store';
import type { PaymentFlow as PaymentFlowType } from '../../shared/types';

export default function PaymentFlow() {
  const role = useCurrentRole();
  const area = useCurrentArea();
  const [data, setData] = useState<PaymentFlowType[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [searchText, setSearchText] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await api.getPaymentFlows(
        page,
        pageSize,
        startTime || undefined,
        endTime || undefined,
        undefined,
        role,
        area
      );
      setData(response.list);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to load payment flows:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, startTime, endTime, role, area]);

  const filteredData = data.filter(
    (item) =>
      !searchText ||
      item.flowNo.toLowerCase().includes(searchText.toLowerCase()) ||
      item.propertyName.toLowerCase().includes(searchText.toLowerCase()) ||
      item.tenantName.toLowerCase().includes(searchText.toLowerCase())
  );

  const totalPages = Math.ceil(total / pageSize);

  const paymentTypeColors: Record<string, string> = {
    押金退还: 'bg-emerald-100 text-emerald-700',
    违约金: 'bg-red-100 text-red-700',
    水电费结算: 'bg-blue-100 text-blue-700',
    维修费扣除: 'bg-amber-100 text-amber-700',
    其他扣款: 'bg-slate-100 text-slate-700',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">收款流水明细</h1>
        <p className="text-sm text-slate-500 mt-1">
          退租结算收款明细，支付流水作为追溯来源
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜索流水号、房源、租客..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            <span className="text-slate-400">至</span>
            <input
              type="date"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Filter className="w-4 h-4" />
            筛选
          </button>
        </div>

        <ChartCard
          title="收款流水明细"
          subtitle={`共 ${total} 条记录`}
          updateTime={data[0]?.updateTime}
          onRefresh={loadData}
          isLoading={loading}
          className="!p-0 !border-0 !shadow-none"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    流水号
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    房源
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    租客
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    金额
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    款项类型
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    支付时间
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    支付来源
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mx-auto" />
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, index) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                      }`}
                    >
                      <td className="py-4 px-4">
                        <span className="text-sm font-mono text-indigo-600 font-medium">
                          {item.flowNo}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-900">
                            {item.propertyName}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-slate-900">
                          {item.tenantName}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`text-sm font-bold ${
                            item.paymentType === '押金退还'
                              ? 'text-emerald-600'
                              : 'text-slate-900'
                          }`}
                        >
                          {formatAmount(item.amount)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-1 text-xs font-medium rounded-md ${
                            paymentTypeColors[item.paymentType] ||
                            'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.paymentType}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-slate-600">
                          {formatDateTime(item.paymentTime)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-slate-600">
                          {item.source}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              显示 {(page - 1) * pageSize + 1} -{' '}
              {Math.min(page * pageSize, total)} 条，共 {total} 条
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    disabled={loading}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                      page === pageNum
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
