import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Row, Col, Descriptions, Tag, List, Alert, Button, Space } from 'antd'
import { ArrowLeftOutlined, CarOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { vehicleApi } from '../api'

const warningLevelMap = {
  normal: { color: 'success', label: '正常' },
  warning: { color: 'warning', label: '预警' },
  danger: { color: 'error', label: '高危' },
}

const statusMap = {
  pending: { color: 'default', label: '待处理' },
  in_progress: { color: 'processing', label: '进行中' },
  quality_check: { color: 'warning', label: '质检中' },
  completed: { color: 'success', label: '已完成' },
  reworked: { color: 'error', label: '返修中' },
}

export default function VehicleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)

  useEffect(() => {
    if (id) loadDetail()
  }, [id])

  const loadDetail = async () => {
    const result = await vehicleApi.getDetail(id).catch(() => null)
    setData(result)
  }

  if (!data) {
    return <div style={{ padding: 40, textAlign: 'center' }}>加载中...</div>
  }

  return (
    <div>
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            返回
          </Button>
          <div>
            <div className="page-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <CarOutlined style={{ color: '#1677ff' }} />
              {data.plate_number} - {data.brand} {data.model}
              <Tag color={warningLevelMap[data.warning_level]?.color}>
                {warningLevelMap[data.warning_level]?.label}
              </Tag>
            </div>
            <div className="page-subtitle">VIN: {data.vin}</div>
          </div>
        </Space>
      </div>

      {data.warning_items && data.warning_items.length > 0 && (
        <Alert
          style={{ marginBottom: 16 }}
          type="warning"
          showIcon
          message="触发预警项"
          description={
            <Space wrap>
              {data.warning_items.map((w) => (
                <Tag key={w.threshold_id} color="error">
                  {w.name}: 当前 {w.current_value} {w.unit}，阈值 {w.threshold} {w.unit}
                </Tag>
              ))}
            </Space>
          }
        />
      )}

      <div className="detail-panel">
        <Descriptions title="车辆基本信息" column={3} size="small" bordered>
          <Descriptions.Item label="车牌号">{data.plate_number}</Descriptions.Item>
          <Descriptions.Item label="VIN">{data.vin}</Descriptions.Item>
          <Descriptions.Item label="品牌">{data.brand}</Descriptions.Item>
          <Descriptions.Item label="车型">{data.model}</Descriptions.Item>
          <Descriptions.Item label="年款">{data.year}</Descriptions.Item>
          <Descriptions.Item label="颜色">{data.color}</Descriptions.Item>
          <Descriptions.Item label="里程">
            {(data.mileage || 0).toLocaleString()} km
          </Descriptions.Item>
          <Descriptions.Item label="车主姓名">{data.owner_name}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{data.owner_phone}</Descriptions.Item>
          <Descriptions.Item label="累计维修次数">
            <span style={{ color: '#1677ff', fontWeight: 600 }}>{data.repair_count}</span> 次
          </Descriptions.Item>
          <Descriptions.Item label="累计消费">
            <span style={{ color: '#faad14', fontWeight: 600 }}>
              ¥{(data.total_amount || 0).toLocaleString()}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="最后维修">
            {data.last_repair_date ? dayjs(data.last_repair_date).format('YYYY-MM-DD') : '-'}
          </Descriptions.Item>
        </Descriptions>
      </div>

      <div className="detail-panel">
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
          维修工单历史
        </div>
        <List
          dataSource={data.repair_orders || []}
          locale={{ emptyText: '暂无维修记录' }}
          renderItem={(order) => (
            <List.Item
              style={{ cursor: 'pointer', padding: '12px 0' }}
              onClick={() => navigate(`/repair-order/${order.id}`)}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <span style={{ fontWeight: 500 }}>{order.order_no}</span>
                    <Tag color={statusMap[order.status]?.color}>{statusMap[order.status]?.label}</Tag>
                    {order.is_rework && <Tag color="error">返修</Tag>}
                    <span style={{ color: '#999', fontSize: 12 }}>
                      {dayjs(order.created_at).format('YYYY-MM-DD HH:mm')}
                    </span>
                  </Space>
                }
                description={
                  <Space wrap>
                    <span>技师: {order.mechanic || '-'}</span>
                    <span>金额: ¥{(order.actual_amount || 0).toLocaleString()}</span>
                    <span style={{ color: '#666' }}>{order.fault_description}</span>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </div>
    </div>
  )
}
