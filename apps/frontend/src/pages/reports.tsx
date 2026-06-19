import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { TrendingUp, DollarSign, Users, Calendar } from 'lucide-react';
import api from '@/lib/api';

interface OccupancyData {
  date: string;
  occupancyRate: number;
  occupiedRooms: number;
  totalRooms: number;
}

interface ChannelData {
  channel: string;
  count: number;
  revenue: number;
  percentage: number;
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function ReportsPage() {
  const [propertyId, setPropertyId] = useState('');
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [properties, setProperties] = useState<any[]>([]);
  const [occupancyData, setOccupancyData] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [channelData, setChannelData] = useState<ChannelData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [propertyId, period]);

  const fetchProperties = async () => {
    try {
      const res = await api.get('/properties?pageSize=100');
      setProperties(res.data.list || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const params: any = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
        period,
      };
      if (propertyId) params.propertyId = parseInt(propertyId);

      const [occRes, revRes, chRes] = await Promise.all([
        api.get('/reports/occupancy-trend', { params }),
        api.get('/reports/revenue', { params }),
        api.get('/reports/channel-distribution', { params: propertyId ? { propertyId: parseInt(propertyId) } : {} }),
      ]);

      setOccupancyData(occRes.data);
      setRevenueData(revRes.data);
      setChannelData(chRes.data.channels || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getChannelName = (channel: string) => {
    const names: Record<string, string> = {
      AIRBNB: 'Airbnb',
      TRIP_ADVISOR: 'TripAdvisor',
      BOOKING_COM: 'Booking.com',
      MEITUAN: '美团',
      XIANCHENG: '携程',
      DIRECT: '直订',
      OTHER: '其他',
    };
    return names[channel] || channel;
  };

  const occupancyChartData = occupancyData?.data?.map((item: OccupancyData) => ({
    ...item,
    date: item.date.substring(5),
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">报表分析</h1>
        <div className="flex items-center gap-3">
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="input w-48"
          >
            <option value="">全部房源</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="input w-32"
          >
            <option value="day">按天</option>
            <option value="week">按周</option>
            <option value="month">按月</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">平均入住率</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {occupancyData?.avgOccupancy || 0}%
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">过去30天</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">总收入</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                ¥{revenueData?.totalRevenue?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">过去30天</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">订单数</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">
                {revenueData?.totalOrders || 0}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">过去30天</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">客房间夜</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">
                {revenueData?.totalRoomNights || 0}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">过去30天</p>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">入住率趋势</h3>
        {loading ? (
          <div className="h-72 flex items-center justify-center text-gray-400">
            加载中...
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={occupancyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${value}%`, '入住率']}
                />
                <Line
                  type="monotone"
                  dataKey="occupancyRate"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">渠道分布</h3>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-gray-400">
              加载中...
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="channel"
                    label={({ channel, percentage }) =>
                      `${getChannelName(channel)} ${percentage}%`
                    }
                    labelLine={false}
                  >
                    {channelData.map((entry, index) => (
                      <Cell key={entry.channel} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value} 单`,
                      getChannelName(name),
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">渠道收入</h3>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-gray-400">
              加载中...
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={channelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                  <YAxis
                    type="category"
                    dataKey="channel"
                    stroke="#9ca3af"
                    fontSize={12}
                    tickFormatter={getChannelName}
                    width={80}
                  />
                  <Tooltip
                    formatter={(value: number) => [`¥${value}`, '收入']}
                    labelFormatter={getChannelName}
                  />
                  <Bar dataKey="revenue" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">渠道明细</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">渠道</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">订单数</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">占比</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">收入</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {channelData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    暂无数据
                  </td>
                </tr>
              ) : (
                channelData.map((channel, index) => (
                  <tr key={channel.channel} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-gray-800">{getChannelName(channel.channel)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{channel.count} 单</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${channel.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{channel.percentage}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-800 font-medium">
                      ¥{channel.revenue.toFixed(2)}
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
