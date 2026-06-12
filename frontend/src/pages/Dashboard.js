// -*- coding: utf-8 -*-
/**
 * 仪表盘首页 Dashboard
 * 功能：
 * - 顶部6个统计卡片（设备总数/在线率、平均清洁风险分、高风险设备数、待处理故障数、逾期整改任务数、巡检合格率）
 * - 中部两栏：TOP10风险设备表格 + 清洁风险分布饼图
 * - 底部：巡检合格率趋势折线图
 */
import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Progress,
  Table,
  Tag,
  Space,
  Button,
  Spin,
  message,
  Typography,
  Tooltip,
} from 'antd';
import {
  DesktopOutlined,
  WarningOutlined,
  AlertOutlined,
  ToolOutlined,
  FileProtectOutlined,
  CheckCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ReloadOutlined,
  EyeOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useNavigate } from 'react-router-dom';
import {
  initMockData,
  getDashboardOverview,
  getTopRisks,
  getCleanRiskDistribution,
  getInspectionTrend,
} from '../services/api';

const { Title } = Typography;

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [initLoading, setInitLoading] = useState(false);

  // 概览统计数据
  const [overview, setOverview] = useState({
    total_equipment: 0,
    online_rate: 0,
    avg_risk_score: 0,
    high_risk_count: 0,
    fault_pending_count: 0,
    task_overdue_count: 0,
    inspection_pass_rate: 0,
    change: { prev_pass_rate: 0, improvement_rate: 0 },
  });

  // TOP10风险设备
  const [topRisks, setTopRisks] = useState([]);

  // 清洁风险分布
  const [riskDist, setRiskDist] = useState({
    high_risk: { count: 0, percentage: 0 },
    medium_risk: { count: 0, percentage: 0 },
    low_risk: { count: 0, percentage: 0 },
  });

  // 巡检趋势
  const [inspTrend, setInspTrend] = useState([]);

  // 首次加载初始化Mock数据 + 加载全部数据
  useEffect(() => {
    const initializeAndLoad = async () => {
      setLoading(true);
      setInitLoading(true);
      try {
        const initRes = await initMockData();
        if (initRes.code === 0) {
          message.success(initRes.message);
        }
        await loadAllData();
      } catch (err) {
        message.error('数据加载失败：' + (err.message || '未知错误'));
      } finally {
        setLoading(false);
        setInitLoading(false);
      }
    };
    initializeAndLoad();
  }, []);

  // 加载所有数据
  const loadAllData = async () => {
    try {
      const [ovRes, riskRes, distRes, trendRes] = await Promise.all([
        getDashboardOverview(),
        getTopRisks(10),
        getCleanRiskDistribution(),
        getInspectionTrend(),
      ]);
      if (ovRes.code === 0) setOverview(ovRes.data);
      if (riskRes.code === 0) setTopRisks(riskRes.data || []);
      if (distRes.code === 0) setRiskDist(distRes.data);
      if (trendRes.code === 0) setInspTrend(trendRes.data || []);
    } catch (err) {
      message.error('部分数据加载失败');
    }
  };

  // 手动刷新
  const handleRefresh = async () => {
    setLoading(true);
    try {
      await loadAllData();
      message.success('数据已刷新');
    } finally {
      setLoading(false);
    }
  };

  // 风险等级渲染
  const renderRiskLevel = (level, score) => {
    const map = {
      critical: { color: 'red', text: '严重' },
      high: { color: 'volcano', text: '高风险' },
      medium: { color: 'orange', text: '中风险' },
      low: { color: 'green', text: '低风险' },
    };
    const cfg = map[level] || map.low;
    return (
      <Space>
        <Tag color={cfg.color}>{cfg.text}</Tag>
        <span style={{ fontWeight: 600, color: score >= 70 ? '#cf1322' : undefined }}>
          {score?.toFixed?.(1) || score}
        </span>
      </Space>
    );
  };

  // 设备状态渲染
  const renderStatus = (status) => {
    const map = {
      online: { color: 'success', text: '在线', icon: <CheckCircleOutlined /> },
      warning: { color: 'warning', text: '告警', icon: <WarningOutlined /> },
      offline: { color: 'error', text: '离线', icon: <AlertOutlined /> },
    };
    const cfg = map[status] || map.online;
    return <Tag color={cfg.color} icon={cfg.icon}>{cfg.text}</Tag>;
  };

  // TOP10表格列
  const topRiskColumns = [
    {
      title: '排名',
      dataIndex: 'index',
      key: 'index',
      width: 60,
      render: (_, __, idx) => {
        const rank = idx + 1;
        return (
          <span
            style={{
              display: 'inline-block',
              width: 24,
              height: 24,
              lineHeight: '24px',
              textAlign: 'center',
              borderRadius: '50%',
              background: rank <= 3 ? '#ff4d4f' : '#f0f0f0',
              color: rank <= 3 ? '#fff' : '#666',
              fontWeight: 600,
            }}
          >
            {rank}
          </span>
        );
      },
    },
    {
      title: '设备编码',
      dataIndex: 'equipment_code',
      key: 'equipment_code',
      width: 140,
      render: (text) => <code style={{ color: '#1677ff' }}>{text}</code>,
    },
    {
      title: '门店',
      dataIndex: 'store_name',
      key: 'store_name',
      width: 130,
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'equipment_type',
      key: 'equipment_type',
      width: 110,
    },
    {
      title: '风险分 / 等级',
      dataIndex: 'clean_risk_score',
      key: 'clean_risk_score',
      width: 150,
      sorter: (a, b) => a.clean_risk_score - b.clean_risk_score,
      defaultSortOrder: 'descend',
      render: (val, record) => renderRiskLevel(record.risk_level, val),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: renderStatus,
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              navigate('/risk-chart', {
                state: { equipment_ids: [record.equipment_id] },
              });
            }}
          >
            风险详情
          </Button>
          <Tooltip title="查看样本">
            <Button
              type="link"
              size="small"
              icon={<LinkOutlined />}
              onClick={() => {
                message.info('样本详情功能即将上线');
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 清洁风险分布饼图配置
  const pieOption = {
    title: {
      text: '清洁风险分布',
      left: 'center',
      top: 10,
      textStyle: { fontSize: 14, fontWeight: 600 },
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}台 ({d}%)',
    },
    legend: {
      bottom: 10,
      left: 'center',
    },
    color: ['#ff4d4f', '#faad14', '#52c41a'],
    series: [
      {
        name: '风险等级',
        type: 'pie',
        radius: ['40%', '68%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{b}\n{c}台 ({d}%)',
        },
        labelLine: { show: true },
        data: [
          {
            value: riskDist.high_risk?.count || 0,
            name: '高风险',
            itemStyle: { color: '#ff4d4f' },
          },
          {
            value: riskDist.medium_risk?.count || 0,
            name: '中风险',
            itemStyle: { color: '#faad14' },
          },
          {
            value: riskDist.low_risk?.count || 0,
            name: '低风险',
            itemStyle: { color: '#52c41a' },
          },
        ],
      },
    ],
  };

  // 巡检合格率趋势图配置
  const trendOption = {
    title: {
      text: '巡检合格率趋势（近8周）',
      left: 'left',
      top: 10,
      textStyle: { fontSize: 14, fontWeight: 600 },
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const p = params[0];
        return `<div style="font-weight:600;margin-bottom:4px">${p.axisValue}</div>
          <div>合格率：<b style="color:#1677ff">${p.data}%</b></div>`;
      },
    },
    grid: {
      left: 50,
      right: 30,
      top: 50,
      bottom: 40,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: inspTrend.map((w) => w.week_label || `W${w.period_start?.slice(5, 10)}`),
      axisLine: { lineStyle: { color: '#ddd' } },
      axisLabel: { color: '#666' },
    },
    yAxis: {
      type: 'value',
      min: 50,
      max: 100,
      axisLabel: { formatter: '{value}%', color: '#666' },
      splitLine: { lineStyle: { color: '#f0f0f0' } },
    },
    series: [
      {
        name: '合格率',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3, color: '#1677ff' },
        itemStyle: { color: '#1677ff', borderWidth: 2, borderColor: '#fff' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(22, 119, 255, 0.35)' },
              { offset: 1, color: 'rgba(22, 119, 255, 0.02)' },
            ],
          },
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { type: 'dashed', color: '#52c41a' },
          data: [{ yAxis: 80, label: { formatter: '合格线 80%', color: '#52c41a' } }],
        },
        data: inspTrend.map((w) => w.pass_rate),
      },
    ],
  };

  // 渲染平均风险分的环形进度颜色
  const getProgressColor = (val) => {
    if (val >= 70) return '#ff4d4f';
    if (val >= 50) return '#faad14';
    return '#52c41a';
  };

  return (
    <div style={{ padding: 24, background: '#f5f7fa', minHeight: '100vh' }}>
      {/* 顶部标题栏 */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            <DesktopOutlined style={{ color: '#1677ff', marginRight: 8 }} />
            运营监测仪表盘
          </Title>
        </Col>
        <Col>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
            >
              刷新数据
            </Button>
            <Button
              type="primary"
              onClick={() => navigate('/risk-chart')}
            >
              风险监测图
            </Button>
          </Space>
        </Col>
      </Row>

      <Spin spinning={loading || initLoading} tip={initLoading ? '正在初始化Mock数据...' : '加载中...'}>
        {/* 统计卡片区 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          {/* 设备总数/在线率 */}
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <Statistic
                title={
                  <Space>
                    <DesktopOutlined style={{ color: '#1677ff' }} />
                    设备总数 / 在线率
                  </Space>
                }
                value={overview.total_equipment}
                suffix="台"
                valueStyle={{ color: '#1677ff' }}
              />
              <div style={{ marginTop: 8, fontSize: 13, color: '#666' }}>
                在线率：
                <span style={{ color: overview.online_rate >= 90 ? '#52c41a' : '#faad14', fontWeight: 600 }}>
                  {overview.online_rate}%
                </span>
              </div>
            </Card>
          </Col>

          {/* 平均清洁风险分 */}
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <Statistic
                title={
                  <Space>
                    <AlertOutlined style={{ color: getProgressColor(overview.avg_risk_score) }} />
                    平均清洁风险分
                  </Space>
                }
                value={overview.avg_risk_score}
                precision={2}
                valueStyle={{ color: getProgressColor(overview.avg_risk_score) }}
              />
              <div style={{ marginTop: 8 }}>
                <Progress
                  type="dashboard"
                  percent={Math.round(overview.avg_risk_score)}
                  size={90}
                  strokeColor={getProgressColor(overview.avg_risk_score)}
                  showInfo={false}
                />
              </div>
            </Card>
          </Col>

          {/* 高风险设备数 */}
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card
              style={{
                borderLeft: '4px solid #ff4d4f',
                background: overview.high_risk_count > 0 ? '#fff1f0' : undefined,
              }}
            >
              <Statistic
                title={
                  <Space>
                    <WarningOutlined style={{ color: '#ff4d4f' }} />
                    高风险设备数
                  </Space>
                }
                value={overview.high_risk_count}
                suffix="台"
                valueStyle={{ color: '#cf1322' }}
              />
              {overview.high_risk_count > 0 && (
                <Tag color="red" style={{ marginTop: 8 }}>
                  <AlertOutlined /> 需立即处理
                </Tag>
              )}
            </Card>
          </Col>

          {/* 待处理故障数 */}
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <Statistic
                title={
                  <Space>
                    <ToolOutlined style={{ color: '#722ed1' }} />
                    待处理故障数
                  </Space>
                }
                value={overview.fault_pending_count}
                suffix="单"
                valueStyle={{ color: '#722ed1' }}
              />
              <Tooltip title="包含状态为待处理和处理中的故障工单">
                <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                  待处理/处理中
                </div>
              </Tooltip>
            </Card>
          </Col>

          {/* 逾期整改任务数 */}
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card
              style={{
                borderLeft: '4px solid #fa8c16',
                background: overview.task_overdue_count > 0 ? '#fff7e6' : undefined,
              }}
            >
              <Statistic
                title={
                  <Space>
                    <FileProtectOutlined style={{ color: '#fa8c16' }} />
                    逾期整改任务数
                  </Space>
                }
                value={overview.task_overdue_count}
                suffix="项"
                valueStyle={{ color: '#d46b08' }}
              />
              {overview.task_overdue_count > 0 && (
                <Tag color="orange" style={{ marginTop: 8 }}>
                  已超过截止日期
                </Tag>
              )}
            </Card>
          </Col>

          {/* 巡检合格率 */}
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <Statistic
                title={
                  <Space>
                    <CheckCircleOutlined style={{ color: '#13c2c2' }} />
                    巡检合格率
                  </Space>
                }
                value={overview.inspection_pass_rate}
                precision={2}
                suffix="%"
                valueStyle={{ color: '#13c2c2' }}
              />
              <div style={{ marginTop: 8, fontSize: 13 }}>
                {overview.change?.improvement_rate >= 0 ? (
                  <span style={{ color: '#52c41a' }}>
                    <ArrowUpOutlined /> 环比 +{overview.change?.improvement_rate?.toFixed?.(2)}%
                  </span>
                ) : (
                  <span style={{ color: '#ff4d4f' }}>
                    <ArrowDownOutlined /> 环比 {overview.change?.improvement_rate?.toFixed?.(2)}%
                  </span>
                )}
                <span style={{ color: '#999', marginLeft: 6, fontSize: 12 }}>
                  上期 {overview.change?.prev_pass_rate?.toFixed?.(2)}%
                </span>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 中部两栏：TOP10表格 + 饼图 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} lg={15}>
            <Card
              title={
                <Space>
                  <WarningOutlined style={{ color: '#ff4d4f' }} />
                  TOP10 高风险设备
                </Space>
              }
              extra={<span style={{ color: '#999', fontSize: 12 }}>按最新风险分降序</span>}
            >
              <Table
                rowKey="equipment_code"
                columns={topRiskColumns}
                dataSource={topRisks}
                pagination={false}
                size="small"
                scroll={{ x: 900 }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={9}>
            <Card>
              <ReactECharts
                option={pieOption}
                style={{ height: 380 }}
                opts={{ renderer: 'canvas' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 底部趋势图 */}
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card>
              <ReactECharts
                option={trendOption}
                style={{ height: 300 }}
                opts={{ renderer: 'canvas' }}
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default Dashboard;
