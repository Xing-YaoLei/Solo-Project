import { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import ChartCard from '@/components/ChartCard';
import { residentApi } from '@/services/api';
import type {
  BedUtilization,
  CareLevelDistribution,
  AgeDistribution,
  DiseaseDistribution,
  ResidentProfile,
} from '@/types';

export default function Residents() {
  const [bedUtilization, setBedUtilization] = useState<BedUtilization[]>([]);
  const [careLevelDist, setCareLevelDist] = useState<CareLevelDistribution[]>([]);
  const [ageDist, setAgeDist] = useState<AgeDistribution[]>([]);
  const [diseaseDist, setDiseaseDist] = useState<DiseaseDistribution[]>([]);
  const [residents, setResidents] = useState<ResidentProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bedUtil, careLevel, age, disease, residentList] = await Promise.all([
          residentApi.getBedUtilization(),
          residentApi.getCareLevelDistribution(),
          residentApi.getAgeDistribution(),
          residentApi.getDiseaseDistribution(),
          residentApi.getResidents(page, pageSize),
        ]);
        setBedUtilization(bedUtil);
        setCareLevelDist(careLevel);
        setAgeDist(age);
        setDiseaseDist(disease);
        setResidents(residentList.list);
        setTotal(residentList.total);
      } catch (error) {
        console.error('获取数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page, pageSize]);

  const bedUtilOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const data = params[0];
        return `${data.name}<br/>床位利用率: ${data.value}%`;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      max: 100,
      axisLabel: { formatter: '{value}%' },
    },
    yAxis: {
      type: 'category',
      data: bedUtilization.map((item) => item.area),
    },
    series: [
      {
        type: 'bar',
        data: bedUtilization.map((item) => item.utilizationRate),
        barWidth: '50%',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: '#0d9488' },
              { offset: 1, color: '#2dd4bf' },
            ],
          },
          borderRadius: [0, 6, 6, 0],
        },
        label: {
          show: true,
          position: 'right',
          formatter: '{c}%',
          color: '#0d9488',
          fontWeight: 'bold',
        },
      },
    ],
  };

  const careLevelOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}人 ({d}%)',
    },
    series: [
      {
        name: '护理等级',
        type: 'pie',
        radius: ['50%', '75%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 3,
        },
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}\n{d}%',
          fontSize: 11,
        },
        data: careLevelDist.map((item, index) => ({
          value: item.count,
          name: item.careLevel,
          itemStyle: {
            color: ['#0d9488', '#14b8a6', '#f59e0b', '#ef4444'][index % 4],
          },
        })),
      },
    ],
  };

  const ageOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}人',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: ageDist.map((item) => item.ageGroup),
      axisLabel: {
        fontSize: 10,
        rotate: 15,
      },
    },
    yAxis: {
      type: 'value',
      name: '人数',
    },
    series: [
      {
        type: 'bar',
        data: ageDist.map((item) => item.count),
        barWidth: '55%',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#2dd4bf' },
              { offset: 1, color: '#0d9488' },
            ],
          },
          borderRadius: [6, 6, 0, 0],
        },
      },
    ],
  };

  const diseaseOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}人 ({d}%)',
    },
    series: [
      {
        name: '疾病类型',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '50%'],
        roseType: 'radius',
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{b}',
          fontSize: 11,
        },
        data: diseaseDist.map((item, index) => ({
          value: item.count,
          name: item.disease,
          itemStyle: {
            color: [
              '#0d9488',
              '#14b8a6',
              '#2dd4bf',
              '#f59e0b',
              '#ef4444',
              '#8b5cf6',
              '#06b6d4',
            ][index % 7],
          },
        })),
      },
    ],
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
        <h1 className="text-xl font-bold text-slate-800">老人档案分析</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="床位利用率" subtitle="各区域床位使用情况">
          <div className="h-64">
            <ReactECharts option={bedUtilOption} style={{ height: '100%' }} />
          </div>
        </ChartCard>

        <ChartCard title="护理等级分布" subtitle="在住老人护理等级占比">
          <div className="h-64">
            <ReactECharts option={careLevelOption} style={{ height: '100%' }} />
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="年龄分布" subtitle="在住老人年龄段分布">
          <div className="h-64">
            <ReactECharts option={ageOption} style={{ height: '100%' }} />
          </div>
        </ChartCard>

        <ChartCard title="疾病类型分布" subtitle="主要慢性病分布">
          <div className="h-64">
            <ReactECharts option={diseaseOption} style={{ height: '100%' }} />
          </div>
        </ChartCard>
      </div>

      <ChartCard title="老人档案列表" subtitle={`共 ${total} 位老人`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-medium text-slate-600">姓名</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">年龄</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">性别</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">护理等级</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">床位号</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">入住日期</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">主要疾病</th>
              </tr>
            </thead>
            <tbody>
              {residents.map((resident) => (
                <tr
                  key={resident.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td className="py-3 px-4 text-slate-800 font-medium">{resident.name}</td>
                  <td className="py-3 px-4 text-slate-600">{resident.age}岁</td>
                  <td className="py-3 px-4 text-slate-600">{resident.gender}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                      {resident.careLevel}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{resident.bedNo}</td>
                  <td className="py-3 px-4 text-slate-500">{resident.admissionDate}</td>
                  <td className="py-3 px-4 text-slate-600">{resident.primaryDisease}</td>
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
    </div>
  );
}
