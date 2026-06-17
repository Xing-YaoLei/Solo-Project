import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { reviewApi } from '@/services/api';
import type { FallReview as FallReviewType, FallEventSummary } from '@/types';
import {
  ArrowLeft,
  AlertTriangle,
  User,
  Clock,
  MessageSquare,
  HeartPulse,
  FileText,
  Calendar,
  ChevronRight,
} from 'lucide-react';

export default function FallReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [reviewData, setReviewData] = useState<FallReviewType | null>(null);
  const [fallEvents, setFallEvents] = useState<FallEventSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [review, events] = await Promise.all([
          reviewApi.getFallReview(id),
          reviewApi.getFallEvents(10),
        ]);
        setReviewData(review);
        setFallEvents(events);
      } catch (error) {
        console.error('获取数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleEventSelect = (eventId: string) => {
    navigate(`/review/fall/${eventId}`);
  };

  const careComplianceOption = reviewData
    ? {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
        },
        legend: {
          data: ['事件前', '事件后'],
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
          data: ['护理达标率', '总任务数', '已完成数'],
        },
        yAxis: {
          type: 'value',
        },
        series: [
          {
            name: '事件前',
            type: 'bar',
            data: [
              reviewData.careCompliance.beforeEvent.rate,
              reviewData.careCompliance.beforeEvent.totalTasks,
              reviewData.careCompliance.beforeEvent.completedTasks,
            ],
            barWidth: '30%',
            itemStyle: {
              color: '#94a3b8',
              borderRadius: [4, 4, 0, 0],
            },
          },
          {
            name: '事件后',
            type: 'bar',
            data: [
              reviewData.careCompliance.afterEvent.rate,
              reviewData.careCompliance.afterEvent.totalTasks,
              reviewData.careCompliance.afterEvent.completedTasks,
            ],
            barWidth: '30%',
            itemStyle: {
              color: '#0d9488',
              borderRadius: [4, 4, 0, 0],
            },
          },
        ],
      }
    : {};

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'event':
        return <AlertTriangle className="w-4 h-4" />;
      case 'care':
        return <HeartPulse className="w-4 h-4" />;
      case 'remark':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTimelineColor = (type: string) => {
    switch (type) {
      case 'event':
        return 'bg-danger-100 text-danger-600 border-danger-200';
      case 'care':
        return 'bg-primary-100 text-primary-600 border-primary-200';
      case 'remark':
        return 'bg-warning-100 text-warning-600 border-warning-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getRemarkTypeLabel = (type: string) => {
    switch (type) {
      case 'initial':
        return '初次判断';
      case 'review':
        return '复盘备注';
      case 'improvement':
        return '改进措施';
      default:
        return '备注';
    }
  };

  const getRemarkTypeColor = (type: string) => {
    switch (type) {
      case 'initial':
        return 'bg-primary-100 text-primary-700';
      case 'review':
        return 'bg-warning-100 text-warning-700';
      case 'improvement':
        return 'bg-emerald-100 text-emerald-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">加载中...</div>
      </div>
    );
  }

  if (!reviewData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">未找到复盘数据</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/risk')}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回风险事件
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800">跌倒事件复盘</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            围绕跌倒事件的护理达标情况分析与复盘材料
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-danger-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-7 h-7 text-danger-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-slate-800">
                    {reviewData.eventInfo.residentName}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-danger-100 text-danger-700">
                    高风险 · 跌倒
                  </span>
                </div>
                <div className="flex items-center gap-6 mt-3">
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>床位：{reviewData.eventInfo.bedNo}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>发生时间：{reviewData.eventInfo.occurTime}</span>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-700 bg-slate-50 rounded-lg p-3">
                  {reviewData.eventInfo.description}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-800">事件时间线</h3>
              <p className="text-xs text-slate-500 mt-0.5">事件前后的护理记录与备注</p>
            </div>
            <div className="p-5">
              <div className="relative">
                <div className="absolute left-[18px] top-2 bottom-2 w-0.5 bg-slate-200"></div>
                <div className="space-y-4">
                  {reviewData.timeline.map((item, index) => (
                    <div key={index} className="relative flex items-start gap-4 pl-10">
                      <div
                        className={`absolute left-0 w-9 h-9 rounded-full flex items-center justify-center border-2 ${getTimelineColor(
                          item.type
                        )}`}
                      >
                        {getTimelineIcon(item.type)}
                      </div>
                      <div className="flex-1 py-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-800">
                            {item.description}
                          </span>
                          <span className="text-xs text-slate-400">{item.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-800">护理达标对比</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                事件前后各 {reviewData.careCompliance.periodDays} 天的护理执行情况
              </p>
            </div>
            <div className="p-5">
              <div className="h-64">
                <ReactECharts option={careComplianceOption} style={{ height: '100%' }} />
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100">
                <div className="text-center p-3 rounded-lg bg-slate-50">
                  <p className="text-xs text-slate-500 mb-1">事件前达标率</p>
                  <p className="text-xl font-bold text-slate-700">
                    {reviewData.careCompliance.beforeEvent.rate}%
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg bg-primary-50">
                  <p className="text-xs text-primary-600 mb-1">事件后达标率</p>
                  <p className="text-xl font-bold text-primary-700">
                    {reviewData.careCompliance.afterEvent.rate}%
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg bg-warning-50">
                  <p className="text-xs text-warning-600 mb-1">变化</p>
                  <p className="text-xl font-bold text-warning-700">
                    {(
                      reviewData.careCompliance.afterEvent.rate -
                      reviewData.careCompliance.beforeEvent.rate
                    ).toFixed(1)}
                    %
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-800">备注回顾</h3>
              <p className="text-xs text-slate-500 mt-0.5">各阶段的判断备注与改进措施</p>
            </div>
            <div className="p-5">
              {reviewData.remarks.length > 0 ? (
                <div className="space-y-4">
                  {reviewData.remarks.map((remark) => (
                    <div
                      key={remark.id}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRemarkTypeColor(
                            remark.type
                          )}`}
                        >
                          {getRemarkTypeLabel(remark.type)}
                        </span>
                        <span className="text-xs text-slate-400">{remark.time}</span>
                      </div>
                      <p className="text-sm text-slate-700">{remark.content}</p>
                      <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                        <User className="w-3.5 h-3.5" />
                        <span>{remark.user}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>暂无备注记录</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800">最近跌倒事件</h3>
            </div>
            <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
              {fallEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => handleEventSelect(event.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    event.id === id
                      ? 'bg-primary-50 border border-primary-200'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-800">
                      {event.residentName}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-slate-500">{event.bedNo}</span>
                    <span className="text-xs text-danger-600 bg-danger-50 px-1.5 py-0.5 rounded">
                      {event.level === 'high' ? '高风险' : '中风险'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{event.occurTime}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-warning-50 to-white rounded-xl border border-warning-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-warning-600" />
              <h3 className="text-sm font-semibold text-slate-800">复盘要点</h3>
            </div>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-warning-500 mt-1.5 flex-shrink-0"></span>
                检查事件前护理排班是否合理
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-warning-500 mt-1.5 flex-shrink-0"></span>
                分析护理达标率变化原因
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-warning-500 mt-1.5 flex-shrink-0"></span>
                评估环境安全因素
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-warning-500 mt-1.5 flex-shrink-0"></span>
                制定后续改进措施
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-warning-500 mt-1.5 flex-shrink-0"></span>
                跟踪改进效果
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
