import { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import ChartCard from '@/components/ChartCard';
import { riskApi } from '@/services/api';
import type { RiskTypeDistribution, RiskDailyTrend, RiskEvent } from '@/types';
import { MessageSquare, AlertCircle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RiskEvents() {
  const navigate = useNavigate();
  const [typeDistribution, setTypeDistribution] = useState<RiskTypeDistribution[]>([]);
  const [dailyTrend, setDailyTrend] = useState<RiskDailyTrend[]>([]);
  const [events, setEvents] = useState<RiskEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<RiskEvent | null>(null);
  const [remarkInput, setRemarkInput] = useState('');
  const [showRemarkModal, setShowRemarkModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [typeDist, trend, eventList] = await Promise.all([
          riskApi.getTypeDistribution(30),
          riskApi.getDailyTrend(30),
          riskApi.getEvents(page, pageSize),
        ]);
        setTypeDistribution(typeDist);
        setDailyTrend(trend);
        setEvents(eventList.list);
        setTotal(eventList.total);
      } catch (error) {
        console.error('获取数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page, pageSize]);

  const pieOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}起 ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      itemWidth: 12,
      itemHeight: 12,
      textStyle: {
        fontSize: 12,
        color: '#64748b',
      },
    },
    series: [
      {
        name: '风险类型',
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        data: typeDistribution.map((item, index) => ({
          value: item.count,
          name: item.type,
          itemStyle: {
            color: ['#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4', '#64748b'][index % 5],
          },
        })),
      },
    ],
  };

  const trendOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
    },
    legend: {
      data: ['跌倒', '压疮', '走失', '用药失误', '其他'],
      top: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dailyTrend.map((item) => item.date),
      axisLabel: {
        fontSize: 10,
        rotate: 30,
      },
    },
    yAxis: {
      type: 'value',
      name: '事件数',
    },
    series: [
      {
        name: '跌倒',
        type: 'line',
        stack: 'Total',
        smooth: true,
        data: dailyTrend.map((item) => item.fall),
        lineStyle: { width: 2 },
        itemStyle: { color: '#ef4444' },
        areaStyle: {
          color: 'rgba(239, 68, 68, 0.15)',
        },
      },
      {
        name: '压疮',
        type: 'line',
        stack: 'Total',
        smooth: true,
        data: dailyTrend.map((item) => item.pressure_ulcer),
        lineStyle: { width: 2 },
        itemStyle: { color: '#f59e0b' },
        areaStyle: {
          color: 'rgba(245, 158, 11, 0.15)',
        },
      },
      {
        name: '走失',
        type: 'line',
        stack: 'Total',
        smooth: true,
        data: dailyTrend.map((item) => item.wandering),
        lineStyle: { width: 2 },
        itemStyle: { color: '#8b5cf6' },
        areaStyle: {
          color: 'rgba(139, 92, 246, 0.15)',
        },
      },
      {
        name: '用药失误',
        type: 'line',
        stack: 'Total',
        smooth: true,
        data: dailyTrend.map((item) => item.medication_error),
        lineStyle: { width: 2 },
        itemStyle: { color: '#06b6d4' },
        areaStyle: {
          color: 'rgba(6, 182, 212, 0.15)',
        },
      },
      {
        name: '其他',
        type: 'line',
        stack: 'Total',
        smooth: true,
        data: dailyTrend.map((item) => item.other),
        lineStyle: { width: 2 },
        itemStyle: { color: '#64748b' },
        areaStyle: {
          color: 'rgba(100, 116, 139, 0.15)',
        },
      },
    ],
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-danger-100 text-danger-700 border-danger-200';
      case 'medium':
        return 'bg-warning-100 text-warning-700 border-warning-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'high':
        return '高风险';
      case 'medium':
        return '中风险';
      default:
        return '低风险';
    }
  };

  const getTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      fall: '跌倒',
      pressure_ulcer: '压疮',
      wandering: '走失',
      medication_error: '用药失误',
      other: '其他',
    };
    return typeMap[type] || type;
  };

  const handleAddRemark = (event: RiskEvent) => {
    setSelectedEvent(event);
    setRemarkInput(event.remark || '');
    setShowRemarkModal(true);
  };

  const submitRemark = async () => {
    if (!selectedEvent || !remarkInput.trim()) return;
    try {
      await riskApi.addRemark(selectedEvent.id, remarkInput);
      const updated = await riskApi.getEvents(page, pageSize);
      setEvents(updated.list);
      setShowRemarkModal(false);
    } catch (error) {
      console.error('添加备注失败:', error);
    }
  };

  const handleViewReview = (event: RiskEvent) => {
    if (event.type === 'fall') {
      navigate(`/review/fall/${event.id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">风险事件分析</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="风险类型分布" subtitle="近30天各类风险占比">
          <div className="h-64">
            <ReactECharts option={pieOption} style={{ height: '100%' }} />
          </div>
        </ChartCard>

        <ChartCard title="风险事件趋势" subtitle="近30天每日风险事件数" className="lg:col-span-2">
          <div className="h-64">
            <ReactECharts option={trendOption} style={{ height: '100%' }} />
          </div>
        </ChartCard>
      </div>

      <ChartCard title="风险事件列表" subtitle={`共 ${total} 条记录`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-medium text-slate-600">风险等级</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">类型</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">老人</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">床位</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">发生时间</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">描述</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">备注</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr
                  key={event.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${getLevelColor(
                        event.level
                      )}`}
                    >
                      {getLevelText(event.level)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700">{getTypeText(event.type)}</td>
                  <td className="py-3 px-4 text-slate-800 font-medium">{event.residentName}</td>
                  <td className="py-3 px-4 text-slate-600">{event.bedNo}</td>
                  <td className="py-3 px-4 text-slate-500">{event.occurTime}</td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{event.description}</td>
                  <td className="py-3 px-4">
                    {event.remark ? (
                      <div className="flex items-center gap-1 text-primary-600">
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-xs">有备注</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">无备注</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAddRemark(event)}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                      >
                        <MessageSquare className="w-4 h-4" />
                        备注
                      </button>
                      {event.type === 'fall' && (
                        <button
                          onClick={() => handleViewReview(event)}
                          className="text-warning-600 hover:text-warning-700 text-sm font-medium flex items-center gap-1"
                        >
                          <AlertCircle className="w-4 h-4" />
                          复盘
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
          <span className="text-sm text-slate-500">
            显示 {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} 条，共 {total} 条
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            <span className="text-sm text-slate-600">第 {page} 页</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page * pageSize >= total}
              className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        </div>
      </ChartCard>

      {showRemarkModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">添加风险事件备注</h3>
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(
                    selectedEvent.level
                  )}`}
                >
                  {getLevelText(selectedEvent.level)}
                </span>
                <span className="text-sm text-slate-600">
                  {selectedEvent.residentName} · {selectedEvent.bedNo}
                </span>
              </div>
              <p className="text-sm text-slate-500">{selectedEvent.description}</p>
            </div>
            <textarea
              value={remarkInput}
              onChange={(e) => setRemarkInput(e.target.value)}
              placeholder="请输入备注内容，记录当时的判断和处理措施..."
              className="w-full h-32 p-3 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowRemarkModal(false)}
                className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                取消
              </button>
              <button
                onClick={submitRemark}
                className="px-4 py-2 text-sm rounded-lg bg-primary-500 text-white hover:bg-primary-600"
              >
                保存备注
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
