import { useEffect, useState } from 'react'
import { Card, Table, Tag, Button, Space, Select, DatePicker, Modal, Form, message, Descriptions, Drawer, Row, Col, Progress, Badge, Typography, InputNumber, Alert } from 'antd'
import {
  DownloadOutlined, FileTextOutlined, FileDoneOutlined,
  BarChartOutlined, TeamOutlined, EyeOutlined, InfoCircleOutlined,
  ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined,
} from '@ant-design/icons'
import { reportsApi, authApi } from '../services'
import dayjs from 'dayjs'

const { Text } = Typography

const REPORT_TYPES = [
  { value: 'classroom_utilization', label: '教室利用率报表', icon: <BarChartOutlined />, desc: '按月统计各教室的使用率、出勤情况' },
  { value: 'monthly_summary', label: '月度复核汇总报表', icon: <FileDoneOutlined />, desc: '月度复核申请状态、通过率、处理时效' },
  { value: 'review_details', label: '复核申请明细报表', icon: <FileTextOutlined />, desc: '所有复核申请的详细数据导出' },
  { value: 'advisor_quota', label: '导师名额统计报表', icon: <TeamOutlined />, desc: '导师名额分配、使用率统计' },
]

export default function Reports() {
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [loading, setLoading] = useState(false)
  const [generateModal, setGenerateModal] = useState(false)
  const [infoDrawer, setInfoDrawer] = useState(false)
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [reportType, setReportType] = useState(null)
  const [generators, setGenerators] = useState([])
  const [filters, setFilters] = useState({})
  const [form] = Form.useForm()

  useEffect(() => { loadData() }, [pagination.current, pagination.pageSize, filters])
  useEffect(() => { loadGenerators() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await reportsApi.list({
        page: pagination.current,
        page_size: pagination.pageSize,
        ...filters,
      })
      setData(res.data.data)
      setPagination(p => ({ ...p, total: res.data.pagination.total }))
    } catch {}
    setLoading(false)
  }

  const loadGenerators = async () => {
    try {
      const [res1, res2, res3] = await Promise.all([
        authApi.listUsers('admin'),
        authApi.listUsers('student_affairs'),
        authApi.listUsers('auditor'),
      ])
      setGenerators([...res1.data, ...res2.data, ...res3.data])
    } catch {}
  }

  const openGenerate = (type) => {
    setReportType(type)
    form.resetFields()
    if (type.value === 'classroom_utilization') {
      form.setFieldsValue({ year: dayjs().year(), month: dayjs().month() + 1 })
    } else if (type.value === 'monthly_summary') {
      form.setFieldsValue({ year: dayjs().year() })
    }
    setGenerateModal(true)
  }

  const handleGenerate = async () => {
    const vals = await form.validateFields()
    try {
      const res = await reportsApi.generate(reportType.value, vals)
      message.success('报表生成成功！筛选口径已记录')
      setGenerateModal(false)
      loadData()

      Modal.confirm({
        title: '报表已生成',
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        content: (
          <div>
            <Descriptions size="small" column={1} bordered>
              <Descriptions.Item label="报表ID">{res.data.report_id}</Descriptions.Item>
              <Descriptions.Item label="文件名">{res.data.file_name}</Descriptions.Item>
              <Descriptions.Item label="生成者">{res.data.generated_by}</Descriptions.Item>
              <Descriptions.Item label="筛选口径">
                <Text code style={{ whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(res.data.filter_criteria, null, 2)}
                </Text>
              </Descriptions.Item>
            </Descriptions>
          </div>
        ),
        okText: '立即下载',
        cancelText: '稍后下载',
        onOk: () => downloadReport(res.data.report_id, res.data.file_name),
      })
    } catch {}
  }

  const downloadReport = async (id, name) => {
    try {
      const res = await reportsApi.download(id)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = name || `report_${id}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
      message.success('下载成功，报表中包含筛选口径和生成者信息')
      loadData()
    } catch {}
  }

  const viewInfo = async (record) => {
    setSelected(record)
    try {
      const res = await reportsApi.info(record.id)
      setDetail(res.data)
    } catch { setDetail(record) }
    setInfoDrawer(true)
  }

  const columns = [
    { title: '报表名称', dataIndex: 'report_name', render: (v, r) => (
      <Space>
        <FileDoneOutlined style={{ color: '#1677ff' }} />
        <a onClick={() => viewInfo(r)}>{v}</a>
      </Space>
    ) },
    { title: '报表类型', dataIndex: 'report_type', width: 150, render: v => {
      const cfg = REPORT_TYPES.find(t => t.value === v) || {}
      return <Tag color="blue">{cfg.label || v}</Tag>
    } },
    { title: '生成者', dataIndex: 'generated_by_name', width: 120 },
    { title: '格式', dataIndex: 'file_format', width: 80, render: v => <Tag color="geekblue">{v.toUpperCase()}</Tag> },
    { title: '下载次数', dataIndex: 'download_count', width: 100, render: v => <Badge count={v} showZero color="#1677ff" /> },
    { title: '状态', dataIndex: 'status', width: 100, render: v => {
      const map = {
        pending: { label: '生成中', color: 'processing', icon: <ClockCircleOutlined /> },
        completed: { label: '已完成', color: 'success', icon: <CheckCircleOutlined /> },
        failed: { label: '失败', color: 'error', icon: <CloseCircleOutlined /> },
      }
      const s = map[v] || {}
      return <Tag color={s.color} icon={s.icon}>{s.label}</Tag>
    } },
    { title: '生成时间', dataIndex: 'generated_at', width: 160, render: v => dayjs(v).format('YYYY-MM-DD HH:mm') },
    { title: '操作', width: 160, fixed: 'right', render: (_, r) => (
      <Space size="small">
        <Button size="small" icon={<InfoCircleOutlined />} onClick={() => viewInfo(r)}>信息</Button>
        <Button size="small" type="primary" icon={<DownloadOutlined />} onClick={() => downloadReport(r.id, r.file_path)}>下载</Button>
      </Space>
    ) },
  ]

  const renderFormFields = () => {
    if (!reportType) return null
    switch (reportType.value) {
      case 'classroom_utilization':
        return (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space>
              <Form.Item name="year" label="年份" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                <Select
                  style={{ width: 140 }}
                  options={Array.from({ length: 5 }, (_, i) => ({ label: `${dayjs().year() - i}年`, value: dayjs().year() - i }))}
                />
              </Form.Item>
              <Form.Item name="month" label="月份" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                <Select
                  style={{ width: 140 }}
                  options={Array.from({ length: 12 }, (_, i) => ({ label: `${i + 1}月`, value: i + 1 }))}
                />
              </Form.Item>
            </Space>
            <Form.Item name="building" label="教学楼（可选）">
              <Select
                allowClear
                style={{ width: '100%' }}
                options={['第一教学楼', '第二教学楼', '第三教学楼', '实验楼'].map(b => ({ label: b, value: b }))}
              />
            </Form.Item>
          </Space>
        )
      case 'monthly_summary':
        return (
          <Form.Item name="year" label="统计年份" rules={[{ required: true }]}>
            <Select
              style={{ width: 200 }}
              options={Array.from({ length: 5 }, (_, i) => ({ label: `${dayjs().year() - i}年`, value: dayjs().year() - i }))}
            />
          </Form.Item>
        )
      default:
        return (
          <Alert type="info" showIcon message="该报表将导出全量数据，如需特定筛选请在下载后手动过滤。" />
        )
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div className="page-title" style={{ margin: 0 }}>
          报表下载中心
          <Tag color="green" style={{ marginLeft: 8 }}>
            <InfoCircleOutlined /> 下载时记录筛选口径与生成者
          </Tag>
        </div>
        <Space>
          <Select
            placeholder="报表类型"
            allowClear
            style={{ width: 160 }}
            value={filters.report_type || undefined}
            onChange={v => setFilters(f => ({ ...f, report_type: v || '' }))}
            options={REPORT_TYPES.map(t => ({ label: t.label, value: t.value }))}
          />
          <Select
            placeholder="生成者"
            allowClear
            showSearch
            style={{ width: 160 }}
            value={filters.generated_by_id || undefined}
            onChange={v => setFilters(f => ({ ...f, generated_by_id: v || '' }))}
            options={generators.map(g => ({ label: g.full_name, value: g.id }))}
            optionFilterProp="label"
          />
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          {REPORT_TYPES.map(t => (
            <Col xs={24} md={12} lg={6} key={t.value}>
              <Card
                size="small"
                hoverable
                onClick={() => openGenerate(t)}
                style={{ cursor: 'pointer', height: '100%', borderLeft: '3px solid #1677ff' }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space>
                    <div style={{ fontSize: 28, color: '#1677ff' }}>{t.icon}</div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{t.label}</div>
                    </div>
                  </Space>
                  <Text type="secondary" style={{ fontSize: 12 }}>{t.desc}</Text>
                  <Button type="primary" size="small" icon={<FileDoneOutlined />} block>
                    生成报表
                  </Button>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Card title="历史报表" size="small">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data}
          columns={columns}
          scroll={{ x: 1000 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: t => `共 ${t} 个报表`,
            onChange: (page, pageSize) => setPagination({ current: page, pageSize, total: pagination.total }),
          }}
        />
      </Card>

      <Modal
        title={
          <Space>
            {reportType?.icon}
            生成 {reportType?.label}
          </Space>
        }
        open={generateModal}
        onCancel={() => setGenerateModal(false)}
        onOk={handleGenerate}
        okText="确认生成"
        width={600}
      >
        <Alert
          type="info"
          showIcon
          message={
            <Space>
              <InfoCircleOutlined />
              <span>生成报表时系统会自动记录：<b>筛选口径</b>、<b>生成者</b>、<b>生成时间</b>，下载后可随时查看</span>
            </Space>
          }
          style={{ marginBottom: 16 }}
        />
        <Form form={form} layout="vertical">
          {renderFormFields()}
        </Form>
      </Modal>

      <Drawer
        title={`报表详细信息 - ${selected?.report_name || ''}`}
        placement="right"
        width={520}
        open={infoDrawer}
        onClose={() => setInfoDrawer(false)}
        extra={detail && (
          <Button type="primary" icon={<DownloadOutlined />} onClick={() => downloadReport(detail.id, detail.file_path)}>
            下载
          </Button>
        )}
      >
        {detail && (
          <>
            <Descriptions column={1} bordered style={{ marginBottom: 16 }} size="small">
              <Descriptions.Item label="报表名称">{detail.report_name}</Descriptions.Item>
              <Descriptions.Item label="报表类型">{detail.report_type}</Descriptions.Item>
              <Descriptions.Item label="文件格式">{detail.file_format?.toUpperCase()}</Descriptions.Item>
              <Descriptions.Item label="生成者">
                <Tag color="blue">{detail.generated_by_name || detail.generated_by_id}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="生成时间">{dayjs(detail.generated_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              <Descriptions.Item label="下载次数">
                <Badge count={detail.download_count} showZero color="#1677ff" />
              </Descriptions.Item>
              <Descriptions.Item label="任务ID">{detail.task_id || '-'}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={detail.status === 'completed' ? 'success' : 'processing'}>{detail.status}</Tag>
              </Descriptions.Item>
            </Descriptions>
            <Card
              size="small"
              title={
                <Space>
                  <InfoCircleOutlined style={{ color: '#1677ff' }} />
                  筛选口径（生成时记录）
                </Space>
              }
            >
              <pre style={{
                background: '#f6f8fa',
                padding: 12,
                borderRadius: 6,
                fontSize: 12,
                overflowX: 'auto',
                margin: 0,
              }}>
                {JSON.stringify(detail.filter_criteria, null, 2)}
              </pre>
            </Card>
          </>
        )}
      </Drawer>
    </div>
  )
}
