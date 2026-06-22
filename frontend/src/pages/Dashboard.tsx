import React from 'react'
import { Card, Row, Col, Statistic, Spin, Alert } from 'antd'
import {
  ExperimentOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  UnorderedListOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import ReactECharts from 'echarts-for-react'
import { Link } from '@tanstack/react-router'
import { checklistApi } from '@/api/checklist'
import { RiskLevel } from '@/types/enums'

const riskTextMap: Record<string, string> = {
  [RiskLevel.LOW]: '低风险',
  [RiskLevel.MEDIUM]: '中风险',
  [RiskLevel.HIGH]: '高风险',
  [RiskLevel.CRITICAL]: '严重风险',
}

const riskColorMap: Record<string, string> = {
  [RiskLevel.LOW]: '#52c41a',
  [RiskLevel.MEDIUM]: '#faad14',
  [RiskLevel.HIGH]: '#fa8c16',
  [RiskLevel.CRITICAL]: '#ff4d4f',
}

const Dashboard: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: checklistApi.getDashboardStats,
  })

  const riskPieOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: '0%', icon: 'circle' },
    series: [
      {
        name: '风险等级分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
        label: { show: true, formatter: '{b}\n{d}%' },
        emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
        data: data
          ? Object.entries(data.riskDistribution).map(([key, value]) => ({
              name: riskTextMap[key] || key,
              value,
              itemStyle: { color: riskColorMap[key] || '#1890ff' },
            }))
          : [],
      },
    ],
  }

  const metricsBarOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['检查清单', '抽样记录', '整改计划', '异常单', '供应商'],
      axisLabel: { interval: 0 },
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '数量',
        type: 'bar',
        barWidth: '50%',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#1890ff' },
              { offset: 1, color: '#69c0ff' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
        data: data
          ? [
              data.totalChecklists,
              data.totalSamplings,
              data.totalRectifications,
              data.totalExceptions,
              data.totalVendors,
            ]
          : [],
      },
    ],
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card hoverable>
            <Link to="/sampling">
              <Statistic
                title="抽样覆盖率"
                value={data?.samplingCoverageRate ?? 0}
                precision={1}
                suffix="%"
                valueStyle={{ color: '#1890ff' }}
                prefix={<ExperimentOutlined />}
              />
            </Link>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card hoverable>
            <Link to="/rectification">
              <Statistic
                title="整改完成率"
                value={data?.rectificationCompletionRate ?? 0}
                precision={1}
                suffix="%"
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Link>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card hoverable>
            <Link to="/exceptions">
              <Statistic
                title="待处理异常单"
                value={data?.pendingExceptions ?? 0}
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<WarningOutlined />}
              />
            </Link>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card hoverable>
            <Link to="/checklist">
              <Statistic
                title="检查清单总数"
                value={data?.totalChecklists ?? 0}
                valueStyle={{ color: '#722ed1' }}
                prefix={<UnorderedListOutlined />}
              />
            </Link>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="风险等级分布">
            <ReactECharts option={riskPieOption} style={{ height: 320 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="关键指标概览">
            <ReactECharts option={metricsBarOption} style={{ height: 320 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Alert
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            message="抽样覆盖口径说明"
            description={
              data?.samplingCoverageDescription ||
              '抽样覆盖率 = 已关联抽样记录的检查清单数 / 检查清单总数 × 100%。仅统计已发布状态的检查清单，抽样记录以"已审核"状态为准。数据每日凌晨自动刷新。'
            }
          />
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
