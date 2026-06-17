import { createLazyFileRoute } from '@tanstack/react-router'
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Input,
  Select,
  Row,
  Col,
  Form,
  Tabs,
  message,
  Popconfirm,
  Typography,
  Alert,
  Divider,
} from 'antd'
import {
  ExportOutlined,
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  DeleteOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { exportApi } from '@/api'
import type { ExportRecord } from '@/types'
import dayjs from 'dayjs'
import { saveAs } from 'file-saver'

// @ts-ignore
export const Route = createLazyFileRoute('/export')({
  component: ExportPage,
})

const { Title, Text, Paragraph } = Typography

const exportTypeOptions = [
  { value: 'contracts', label: '合同' },
  { value: 'bills', label: '单据' },
  { value: 'reconciliation', label: '对账差异' },
  { value: 'exceptions', label: '异常单' },
]

const caliberTemplates: Record<string, string> = {
  contracts: `【数据口径说明】
1. 统计范围：所有合同，包含草稿、待审批、已审批、已完成、已作废等全部状态
2. 合同金额：签约金额，包含主合同及补充协议金额
3. 回款周期：从签约日期到最后一笔回款日期的天数
4. 统计时间：${dayjs().format('YYYY-MM-DD HH:mm:ss')}
5. 数据来源：家装工地量房报价跟进台
6. 注意事项：金额单位为人民币元，保留2位小数`,
  bills: `【数据口径说明】
1. 统计范围：所有单据，包含量房单、报价单、材料单、人工费单等
2. 单据金额：单据明细实际金额合计，已扣除折扣
3. 已付金额：截至导出时间已实际到账金额
4. 未付金额：单据总金额减去已付金额
5. 统计时间：${dayjs().format('YYYY-MM-DD HH:mm:ss')}
6. 数据来源：家装工地量房报价跟进台
7. 注意事项：金额单位为人民币元，保留2位小数`,
  reconciliation: `【数据口径说明】
1. 统计范围：所有对账差异记录
2. 差异金额：预期金额与实际金额的差额
3. 状态说明：待处理、处理中、已解决、已驳回
4. 处理时效：从创建时间到处理完成时间的小时数
5. 统计时间：${dayjs().format('YYYY-MM-DD HH:mm:ss')}
6. 数据来源：家装工地量房报价跟进台
7. 注意事项：金额单位为人民币元，保留2位小数`,
  exceptions: `【数据口径说明】
1. 统计范围：所有异常单，包含金额不一致、审批超时、资料缺失等类型
2. 优先级：高/中/低，影响金额超过1万元自动标记为高优先级
3. 处理时效：从创建时间到关闭时间的小时数
4. 统计时间：${dayjs().format('YYYY-MM-DD HH:mm:ss')}
5. 数据来源：家装工地量房报价跟进台
6. 注意事项：金额单位为人民币元，保留2位小数`,
}

const getExportTypeText = (type: string) => {
  const texts: Record<string, string> = {
    contracts: '合同',
    bills: '单据',
    reconciliation: '对账差异',
    exceptions: '异常单',
  }
  return texts[type] || type
}

const getExportTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    contracts: 'blue',
    bills: 'cyan',
    reconciliation: 'orange',
    exceptions: 'red',
  }
  return colors[type] || 'default'
}

function ExportPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('export')
  const [form] = Form.useForm()
  const [keyword, setKeyword] = useState('')
  const [typeFilter, setTypeFilter] = useState<string | undefined>()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['export', 'list', page, pageSize, keyword, typeFilter],
    queryFn: () =>
      exportApi.getExportRecords({
        page,
        page_size: pageSize,
        keyword,
        status: typeFilter,
      }),
  })

  const exportMutation = useMutation({
    mutationFn: (data: any) => exportApi.exportData(data),
    onSuccess: (blob, variables) => {
      const fileName = `${variables.export_name}_${dayjs().format('YYYYMMDDHHmmss')}.xlsx`
      saveAs(blob, fileName)
      message.success('导出成功')
      queryClient.invalidateQueries({ queryKey: ['export', 'list'] })
    },
    onError: () => {
      message.error('导出失败')
    },
  })

  const downloadMutation = useMutation({
    mutationFn: (id: number) => exportApi.downloadExport(id),
    onSuccess: (blob, id) => {
      const record = data?.items?.find((r) => r.id === id)
      const fileName = record?.file_name || `export_${dayjs().format('YYYYMMDDHHmmss')}.xlsx`
      saveAs(blob, fileName)
      message.success('下载成功')
    },
    onError: () => {
      message.error('下载失败')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => exportApi.deleteExportRecord(id),
    onSuccess: () => {
      message.success('删除成功')
      queryClient.invalidateQueries({ queryKey: ['export', 'list'] })
    },
    onError: () => {
      message.error('删除失败')
    },
  })

  const handleTypeChange = (type: string) => {
    form.setFieldsValue({
      data_caliber: caliberTemplates[type] || caliberTemplates.contracts,
    })
  }

  const handleExport = async (values: any) => {
    const filterConditions: Record<string, any> = {}
    if (values.status) filterConditions.status = values.status
    if (values.start_date) filterConditions.start_date = values.start_date
    if (values.end_date) filterConditions.end_date = values.end_date

    exportMutation.mutate({
      export_type: values.export_type,
      export_name: values.export_name,
      filter_conditions: Object.keys(filterConditions).length > 0 ? filterConditions : undefined,
      data_caliber: values.data_caliber,
      include_caliber: true,
    })
  }

  const handleDownload = (record: ExportRecord) => {
    downloadMutation.mutate(record.id)
  }

  const handleDelete = (record: ExportRecord) => {
    deleteMutation.mutate(record.id)
  }

  const handleSearch = () => {
    setPage(1)
    refetch()
  }

  const handleReset = () => {
    setKeyword('')
    setTypeFilter(undefined)
    setPage(1)
    refetch()
  }

  const getCaliberSummary = (caliber: string) => {
    const lines = caliber.split('\n').filter((line) => line.trim())
    return lines.slice(0, 3).map((line, idx) => (
      <div key={idx} className="text-xs">
        {line.length > 50 ? line.substring(0, 50) + '...' : line}
      </div>
    ))
  }

  const columns = [
    {
      title: '导出类型',
      dataIndex: 'export_type',
      key: 'export_type',
      width: 100,
      render: (type: string) => (
        <Tag color={getExportTypeColor(type)}>{getExportTypeText(type)}</Tag>
      ),
    },
    {
      title: '名称',
      dataIndex: 'export_name',
      key: 'export_name',
      ellipsis: true,
    },
    {
      title: '文件名',
      dataIndex: 'file_name',
      key: 'file_name',
      ellipsis: true,
      render: (name: string) => (
        <Space>
          <FileTextOutlined className="text-gray-400" />
          <span>{name}</span>
        </Space>
      ),
    },
    {
      title: '数据口径',
      dataIndex: 'data_caliber',
      key: 'data_caliber',
      width: 280,
      render: (caliber: string) => (
        <div className="caliber-note mb-0">
          {getCaliberSummary(caliber)}
        </div>
      ),
    },
    {
      title: '记录数',
      dataIndex: 'record_count',
      key: 'record_count',
      width: 80,
      render: (count?: number) => (
        <span className="font-medium">{count ?? '-'}</span>
      ),
    },
    {
      title: '导出时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right' as const,
      render: (_: any, record: ExportRecord) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record)}
            loading={downloadMutation.isPending && downloadMutation.variables === record.id}
          >
            重新下载
          </Button>
          <Popconfirm title="确定要删除这条导出记录吗？" onConfirm={() => handleDelete(record)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const tabItems = [
    {
      key: 'export',
      label: '立即导出',
      children: (
        <Card className="card-wrapper">
          <Alert
            message="数据导出说明"
            description="导出的Excel文件将包含专门的'数据口径'工作表，用于向团队说明数据统计范围和计算规则。请务必填写完整的口径说明。"
            type="info"
            showIcon
            className="mb-6"
          />
          <Form
            form={form}
            layout="vertical"
            onFinish={handleExport}
            initialValues={{
              export_type: 'contracts',
              export_name: '合同数据导出',
              data_caliber: caliberTemplates.contracts,
            }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="export_type"
                  label="导出类型"
                  rules={[{ required: true, message: '请选择导出类型' }]}
                >
                  <Select options={exportTypeOptions} onChange={handleTypeChange} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="export_name"
                  label="导出名称"
                  rules={[{ required: true, message: '请输入导出名称' }]}
                >
                  <Input placeholder="请输入导出文件名称" />
                </Form.Item>
              </Col>
            </Row>

            <Divider />
            <Title level={5} className="mb-4">过滤条件</Title>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="status" label="状态筛选">
                  <Select
                    placeholder="全部状态"
                    allowClear
                    options={[
                      { value: 'pending', label: '待处理' },
                      { value: 'processing', label: '处理中' },
                      { value: 'approved', label: '已通过' },
                      { value: 'completed', label: '已完成' },
                      { value: 'closed', label: '已关闭' },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="start_date" label="开始日期">
                  <Input type="date" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="end_date" label="结束日期">
                  <Input type="date" />
                </Form.Item>
              </Col>
            </Row>

            <Divider />
            <Title level={5} className="mb-4">口径说明</Title>
            <div className="caliber-note">
              <Paragraph className="mb-2 text-sm">
                <Text strong>提示：</Text>口径说明将作为独立工作表包含在导出的Excel文件中，用于向接收数据的团队成员解释数据统计规则。请确保信息准确完整。
              </Paragraph>
            </div>
            <Form.Item
              name="data_caliber"
              label="数据口径说明"
              rules={[{ required: true, message: '请填写数据口径说明' }]}
              tooltip="用于向团队解释数据统计范围和计算规则"
            >
              <Input.TextArea
                rows={8}
                placeholder="请填写数据口径说明，包含统计范围、计算规则、注意事项等"
              />
            </Form.Item>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button onClick={() => form.resetFields()}>
                重置
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<ExportOutlined />}
                loading={exportMutation.isPending}
              >
                立即导出
              </Button>
            </div>
          </Form>
        </Card>
      ),
    },
    {
      key: 'records',
      label: '导出记录',
      children: (
        <Card className="card-wrapper">
          <div className="space-y-4">
            <Row gutter={16} align="middle">
              <Col span={6}>
                <Input
                  placeholder="搜索导出名称、文件名"
                  prefix={<SearchOutlined />}
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onPressEnter={handleSearch}
                />
              </Col>
              <Col span={4}>
                <Select
                  placeholder="按类型筛选"
                  allowClear
                  style={{ width: '100%' }}
                  value={typeFilter}
                  onChange={(val) => setTypeFilter(val)}
                  options={exportTypeOptions}
                />
              </Col>
              <Col span={14} className="flex justify-end gap-2">
                <Button icon={<ReloadOutlined />} onClick={handleReset}>
                  重置
                </Button>
                <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                  搜索
                </Button>
              </Col>
            </Row>

            <Table
              dataSource={data?.items || []}
              columns={columns}
              rowKey="id"
              loading={isLoading}
              pagination={{
                current: page,
                pageSize,
                total: data?.total || 0,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`,
                onChange: (p, ps) => {
                  setPage(p)
                  setPageSize(ps)
                },
              }}
            />
          </div>
        </Card>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <Card title="数据导出" className="card-wrapper">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          className="export-tabs"
        />
      </Card>
    </div>
  )
}
