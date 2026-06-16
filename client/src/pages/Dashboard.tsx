import { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, List, Tag, Button, Space } from 'antd'
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { getStatisticsOverview } from '@/api/business'
import { getPrescriptions } from '@/api/prescription'
import { useUserStore } from '@/store/user'
import { PrescriptionStatus, PrescriptionStatusColors, UserRole } from '@/types'
import type { StatisticsDto, Prescription } from '@/types'
import dayjs from 'dayjs'

const Dashboard = () => {
  const navigate = useNavigate()
  const { hasRole } = useUserStore()
  const [statistics, setStatistics] = useState<StatisticsDto | null>(null)
  const [recentPrescriptions, setRecentPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchStatistics()
    fetchRecentPrescriptions()
  }, [])

  const fetchStatistics = async () => {
    try {
      const data = await getStatisticsOverview({})
      setStatistics(data)
    } catch (error) {
      console.error('Fetch statistics error:', error)
    }
  }

  const fetchRecentPrescriptions = async () => {
    setLoading(true)
    try {
      const data = await getPrescriptions({ pageIndex: 1, pageSize: 8 })
      setRecentPrescriptions(data.items)
    } catch (error) {
      console.error('Fetch prescriptions error:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = statistics
    ? [
        {
          title: '处方总数',
          value: statistics.totalPrescriptions,
          icon: <FileTextOutlined style={{ fontSize: 24, color: '#1677ff' }} />,
          color: '#1677ff',
        },
        {
          title: '待审核',
          value: statistics.reviewingCount + statistics.pendingCount,
          icon: <ClockCircleOutlined style={{ fontSize: 24, color: '#fa8c16' }} />,
          color: '#fa8c16',
        },
        {
          title: '已通过',
          value: statistics.approvedCount + statistics.completedCount,
          icon: <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
          color: '#52c41a',
        },
        {
          title: '已拒绝',
          value: statistics.rejectedCount,
          icon: <CloseCircleOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />,
          color: '#ff4d4f',
        },
        {
          title: '处方不清',
          value: statistics.unclearCount,
          icon: <ExclamationCircleOutlined style={{ fontSize: 24, color: '#faad14' }} />,
          color: '#faad14',
        },
        {
          title: '回访完成',
          value: statistics.followUpCompletedCount,
          icon: <CheckCircleOutlined style={{ fontSize: 24, color: '#13c2c2' }} />,
          color: '#13c2c2',
        },
      ]
    : []

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">工作台</div>
        <Space>
          {hasRole([UserRole.Cashier, UserRole.StoreManager]) && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/prescriptions?action=create')}
            >
              新建处方
            </Button>
          )}
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((card, index) => (
          <Col xs={12} sm={8} md={4} key={index}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ marginRight: 16 }}>{card.icon}</div>
                <div>
                  <Statistic
                    title={card.title}
                    value={card.value}
                    valueStyle={{ color: card.color, fontSize: 24 }}
                  />
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Card
            title="最近处方"
            extra={
              <Button type="link" onClick={() => navigate('/prescriptions')}>
                查看全部
              </Button>
            }
          >
            <List
              loading={loading}
              dataSource={recentPrescriptions}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Tag color={PrescriptionStatusColors[item.status]} key="status">
                      {item.statusName}
                    </Tag>,
                    <Button type="link" size="small" onClick={() => navigate(`/prescriptions/${item.id}`)}>
                      查看
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <span style={{ fontWeight: 500 }}>{item.prescriptionNo}</span>
                        {item.hasUnclearRecord && (
                          <Tag color="warning" style={{ margin: 0 }}>
                            有不清记录
                          </Tag>
                        )}
                      </Space>
                    }
                    description={
                      <Space size={16}>
                        <span>患者：{item.patientName}</span>
                        <span>门店：{item.storeName}</span>
                        <span>提交：{dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}</span>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
