import React, { useState } from 'react'
import {
  Card,
  Form,
  Select,
  DatePicker,
  Button,
  Tabs,
  Alert,
  App as AntdApp,
  Statistic,
  Row,
  Col,
  Empty,
  Table,
  Tag,
  Progress,
} from 'antd'
import {
  ExportOutlined,
  DownloadOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  ExperimentOutlined,
  ToolOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { exportApi } from '@/api/export'
import { ExportType, SamplingStatus, RectificationStatus, ExceptionStatus, RiskLevel, ExceptionType } from '@/types/enums'
import { ExportTask } from '@/types'
import StatusTag from '@/components/StatusTag'

const { RangePicker } = DatePicker

interface ExportFormValues {
  entityType: string
  format: 'excel' | 'csv'
  status?: string
  riskLevel?: string
  exceptionType?: string
  evidenceStatus?: string
  dateRange?: [dayjs.Dayjs, dayjs.Dayjs]
}

const mockExportTasks: ExportTask[] = [
  {
    taskId: 'EXP-2025-001',
    status: 'completed',
    entityType: ExportType.SAMPLING,
    format: 'excel',
  },
  {
    taskId: 'EXP-2025-002',
    status: 'completed',
    entityType: ExportType.RECTIFICATION,
    format: 'csv',
  },
  {
    taskId: 'EXP-2025-003',
    status: 'processing',
    entityType: ExportType.EXCEPTION,
    format: 'excel',
  },
]

const exportTypeMap: Record<string, { label: string; icon: React.ReactNode }> = {
  [ExportType.SAMPLING]: { label: '抽样记录', icon: <ExperimentOutlined /> },
  [ExportType.RECTIFICATION]: { label: '整改计划', icon: <ToolOutlined /> },
  [ExportType.EXCEPTION]: { label: '异常单', icon: <WarningOutlined /> },
}

const samplingStatusOptions = [
  { label: '待审核', value: SamplingStatus.PENDING },
  { label: '已审核', value: SamplingStatus.REVIEWED },
  { label: '需跟进', value: SamplingStatus.FOLLOW_UP },
]

const rectificationStatusOptions = [
  { label: '未启动', value: RectificationStatus.NOT_STARTED },
  { label: '进行中', value: RectificationStatus.IN_PROGRESS },
  { label: '已提交', value: RectificationStatus.SUBMITTED },
  { label: '已审核', value: RectificationStatus.REVIEWED },
  { label: '已关闭', value: RectificationStatus.CLOSED },
]

const exceptionStatusOptions = [
  { label: '待处理', value: ExceptionStatus.OPEN },
  { label: '处理中', value: ExceptionStatus.PROCESSING },
  { label: '已关闭', value: ExceptionStatus.CLOSED },
]

const exceptionTypeOptions = [
  { label: '证据缺失', value: ExceptionType.EVIDENCE_MISSING },
  { label: '不合规', value: ExceptionType.NON_COMPLIANCE },
  { label: '其他', value: ExceptionType.OTHER },
]

const riskLevelOptions = [
  { label: '低风险', value: RiskLevel.LOW },
  { label: '中风险', value: RiskLevel.MEDIUM },
  { label: '高风险', value: RiskLevel.HIGH },
  { label: '严重风险', value: RiskLevel.CRITICAL },
]

const ExportPage: React.FC = () => {
  const [form] = Form.useForm<ExportFormValues>()
  const { message } = AntdApp.useApp()
  const [selectedType, setSelectedType] = useState<ExportType | string>('')

  const { data: coverageData, isLoading: coverageLoading } = useQuery({
    queryKey: ['sampling-coverage'],
    queryFn: exportApi.getSamplingCoverage,
  })

  const watchedEntityType = Form.useWatch('entityType', form)

  React.useEffect(() => {
    setSelectedType(watchedEntityType || '')
  }, [watchedEntityType])

  const exportSyncMutation = useMutation({
    mutationFn: (request: { entityType: string; format: 'excel' | 'csv'; filters?: Record<string, any> }) =>
      exportApi.exportSync({
        entityType: request.entityType,
        format: request.format,
        filters: request.filters,
      }),
    onSuccess: (blob, variables) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const typeInfo = exportTypeMap[variables.entityType]
      const typeLabel = typeInfo?.label || variables.entityType
      a.download = `${typeLabel}_${dayjs().format('YYYYMMDDHHmmss')}.${variables.format === 'excel' ? 'xlsx' : 'csv'}`
      a.click()
      window.URL.revokeObjectURL(url)
      message.success('导出成功')
    },
    onError: () => message.error('导出失败'),
  })

  const handleExport = async () => {
    try {
      const values = await form.validateFields()
      const filters: Record<string, any> = {}
      if (values.status) filters.status = values.status
      if (values.riskLevel) filters.riskLevel = values.riskLevel
      if (values.exceptionType) filters.exceptionType = values.exceptionType
      if (values.evidenceStatus) filters.evidenceStatus = values.evidenceStatus
      if (values.dateRange) {
        filters.startDate = values.dateRange[0].startOf('day').toISOString()
        filters.endDate = values.dateRange[1].endOf('day').toISOString()
      }
      exportSyncMutation.mutate({
        entityType: values.entityType,
        format: values.format,
        filters,
      })
    } catch {
    }
  }

  const handleDownloadTask = (task: ExportTask) => {
    message.info(`正在下载任务 ${task.taskId}...`)
  }

  const syncTabContent = (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <span>
                <ExportOutlined style={{ marginRight: 8 }} />
                同步导出
              </span>
            }
          >
            <Form form={form} layout="vertical" onFinish={handleExport} initialValues={{ format: 'excel' }}>
              <Form.Item
                label="导出类型"
                name="entityType"
                rules={[{ required: true, message: '请选择导出类型' }]}
              >
                <Select
                  placeholder="请选择导出类型"
                  options={[
                    { label: '抽样记录', value: ExportType.SAMPLING, icon: <ExperimentOutlined /> },
                    { label: '整改计划', value: ExportType.RECTIFICATION, icon: <ToolOutlined /> },
                    { label: '异常单', value: ExportType.EXCEPTION, icon: <WarningOutlined /> },
                  ]}
                  optionLabelProp="label"
                />
              </Form.Item>
              <Form.Item
                label="导出格式"
                name="format"
                rules={[{ required: true, message: '请选择导出格式' }]}
              >
                <Select
                  placeholder="请选择导出格式"
                  options={[
                    { label: 'Excel (.xlsx)', value: 'excel' },
                    { label: 'CSV (.csv)', value: 'csv' },
                  ]}
                />
              </Form.Item>

              {selectedType === ExportType.SAMPLING && (
                <>
                  <Form.Item label="状态筛选" name="status">
                    <Select placeholder="选择抽样状态（可选）" allowClear options={samplingStatusOptions} />
                  </Form.Item>
                  <Form.Item label="证据状态" name="evidenceStatus">
                    <Select
                      placeholder="选择证据状态（可选）"
                      allowClear
                      options={[
                        { label: '完整', value: 'complete' },
                        { label: '部分', value: 'partial' },
                        { label: '缺失', value: 'missing' },
                      ]}
                    />
                  </Form.Item>
                </>
              )}
              {selectedType === ExportType.RECTIFICATION && (
                <>
                  <Form.Item label="状态筛选" name="status">
                    <Select placeholder="选择整改状态（可选）" allowClear options={rectificationStatusOptions} />
                  </Form.Item>
                  <Form.Item label="风险等级" name="riskLevel">
                    <Select placeholder="选择风险等级（可选）" allowClear options={riskLevelOptions} />
                  </Form.Item>
                </>
              )}
              {selectedType === ExportType.EXCEPTION && (
                <>
                  <Form.Item label="状态筛选" name="status">
                    <Select placeholder="选择异常状态（可选）" allowClear options={exceptionStatusOptions} />
                  </Form.Item>
                  <Form.Item label="异常类型" name="exceptionType">
                    <Select placeholder="选择异常类型（可选）" allowClear options={exceptionTypeOptions} />
                  </Form.Item>
                </>
              )}

              <Form.Item label="日期范围" name="dateRange">
                <RangePicker
                  style={{ width: '100%' }}
                  presets={[
                    { label: '近7天', value: [dayjs().add(-7, 'day'), dayjs()] },
                    { label: '近30天', value: [dayjs().add(-30, 'day'), dayjs()] },
                    {
                      label: '本季度',
                      value: () => {
                        const now = dayjs()
                        const quarter = Math.floor(now.month() / 3)
                        const start = now.month(quarter * 3).startOf('month')
                        return [start, now] as const
                      },
                    },
                    { label: '本年度', value: [dayjs().startOf('year'), dayjs()] },
                  ]}
                />
              </Form.Item>

              <div style={{ textAlign: 'right' }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<ExportOutlined />}
                  loading={exportSyncMutation.isPending}
                >
                  立即导出
                </Button>
              </div>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <span>
                <InfoCircleOutlined style={{ marginRight: 8 }} />
                口径说明
              </span>
            }
          >
            <Alert
              type="info"
              showIcon
              message={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileTextOutlined />
                  <strong>抽样覆盖口径说明</strong>
                </div>
              }
              description={
                coverageLoading ? (
                  '加载中...'
                ) : coverageData ? (
                  <div>
                    <div style={{ marginTop: 8, marginBottom: 8 }}>
                      <Row gutter={[16, 16]}>
                        <Col span={8}>
                          <Statistic
                            title="清单总数"
                            value={coverageData.totalChecklists}
                            valueStyle={{ fontSize: 18 }}
                            prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
                          />
                        </Col>
                        <Col span={8}>
                          <Statistic
                            title="已抽样"
                            value={coverageData.sampledChecklists}
                            valueStyle={{ fontSize: 18, color: '#52c41a' }}
                            prefix={<ExperimentOutlined />}
                          />
                        </Col>
                        <Col span={8}>
                          <Statistic
                            title="覆盖率"
                            value={coverageData.coverageRate}
                            precision={1}
                            suffix="%"
                            valueStyle={{ fontSize: 18, color: '#722ed1' }}
                          />
                          <Progress
                            percent={Math.round(coverageData.coverageRate)}
                            size="small"
                            showInfo={false}
                            style={{ marginTop: 4 }}
                          />
                        </Col>
                      </Row>
                    </div>
                    <div style={{ color: '#666', fontSize: 13, lineHeight: 1.8 }}>
                      <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{coverageData.description}</p>
                      {Object.entries(coverageData.byCategory || {}).length > 0 && (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ fontWeight: 500, marginBottom: 8 }}>按分类覆盖情况：</div>
                          {Object.entries(coverageData.byCategory).map(([cat, info]) => (
                            <div
                              key={cat}
                              style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}
                            >
                              <Tag color="blue">{cat}</Tag>
                              <span style={{ fontSize: 12, color: '#666' }}>
                                {info.sampled}/{info.total} （{info.coverageRate.toFixed(1)}%）
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                    抽样覆盖率 = 已关联抽样记录的检查清单数 / 检查清单总数 × 100%
                    {'\n'}仅统计已发布状态的检查清单，抽样记录以"已审核"状态为准。
                    {'\n'}数据每日凌晨自动刷新。
                    {'\n\n'}导出口径：
                    {'\n'}1. 抽样记录：导出日期范围内创建的抽样记录，包含基本信息、证据状态、状态变更历史
                    {'\n'}2. 整改计划：导出截止日期范围内的整改计划，包含风险等级、进度、负责人
                    {'\n'}3. 异常单：导出创建日期范围内的异常单，包含异常类型、处理结果、责任人
                  </div>
                )
              }
              style={{ marginTop: 16 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )

  const historyTabContent = (
    <Card
      title={
        <span>
          <DownloadOutlined style={{ marginRight: 8 }} />
          最近导出记录
        </span>
      }
    >
      {mockExportTasks.length ? (
        <Table
          rowKey="taskId"
          columns={[
            {
              title: '任务ID',
              dataIndex: 'taskId',
              width: 160,
            },
            {
              title: '导出类型',
              dataIndex: 'entityType',
              width: 120,
              render: (val: string) => {
                const info = exportTypeMap[val]
                return info ? (
                  <span>
                    {info.icon} {info.label}
                  </span>
                ) : (
                  val
                )
              },
            },
            {
              title: '格式',
              dataIndex: 'format',
              width: 80,
              render: (val: string) => <Tag color="blue">{val.toUpperCase()}</Tag>,
            },
            {
              title: '状态',
              dataIndex: 'status',
              width: 120,
              render: (val: string) => <StatusTag status={val} />,
            },
            {
              title: '操作',
              key: 'actions',
              width: 120,
              render: (_: unknown, record: ExportTask) =>
                record.status === 'completed' ? (
                  <Button
                    type="link"
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownloadTask(record)}
                  >
                    下载
                  </Button>
                ) : record.status === 'processing' ? (
                  <Tag color="blue">处理中...</Tag>
                ) : (
                  '-'
                ),
            },
          ]}
          dataSource={mockExportTasks}
          pagination={false}
        />
      ) : (
        <Empty description="暂无导出记录" style={{ padding: 40 }} />
      )}
    </Card>
  )

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: 0 }}>数据导出</h2>
      </div>

      <Tabs
        defaultActiveKey="sync"
        items={[
          {
            key: 'sync',
            label: (
              <span>
                <ExportOutlined style={{ marginRight: 8 }} />
                同步导出
              </span>
            ),
            children: syncTabContent,
          },
          {
            key: 'history',
            label: (
              <span>
                <FileTextOutlined style={{ marginRight: 8 }} />
                导出记录
              </span>
            ),
            children: historyTabContent,
          },
        ]}
      />
    </div>
  )
}

export default ExportPage
