import { useEffect, useState } from 'react';
import { AlertTriangle, Wrench, MessageSquare } from 'lucide-react';
import ChartCard from '../components/ChartCard';
import ComplaintScatterChart from '../components/charts/ComplaintScatterChart';
import PropertyRankingChart from '../components/charts/PropertyRankingChart';
import { api } from '../utils/api';
import { useCurrentRole, useCurrentArea } from '../store';
import type {
  ComplaintTag,
  PropertyRanking,
} from '../../shared/types';

export default function RiskMonitoring() {
  const role = useCurrentRole();
  const area = useCurrentArea();
  const [complaintTags, setComplaintTags] = useState<ComplaintTag[]>([]);
  const [propertyRanking, setPropertyRanking] = useState<PropertyRanking[]>([]);
  const [rankingMetric, setRankingMetric] = useState<'repair' | 'complaint'>('repair');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tags, ranking] = await Promise.all([
        api.getComplaintTags(role, area),
        api.getPropertyRanking(rankingMetric, 'absolute', role, area),
      ]);
      setComplaintTags(tags);
      setPropertyRanking(ranking);
    } catch (error) {
      console.error('Failed to load risk data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [role, area, rankingMetric]);

  const abnormalCount = complaintTags.filter((t) => t.isAbnormal).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">风险监测</h1>
        <p className="text-sm text-slate-500 mt-1">
          投诉标签异常标注与房源风险排行
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">异常标签</p>
              <p className="text-4xl font-bold mt-2">{abnormalCount}</p>
              <p className="text-white/70 text-xs mt-2">
                共 {complaintTags.length} 个投诉标签
              </p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">
                {rankingMetric === 'repair' ? '最高维修次数' : '最高投诉次数'}
              </p>
              <p className="text-4xl font-bold mt-2">
                {propertyRanking[0]
                  ? rankingMetric === 'repair'
                    ? propertyRanking[0].repairCount
                    : propertyRanking[0].complaintCount
                  : 0}
              </p>
              <p className="text-white/70 text-xs mt-2">
                {propertyRanking[0]?.propertyName || '-'}
              </p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              {rankingMetric === 'repair' ? (
                <Wrench className="w-7 h-7" />
              ) : (
                <MessageSquare className="w-7 h-7" />
              )}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">最高风险率</p>
              <p className="text-4xl font-bold mt-2">
                {propertyRanking[0]
                  ? Math.max(
                      ...propertyRanking.map((p) =>
                        rankingMetric === 'repair' ? p.repairRate : p.complaintRate
                      )
                    ).toFixed(1)
                  : 0}
                %
              </p>
              <p className="text-white/70 text-xs mt-2">
                {rankingMetric === 'repair' ? '维修率' : '投诉率'}
              </p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="投诉标签异常标注"
          subtitle="投诉数量与涉及金额分布"
          updateTime={complaintTags[0]?.updateTime}
          onRefresh={loadData}
          isLoading={loading}
          className="lg:col-span-2"
        >
          <ComplaintScatterChart data={complaintTags} height="420px" />
        </ChartCard>

        <ChartCard
          title="房源照片排行"
          subtitle="可切换绝对值和占比查看"
          updateTime={propertyRanking[0]?.updateTime}
          onRefresh={loadData}
          isLoading={loading}
          className="lg:col-span-2"
        >
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setRankingMetric('repair')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                rankingMetric === 'repair'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Wrench className="w-4 h-4" />
              维修排行
            </button>
            <button
              onClick={() => setRankingMetric('complaint')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                rankingMetric === 'complaint'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              投诉排行
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <PropertyRankingChart
                data={propertyRanking}
                metric={rankingMetric}
                height="450px"
              />
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-700 mb-4">
                房源照片展示
              </h4>
              <div className="grid grid-cols-2 gap-4 max-h-[450px] overflow-y-auto pr-2">
                {propertyRanking.map((item, index) => (
                  <div
                    key={item.id}
                    className="group relative rounded-xl overflow-hidden bg-slate-100"
                  >
                    <div className="aspect-square relative">
                      <img
                        src={item.photoUrl}
                        alt={item.propertyName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23e2e8f0" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%2394a3b8" font-family="sans-serif" font-size="14"%3E房源照片%3C/text%3E%3C/svg%3E';
                        }}
                      />
                      <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md font-bold">
                        #{index + 1}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="text-white font-semibold text-sm">
                            {item.propertyName}
                          </p>
                          <p className="text-white/80 text-xs">
                            {item.area}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <span className="bg-blue-500/80 text-white text-xs px-2 py-0.5 rounded">
                              {rankingMetric === 'repair'
                                ? `维修 ${item.repairCount}`
                                : `投诉 ${item.complaintCount}`}
                            </span>
                            <span className="bg-orange-500/80 text-white text-xs px-2 py-0.5 rounded">
                              {rankingMetric === 'repair'
                                ? `${item.repairRate}%`
                                : `${item.complaintRate}%`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
