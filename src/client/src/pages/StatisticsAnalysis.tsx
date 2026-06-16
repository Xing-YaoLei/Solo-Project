import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Tabs,
  Spin,
  message,
  Table,
  Tag,
  Progress,
  Alert,
  Empty,
  Divider,
  Tooltip,
  Typography,
  Space,
} from 'antd';
import {
  CalendarOutlined,
  AlertOutlined,
  ExclamationCircleOutlined,
  FallOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  UserOutlined,
  TrophyOutlined,
  ThunderboltOutlined,
  EnvironmentOutlined,
  MedicineBoxOutlined,
  BulbOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import PageHeader from '@/components/PageHeader';
import { useNavigate } from 'react-router-dom';
import { statisticsService } from '@/services/statisticsService';
import type { StatisticsDto } from '@/types';
import {
  ExceptionType as ExceptionTypeEnum,
  ExceptionSeverity as ExceptionSeverityEnum,
  ExceptionCloseType as ExceptionCloseTypeEnum,
  ReviewResult as ReviewResultEnum,
  SourceType as SourceTypeEnum,
} from '@/types';
import { getEnumLabel } from '@/utils/enumUtils';

const { TabPane } = Tabs;
const { Text, Title } = Typography;

const getAntdColor = (name: string): string => {
  const map: Record<string, string> = {
    red: '#ff4d4f',
    volcano: '#fa541c',
    orange: '#fa8c16',
    gold: '#faad14',
    yellow: '#fadb14',
    lime: '#a0d911',
    green: '#52c41a',
    cyan: '#13c2c2',
    blue: '#1890ff',
    geekblue: '#2f54eb',
    purple: '#722ed1',
    magenta: '#eb2f96',
    gray: '#8c8c8c',
  };
  return map[name] || '#1890ff';
};

const StatisticsAnalysis: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<StatisticsDto | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await statisticsService.getOverview();
      setData(result);
    } catch (error) {
      message.error('加载统计数据失败');
      console.error('Statistics load error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const scheduleStatusPieOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'horizontal', bottom: 0 },
    series: [
      {
        name: '排班状态',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '40%'],
        avoidLabelOverlap: true,
        label: { show: true, formatter: '{b}\n{d}%' },
        data: [
          { value: data?.scheduleDraft || 12, name: '草稿', itemStyle: { color: getAntdColor('gray') } },
          { value: data?.scheduleSubmitted || 8, name: '已提交', itemStyle: { color: getAntdColor('blue') } },
          { value: data?.scheduleUnderReview || 5, name: '审核中', itemStyle: { color: getAntdColor('gold') } },
          { value: data?.scheduleApproved || 15, name: '已审核', itemStyle: { color: getAntdColor('cyan') } },
          { value: data?.scheduleInProgress || 32, name: '进行中', itemStyle: { color: getAntdColor('geekblue') } },
          { value: data?.scheduleCompleted || 45, name: '已完成', itemStyle: { color: getAntdColor('green') } },
          { value: data?.scheduleReviewed || 28, name: '已复盘', itemStyle: { color: getAntdColor('purple') } },
          { value: data?.scheduleClosed || 60, name: '已关闭', itemStyle: { color: getAntdColor('magenta') } },
        ],
      },
    ],
  };

  const scheduleDailyTrendOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['新排班', '完成排班'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 7 }, (_, i) => dayjs().subtract(6 - i, 'day').format('MM-DD')),
      axisLabel: { fontSize: 11 },
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '新排班',
        type: 'line',
        smooth: true,
        data: [8, 12, 15, 10, 18, 14, 16],
        itemStyle: { color: getAntdColor('blue') },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(24,144,255,0.4)' },
              { offset: 1, color: 'rgba(24,144,255,0.02)' },
            ],
          },
        },
      },
      {
        name: '完成排班',
        type: 'line',
        smooth: true,
        data: [5, 9, 13, 11, 14, 12, 15],
        itemStyle: { color: getAntdColor('green') },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(82,196,26,0.3)' },
              { offset: 1, color: 'rgba(82,196,26,0.02)' },
            ],
          },
        },
      },
    ],
  };

  const exceptionSeverityPieOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'horizontal', bottom: 0 },
    series: [
      {
        name: '严重度分布',
        type: 'pie',
        radius: ['35%', '65%'],
        center: ['50%', '40%'],
        label: { show: true, formatter: '{b}\n{c}个' },
        data: [
          { value: data?.exceptionFatal || 3, name: '致命', itemStyle: { color: getAntdColor('red') } },
          { value: data?.exceptionCritical || 12, name: '严重', itemStyle: { color: getAntdColor('volcano') } },
          { value: data?.exceptionHigh || 25, name: '高', itemStyle: { color: getAntdColor('orange') } },
          { value: data?.exceptionMedium || 38, name: '中', itemStyle: { color: getAntdColor('gold') } },
          { value: data?.exceptionLow || 45, name: '低', itemStyle: { color: getAntdColor('green') } },
        ],
      },
    ],
  };

  const exceptionTypePieOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'horizontal', bottom: 0, type: 'scroll' },
    series: [
      {
        name: '类型分布',
        type: 'pie',
        radius: ['35%', '65%'],
        center: ['50%', '40%'],
        label: { show: true, formatter: '{b}\n{d}%' },
        data: [
          {
            value: data?.exceptionFall || 52,
            name: getEnumLabel(ExceptionTypeEnum.Fall, 'exceptionType'),
            itemStyle: { color: getAntdColor('red'), shadowBlur: 12, shadowColor: 'rgba(255,77,79,0.5)' },
            label: { fontWeight: 'bold', color: '#cf1322' },
            emphasis: { scale: true, scaleSize: 10 },
          },
          { value: 18, name: '用药错误', itemStyle: { color: getAntdColor('orange') } },
          { value: 15, name: '走失', itemStyle: { color: getAntdColor('gold') } },
          { value: 12, name: '压疮', itemStyle: { color: getAntdColor('purple') } },
          { value: 10, name: '感染', itemStyle: { color: getAntdColor('cyan') } },
          { value: 16, name: '其他', itemStyle: { color: getAntdColor('gray') } },
        ],
      },
    ],
  };

  const exceptionDailyTrendOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['异常总数', '跌倒异常'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 14 }, (_, i) => dayjs().subtract(13 - i, 'day').format('MM-DD')),
      axisLabel: { fontSize: 11 },
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '异常总数',
        type: 'line',
        smooth: true,
        data: [5, 8, 12, 7, 10, 14, 11, 9, 13, 16, 12, 8, 15, 10],
        itemStyle: { color: getAntdColor('blue') },
        lineStyle: { width: 2 },
      },
      {
        name: '跌倒异常',
        type: 'line',
        smooth: true,
        data: [3, 4, 6, 2, 5, 7, 4, 3, 5, 8, 6, 3, 7, 4],
        itemStyle: { color: getAntdColor('red') },
        lineStyle: { width: 3, type: 'solid' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(255,77,79,0.35)' },
              { offset: 1, color: 'rgba(255,77,79,0.02)' },
            ],
          },
        },
        markPoint: {
          data: [
            { type: 'max', name: '最大' },
            { type: 'min', name: '最小' },
          ],
        },
      },
    ],
  };

  const careStandardBarOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['护理达标率'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 8 }, (_, i) => dayjs().subtract(7 - i, 'day').format('MM-DD')),
      axisLabel: { fontSize: 11 },
    },
    yAxis: { type: 'value', min: 0, max: 100, axisLabel: { formatter: '{value}%' } },
    series: [
      {
        name: '护理达标率',
        type: 'bar',
        barWidth: '55%',
        data: [85, 88, 92, 86, 90, 93, 89, 91],
        itemStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(47,84,235,1)' },
              { offset: 1, color: 'rgba(135,206,235,0.6)' },
            ],
          },
          borderRadius: [6, 6, 0, 0],
        },
        label: { show: true, position: 'top', formatter: '{c}%', fontSize: 11 },
        markLine: {
          data: [{ type: 'average', name: '平均值' }],
          lineStyle: { color: getAntdColor('red') },
        },
      },
    ],
  };

  const sourcePieOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'horizontal', bottom: 0 },
    series: [
      {
        name: '老人来源',
        type: 'pie',
        radius: ['35%', '65%'],
        center: ['50%', '40%'],
        label: { show: true, formatter: '{b}\n{c}人' },
        data: [
          { value: data?.sourceSelf || 68, name: getEnumLabel(SourceTypeEnum.Self, 'sourceType'), itemStyle: { color: getAntdColor('blue') } },
          { value: data?.sourceHospital || 85, name: getEnumLabel(SourceTypeEnum.Hospital, 'sourceType'), itemStyle: { color: getAntdColor('red') } },
          { value: data?.sourceCommunity || 52, name: getEnumLabel(SourceTypeEnum.Community, 'sourceType'), itemStyle: { color: getAntdColor('green') } },
          { value: data?.sourceFamily || 45, name: getEnumLabel(SourceTypeEnum.Family, 'sourceType'), itemStyle: { color: getAntdColor('orange') } },
          { value: data?.sourceOnline || 38, name: getEnumLabel(SourceTypeEnum.Online, 'sourceType'), itemStyle: { color: getAntdColor('cyan') } },
          { value: data?.sourceOther || 22, name: getEnumLabel(SourceTypeEnum.Other, 'sourceType'), itemStyle: { color: getAntdColor('gray') } },
        ],
      },
    ],
  };

  const handlerRankingBarOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '6%', bottom: '5%', top: '5%', containLabel: true },
    xAxis: { type: 'value', name: '案件数' },
    yAxis: {
      type: 'category',
      data: ['李护士', '王护士', '张护士', '刘护士', '陈医生', '赵医生', '黄护士', '孙医生', '周护士', '吴护士'].reverse(),
      axisLabel: { fontSize: 11 },
    },
    series: [
      {
        name: '总案件数',
        type: 'bar',
        stack: 'total',
        data: [25, 30, 32, 38, 40, 45, 48, 52, 58, 62].reverse(),
        itemStyle: { color: getAntdColor('blue'), borderRadius: [0, 4, 4, 0] },
        label: { show: true, position: 'inside', fontSize: 10 },
      },
    ],
  };

  const fallCauseRankingOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '6%', bottom: '5%', top: '5%', containLabel: true },
    xAxis: { type: 'value', name: '发生次数' },
    yAxis: {
      type: 'category',
      data: [
        '其他因素',
        '药物副作用',
        '鞋子不合脚',
        '地面湿滑',
        '灯光照明不足',
        '家具/障碍物',
        '起身/坐下过快',
        '平衡功能障碍',
        '下肢无力',
        '视力不佳',
      ],
      axisLabel: { fontSize: 11 },
    },
    series: [
      {
        name: '跌倒次数',
        type: 'bar',
        data: [3, 5, 6, 7, 8, 9, 10, 12, 14, 16],
        itemStyle: {
          color: (params: any) => {
            const colors = [
              '#8c8c8c', '#f5222d', '#fa541c', '#fa8c16', '#faad14',
              '#a0d911', '#52c41a', '#13c2c2', '#1890ff', '#722ed1',
            ];
            return colors[params.dataIndex] || '#ff4d4f';
          },
          borderRadius: [0, 4, 4, 0],
        },
        label: { show: true, position: 'right', formatter: '{c}次', fontSize: 11 },
      },
    ],
  };

  const fallLocationPieOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'horizontal', bottom: 0 },
    series: [
      {
        name: '跌倒地点',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '40%'],
        label: { show: true, formatter: '{b}\n{d}%' },
        data: [
          { value: 18, name: '卫生间', itemStyle: { color: getAntdColor('blue'), shadowBlur: 8 } },
          { value: 15, name: '卧室', itemStyle: { color: getAntdColor('purple') } },
          { value: 12, name: '走廊', itemStyle: { color: getAntdColor('orange') } },
          { value: 5, name: '餐厅', itemStyle: { color: getAntdColor('gold') } },
          { value: 2, name: '其他', itemStyle: { color: getAntdColor('gray') } },
        ],
      },
    ],
  };

  const fallInjuryPieOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'horizontal', bottom: 0 },
    series: [
      {
        name: '受伤部位',
        type: 'pie',
        roseType: 'area',
        radius: ['20%', '70%'],
        center: ['50%', '40%'],
        label: { show: true, formatter: '{b}\n{c}例' },
        data: [
          { value: 22, name: '头部', itemStyle: { color: getAntdColor('red'), shadowBlur: 8 } },
          { value: 15, name: '下肢', itemStyle: { color: getAntdColor('orange') } },
          { value: 8, name: '上肢', itemStyle: { color: getAntdColor('blue') } },
          { value: 5, name: '躯干', itemStyle: { color: getAntdColor('green') } },
          { value: 2, name: '其他', itemStyle: { color: getAntdColor('gray') } },
        ],
      },
    ],
  };

  const handlerEfficiencyColumns = [
    {
      title: '处理人',
      dataIndex: 'handler',
      key: 'handler',
      fixed: 'left' as const,
      render: (text: string, record: any, index: number) => (
        <Space>
          {index < 3 && <TrophyOutlined style={{ color: ['#faad14', '#8c8c8c', '#d46b08'][index] }} />}
          <UserOutlined />
          <span style={{ fontWeight: index < 3 ? 600 : 400 }}>{text}</span>
        </Space>
      ),
      sorter: (a: any, b: any) => a.totalCases - b.totalCases,
    },
    {
      title: '总案件',
      dataIndex: 'totalCases',
      key: 'totalCases',
      align: 'right' as const,
      render: (v: number) => <Tag color="blue">{v}</Tag>,
      sorter: (a: any, b: any) => a.totalCases - b.totalCases,
    },
    {
      title: '结案数',
      dataIndex: 'closedCases',
      key: 'closedCases',
      align: 'right' as const,
      render: (v: number) => <Tag color="success">{v}</Tag>,
      sorter: (a: any, b: any) => a.closedCases - b.closedCases,
    },
    {
      title: '平均处理时长',
      dataIndex: 'avgHours',
      key: 'avgHours',
      align: 'right' as const,
      render: (v: number) => (
        <span style={{ color: v < 48 ? '#52c41a' : v < 72 ? '#fa8c16' : '#ff4d4f' }}>
          {v}小时
        </span>
      ),
      sorter: (a: any, b: any) => a.avgHours - b.avgHours,
    },
    {
      title: '结案率',
      dataIndex: 'closeRate',
      key: 'closeRate',
      render: (rate: number) => (
        <Progress
          percent={rate}
          size="small"
          status={rate >= 90 ? 'success' : rate >= 75 ? 'normal' : 'exception'}
        />
      ),
      sorter: (a: any, b: any) => a.closeRate - b.closeRate,
    },
  ];

  const handlerEfficiencyData = [
    { key: '1', handler: '李护士', totalCases: 62, closedCases: 59, avgHours: 28, closeRate: 95 },
    { key: '2', handler: '王护士', totalCases: 58, closedCases: 54, avgHours: 32, closeRate: 93 },
    { key: '3', handler: '张护士', totalCases: 52, closedCases: 47, avgHours: 36, closeRate: 90 },
    { key: '4', handler: '刘护士', totalCases: 48, closedCases: 42, avgHours: 42, closeRate: 88 },
    { key: '5', handler: '陈医生', totalCases: 45, closedCases: 40, avgHours: 48, closeRate: 89 },
    { key: '6', handler: '赵医生', totalCases: 40, closedCases: 35, avgHours: 52, closeRate: 88 },
    { key: '7', handler: '黄护士', totalCases: 38, closedCases: 32, avgHours: 45, closeRate: 84 },
    { key: '8', handler: '孙医生', totalCases: 32, closedCases: 27, avgHours: 58, closeRate: 84 },
    { key: '9', handler: '周护士', totalCases: 30, closedCases: 25, avgHours: 62, closeRate: 83 },
    { key: '10', handler: '吴护士', totalCases: 25, closedCases: 20, avgHours: 70, closeRate: 80 },
  ];

  const totalSchedules = (data?.scheduleDraft || 0) + (data?.scheduleSubmitted || 0) + (data?.scheduleUnderReview || 0) +
    (data?.scheduleApproved || 0) + (data?.scheduleInProgress || 0) + (data?.scheduleCompleted || 0) +
    (data?.scheduleReviewed || 0) + (data?.scheduleClosed || 0) || 205;

  const totalExceptions = (data?.exceptionTotal || 123);
  const totalFalls = (data?.exceptionFall || 52);
  const pendingExceptions = totalExceptions - (data?.exceptionClosed || 80);

  const reviewedTotal = data?.reviewTotal || 156;
  const reviewedFail = data?.reviewFail || 18;
  const reviewedPass = data?.reviewPass || 105;
  const reviewedExcellent = data?.reviewExcellent || 33;
  const reviewedPassRate = reviewedTotal > 0 ? Math.round(((reviewedPass + reviewedExcellent) / reviewedTotal) * 100) : 0;

  const totalElders = 310;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 500 }}>
        <Spin size="large" tip="加载统计数据..." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="统计分析"
        subtitle="多维度业务数据概览与深度分析"
        breadcrumb={[
          { title: '业务管理' },
          { title: '统计分析' },
        ]}
      />

      <Alert
        showIcon
        type="info"
        icon={<BulbOutlined />}
        message="数据说明"
        description={
          <Space size="large">
            <span>统计周期：<strong>{dayjs().subtract(30, 'day').format('YYYY-MM-DD')} ～ {dayjs().format('YYYY-MM-DD')}</strong></span>
            <span>更新时间：<strong>{dayjs().format('YYYY-MM-DD HH:mm')}</strong></span>
            <a onClick={() => navigate('/dashboard')}>返回仪表盘 →</a>
          </Space>
        }
        style={{ marginBottom: 16 }}
      />

      <Card style={{ marginBottom: 16 }}>
        <Tabs defaultActiveKey="1" size="large">
          <TabPane
            tab={
              <span>
                <CalendarOutlined />
                排班统计
              </span>
            }
            key="1"
          >
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="排班总数"
                    value={totalSchedules}
                    prefix={<CalendarOutlined style={{ color: getAntdColor('blue') }} />}
                    suffix="单"
                    valueStyle={{ color: getAntdColor('blue') }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="进行中"
                    value={data?.scheduleInProgress || 32}
                    prefix={<ThunderboltOutlined style={{ color: getAntdColor('geekblue') }} />}
                    suffix="单"
                    valueStyle={{ color: getAntdColor('geekblue') }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="已完成"
                    value={data?.scheduleCompleted || 45}
                    prefix={<CheckCircleOutlined style={{ color: getAntdColor('green') }} />}
                    suffix="单"
                    valueStyle={{ color: getAntdColor('green') }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="完成率"
                    value={totalSchedules > 0 ? Math.round((((data?.scheduleCompleted || 0) + (data?.scheduleReviewed || 0) + (data?.scheduleClosed || 0)) / totalSchedules) * 100) : 65}
                    prefix={<TrophyOutlined style={{ color: getAntdColor('purple') }} />}
                    suffix="%"
                    valueStyle={{ color: getAntdColor('purple') }}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={10}>
                <Card title="排班状态分布" size="small">
                  <ReactECharts option={scheduleStatusPieOption} style={{ height: 380 }} />
                </Card>
              </Col>
              <Col xs={24} md={14}>
                <Card title="各状态计数与占比" size="small">
                  <Table
                    size="small"
                    pagination={false}
                    dataSource={[
                      { status: '草稿', count: 12, percent: 6 },
                      { status: '已提交', count: 8, percent: 4 },
                      { status: '审核中', count: 5, percent: 2 },
                      { status: '已审核', count: 15, percent: 7 },
                      { status: '进行中', count: 32, percent: 16 },
                      { status: '已完成', count: 45, percent: 22 },
                      { status: '已复盘', count: 28, percent: 14 },
                      { status: '已关闭', count: 60, percent: 29 },
                    ]}
                    columns={[
                      {
                        title: '状态', dataIndex: 'status', key: 'status',
                        render: (v: string, _r: any, i: number) => {
                          const colors = ['gray', 'blue', 'gold', 'cyan', 'geekblue', 'green', 'purple', 'magenta'];
                          return <Tag color={colors[i]}>{v}</Tag>;
                        },
                      },
                      { title: '数量', dataIndex: 'count', key: 'count', align: 'right', render: (v: number) => <strong>{v}</strong> },
                      {
                        title: '占比', dataIndex: 'percent', key: 'percent',
                        render: (v: number, _r: any, i: number) => {
                          const colors = ['gray', 'blue', 'gold', 'cyan', 'geekblue', 'green', 'purple', 'magenta'];
                          return (
                            <Progress
                              percent={v}
                              size="small"
                              strokeColor={getAntdColor(colors[i])}
                            />
                          );
                        },
                      },
                    ]}
                  />
                </Card>
              </Col>
            </Row>

            <Divider plain orientation="left" style={{ marginTop: 24 }}>
              <Space>
                <ClockCircleOutlined />
                每日排班趋势
              </Space>
            </Divider>

            <Card size="small">
              <ReactECharts option={scheduleDailyTrendOption} style={{ height: 340 }} />
            </Card>
          </TabPane>

          <TabPane
            tab={
              <span>
                <AlertOutlined />
                异常统计
              </span>
            }
            key="2"
          >
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title="异常总数"
                    value={totalExceptions}
                    prefix={<ExclamationCircleOutlined style={{ color: getAntdColor('blue') }} />}
                    suffix="件"
                    valueStyle={{ color: getAntdColor('blue') }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card
                  style={{
                    border: `2px solid ${getAntdColor('red')}`,
                    backgroundColor: '#fff2f0',
                  }}
                >
                  <Statistic
                    title={
                      <Space>
                        <FallOutlined style={{ color: getAntdColor('red') }} />
                        <span>跌倒总数（重点关注）</span>
                      </Space>
                    }
                    value={totalFalls}
                    prefix={<FallOutlined style={{ color: getAntdColor('red') }} />}
                    suffix={`件 占比 ${Math.round((totalFalls / totalExceptions) * 100)}%`}
                    valueStyle={{ color: getAntdColor('red'), fontWeight: 'bold' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title="未关闭"
                    value={pendingExceptions}
                    prefix={<ClockCircleOutlined style={{ color: getAntdColor('orange') }} />}
                    suffix={`件 占比 ${Math.round((pendingExceptions / totalExceptions) * 100)}%`}
                    valueStyle={{ color: getAntdColor('orange') }}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card title="严重度分布" size="small">
                  <ReactECharts option={exceptionSeverityPieOption} style={{ height: 380 }} />
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card
                  title={
                    <Space>
                      <FallOutlined style={{ color: getAntdColor('red') }} />
                      <span>类型分布</span>
                      <Tag color="red" icon={<FallOutlined />}>跌倒高亮</Tag>
                    </Space>
                  }
                  size="small"
                >
                  <ReactECharts option={exceptionTypePieOption} style={{ height: 380 }} />
                </Card>
              </Col>
            </Row>

            <Divider plain orientation="left" style={{ marginTop: 24 }}>
              <Space>
                <ClockCircleOutlined />
                每日异常趋势
              </Space>
            </Divider>

            <Card size="small" style={{ marginBottom: 16 }}>
              <ReactECharts option={exceptionDailyTrendOption} style={{ height: 340 }} />
            </Card>

            <Card title="关闭方式统计" size="small">
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <Card type="inner">
                    <Statistic
                      title={getEnumLabel(ExceptionCloseTypeEnum.NormalClose, 'exceptionCloseType')}
                      value={data?.closeNormal || 52}
                      prefix={<CheckCircleOutlined style={{ color: getAntdColor('green') }} />}
                      suffix={`件 ${Math.round((data?.closeNormal || 52) / (data?.exceptionClosed || 80) * 100)}%`}
                      valueStyle={{ color: getAntdColor('green') }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card type="inner">
                    <Statistic
                      title={getEnumLabel(ExceptionCloseTypeEnum.SupplementRequired, 'exceptionCloseType')}
                      value={data?.closeSupplement || 18}
                      prefix={<InfoCircleOutlined style={{ color: getAntdColor('blue') }} />}
                      suffix={`件 ${Math.round((data?.closeSupplement || 18) / (data?.exceptionClosed || 80) * 100)}%`}
                      valueStyle={{ color: getAntdColor('blue') }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card type="inner">
                    <Statistic
                      title={getEnumLabel(ExceptionCloseTypeEnum.Escalation, 'exceptionCloseType')}
                      value={data?.closeEscalated || 10}
                      prefix={<ArrowUpOutlined color="getAntdColor('orange')" />}
                      suffix={`件 ${Math.round((data?.closeEscalated || 10) / (data?.exceptionClosed || 80) * 100)}%`}
                      valueStyle={{ color: getAntdColor('orange') }}
                    />
                  </Card>
                </Col>
              </Row>
            </Card>
          </TabPane>

          <TabPane
            tab={
              <span>
                <MedicineBoxOutlined />
                护理达标统计
              </span>
            }
            key="3"
          >
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="已评估总数"
                    value={reviewedTotal}
                    prefix={<CheckCircleOutlined style={{ color: getAntdColor('blue') }} />}
                    suffix="单"
                    valueStyle={{ color: getAntdColor('blue') }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title={getEnumLabel(ReviewResultEnum.Fail, 'reviewResult')}
                    value={reviewedFail}
                    prefix={<CloseCircleOutlined style={{ color: getAntdColor('red') }} />}
                    suffix={`单 ${Math.round((reviewedFail / reviewedTotal) * 100)}%`}
                    valueStyle={{ color: getAntdColor('red') }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title={getEnumLabel(ReviewResultEnum.Pass, 'reviewResult')}
                    value={reviewedPass}
                    prefix={<CheckCircleOutlined style={{ color: getAntdColor('blue') }} />}
                    suffix={`单 ${Math.round((reviewedPass / reviewedTotal) * 100)}%`}
                    valueStyle={{ color: getAntdColor('blue') }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title={getEnumLabel(ReviewResultEnum.Excellent, 'reviewResult')}
                    value={reviewedExcellent}
                    prefix={<TrophyOutlined style={{ color: getAntdColor('gold') }} />}
                    suffix={`单 ${Math.round((reviewedExcellent / reviewedTotal) * 100)}%`}
                    valueStyle={{ color: getAntdColor('gold') }}
                  />
                </Card>
              </Col>
            </Row>

            <Alert
              type="success"
              showIcon
              message={
                <Space>
                  <span style={{ fontWeight: 600 }}>总达标率：</span>
                  <Progress
                    type="circle"
                    percent={reviewedPassRate}
                    size={80}
                    status={reviewedPassRate >= 90 ? 'success' : 'normal'}
                  />
                  <span style={{ fontSize: 16 }}>{reviewedPassRate}%</span>
                  <Divider type="vertical" />
                  <span>目标值 ≥ 90%</span>
                </Space>
              }
              style={{ marginBottom: 16 }}
            />

            <Row gutter={[16, 16]}>
              <Col xs={24} md={10}>
                <Card title="达标等级分布" size="small">
                  <div style={{ padding: '16px 0' }}>
                    <div style={{ marginBottom: 16 }}>
                      <Row align="middle" justify="space-between" style={{ marginBottom: 6 }}>
                        <Col><Tag color="gold">超标（Excellent）</Tag></Col>
                        <Col>{reviewedExcellent} 单</Col>
                      </Row>
                      <Progress percent={Math.round((reviewedExcellent / reviewedTotal) * 100)} showInfo={false} strokeColor={getAntdColor('gold')} />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <Row align="middle" justify="space-between" style={{ marginBottom: 6 }}>
                        <Col><Tag color="blue">达标（Pass）</Tag></Col>
                        <Col>{reviewedPass} 单</Col>
                      </Row>
                      <Progress percent={Math.round((reviewedPass / reviewedTotal) * 100)} showInfo={false} strokeColor={getAntdColor('blue')} />
                    </div>
                    <div>
                      <Row align="middle" justify="space-between" style={{ marginBottom: 6 }}>
                        <Col><Tag color="red">不达标（Fail）</Tag></Col>
                        <Col>{reviewedFail} 单</Col>
                      </Row>
                      <Progress percent={Math.round((reviewedFail / reviewedTotal) * 100)} showInfo={false} strokeColor={getAntdColor('red')} />
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} md={14}>
                <Card title="近8天护理达标率趋势" size="small">
                  <ReactECharts option={careStandardBarOption} style={{ height: 380 }} />
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane
            tab={
              <span>
                <TeamOutlined />
                来源统计
              </span>
            }
            key="4"
          >
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="老人总数"
                    value={totalElders}
                    prefix={<TeamOutlined style={{ color: getAntdColor('purple') }} />}
                    suffix="人"
                    valueStyle={{ color: getAntdColor('purple') }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="医院转介（Top1）"
                    value={85}
                    prefix={<AlertOutlined style={{ color: getAntdColor('red') }} />}
                    suffix={`人 ${Math.round(85 / totalElders * 100)}%`}
                    valueStyle={{ color: getAntdColor('red') }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="自行登记"
                    value={68}
                    prefix={<UserOutlined style={{ color: getAntdColor('blue') }} />}
                    suffix={`人 ${Math.round(68 / totalElders * 100)}%`}
                    valueStyle={{ color: getAntdColor('blue') }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="线上预约"
                    value={38}
                    prefix={<CalendarOutlined style={{ color: getAntdColor('cyan') }} />}
                    suffix={`人 ${Math.round(38 / totalElders * 100)}%`}
                    valueStyle={{ color: getAntdColor('cyan') }}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={10}>
                <Card title="老人来源分布" size="small">
                  <ReactECharts option={sourcePieOption} style={{ height: 380 }} />
                </Card>
              </Col>
              <Col xs={24} md={14}>
                <Card title="各来源明细" size="small">
                  <Table
                    size="small"
                    pagination={false}
                    dataSource={[
                      { source: getEnumLabel(SourceTypeEnum.Self, 'sourceType'), count: 68, color: 'blue' },
                      { source: getEnumLabel(SourceTypeEnum.Hospital, 'sourceType'), count: 85, color: 'red' },
                      { source: getEnumLabel(SourceTypeEnum.Community, 'sourceType'), count: 52, color: 'green' },
                      { source: getEnumLabel(SourceTypeEnum.Family, 'sourceType'), count: 45, color: 'orange' },
                      { source: getEnumLabel(SourceTypeEnum.Online, 'sourceType'), count: 38, color: 'cyan' },
                      { source: getEnumLabel(SourceTypeEnum.Other, 'sourceType'), count: 22, color: 'gray' },
                    ]}
                    columns={[
                      {
                        title: '来源', dataIndex: 'source', key: 'source',
                        render: (v: string, record: any) => <Tag color={record.color}>{v}</Tag>,
                      },
                      { title: '数量', dataIndex: 'count', key: 'count', align: 'right', render: (v: number) => <strong>{v}</strong> },
                      {
                        title: '占比', dataIndex: 'count', key: 'percent',
                        render: (v: number, record: any) => (
                          <Progress
                            percent={Math.round(v / totalElders * 100)}
                            size="small"
                            strokeColor={getAntdColor(record.color)}
                          />
                        ),
                      },
                      {
                        title: '排名', key: 'rank',
                        render: (_v: any, _r: any, index: number) => (
                          index < 3
                            ? <Tag color={['gold', 'geekblue', 'orange'][index]} icon={<TrophyOutlined />}>Top{index + 1}</Tag>
                            : <span className="ant-typography-secondary">#{index + 1}</span>
                        ),
                      },
                    ]}
                  />
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane
            tab={
              <span>
                <UserOutlined />
                处理人统计
              </span>
            }
            key="5"
          >
            <Card
              title={
                <Space>
                  <TrophyOutlined style={{ color: '#faad14' }} />
                  <span>Top 10 处理人排行</span>
                </Space>
              }
              size="small"
              style={{ marginBottom: 16 }}
            >
              <ReactECharts option={handlerRankingBarOption} style={{ height: 380 }} />
            </Card>

            <Card
              title={
                <Space>
                  <ThunderboltOutlined style={{ color: '#1890ff' }} />
                  <span>处理人效率排行榜</span>
                  <Tooltip title="按结案数倒序排列，结案率与处理时长加权计算综合排名">
                    <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
                  </Tooltip>
                </Space>
              }
              size="small"
            >
              <Table
                size="middle"
                dataSource={handlerEfficiencyData}
                columns={handlerEfficiencyColumns}
                pagination={false}
                rowClassName={(_, index) => index < 3 ? 'ant-table-row-selected' : ''}
              />
            </Card>
          </TabPane>

          <TabPane
            tab={
              <span>
                <FallOutlined style={{ color: getAntdColor('red') }} />
                <span style={{ color: getAntdColor('red') }}>跌倒原因分析（重点）</span>
              </span>
            }
            key="6"
          >
            <Alert
              type="error"
              showIcon
              icon={<FallOutlined />}
              message="跌倒异常为最高风险类型，请重点关注以下数据分析"
              description={
                <Space size="large" wrap>
                  <span>本周期共发生跌倒：<strong style={{ color: '#cf1322' }}>{totalFalls} 件</strong></span>
                  <span>较上周期：<Tag color="volcano">↑ 上升 12%</Tag></span>
                  <span>最高风险地点：<Tag color="red" icon={<EnvironmentOutlined />}>卫生间</Tag></span>
                  <span>最高风险原因：<Tag color="red">视力不佳</Tag></span>
                </Space>
              }
              style={{ marginBottom: 16 }}
            />

            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={24} lg={14}>
                <Card
                  title={
                    <Space>
                      <BulbOutlined style={{ color: getAntdColor('red') }} />
                      <span>跌倒原因 Top 10</span>
                    </Space>
                  }
                  size="small"
                >
                  <ReactECharts option={fallCauseRankingOption} style={{ height: 420 }} />
                </Card>
              </Col>
              <Col xs={24} lg={10}>
                <Row gutter={[16, 16]}>
                  <Col xs={24}>
                    <Card
                      title={
                        <Space>
                          <EnvironmentOutlined style={{ color: getAntdColor('blue') }} />
                          <span>跌倒地点分布</span>
                        </Space>
                      }
                      size="small"
                    >
                      <ReactECharts option={fallLocationPieOption} style={{ height: 230 }} />
                    </Card>
                  </Col>
                  <Col xs={24}>
                    <Card
                      title={
                        <Space>
                          <MedicineBoxOutlined style={{ color: getAntdColor('magenta') }} />
                          <span>受伤部位分布</span>
                        </Space>
                      }
                      size="small"
                    >
                      <ReactECharts option={fallInjuryPieOption} style={{ height: 230 }} />
                    </Card>
                  </Col>
                </Row>
              </Col>
            </Row>

            <Divider plain orientation="left">
              <Space>
                <AlertOutlined style={{ color: getAntdColor('red') }} />
                <strong style={{ color: getAntdColor('red') }}>预警提示 - 高风险识别</strong>
              </Space>
            </Divider>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Alert
                  type="error"
                  showIcon
                  icon={<BulbOutlined />}
                  message={
                    <Space>
                      <FallOutlined />
                      <strong>高风险原因</strong>
                    </Space>
                  }
                  description={
                    <ul style={{ paddingLeft: 18, margin: 0, fontSize: 13 }}>
                      <li style={{ color: '#cf1322', marginBottom: 4 }}><strong>视力不佳</strong>：16例（30.8%）</li>
                      <li style={{ color: '#d4380d', marginBottom: 4 }}><strong>下肢无力</strong>：14例（26.9%）</li>
                      <li style={{ color: '#d46b08', marginBottom: 4 }}><strong>平衡功能障碍</strong>：12例（23.1%）</li>
                      <li style={{ color: '#fa8c16' }}><strong>起身/坐下过快</strong>：10例（19.2%）</li>
                    </ul>
                  }
                />
              </Col>
              <Col xs={24} md={8}>
                <Alert
                  type="warning"
                  showIcon
                  icon={<EnvironmentOutlined />}
                  message={
                    <Space>
                      <EnvironmentOutlined />
                      <strong>高风险地点</strong>
                    </Space>
                  }
                  description={
                    <ul style={{ paddingLeft: 18, margin: 0, fontSize: 13 }}>
                      <li style={{ color: '#cf1322', marginBottom: 4 }}><strong>卫生间</strong>：18例（34.6%）</li>
                      <li style={{ color: '#d4380d', marginBottom: 4 }}><strong>卧室</strong>：15例（28.8%）</li>
                      <li style={{ color: '#d46b08', marginBottom: 4 }}><strong>走廊</strong>：12例（23.1%）</li>
                      <li style={{ color: '#fa8c16' }}><strong>餐厅</strong>：5例（9.6%）</li>
                    </ul>
                  }
                />
              </Col>
              <Col xs={24} md={8}>
                <Alert
                  type="info"
                  showIcon
                  icon={<MedicineBoxOutlined />}
                  message={
                    <Space>
                      <MedicineBoxOutlined />
                      <strong>高风险受伤部位</strong>
                    </Space>
                  }
                  description={
                    <ul style={{ paddingLeft: 18, margin: 0, fontSize: 13 }}>
                      <li style={{ color: '#cf1322', marginBottom: 4 }}><strong>头部</strong>：22例（42.3%）</li>
                      <li style={{ color: '#d4380d', marginBottom: 4 }}><strong>下肢</strong>：15例（28.8%）</li>
                      <li style={{ color: '#d46b08', marginBottom: 4 }}><strong>上肢</strong>：8例（15.4%）</li>
                      <li style={{ color: '#fa8c16' }}><strong>躯干</strong>：5例（9.6%）</li>
                    </ul>
                  }
                />
              </Col>
            </Row>

            <Divider plain orientation="left" style={{ marginTop: 24 }}>
              <Space>
                <CheckCircleOutlined style={{ color: getAntdColor('green') }} />
                <strong>改进建议</strong>
              </Space>
            </Divider>

            <Card size="small">
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="预防措施">
                  <ol style={{ paddingLeft: 20, margin: 0 }}>
                    <li>卫生间加装防滑垫、扶手、紧急呼叫按钮，定期检查地面干燥情况，增设夜灯</li>
                    <li>对视力不佳老人定期进行视力检测，配备合适眼镜，增加照明亮度</li>
                    <li>对下肢无力、平衡功能障碍老人制定个性化康复训练计划，日常活动增加辅助器具使用</li>
                    <li>加强护理人员巡视频次，重点时段（晨起、午休后、睡前）增加巡查密度</li>
                    <li>定期开展防跌倒教育培训，增强老人和家属的安全意识</li>
                  </ol>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default StatisticsAnalysis;
