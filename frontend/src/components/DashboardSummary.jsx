import React from 'react'
import { Card, Statistic, Row, Col } from 'antd'
import {
  RiseOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  FileUnknownOutlined,
  SwapOutlined,
  AlertOutlined,
} from '@ant-design/icons'

const StatCard = ({ title, value, icon, color, suffix }) => {
  return (
    <Card className="stat-card">
      <Row align="middle" gutter={16}>
        <Col span={6}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 8,
              background: `${color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              color,
            }}
          >
            {icon}
          </div>
        </Col>
        <Col span={18}>
          <div className="stat-label" style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>
            {title}
          </div>
          <div className="stat-value" style={{ fontSize: 22, fontWeight: 600, color: '#1f2937' }}>
            {value}
            {suffix && <span style={{ fontSize: 14, fontWeight: 400 }}>{suffix}</span>}
          </div>
        </Col>
      </Row>
    </Card>
  )
}

const DashboardSummary = ({ summary }) => {
  if (!summary) return null

  const stats = [
    {
      title: '累计结算金额',
      value: summary.total_settlement,
      icon: <RiseOutlined />,
      color: '#16a34a',
      suffix: ' 元',
    },
    {
      title: '订单总数',
      value: summary.total_orders,
      icon: <FileUnknownOutlined />,
      color: '#2563eb',
      suffix: ' 单',
    },
    {
      title: '异常数量',
      value: summary.anomaly_count,
      icon: <WarningOutlined />,
      color: '#dc2626',
      suffix: ' 个',
    },
    {
      title: '延迟订单',
      value: summary.delay_orders,
      icon: <ClockCircleOutlined />,
      color: '#d97706',
      suffix: ' 单',
    },
    {
      title: '客服记录缺失',
      value: summary.missing_cs_records,
      icon: <FileUnknownOutlined />,
      color: '#7c3aed',
      suffix: ' 条',
    },
    {
      title: '口径变化次数',
      value: summary.caliber_changes,
      icon: <SwapOutlined />,
      color: '#0891b2',
      suffix: ' 次',
    },
  ]

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      {stats.map((stat, index) => (
        <Col xs={24} sm={12} md={8} lg={4} key={index}>
          <StatCard {...stat} />
        </Col>
      ))}
    </Row>
  )
}

export default DashboardSummary
