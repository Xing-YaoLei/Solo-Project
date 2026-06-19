import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Row, Col, Descriptions, Tag, Button, Space, Divider, Table,
  Image, Empty, Card, Alert,
} from 'antd'
import { ArrowLeftOutlined, CameraOutlined, ToolOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { repairOrderApi } from '../api'

const statusMap = {
  pending: { color: 'default', label: '待处理' },
  in_progress: { color: 'processing', label: '进行中' },
  quality_check: { color: 'warning', label: '质检中' },
  completed: { color: 'success', label: '已完成' },
  reworked: { color: 'error', label: '返修中' },
}

const stockTaskStatusMap = {
  open: { color: 'error', label: '待处理' },
  in_progress: { color: 'processing', label: '处理中' },
  resolved: { color: 'success', label: '已解决' },
  closed: { color: 'default', label: '已关闭' },
}

const priorityMap = {
  normal: { color: 'default', label: '普通' },
  high: { color: 'warning', label: '高' },
  urgent: { color: 'error', label: '紧急' },
}

export default function RepairOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)

  useEffect(() => {
    if (id) loadDetail()
  }, [id])

  const loadDetail = async () => {
    const result = await repairOrderApi.getDetail(id).catch(() => null)
    setData(result)
  }

  if (!data) {
    return <div style={{ padding: 40, textAlign: 'center' }}>加载中...</div>
  }

  const partColumns = [
    { title: '配件编码', dataIndex: 'code', key: 'code', width: 120 },
    { title: '配件名称', dataIndex: 'name', key: 'name' },
    { title: '数量', dataIndex: 'qty', key: 'qty', width: 80 },
    { title: '单价', dataIndex: 'price', key: 'price', render: (v) => `¥${v}` },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: (v) => `¥${v}` },
    {
      title: '状态',
      dataIndex: 'out_of_stock',
      key: 'out_of_stock',
      render: (v) => (v ? <Tag color="error">缺货</Tag> : <Tag color="success">正常</Tag>),
    },
  ]

  const laborColumns = [
    { title: '项目名称', dataIndex: 'name', key: 'name' },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: (v) => `¥${v}` },
  ]

  const stockTaskColumns = [
    { title: '任务编号', dataIndex: 'task_no', key: 'task_no' },
    { title: '配件编码', dataIndex: 'part_code', key: 'part_code' },
    { title: '配件名称', dataIndex: 'part_name', key: 'part_name' },
    { title: '数量', dataIndex: 'required_qty', key: 'required_qty', width: 80 },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (v) => <Tag color={priorityMap[v]?.color}>{priorityMap[v]?.label}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v) => (
        <Tag color={stockTaskStatusMap[v]?.color}>{stockTaskStatusMap[v]?.label}</Tag>
      ),
    },
    { title: '处理人', dataIndex: 'assigned_to', key: 'assigned_to' },
    {
      title: '处理结论',
      dataIndex: 'resolution',
      key: 'resolution',
      render: (v) => v || <span style={{ color: '#999' }}>-</span>,
    },
    {
      title: '解决人/时间',
      key: 'resolved',
      render: (_, r) =>
        r.resolved_by
          ? `${r.resolved_by} / ${dayjs(r.resolved_at).format('MM-DD HH:mm')}`
          : '-',
    },
  ]

  return (
    <div>
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            返回
          </Button>
          <div>
            <div className="page-title">
              工单详情 - {data.order_no}
              <Tag color={statusMap[data.status]?.color} style={{ marginLeft: 10 }}>
                {statusMap[data.status]?.label}
              </Tag>
              {data.is_rework && <Tag color="error">返修</Tag>}
            </div>
            <div className="page-subtitle">
              创建时间: {dayjs(data.created_at).format('YYYY-MM-DD HH:mm:ss')}
              {data.is_rework && data.rework_reason && (
                <span style={{ marginLeft: 16, color: '#ff4d4f' }}>
                  返修原因: {data.rework_reason}
                </span>
              )}
            </div>
          </div>
        </Space>
      </div>

      {data.has_stockout && (
        <Alert
          style={{ marginBottom: 16 }}
          type="warning"
          showIcon
          message="本工单存在配件缺货"
          description="请查看下方缺货任务列表处理情况和结论"
        />
      )}

      <div className="detail-panel">
        <Descriptions title="工单基本信息" column={3} size="small" bordered>
          <Descriptions.Item label="工单号">{data.order_no}</Descriptions.Item>
          <Descriptions.Item label="车牌号">
            {data.vehicle && (
              <a onClick={() => navigate(`/vehicles/${data.vehicle.id}`)}>
                {data.vehicle_plate}
              </a>
            )}
            {!data.vehicle && data.vehicle_plate}
          </Descriptions.Item>
          <Descriptions.Item label="车辆">
            {data.vehicle ? `${data.vehicle.brand} ${data.vehicle.model}` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="维修技师">{data.mechanic || '-'}</Descriptions.Item>
          <Descriptions.Item label="质检员">{data.quality_inspector || '-'}</Descriptions.Item>
          <Descriptions.Item label="收银员">
            {data.cashier_no ? `${data.cashier_no}` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="报价金额">¥{data.total_amount.toLocaleString()}</Descriptions.Item>
          <Descriptions.Item label="实收金额">
            <span style={{ color: '#1677ff', fontWeight: 600 }}>
              ¥{(data.actual_amount || 0).toLocaleString()}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="收银金额">
            ¥{(data.cashier_amount || 0).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="开工时间">
            {data.start_time ? dayjs(data.start_time).format('MM-DD HH:mm') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="完工时间">
            {data.end_time ? dayjs(data.end_time).format('MM-DD HH:mm') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="交车时间">
            {data.delivery_time ? dayjs(data.delivery_time).format('MM-DD HH:mm') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="故障描述" span={3}>
            {data.fault_description || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="维修内容" span={3}>
            {data.repair_content || '-'}
          </Descriptions.Item>
        </Descriptions>
      </div>

      {data.quotation && (
        <div className="detail-panel">
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            报价单明细 - {data.quotation.quotation_no}
            {data.quotation.insurance_covered && (
              <Tag color="blue" style={{ marginLeft: 10 }}>
                保险理赔: {data.quotation.insurance_claim_no}
              </Tag>
            )}
          </div>
          <Row gutter={[24, 16]}>
            <Col span={14}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>配件清单</div>
              <Table
                columns={partColumns}
                dataSource={data.quotation.parts || []}
                rowKey="code"
                pagination={false}
                size="small"
                summary={() => (
                  <Table.Summary>
                    <Table.Summary.Row>
                      <Table.Summary.Cell colSpan={4} index={0} align="right">
                        <strong>配件合计:</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <strong>¥{(data.quotation.parts_amount || 0).toLocaleString()}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} />
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            </Col>
            <Col span={10}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>工时项目</div>
              <Table
                columns={laborColumns}
                dataSource={data.quotation.labor_items || []}
                rowKey="name"
                pagination={false}
                size="small"
                summary={() => (
                  <Table.Summary>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} align="right">
                        <strong>工时合计:</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <strong>¥{(data.quotation.labor_amount || 0).toLocaleString()}</strong>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
              <Card size="small" style={{ marginTop: 12 }}>
                <Row justify="space-between">
                  <Col>优惠金额:</Col>
                  <Col>¥{(data.quotation.discount_amount || 0).toLocaleString()}</Col>
                </Row>
                <Divider style={{ margin: '8px 0' }} />
                <Row justify="space-between">
                  <Col><strong>报价总计:</strong></Col>
                  <Col>
                    <strong style={{ color: '#1677ff', fontSize: 16 }}>
                      ¥{(data.quotation.total_amount || 0).toLocaleString()}
                    </strong>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </div>
      )}

      <div className="detail-panel">
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
          <CameraOutlined style={{ color: '#1677ff', marginRight: 6 }} />
          质检照片 ({data.inspection_photos?.length || 0})
        </div>
        {data.inspection_photos && data.inspection_photos.length > 0 ? (
          <div className="photo-grid">
            {data.inspection_photos.map((photo) => (
              <div key={photo.id} className="photo-item">
                <Image
                  src={photo.photo_url}
                  width="100%"
                  height={120}
                  style={{ objectFit: 'cover' }}
                  preview={{ src: photo.photo_url }}
                />
                <div className="photo-info">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{photo.description || '未标注'}</span>
                    {photo.is_quality_issue && <Tag color="error" style={{ margin: 0 }}>问题</Tag>}
                  </div>
                  <div style={{ color: '#999', marginTop: 2 }}>
                    {photo.uploader} · {dayjs(photo.created_at).format('MM-DD HH:mm')}
                  </div>
                  {photo.issue_notes && (
                    <div style={{ color: '#ff4d4f', marginTop: 4 }}>{photo.issue_notes}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty description="暂无质检照片" />
        )}
      </div>

      {data.stock_tasks && data.stock_tasks.length > 0 && (
        <div className="detail-panel">
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            <ToolOutlined style={{ color: '#faad14', marginRight: 6 }} />
            配件缺货任务 ({data.stock_tasks.length}) - 复盘可查看处理结论
          </div>
          <Table
            columns={stockTaskColumns}
            dataSource={data.stock_tasks}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </div>
      )}

      {data.vehicle && (
        <div className="detail-panel">
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            <a onClick={() => navigate(`/vehicles/${data.vehicle.id}`)}>
              查看完整车辆档案 →
            </a>
          </div>
          <Descriptions column={4} size="small">
            <Descriptions.Item label="累计维修次数">{data.vehicle.repair_count} 次</Descriptions.Item>
            <Descriptions.Item label="累计消费">¥{(data.vehicle.total_amount || 0).toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="当前里程">{(data.vehicle.mileage || 0).toLocaleString()} km</Descriptions.Item>
            <Descriptions.Item label="预警级别">
              <Tag
                color={
                  data.vehicle.warning_level === 'danger'
                    ? 'error'
                    : data.vehicle.warning_level === 'warning'
                    ? 'warning'
                    : 'success'
                }
              >
                {data.vehicle.warning_level === 'danger'
                  ? '高危'
                  : data.vehicle.warning_level === 'warning'
                  ? '预警'
                  : '正常'}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </div>
      )}
    </div>
  )
}
