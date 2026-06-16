import React, { useEffect, useState, useMemo } from 'react';
import { Card, Row, Col, Statistic, Spin, message, Empty } from 'antd';
import {
  CalendarOutlined,
  PlayCircleOutlined,
  WarningOutlined,
  PlusCircleOutlined,
  FallOutlined,
  TeamOutlined,
  StockOutlined,
  RiseOutlined,
  EnvironmentOutlined,
  UserOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { statisticsService } from '@/services/statisticsService';
import type { StatisticsDto, ExceptionType, SourceType } from '@/types';
import {
  exceptionTypeMap,
  sourceTypeMap,
  scheduleStatusMap,
} from '@/utils/enumUtils';
import PageHeader from '@/components/PageHeader';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<StatisticsDto | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await statisticsService.getOverview({
          startDate: dayjs().startOf('month').format('YYYY-MM-DD'),
          endDate: dayjs().endOf('month').format('YYYY-MM-DD'),
        });
        setData(result);
      } catch (error) {
        message.error('加载仪表盘数据失败');
        console.error('Dashboard data error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const scheduleStatusPieOption = useMemo(() => {
    if (!data?.scheduleStatistics) return {};
    const breakdown = data.scheduleStatistics.statusBreakdown || [];
    return {
      title: { text: '排班状态分布', left: 'center', textStyle: { fontSize: 14 } },
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { orient: 'vertical', left: 'left', top: 'middle', textStyle: { fontSize: 12 } },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
        data: breakdown.map((item) => {
          const mapping = scheduleStatusMap.find((m) => m.value === item.status);
          return {
            name: mapping?.label || item.statusText,
            value: item.count,
            itemStyle: mapping?.color ? { color: getAntdColor(mapping.color) } : undefined,
          };
        }),
      }],
    };
  }, [data]);

  const exceptionTypePieOption = useMemo(() => {
    if (!data?.exceptionStatistics) return {};
    const breakdown = data.exceptionStatistics.typeBreakdown || [];
    return {
      title: { text: '异常类型分布', left: 'center', textStyle: { fontSize: 14 } },
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { orient: 'vertical', left: 'left', top: 'middle', textStyle: { fontSize: 12 } },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
        data: breakdown.map((item) => {
          const mapping = exceptionTypeMap.find((m) => m.value === item.type);
          const isFall = item.type === 1;
          return {
            name: mapping?.label || item.typeText,
            value: item.count,
            itemStyle: {
              color: isFall ? '#ff4d4f' : (mapping?.color ? getAntdColor(mapping.color) : undefined),
              shadowBlur: isFall ? 20 : 0,
              shadowColor: isFall ? 'rgba(255, 77, 79, 0.5)' : undefined,
            },
          };
        }),
      }],
    };
  }, [data]);

  const exceptionTrendLineOption = useMemo(() => {
    if (!data?.exceptionStatistics) return {};
    const trend = data.exceptionStatistics.dailyTrend || [];
    const last7Days = trend.slice(-7);
    return {
      title: { text: '近7天异常趋势', left: 'center', textStyle: { fontSize: 14 } },
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: last7Days.map((item) => dayjs(item.date).format('MM-DD')),
      },
      yAxis: { type: 'value', minInterval: 1 },
      series: [{
        name: '异常数',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3, color: '#ff4d4f' },
        itemStyle: { color: '#ff4d4f' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(255, 77, 79, 0.3)' },
              { offset: 1, color: 'rgba(255, 77, 79, 0.02)' },
            ],
          },
        },
        data: last7Days.map((item) => item.count),
      }],
    };
  }, [data]);

  const careStandardBarOption = useMemo(() => {
    if (!data?.careStandardStatistics) return {};
    const breakdown = data.careStandardStatistics.breakdown || [];
    const colors = ['#8c8c8c', '#ff4d4f', '#52c41a', '#13c2c2'];
    return {
      title: { text: '护理达标率', left: 'center', textStyle: { fontSize: 14 } },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
      xAxis: { type: 'category', data: breakdown.map((item) => item.standardText) },
      yAxis: { type: 'value', minInterval: 1 },
      series: [{
        type: 'bar',
        barWidth: '40%',
        itemStyle: { borderRadius: [4, 4, 0, 0] },
        label: { show: true, position: 'top', formatter: '{c}\n{d}%' },
        data: breakdown.map((item, index) => ({
          value: item.count,
          itemStyle: { color: colors[index % colors.length] },
          percent: item.percentage.toFixed(1),
        })),
      }],
    };
  }, [data]);

  const sourcePieOption = useMemo(() => {
    if (!data?.sourceStatistics) return {};
    const breakdown = data.sourceStatistics.breakdown || [];
    return {
      title: { text: '老人来源分布', left: 'center', textStyle: { fontSize: 14 } },
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { orient: 'vertical', left: 'left', top: 'middle', textStyle: { fontSize: 12 } },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
        data: breakdown.map((item) => {
          const mapping = sourceTypeMap.find((m) => m.value === item.source);
          return {
            name: mapping?.label || item.sourceText,
            value: item.count,
            itemStyle: mapping?.color ? { color: getAntdColor(mapping.color) } : undefined,
          };
        }),
      }],
    };
  }, [data]);

  const handlerRankingBarOption = useMemo(() => {
    if (!data?.handlerStatistics) return {};
    const topHandlers = data.handlerStatistics.topHandlers || [];
    const sorted = [...topHandlers].sort((a, b) => a.totalProcessed - b.totalProcessed);
    return {
      title: { text: '处理人效率排行', left: 'center', textStyle: { fontSize: 14 } },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
      xAxis: { type: 'value', minInterval: 1 },
      yAxis: { type: 'category', data: sorted.map((item) => item.handlerName) },
      series: [
        {
          name: '总处理',
          type: 'bar',
          barWidth: '35%',
          itemStyle: { borderRadius: [0, 4, 4, 0], color: '#1890ff' },
          label: { show: true, position: 'right' },
          data: sorted.map((item) => item.totalProcessed),
        },
        {
          name: '异常处理',
          type: 'bar',
          barWidth: '35%',
          itemStyle: { borderRadius: [0, 4, 4, 0], color: '#faad14' },
          label: { show: true, position: 'right' },
          data: sorted.map((item) => item.exceptionHandled),
        },
      ],
    };
  }, [data]);

  function getAntdColor(color: string | undefined): string | undefined {
    const colorMap: Record<string, string> = {
      blue: '#1890ff', green: '#52c41a', red: '#ff4d4f', gold: '#faad14',
      orange: '#fa8c16', cyan: '#13c2c2', purple: '#722ed1', magenta: '#eb2f96',
      lime: '#a0d911', pink: '#eb2f96', geekblue: '#2f54eb', volcano: '#fa541c',
      success: '#52c41a', error: '#ff4d4f', warning: '#faad14', processing: '#1890ff',
      default: '#8c8c8c',
    };
    return color ? colorMap[color] || color : undefined;
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  const stats = data?.scheduleStatistics;
  const expStats = data?.exceptionStatistics;

  return (
    <div>
      <PageHeader
        title="数据仪表盘"
        subtitle="养老院排班与异常管理系统概览"
        breadcrumb={[{ title: '首页' }, { title: '仪表盘' }]}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/schedules')}>
            <Statistic
              title="总排单数"
              value={stats?.totalCount || 0}
              prefix={<CalendarOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/schedules?status=40')}>
            <Statistic
              title="进行中排单数"
              value={(stats?.inProgressCount || 0) + (stats?.exceptionOccurredCount || 0)}
              prefix={<PlayCircleOutlined style={{ color: '#13c2c2' }} />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/exceptions')}>
            <Statistic
              title="异常总数"
              value={expStats?.totalCount || 0}
              prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/exceptions?dateRange=month')}>
            <Statistic
              title="本月新增异常"
              value={expStats?.totalCount || 0}
              prefix={<PlusCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
              suffix={<span style={{ fontSize: 14, color: '#ff4d4f', marginLeft: 8 }}>
                <FallOutlined /> 跌倒 {expStats?.fallCount || 0}
              </span>}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card>
            {data?.scheduleStatistics?.statusBreakdown && data.scheduleStatistics.statusBreakdown.length > 0 ? (
              <ReactECharts option={scheduleStatusPieOption} style={{ height: 320 }} />
            ) : (
              <Empty style={{ padding: 60 }} description="暂无排班数据" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card>
            {data?.exceptionStatistics?.typeBreakdown && data.exceptionStatistics.typeBreakdown.length > 0 ? (
              <ReactECharts option={exceptionTypePieOption} style={{ height: 320 }} />
            ) : (
              <Empty style={{ padding: 60 }} description="暂无异常数据" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card>
            {data?.exceptionStatistics?.dailyTrend && data.exceptionStatistics.dailyTrend.length > 0 ? (
              <ReactECharts option={exceptionTrendLineOption} style={{ height: 320 }} />
            ) : (
              <Empty style={{ padding: 60 }} description="暂无趋势数据" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card>
            {data?.careStandardStatistics?.breakdown && data.careStandardStatistics.breakdown.length > 0 ? (
              <ReactECharts option={careStandardBarOption} style={{ height: 320 }} />
            ) : (
              <Empty style={{ padding: 60 }} description="暂无护理达标数据" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card>
            {data?.sourceStatistics?.breakdown && data.sourceStatistics.breakdown.length > 0 ? (
              <ReactECharts option={sourcePieOption} style={{ height: 320 }} />
            ) : (
              <Empty style={{ padding: 60 }} description="暂无来源数据" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card>
            {data?.handlerStatistics?.topHandlers && data.handlerStatistics.topHandlers.length > 0 ? (
              <ReactECharts option={handlerRankingBarOption} style={{ height: 320 }} />
            ) : (
              <Empty style={{ padding: 60 }} description="暂无处理人数据" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
