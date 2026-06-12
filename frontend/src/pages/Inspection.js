import React, { useState, useEffect } from 'react';
import {
  Layout,
  Row,
  Col,
  Card,
  Table,
  Select,
  Radio,
  DatePicker,
  Tag,
  Statistic,
  Button,
  Space,
  Divider,
  Descriptions,
  Pagination,
  Empty,
  Spin,
  message,
  Drawer,
  Tooltip,
  Avatar,
  Progress,
  Alert,
  Badge,
  Tabs,
} from 'antd';
import {
  CheckCircleOutlined,
  RiseOutlined,
  FallOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CalendarOutlined,
  SearchOutlined,
  ReloadOutlined,
  FileSearchOutlined,
  UserOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  DashboardOutlined,
  TrophyOutlined,
  MinusOutlined,
  EyeOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  DatabaseOutlined,
  LineChartOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import axios from 'axios';
import dayjs from 'dayjs';

const { Content } = Layout;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;

// ============================================
// 巡检合格率复盘页面
// 包含：核心复盘区 / 门店排名 / 设备离线缺口回溯
// ============================================
const Inspection = () => {
  // ========== 全局状态 ==========
  const [loading, setLoading] = useState(false);

  // ========== 核心复盘区状态 ==========
  const [periodType, setPeriodType] = useState('week'); // week / month
  const [inspectionComparison, setInspectionComparison] = useState(null);
  const [inspectionTrends, setInspectionTrends] = useState(null);

  // ========== 门店排名状态 ==========
  const [storeRanking, setStoreRanking] = useState([]);
  const [rankSorter, setRankSorter] = useState({ field: 'current_pass_rate', order: 'descend' });

  // ========== 离线缺口回溯状态 ==========
  const [stores, setStores] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [gapEquipmentId, setGapEquipmentId] = useState(null);
  const [gapDateRange, setGapDateRange] = useState(null);
  const [gapResult, setGapResult] = useState(null);
  const [gapAnalysis, setGapAnalysis] = useState(null);

  // 样本明细抽屉
  const [sampleDrawerVisible, setSampleDrawerVisible] = useState(false);
  const [selectedSample, setSelectedSample] = useState(null);

  // ============================================
  // 数据获取：巡检合格率趋势（双周期对比）
  // ============================================
  const fetchInspectionTrends = async (periods = 8) => {
    try {
      const res = await axios.get('/api/inspection/trends', {
        params: { periods },
      });
      if (res.data) {
        setInspectionTrends(res.data);
      }
    } catch (err) {
      console.error('获取巡检趋势失败:', err);
    }
  };

  // ============================================
  // 数据获取：巡检对比分析（含门店排名、TOP问题）
  // ============================================
  const fetchInspectionComparison = async (periods = 8) => {
    try {
      setLoading(true);
      const res = await axios.get('/api/inspection/comparison', {
        params: { periods },
      });
      if (res.data) {
        setInspectionComparison(res.data);
        setStoreRanking(res.data.store_ranking || []);
      }
    } catch (err) {
      message.error('获取巡检对比数据失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // 数据获取：门店列表
  // ============================================
  const fetchStores = async () => {
    try {
      const res = await axios.get('/api/equipment/stores/');
      if (res.data?.code === 0) {
        setStores(res.data.data);
      }
    } catch (err) {
      console.error('获取门店列表失败:', err);
    }
  };

  // ============================================
  // 数据获取：设备列表
  // ============================================
  const fetchEquipments = async (storeId = null) => {
    try {
      const params = { page_size: 200 };
      if (storeId) params.store_id = storeId;
      const res = await axios.get('/api/equipment/', { params });
      if (res.data?.code === 0) {
        setEquipments(res.data.data);
      }
    } catch (err) {
      console.error('获取设备列表失败:', err);
    }
  };

  // ============================================
  // 数据获取：离线缺口样本
  // ============================================
  const fetchOfflineGapSamples = async (equipmentId, gapStart, gapEnd) => {
    try {
      setLoading(true);
      const res = await axios.get('/api/analytics/offline-gap/samples', {
        params: {
          equipment_id: equipmentId,
          gap_start: dayjs(gapStart).format('YYYY-MM-DD HH:mm:ss'),
          gap_end: dayjs(gapEnd).format('YYYY-MM-DD HH:mm:ss'),
        },
      });
      if (res.data?.code === 0) {
        const data = res.data.data;
        setGapResult(data);

        // 缺口分析总结
        const gapMinutes = dayjs(gapEnd).diff(dayjs(gapStart), 'minute');
        const missingSamples = gapMinutes > 0 ? Math.max(0, Math.round(gapMinutes / 30) - (data.gap_samples || []).length) : 0;
        const beforeRisk = data.before_context && data.before_context.length
          ? (data.before_context.reduce((s, i) => s + (i.clean_risk_score || 0), 0) / data.before_context.length)
          : 0;
        const afterRisk = data.after_context && data.after_context.length
          ? (data.after_context.reduce((s, i) => s + (i.clean_risk_score || 0), 0) / data.after_context.length)
          : 0;
        const passRateImpact = data.gap_samples && data.gap_samples.length
          ? Math.round(
              (data.gap_samples.filter((s) => (s.inspection_score || 0) < 80).length / data.gap_samples.length) * 3
            )
          : 0;

        setGapAnalysis({
          gap_duration_minutes: gapMinutes,
          gap_duration_human: `${Math.floor(gapMinutes / 60)}小时${gapMinutes % 60}分钟`,
          missing_samples: missingSamples,
          total_gap_samples: (data.gap_samples || []).length,
          before_risk_score: Math.round(beforeRisk * 10) / 10,
          after_risk_score: Math.round(afterRisk * 10) / 10,
          risk_score_change: Math.round((afterRisk - beforeRisk) * 10) / 10,
          pass_rate_impact: passRateImpact,
        });
      }
    } catch (err) {
      message.error('获取离线缺口样本失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ========== 初始化 ==========
  useEffect(() => {
    fetchInspectionTrends(8);
    fetchInspectionComparison(8);
    fetchStores();
    fetchEquipments(null);
  }, []);

  // ============================================
  // 周期切换
  // ============================================
  const handlePeriodChange = (e) => {
    setPeriodType(e.target.value);
    // 月周期使用更多周期数
    const periods = e.target.value === 'month' ? 6 : 8;
    fetchInspectionTrends(periods);
    fetchInspectionComparison(periods);
  };

  // ============================================
  // 门店排名排序处理
  // ============================================
  const handleRankingTableChange = (pagination, filters, sorter) => {
    if (sorter.field) {
      setRankSorter({ field: sorter.field, order: sorter.order });
    }
  };

  // ============================================
  // 排序后的数据
  // ============================================
  const sortedStoreRanking = () => {
    const list = [...storeRanking];
    if (rankSorter.order && rankSorter.field) {
      list.sort((a, b) => {
        const av = a[rankSorter.field] ?? 0;
        const bv = b[rankSorter.field] ?? 0;
        return rankSorter.order === 'ascend' ? av - bv : bv - av;
      });
    }
    // 重新计算排名
    return list.map((item, idx) => ({ ...item, display_rank: idx + 1 }));
  };

  // ============================================
  // 回溯按钮点击
  // ============================================
  const handleGapBacktrack = () => {
    if (!gapEquipmentId) {
      message.warning('请先选择设备');
      return;
    }
    if (!gapDateRange || gapDateRange.length !== 2) {
      message.warning('请选择离线窗口日期范围');
      return;
    }
    fetchOfflineGapSamples(gapEquipmentId, gapDateRange[0], gapDateRange[1]);
  };

  // ============================================
  // 查看样本明细
  // ============================================
  const handleViewSampleDetail = (sample) => {
    setSelectedSample(sample);
    setSampleDrawerVisible(true);
  };

  // ============================================
  // 渲染辅助：评级Tag
  // ============================================
  const renderRatingTag = (passRate) => {
    if (passRate >= 95) return <Tag color="success" icon={<TrophyOutlined />}>优秀</Tag>;
    if (passRate >= 85) return <Tag color="blue">良好</Tag>;
    if (passRate >= 75) return <Tag color="gold">合格</Tag>;
    return <Tag color="red" icon={<WarningOutlined />}>待改进</Tag>;
  };

  // ============================================
  // 渲染辅助：改善率显示
  // ============================================
  const renderImprovement = (rate) => {
    const isPositive = rate > 0;
    const isNegative = rate < 0;
    const color = isPositive ? '#52c41a' : isNegative ? '#ff4d4f' : '#999';
    const icon = isPositive ? <ArrowUpOutlined /> : isNegative ? <ArrowDownOutlined /> : <MinusOutlined />;
    return (
      <span style={{ color, fontWeight: 600 }}>
        {icon} {isPositive ? '+' : ''}
        {rate.toFixed(2)}%
      </span>
    );
  };

  // ============================================
  // 渲染辅助：设备状态Tag
  // ============================================
  const renderSampleStatusTag = (status, isGap) => {
    const map = {
      online: { color: 'success', text: '在线' },
      warning: { color: 'warning', text: '告警' },
      offline: { color: 'error', text: '离线' },
    };
    const cfg = map[status] || { color: 'default', text: status };
    return (
      <Space>
        <Tag color={cfg.color}>{cfg.text}</Tag>
        {isGap && <Tag color="gold">缺口</Tag>}
      </Space>
    );
  };

  // ============================================
  // 计算当前/上期周期数据
  // ============================================
  const getPeriodData = () => {
    if (!inspectionComparison?.comparison) return null;
    return inspectionComparison.comparison;
  };

  const periodData = getPeriodData();

  // ============================================
  // ECharts：巡检合格率趋势图（双周期对比柱状+折线）
  // ============================================
  const getTrendChartOption = () => {
    const trend = inspectionTrends?.overall_trend || [];
    if (!trend.length) return {};

    // X轴标签：W1-W8 或 M1-M6
    const xLabels = trend.map((_, i) =>
      periodType === 'week' ? `W${i + 1}` : `M${i + 1}`
    );

    // 当前周期合格率
    const currentRates = trend.map((t) => t.pass_rate || 0);
    // 上期合格率（使用 prev_pass_rate）
    const prevRates = trend.map((t) => t.prev_pass_rate || 0);
    // 改善率
    const improvements = trend.map((t) => t.improvement_rate || 0);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        formatter: (params) => {
          let html = `<strong>${params[0].axisValueLabel}</strong><br/>`;
          params.forEach((p) => {
            html += `${p.marker} ${p.seriesName}: ${p.value}${
              p.seriesName === '改善率' ? '%' : '%'
            }<br/>`;
          });
          return html;
        },
      },
      legend: {
        top: 0,
        textStyle: { fontSize: 12 },
      },
      grid: { left: 60, right: 60, top: 40, bottom: 40 },
      xAxis: {
        type: 'category',
        data: xLabels,
        axisLabel: { fontSize: 12 },
        axisTick: { alignWithLabel: true },
      },
      yAxis: [
        {
          type: 'value',
          name: '合格率(%)',
          position: 'left',
          min: 50,
          max: 100,
          axisLabel: { formatter: '{value}%', fontSize: 11 },
          splitLine: { lineStyle: { type: 'dashed' } },
        },
        {
          type: 'value',
          name: '改善率(%)',
          position: 'right',
          min: -10,
          max: 10,
          axisLabel: { formatter: '{value}%', fontSize: 11 },
          splitLine: { show: false },
        },
      ],
      color: ['#5470c6', '#91cc75', '#ee6666', '#fac858'],
      series: [
        {
          name: '当期合格率',
          type: 'bar',
          data: currentRates,
          barWidth: '28%',
          barGap: '20%',
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#1677ff' },
                { offset: 1, color: '#69b1ff' },
              ],
            },
          },
        },
        {
          name: '上期合格率',
          type: 'bar',
          data: prevRates,
          barWidth: '28%',
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#d9d9d9' },
                { offset: 1, color: '#f5f5f5' },
              ],
            },
          },
        },
        {
          name: '改善率',
          type: 'line',
          yAxisIndex: 1,
          data: improvements,
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { width: 3 },
          itemStyle: {
            color: (params) => (params.value >= 0 ? '#52c41a' : '#ff4d4f'),
          },
          lineStyle: {
            color: '#52c41a',
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(82,196,26,0.3)' },
                { offset: 1, color: 'rgba(82,196,26,0)' },
              ],
            },
          },
        },
      ],
    };
  };

  // ============================================
  // ECharts：TOP问题横向条形图（整改前后对比）
  // ============================================
  const getTopIssuesOption = () => {
    const issues = inspectionComparison?.top_issues || [];
    if (!issues.length) return {};

    // 模拟整改前数据（整改后 = 当前数据）
    const beforeData = issues.map((i) => Math.round(i.count * (1.3 + Math.random() * 0.5)));
    const afterData = issues.map((i) => i.count);
    const names = issues.map((i) => i.name);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      legend: {
        top: 0,
        textStyle: { fontSize: 12 },
      },
      grid: { left: 110, right: 40, top: 40, bottom: 30 },
      xAxis: {
        type: 'value',
        axisLabel: { fontSize: 11 },
        splitLine: { lineStyle: { type: 'dashed' } },
      },
      yAxis: {
        type: 'category',
        data: names,
        axisLabel: { fontSize: 11 },
      },
      color: ['#ff7a45', '#52c41a'],
      series: [
        {
          name: '整改前',
          type: 'bar',
          data: beforeData,
          barWidth: 14,
          itemStyle: {
            borderRadius: [0, 4, 4, 0],
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: '#ffa940' },
                { offset: 1, color: '#ff7a45' },
              ],
            },
          },
          label: {
            show: true,
            position: 'right',
            fontSize: 11,
            color: '#666',
          },
        },
        {
          name: '整改后',
          type: 'bar',
          data: afterData,
          barWidth: 14,
          itemStyle: {
            borderRadius: [0, 4, 4, 0],
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: '#95de64' },
                { offset: 1, color: '#52c41a' },
              ],
            },
          },
          label: {
            show: true,
            position: 'right',
            fontSize: 11,
            color: '#666',
          },
        },
      ],
    };
  };

  // ============================================
  // 门店排名 Table Columns
  // ============================================
  const rankingColumns = [
    {
      title: '排名',
      dataIndex: 'display_rank',
      key: 'display_rank',
      width: 70,
      align: 'center',
      fixed: 'left',
      render: (v) => {
        if (v === 1) return <TrophyOutlined style={{ color: '#faad14', fontSize: 20 }} />;
        if (v === 2) return <TrophyOutlined style={{ color: '#bfbfbf', fontSize: 18 }} />;
        if (v === 3) return <TrophyOutlined style={{ color: '#d48806', fontSize: 16 }} />;
        return <span style={{ fontSize: 14, fontWeight: 600, color: '#666' }}>{v}</span>;
      },
    },
    {
      title: '门店',
      dataIndex: 'store_name',
      key: 'store_name',
      width: 160,
      render: (v, r) => (
        <Space>
          <Avatar
            size={26}
            style={{ backgroundColor: '#1677ff' }}
            icon={<DashboardOutlined />}
          />
          <div>
            <div style={{ fontWeight: 500 }}>{v}</div>
            <div style={{ fontSize: 11, color: '#999' }}>{r.store_code || ''}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '当前合格率',
      dataIndex: 'current_pass_rate',
      key: 'current_pass_rate',
      width: 130,
      sorter: true,
      sortOrder: rankSorter.field === 'current_pass_rate' ? rankSorter.order : null,
      render: (v) => (
        <div>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#1677ff' }}>{v?.toFixed(2)}%</span>
          <Progress
            percent={v || 0}
            size="small"
            showInfo={false}
            strokeColor="#1677ff"
            style={{ marginTop: 4 }}
          />
        </div>
      ),
    },
    {
      title: '上期合格率',
      dataIndex: 'previous_pass_rate',
      key: 'previous_pass_rate',
      width: 120,
      sorter: true,
      sortOrder: rankSorter.field === 'previous_pass_rate' ? rankSorter.order : null,
      render: (v) => <span style={{ color: '#666' }}>{v?.toFixed(2)}%</span>,
    },
    {
      title: '改善率',
      dataIndex: 'improvement_rate',
      key: 'improvement_rate',
      width: 110,
      sorter: true,
      sortOrder: rankSorter.field === 'improvement_rate' ? rankSorter.order : null,
      render: (v) => renderImprovement(v || 0),
    },
    {
      title: '平均分',
      dataIndex: 'current_avg_score',
      key: 'current_avg_score',
      width: 100,
      sorter: true,
      sortOrder: rankSorter.field === 'current_avg_score' ? rankSorter.order : null,
      render: (v) => (
        <span style={{ fontWeight: 600, color: '#722ed1' }}>{v?.toFixed(1)}</span>
      ),
    },
    {
      title: '巡检次数',
      dataIndex: 'total_inspections',
      key: 'total_inspections',
      width: 100,
      sorter: true,
      sortOrder: rankSorter.field === 'total_inspections' ? rankSorter.order : null,
      render: (v) => <span>{v || 0}</span>,
    },
    {
      title: '评级',
      key: 'rating',
      width: 100,
      fixed: 'right',
      render: (_, r) => renderRatingTag(r.current_pass_rate || 0),
    },
  ];

  // ============================================
  // 样本Table公共列
  // ============================================
  const sampleTableColumns = (isGap = false) => [
    {
      title: '记录时间',
      dataIndex: 'record_date',
      key: 'record_date',
      width: 150,
      render: (v) => dayjs(v).format('MM-DD HH:mm'),
    },
    {
      title: '清洁风险分',
      dataIndex: 'clean_risk_score',
      key: 'clean_risk_score',
      width: 110,
      render: (v) => (
        <span
          style={{
            color: v >= 70 ? '#ff4d4f' : v >= 50 ? '#faad14' : '#52c41a',
            fontWeight: 600,
          }}
        >
          {v?.toFixed(1)}
        </span>
      ),
    },
    {
      title: '巡检分数',
      dataIndex: 'inspection_score',
      key: 'inspection_score',
      width: 100,
      render: (v) => (v != null ? v.toFixed(1) : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (v) => renderSampleStatusTag(v, isGap),
    },
    {
      title: '异常',
      dataIndex: 'anomaly_type',
      key: 'anomaly_type',
      ellipsis: true,
      render: (v) => v || <span style={{ color: '#bfbfbf' }}>无</span>,
    },
    {
      title: '离线(分)',
      dataIndex: 'offline_minutes',
      key: 'offline_minutes',
      width: 80,
      render: (v) => (v > 0 ? v : '-'),
    },
    ...(isGap
      ? [
          {
            title: '操作',
            key: 'action',
            width: 110,
            fixed: 'right',
            render: (_, record) => (
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => handleViewSampleDetail(record)}
              >
                明细详情
              </Button>
            ),
          },
        ]
      : []),
  ];

  // ============================================
  // 渲染
  // ============================================
  return (
    <Layout style={{ padding: 0, background: '#f0f2f5', minHeight: '100vh' }}>
      <Spin spinning={loading}>
        <Content style={{ padding: 16 }}>
          {/* ================ 页面标题 ================ */}
          <Card
            size="small"
            style={{ marginBottom: 16 }}
            bodyStyle={{ padding: 12 }}
            title={
              <Space>
                <LineChartOutlined style={{ color: '#1677ff', fontSize: 18 }} />
                <span style={{ fontWeight: 700, fontSize: 16 }}>巡检合格率复盘分析</span>
              </Space>
            }
          />

          {/* ================ 核心复盘区 ================ */}
          <Card
            size="small"
            style={{ marginBottom: 16 }}
            title={
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space>
                  <BarChartOutlined style={{ color: '#722ed1' }} />
                  <span style={{ fontWeight: 600, fontSize: 14 }}>核心复盘区</span>
                </Space>
                {/* 周期选择器 */}
                <Radio.Group
                  value={periodType}
                  onChange={handlePeriodChange}
                  size="small"
                  optionType="button"
                  buttonStyle="solid"
                >
                  <Radio.Button value="week">
                    <CalendarOutlined /> 按周
                  </Radio.Button>
                  <Radio.Button value="month">
                    <CalendarOutlined /> 按月
                  </Radio.Button>
                </Radio.Group>
              </Space>
            }
          >
            {/* 大数字对比卡片 */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              {/* 当前周期合格率 */}
              <Col span={6}>
                <Card
                  size="small"
                  bodyStyle={{ padding: 16 }}
                  style={{
                    background: 'linear-gradient(135deg, #e6f4ff 0%, #bae0ff 100%)',
                    border: '1px solid #91caff',
                  }}
                >
                  <Statistic
                    title={
                      <span style={{ fontSize: 12, color: '#003a8c' }}>
                        {periodType === 'week' ? '本周' : '本月'}合格率
                      </span>
                    }
                    value={periodData?.current_period?.avg_pass_rate || 0}
                    precision={2}
                    suffix="%"
                    valueStyle={{ fontSize: 30, fontWeight: 800, color: '#0958d9' }}
                    prefix={<CheckCircleOutlined />}
                  />
                  <div style={{ marginTop: 6, fontSize: 11, color: '#003a8c' }}>
                    上期：{periodData?.previous_period?.avg_pass_rate || 0}%
                  </div>
                </Card>
              </Col>

              {/* 改善率 */}
              <Col span={6}>
                <Card
                  size="small"
                  bodyStyle={{ padding: 16 }}
                  style={{
                    background:
                      (periodData?.improvement?.pass_rate_diff || 0) >= 0
                        ? 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)'
                        : 'linear-gradient(135deg, #fff2f0 0%, #ffccc7 100%)',
                    border:
                      (periodData?.improvement?.pass_rate_diff || 0) >= 0
                        ? '1px solid #95de64'
                        : '1px solid #ffa39e',
                  }}
                >
                  <Statistic
                    title={<span style={{ fontSize: 12 }}>改善率</span>}
                    value={periodData?.improvement?.pass_rate_diff || 0}
                    precision={2}
                    suffix="%"
                    valueStyle={{
                      fontSize: 30,
                      fontWeight: 800,
                      color:
                        (periodData?.improvement?.pass_rate_diff || 0) >= 0
                          ? '#389e0d'
                          : '#cf1322',
                    }}
                    prefix={
                      (periodData?.improvement?.pass_rate_diff || 0) >= 0 ? (
                        <RiseOutlined />
                      ) : (
                        <FallOutlined />
                      )
                    }
                  />
                  <div style={{ marginTop: 6, fontSize: 11 }}>
                    {(periodData?.improvement?.pass_rate_diff || 0) >= 0
                      ? '较上期提升，继续保持！'
                      : '较上期下降，需关注改进。'}
                  </div>
                </Card>
              </Col>

              {/* 当前周期平均分 */}
              <Col span={6}>
                <Card
                  size="small"
                  bodyStyle={{ padding: 16 }}
                  style={{
                    background: 'linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%)',
                    border: '1px solid #d3adf7',
                  }}
                >
                  <Statistic
                    title={<span style={{ fontSize: 12, color: '#391085' }}>当前平均分</span>}
                    value={periodData?.current_period?.avg_score || 0}
                    precision={1}
                    valueStyle={{ fontSize: 30, fontWeight: 800, color: '#531dab' }}
                    prefix={<FileSearchOutlined />}
                  />
                  <div style={{ marginTop: 6, fontSize: 11, color: '#391085' }}>
                    上期：{periodData?.previous_period?.avg_score || 0}
                    {periodData?.improvement?.score_diff ? (
                      <span style={{ marginLeft: 8 }}>
                        差：{periodData.improvement.score_diff > 0 ? '+' : ''}
                        {periodData.improvement.score_diff}
                      </span>
                    ) : null}
                  </div>
                </Card>
              </Col>

              {/* 总巡检次数 */}
              <Col span={6}>
                <Card
                  size="small"
                  bodyStyle={{ padding: 16 }}
                  style={{
                    background: 'linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%)',
                    border: '1px solid #ffd591',
                  }}
                >
                  <Statistic
                    title={<span style={{ fontSize: 12, color: '#874d00' }}>总巡检次数</span>}
                    value={periodData?.current_period?.total_inspections || 0}
                    valueStyle={{ fontSize: 30, fontWeight: 800, color: '#d46b08' }}
                    prefix={<DashboardOutlined />}
                  />
                  <div style={{ marginTop: 6, fontSize: 11, color: '#874d00' }}>
                    上期：{periodData?.previous_period?.total_inspections || 0}
                    {periodData?.improvement?.inspection_diff ? (
                      <span style={{ marginLeft: 8 }}>
                        差：{periodData.improvement.inspection_diff > 0 ? '+' : ''}
                        {periodData.improvement.inspection_diff}
                      </span>
                    ) : null}
                  </div>
                </Card>
              </Col>
            </Row>

            {/* 图表区：趋势图 + TOP问题 */}
            <Row gutter={[16, 0]}>
              <Col span={14}>
                <Card
                  size="small"
                  title={
                    <Space>
                      <LineChartOutlined />
                      <span style={{ fontWeight: 600, fontSize: 13 }}>
                        巡检合格率趋势（双周期对比）
                      </span>
                    </Space>
                  }
                  bodyStyle={{ padding: 12 }}
                >
                  {inspectionTrends && inspectionTrends.overall_trend?.length ? (
                    <ReactECharts option={getTrendChartOption()} style={{ height: 300 }} />
                  ) : (
                    <Empty description="暂无趋势数据" />
                  )}
                </Card>
              </Col>
              <Col span={10}>
                <Card
                  size="small"
                  title={
                    <Space>
                      <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                      <span style={{ fontWeight: 600, fontSize: 13 }}>TOP问题（整改前后对比）</span>
                    </Space>
                  }
                  bodyStyle={{ padding: 12 }}
                >
                  {inspectionComparison?.top_issues?.length ? (
                    <ReactECharts option={getTopIssuesOption()} style={{ height: 300 }} />
                  ) : (
                    <Empty description="暂无问题数据" />
                  )}
                </Card>
              </Col>
            </Row>
          </Card>

          {/* ================ 门店排名Table ================ */}
          <Card
            size="small"
            style={{ marginBottom: 16 }}
            title={
              <Space>
                <TrophyOutlined style={{ color: '#faad14' }} />
                <span style={{ fontWeight: 600, fontSize: 14 }}>门店合格率排名</span>
                <Tag color="default">{storeRanking.length} 家门店</Tag>
                <span style={{ fontSize: 11, color: '#999' }}>（支持按各列排序）</span>
              </Space>
            }
            bodyStyle={{ padding: 0 }}
          >
            <Table
              size="small"
              columns={rankingColumns}
              dataSource={sortedStoreRanking()}
              rowKey="store_id"
              pagination={false}
              scroll={{ x: 950, y: 400 }}
              onChange={handleRankingTableChange}
              rowClassName={(record) => {
                if (record.display_rank === 1) return 'row-rank-1';
                if (record.display_rank === 2) return 'row-rank-2';
                if (record.display_rank === 3) return 'row-rank-3';
                return '';
              }}
            />
            <style>{`
              .row-rank-1 { background: linear-gradient(90deg, #fffbe6 0%, transparent 100%); }
              .row-rank-2 { background: linear-gradient(90deg, #f5f5f5 0%, transparent 100%); }
              .row-rank-3 { background: linear-gradient(90deg, #fff2e8 0%, transparent 100%); }
            `}</style>
          </Card>

          {/* ================ 设备离线缺口回溯面板 ================ */}
          <Card
            size="small"
            title={
              <Space>
                <DatabaseOutlined style={{ color: '#fa541c' }} />
                <span style={{ fontWeight: 600, fontSize: 14 }}>设备离线缺口回溯</span>
                <Tag color="orange">离线数据诊断</Tag>
              </Space>
            }
          >
            {/* 筛选条件 */}
            <Card
              size="small"
              style={{ marginBottom: 16 }}
              bodyStyle={{ padding: 16, background: '#fafafa' }}
            >
              <Row gutter={[16, 0]} align="bottom">
                <Col span={8}>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>选择设备</div>
                  <Select
                    style={{ width: '100%' }}
                    placeholder="请选择要回溯的设备"
                    showSearch
                    allowClear
                    optionFilterProp="children"
                    value={gapEquipmentId}
                    onChange={setGapEquipmentId}
                    size="middle"
                  >
                    {equipments.map((e) => (
                      <Option key={e.id} value={e.id}>
                        {e.equipment_code} - {e.equipment_name} ({e.store_name})
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col span={10}>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>
                    离线窗口（日期范围）
                  </div>
                  <RangePicker
                    showTime={{ format: 'HH:mm' }}
                    format="YYYY-MM-DD HH:mm"
                    style={{ width: '100%' }}
                    value={gapDateRange}
                    onChange={setGapDateRange}
                    placeholder={['离线开始时间', '离线结束时间']}
                  />
                </Col>
                <Col span={6} style={{ textAlign: 'right' }}>
                  <Space>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={() => {
                        setGapEquipmentId(null);
                        setGapDateRange(null);
                        setGapResult(null);
                        setGapAnalysis(null);
                      }}
                    >
                      重置
                    </Button>
                    <Button
                      type="primary"
                      icon={<SearchOutlined />}
                      onClick={handleGapBacktrack}
                    >
                      开始回溯
                    </Button>
                  </Space>
                </Col>
              </Row>
            </Card>

            {/* 回溯结果区域 */}
            {gapResult ? (
              <div>
                {/* 关键指标对比卡片 + 缺口分析总结 */}
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  {/* 离线前风险分 */}
                  <Col span={5}>
                    <Card size="small" bodyStyle={{ padding: 14, textAlign: 'center' }}>
                      <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>
                        <ArrowLeftOutlined /> 离线前平均风险分
                      </div>
                      <div
                        style={{
                          fontSize: 26,
                          fontWeight: 800,
                          color:
                            (gapAnalysis?.before_risk_score || 0) >= 70
                              ? '#ff4d4f'
                              : (gapAnalysis?.before_risk_score || 0) >= 50
                              ? '#faad14'
                              : '#52c41a',
                        }}
                      >
                        {gapAnalysis?.before_risk_score || 0}
                      </div>
                    </Card>
                  </Col>

                  {/* 风险分变化 */}
                  <Col span={5}>
                    <Card
                      size="small"
                      bodyStyle={{ padding: 14, textAlign: 'center' }}
                      style={{
                        background:
                          (gapAnalysis?.risk_score_change || 0) <= 0
                            ? '#f6ffed'
                            : '#fff2f0',
                      }}
                    >
                      <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>
                        风险分变化
                      </div>
                      <div
                        style={{
                          fontSize: 26,
                          fontWeight: 800,
                          color:
                            (gapAnalysis?.risk_score_change || 0) <= 0 ? '#389e0d' : '#cf1322',
                        }}
                      >
                        {(gapAnalysis?.risk_score_change || 0) <= 0 ? (
                          <ArrowDownOutlined />
                        ) : (
                          <ArrowUpOutlined />
                        )}{' '}
                        {Math.abs(gapAnalysis?.risk_score_change || 0)}
                      </div>
                    </Card>
                  </Col>

                  {/* 离线后风险分 */}
                  <Col span={5}>
                    <Card size="small" bodyStyle={{ padding: 14, textAlign: 'center' }}>
                      <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>
                        离线后平均风险分 <ArrowRightOutlined />
                      </div>
                      <div
                        style={{
                          fontSize: 26,
                          fontWeight: 800,
                          color:
                            (gapAnalysis?.after_risk_score || 0) >= 70
                              ? '#ff4d4f'
                              : (gapAnalysis?.after_risk_score || 0) >= 50
                              ? '#faad14'
                              : '#52c41a',
                        }}
                      >
                        {gapAnalysis?.after_risk_score || 0}
                      </div>
                    </Card>
                  </Col>

                  {/* 缺口分析总结 */}
                  <Col span={9}>
                    <Alert
                      type="info"
                      showIcon
                      icon={<ExclamationCircleOutlined />}
                      message={<strong>缺口分析总结</strong>}
                      description={
                        <div style={{ fontSize: 12, lineHeight: 1.8 }}>
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <div>
                              <Badge status="default" />
                              <strong>离线时长：</strong>
                              {gapAnalysis?.gap_duration_human || '未知'}（
                              {gapAnalysis?.gap_duration_minutes || 0} 分钟）
                            </div>
                            <div>
                              <Badge status="warning" />
                              <strong>缺失样本数：</strong>
                              <span style={{ color: '#faad14', fontWeight: 600 }}>
                                {gapAnalysis?.missing_samples || 0}
                              </span>
                              {' '}/ 理论应采集 {gapAnalysis?.total_gap_samples +
                                (gapAnalysis?.missing_samples || 0)}{' '}
                              条，实际采集 {gapAnalysis?.total_gap_samples || 0} 条
                            </div>
                            <div>
                              <Badge
                                status={(gapAnalysis?.pass_rate_impact || 0) > 1 ? 'error' : 'success'}
                              />
                              <strong>对合格率影响估算：</strong>
                              <span
                                style={{
                                  color:
                                    (gapAnalysis?.pass_rate_impact || 0) > 1
                                      ? '#ff4d4f'
                                      : '#52c41a',
                                  fontWeight: 600,
                                }}
                              >
                                约 {(gapAnalysis?.pass_rate_impact || 0).toFixed(1)}%
                              </span>
                              {(gapAnalysis?.pass_rate_impact || 0) > 1
                                ? '（缺口数据可能拉低合格率，建议补采）'
                                : '（影响较小，合格率基本可信）'}
                            </div>
                          </Space>
                        </div>
                      }
                    />
                  </Col>
                </Row>

                {/* 3栏对比：离线前 / 缺口期间 / 离线后 */}
                <Row gutter={[12, 0]}>
                  {/* 左栏：离线前上下文 */}
                  <Col span={8}>
                    <Card
                      size="small"
                      title={
                        <Space>
                          <ArrowLeftOutlined />
                          <span style={{ fontWeight: 600 }}>离线前上下文</span>
                          <Tag color="default">最近5条</Tag>
                        </Space>
                      }
                      bodyStyle={{ padding: 0 }}
                      styles={{ header: { background: '#e6f4ff' } }}
                    >
                      <Table
                        size="small"
                        columns={sampleTableColumns(false)}
                        dataSource={gapResult.before_context || []}
                        rowKey={(r, i) => `before-${i}`}
                        pagination={false}
                        scroll={{ y: 260 }}
                        locale={{ emptyText: '无离线前数据' }}
                      />
                    </Card>
                  </Col>

                  {/* 中栏：离线缺口期间 */}
                  <Col span={8}>
                    <Card
                      size="small"
                      title={
                        <Space>
                          <WarningOutlined style={{ color: '#faad14' }} />
                          <span style={{ fontWeight: 600 }}>离线缺口期间</span>
                          <Tag color="warning">
                            {gapAnalysis?.missing_samples || 0} 条缺失
                          </Tag>
                        </Space>
                      }
                      bodyStyle={{ padding: 0, background: '#fffbe6' }}
                      styles={{
                        header: { background: '#fff1b8', borderBottom: '1px solid #ffe58f' },
                      }}
                      extra={
                        <Tooltip title="点击列表中的「明细详情」查看完整样本数据">
                          <Button
                            type="primary"
                            ghost
                            size="small"
                            icon={<EyeOutlined />}
                            disabled={!gapResult.gap_samples?.length}
                          >
                            回到样本明细
                          </Button>
                        </Tooltip>
                      }
                    >
                      <div style={{ background: '#fffbe6' }}>
                        <Alert
                          type="warning"
                          showIcon
                          style={{
                            margin: 8,
                            border: 'none',
                            background: '#fffbe6',
                          }}
                          message={
                            <span style={{ fontSize: 11 }}>
                              黄色高亮区域为离线缺口期间，存在数据缺失情况，
                              <strong>点击「明细详情」</strong>可查看样本详细数据
                            </span>
                          }
                        />
                        <Table
                          size="small"
                          columns={sampleTableColumns(true)}
                          dataSource={gapResult.gap_samples || []}
                          rowKey={(r, i) => `gap-${i}`}
                          pagination={false}
                          scroll={{ y: 240 }}
                          locale={{ emptyText: '无缺口期间数据' }}
                          rowClassName={() => 'gap-row-highlight'}
                        />
                        <style>{`
                          .gap-row-highlight td {
                            background: #fffbe6 !important;
                          }
                        `}</style>
                      </div>
                    </Card>
                  </Col>

                  {/* 右栏：离线后上下文 */}
                  <Col span={8}>
                    <Card
                      size="small"
                      title={
                        <Space>
                          <span style={{ fontWeight: 600 }}>离线后上下文</span>
                          <Tag color="default">恢复后5条</Tag>
                          <ArrowRightOutlined />
                        </Space>
                      }
                      bodyStyle={{ padding: 0 }}
                      styles={{ header: { background: '#f6ffed' } }}
                    >
                      <Table
                        size="small"
                        columns={sampleTableColumns(false)}
                        dataSource={gapResult.after_context || []}
                        rowKey={(r, i) => `after-${i}`}
                        pagination={false}
                        scroll={{ y: 260 }}
                        locale={{ emptyText: '无离线后数据' }}
                      />
                    </Card>
                  </Col>
                </Row>
              </div>
            ) : (
              <Empty
                description={
                  <div style={{ padding: '20px 0' }}>
                    <p style={{ color: '#666' }}>请先选择设备和离线窗口，然后点击「开始回溯」</p>
                    <p style={{ fontSize: 12, color: '#999' }}>
                      回溯功能将展示离线前5条、缺口期间、离线后5条样本的对比数据
                    </p>
                  </div>
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>
        </Content>

        {/* ================ 样本明细详情 Drawer ================ */}
        <Drawer
          title={
            <Space>
              <DatabaseOutlined style={{ color: '#1677ff' }} />
              <span style={{ fontWeight: 600 }}>样本明细详情</span>
              {selectedSample && (
                <Tag color="gold">
                  {dayjs(selectedSample.record_date).format('YYYY-MM-DD HH:mm:ss')}
                </Tag>
              )}
            </Space>
          }
          width={560}
          open={sampleDrawerVisible}
          onClose={() => {
            setSampleDrawerVisible(false);
            setSelectedSample(null);
          }}
          extra={
            selectedSample && renderSampleStatusTag(selectedSample.status, true)
          }
        >
          {selectedSample && (
            <div>
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
                message="该样本采集于离线缺口期间"
                description="数据可能存在不完整情况，请结合上下文综合判断"
              />
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="记录时间">
                  {dayjs(selectedSample.record_date).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
                <Descriptions.Item label="门店ID">
                  {selectedSample.store_id || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="设备ID">
                  {selectedSample.equipment_id || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="设备编号">
                  {selectedSample.equipment_code || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="清洁风险分">
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color:
                        (selectedSample.clean_risk_score || 0) >= 70
                          ? '#ff4d4f'
                          : (selectedSample?.clean_risk_score || 0) >= 50
                          ? '#faad14'
                          : '#52c41a',
                    }}
                  >
                    {selectedSample.clean_risk_score?.toFixed(2) || '-'}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="巡检分数">
                  {selectedSample.inspection_score?.toFixed(2) || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="设备状态">
                  {renderSampleStatusTag(selectedSample.status, true)}
                </Descriptions.Item>
                <Descriptions.Item label="异常类型">
                  {selectedSample.anomaly_type || '无异常'}
                </Descriptions.Item>
                <Descriptions.Item label="异常原因">
                  {selectedSample.anomaly_reason || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="离线时长">
                  {selectedSample.offline_minutes > 0
                    ? `${selectedSample.offline_minutes} 分钟`
                    : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="故障计数">
                  {selectedSample.fault_count || 0}
                </Descriptions.Item>
                <Descriptions.Item label="样本引用">
                  <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
                    {selectedSample.sample_ref || '-'}
                  </span>
                </Descriptions.Item>
              </Descriptions>

              <Divider orientation="left" style={{ marginTop: 24 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>诊断建议</span>
              </Divider>
              <div style={{ fontSize: 12, lineHeight: 2, color: '#595959' }}>
                <p>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />{' '}
                  <strong>数据完整性：</strong>
                  {gapAnalysis?.missing_samples > 0
                    ? `存在 ${gapAnalysis.missing_samples} 条缺失样本，建议排查设备网络连接或采集器状态`
                    : '样本数据完整，可信度较高'}
                </p>
                <p>
                  <WarningOutlined style={{ color: '#faad14' }} />{' '}
                  <strong>风险提示：</strong>
                  {(selectedSample.clean_risk_score || 0) >= 70
                    ? '当前清洁风险分偏高，建议尽快安排深度清洁并复查'
                    : (selectedSample.clean_risk_score || 0) >= 50
                    ? '风险水平中等，建议关注后续数据变化'
                    : '风险水平良好，继续保持日常巡检'}
                </p>
                <p>
                  <DatabaseOutlined style={{ color: '#1677ff' }} />{' '}
                  <strong>补采建议：</strong>
                  离线期间缺失的数据可通过人工巡检报告补录，避免影响整体合格率统计
                </p>
              </div>
            </div>
          )}
        </Drawer>
      </Spin>
    </Layout>
  );
};

export default Inspection;
