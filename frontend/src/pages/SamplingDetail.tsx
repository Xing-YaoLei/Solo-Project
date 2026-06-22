import React, { useState } from 'react'
import {
  Card,
  Descriptions,
  Button,
  Space,
  Row,
  Col,
  Table,
  Tabs,
  App as AntdApp,
  Modal,
  Form,
  Select,
  Input,
  Empty,
} from 'antd'
import {
  ArrowLeftOutlined,
  ReloadOutlined,
  FileTextOutlined,
  ToolOutlined,
  WarningOutlined,
  HistoryOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, Link } from '@tanstack/react-router'
import dayjs from 'dayjs'
import { samplingApi } from '@/api/sampling'
import { rectificationApi } from '@/api/rectification'
import { exceptionApi } from '@/api/exception'
import StatusTag from '@/components/StatusTag'
import RiskLevelTag from '@/components/RiskLevelTag'
import StatusTimeline from '@/components/StatusTimeline'
import { SamplingStatus, RectificationStatus, ExceptionStatus } from '@/types/enums'
import { StatusChangeLog, RectificationPlan } from '@/types'

interface SamplingDetailProps {
  id: number
}

const SamplingDetail: React.FC<SamplingDetailProps> = ({ id }) => {
  const navigate = useNavigate()
  const { message } = AntdApp.useApp()
  const queryClient = useQueryClient()
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [statusForm] = Form.useForm()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sampling-detail', id],
    queryFn: () => samplingApi.get(id),
  })

  const { data: statusLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['sampling-status-logs', id],
    queryFn: () => samplingApi.getStatusLogs(id, { skip: 0, limit: 100 }),
  })

  const { data: rectifications, isLoading: rectLoading } = useQuery({
    queryKey: ['sampling-rectifications', id],
    queryFn: () => rectificationApi.list({ samplingId: id, skip: 0, limit: 100 }),
  })

  const { data: exceptions, isLoading: excLoading } = useQuery({
    queryKey: ['sampling-exceptions', id],
    queryFn: () => exceptionApi.list({ samplingId: id, skip: 0, limit: 100 }),
  })

  const updateStatusMutation = useMutation({
    mutationFn: (params: { status: SamplingStatus; remark?: string }) =>
      samplingApi.updateStatus(id, { status: params.status, remark: params.remark }),
    onSuccess: () => {
      message.success('状态更新成功')
      setStatusModalOpen(false)
      statusForm.resetFields()
      queryClient.invalidateQueries({ queryKey: ['sampling-detail', id] })
      queryClient.invalidateQueries({ queryKey: ['sampling-status-logs', id] })
    },
    onError: () => message.error('状态更新失败'),
  })

  const handleStatusSubmit = async () => {
    try {
      const values = await statusForm.validateFields()
      updateStatusMutation.mutate(values)
    } catch {
    }
  }

  const rectificationColumns = [
    {
      title: '标题',
      dataIndex: 'title',
      render: (text: string, record: RectificationPlan) => (
        <Link to={`/rectification/$id/edit`} params={{ id: String(record.id) }}>
          {text}
        </Link>
      ),
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      width: 100,
      render: (val: string) => <RiskLevelTag level={val} />,
    },
    {
      title: '负责人',
      dataIndex: 'responsiblePerson',
      width: 100,
      render: (val?: string) => val || '-',
    },
    {
      title: '截止日期',
      dataIndex: 'deadline',
      width: 120,
      render: (val?: string) => (val ? dayjs(val).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (val: RectificationStatus) => <StatusTag status={val} />,
    },
  ]

  const exceptionColumns = [
    {
      title: '异常类型',
      dataIndex: 'exceptionType',
      width: 140,
      render: (val: string) => {
        const map: Record<string, string> = {
          evidence_missing: '证据缺失',
          non_compliance: '不合规',
          other: '其他',
        }
        return map[val] || val
      },
    },
    {
      title: '影响范围',
      dataIndex: 'impactScope',
      ellipsis: true,
      render: (val?: string) => val || '-',
    },
    {
      title: '责任人',
      dataIndex: 'responsiblePerson',
      width: 100,
      render: (val?: string) => val || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (val: ExceptionStatus) => <StatusTag status={val} />,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 160,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm'),
    },
  ]

  const tabItems = [
    {
      key: 'basic',
      label: (
        <span>
          <FileTextOutlined style={{ marginRight: 8 }} />
          基本信息
        </span>
      ),
      children: (
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="样本名称">{data?.sampleName}</Descriptions.Item>
          <Descriptions.Item label="样本编码">{data?.sampleCode}</Descriptions.Item>
          <Descriptions.Item label="关联检查清单ID">{data?.checklistId}</Descriptions.Item>
          <Descriptions.Item label="来源">{data?.source || '-'}</Descriptions.Item>
          <Descriptions.Item label="抽样日期">
            {data?.samplingDate ? dayjs(data.samplingDate).format('YYYY-MM-DD') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="抽样人">{data?.sampledBy || '-'}</Descriptions.Item>
          <Descriptions.Item label="状态">
            {data?.status ? <StatusTag status={data.status} /> : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="证据状态">
            {data?.evidenceStatus ? <StatusTag status={data.evidenceStatus} /> : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间" span={2}>
            {data?.createdAt ? dayjs(data.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
          </Descriptions.Item>
          {data?.sampleData && (
            <Descriptions.Item label="抽样数据" span={2}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 12 }}>
                {JSON.stringify(data.sampleData, null, 2)}
              </pre>
            </Descriptions.Item>
          )}
        </Descriptions>
      ),
    },
    {
      key: 'rectifications',
      label: (
        <span>
          <ToolOutlined style={{ marginRight: 8 }} />
          关联整改计划
        </span>
      ),
      children:
        rectifications?.items?.length ? (
          <Table
            rowKey="id"
            size="small"
            loading={rectLoading}
            columns={rectificationColumns}
            dataSource={rectifications.items}
            pagination={false}
          />
        ) : (
          <Empty description="暂无关联整改计划" style={{ padding: 24 }} />
        ),
    },
    {
      key: 'exceptions',
      label: (
        <span>
          <WarningOutlined style={{ marginRight: 8 }} />
          关联异常单
        </span>
      ),
      children:
        exceptions?.items?.length ? (
          <Table
            rowKey="id"
            size="small"
            loading={excLoading}
            columns={exceptionColumns}
            dataSource={exceptions.items}
            pagination={false}
          />
        ) : (
          <Empty description="暂无关联异常单" style={{ padding: 24 }} />
        ),
    },
    {
      key: 'timeline',
      label: (
        <span>
          <HistoryOutlined style={{ marginRight: 8 }} />
          状态变更时间线
        </span>
      ),
      children: <StatusTimeline logs={(statusLogs?.items || []) as StatusChangeLog[]} loading={logsLoading} />,
    },
  ]

  if (isLoading || !data) {
    return (
      <Card loading>
        <div />
      </Card>
    )
  }

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button
            icon={<ArrowLeftOutlined />}
            style={{ marginRight: 16 }}
            onClick={() => navigate({ to: '/sampling' })}
          >
            返回
          </Button>
          <h2 style={{ margin: 0 }}>抽样详情 - {data.sampleName}</h2>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            刷新
          </Button>
          <Button
            icon={<PlusOutlined />}
            onClick={() =>
              navigate({
                to: '/rectification/new',
                search: { samplingId: String(id) } as any,
              })
            }
          >
            新建整改计划
          </Button>
          <Button type="primary" onClick={() => setStatusModalOpen(true)}>
            状态变更
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card>
            <Tabs defaultActiveKey="basic" items={tabItems} />
          </Card>
        </Col>
      </Row>

      <Modal
        title="状态变更"
        open={statusModalOpen}
        onCancel={() => setStatusModalOpen(false)}
        onOk={handleStatusSubmit}
        confirmLoading={updateStatusMutation.isPending}
        destroyOnClose
      >
        <Form form={statusForm} layout="vertical">
          <Form.Item
            label="目标状态"
            name="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select
              placeholder="请选择目标状态"
              options={[
                { label: '待审核', value: SamplingStatus.PENDING },
                { label: '已审核', value: SamplingStatus.REVIEWED },
                { label: '需跟进', value: SamplingStatus.FOLLOW_UP },
              ]}
            />
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={3} placeholder="请输入备注（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default SamplingDetail
