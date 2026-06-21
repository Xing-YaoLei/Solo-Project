import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Table,
  Button,
  Select,
  Input,
  Space,
  Tag,
  Modal,
  Form,
  Card,
  message,
  Tooltip,
} from 'antd'
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { useEffect, useState } from 'react'
import type { ApprovalNode } from '../../types'
import { approvalsApi, quotesApi } from '../../api'
import {
  formatDateTime,
  approvalStatusOptions,
  getApprovalStatusLabel,
} from '../../utils/format'

export const Route = createFileRoute('/_layout/approvals')({
  component: ApprovalsPage,
})

function ApprovalsPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ApprovalNode[]>([])
  const [total, setTotal] = useState(0)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20 })
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [filters, setFilters] = useState({
    status: undefined as string | undefined,
    keyword: '',
  })
  const [actionModal, setActionModal] = useState<{
    visible: boolean
    node: ApprovalNode | null
    action: 'approve' | 'reject'
  }>({ visible: false, node: null, action: 'approve' })
  const [actionForm] = Form.useForm()
  const [createFlowVisible, setCreateFlowVisible] = useState(false)
  const [flowForm] = Form.useForm()
  const [users, setUsers] = useState<Array<{ id: string; full_name: string }>>([])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await approvalsApi.list({
        page: pagination.page,
        page_size: pagination.pageSize,
        status: filters.status,
      })
      setData(res.items)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    loadUsers()
  }, [pagination, filters])

  const loadUsers = async () => {
    try {
      const { authApi } = await import('../../api')
      const res = await authApi.listUsers({ page_size: 100 })
      setUsers(res.items.map((u) => ({ id: u.id, full_name: u.full_name })))
    } catch {}
  }

  const handleAction = async () => {
    if (!actionModal.node) return
    try {
      const values = await actionForm.validateFields()
      await approvalsApi.action(actionModal.node.id, {
        status: actionModal.action === 'approve' ? 'approved' : 'rejected',
        comment: values.comment,
      })
      message.success(actionModal.action === 'approve' ? '已通过' : '已驳回')
      setActionModal({ visible: false, node: null, action: 'approve' })
      actionForm.resetFields()
      loadData()
    } catch (error: any) {
      message.error(error?.response?.data?.detail || '操作失败')
    }
  }

  const handleBatchAction = async (action: 'approve' | 'reject') => {
    Modal.confirm({
      title: `批量${action === 'approve' ? '通过' : '驳回'}`,
      content: `确定要${action === 'approve' ? '通过' : '驳回'}选中的 ${selectedRowKeys.length} 条审批吗？`,
      onOk: async () => {
        try {
          await approvalsApi.batchAction({
            node_ids: selectedRowKeys as string[],
            status: action === 'approve' ? 'approved' : 'rejected',
          })
          message.success('批量操作成功')
          setSelectedRowKeys([])
          loadData()
        } catch (error: any) {
          message.error(error?.response?.data?.detail || '操作失败')
        }
      },
    })
  }

  const handleCreateFlow = async () => {
    try {
      const values = await flowForm.validateFields()
      const nodes = [
        {
          quote_id: values.quote_id,
          approver_id: values.first_approver,
          node_order: 1,
          node_name: '一级审批',
        },
        ...(values.second_approver
          ? [
              {
                quote_id: values.quote_id,
                approver_id: values.second_approver,
                node_order: 2,
                node_name: '二级审批',
              },
            ]
          : []),
        ...(values.third_approver
          ? [
              {
                quote_id: values.quote_id,
                approver_id: values.third_approver,
                node_order: 3,
                node_name: '三级审批',
              },
            ]
          : []),
      ]
      await approvalsApi.createFlow({ quote_id: values.quote_id, nodes })
      message.success('审批流程创建成功')
      setCreateFlowVisible(false)
      flowForm.resetFields()
      loadData()
    } catch (error: any) {
      message.error(error?.response?.data?.detail || '创建失败')
    }
  }

  const columns = [
    {
      title: '审批节点',
      dataIndex: 'node_name',
      width: 120,
    },
    {
      title: '报价单',
      dataIndex: 'quote_id',
      width: 180,
      render: (v: string) => (
        <Button
          type="link"
          icon={<FileTextOutlined />}
          onClick={() => navigate({ to: '/quotes/$id', params: { id: v } })}
        >
          查看报价单
        </Button>
      ),
    },
    { title: '审批人', dataIndex: 'approver_name', width: 120 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: string) => {
        const opt = approvalStatusOptions.find((o) => o.value === v)
        return <Tag color={opt?.color as any}>{getApprovalStatusLabel(v)}</Tag>
      },
    },
    { title: '审批意见', dataIndex: 'comment', ellipsis: true },
    {
      title: '审批时间',
      dataIndex: 'approved_at',
      width: 160,
      render: (v: string) => (v ? formatDateTime(v) : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: unknown, record: ApprovalNode) => (
        <Space size="small">
          <Tooltip title="通过">
            <Button
              type="link"
              size="small"
              icon={<CheckOutlined />}
              disabled={record.status !== 'pending'}
              onClick={() =>
                setActionModal({ visible: true, node: record, action: 'approve' })
              }
            >
              通过
            </Button>
          </Tooltip>
          <Tooltip title="驳回">
            <Button
              type="link"
              size="small"
              danger
              icon={<CloseOutlined />}
              disabled={record.status !== 'pending'}
              onClick={() =>
                setActionModal({ visible: true, node: record, action: 'reject' })
              }
            >
              驳回
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">审批工作台</h2>
        <Button type="primary" onClick={() => setCreateFlowVisible(true)}>
          发起审批
        </Button>
      </div>

      <Card style={{ borderRadius: 8 }}>
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <Input
              allowClear
              placeholder="搜索"
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            />
            <Select
              allowClear
              placeholder="状态"
              style={{ width: 140 }}
              options={approvalStatusOptions}
              value={filters.status}
              onChange={(v) => setFilters({ ...filters, status: v })}
            />
            <Button icon={<ReloadOutlined />} onClick={loadData}>
              刷新
            </Button>
          </div>
          <div className="table-toolbar-right">
            {selectedRowKeys.length > 0 && (
              <>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleBatchAction('approve')}
                >
                  批量通过
                </Button>
                <Button danger onClick={() => handleBatchAction('reject')}>
                  批量驳回
                </Button>
              </>
            )}
          </div>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (page, pageSize) => setPagination({ page, pageSize }),
          }}
        />
      </Card>

      <Modal
        title={actionModal.action === 'approve' ? '审批通过' : '审批驳回'}
        open={actionModal.visible}
        onOk={handleAction}
        onCancel={() => {
          setActionModal({ visible: false, node: null, action: 'approve' })
          actionForm.resetFields()
        }}
      >
        <Form form={actionForm} layout="vertical">
          <Form.Item
            name="comment"
            label={actionModal.action === 'approve' ? '通过意见' : '驳回原因'}
            rules={
              actionModal.action === 'reject'
                ? [{ required: true, message: '请填写驳回原因' }]
                : []
            }
          >
            <Input.TextArea rows={3} placeholder="请填写审批意见" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="发起审批流程"
        open={createFlowVisible}
        onOk={handleCreateFlow}
        onCancel={() => {
          setCreateFlowVisible(false)
          flowForm.resetFields()
        }}
        width={520}
      >
        <Form form={flowForm} layout="vertical">
          <Form.Item
            label="选择报价单"
            name="quote_id"
            rules={[{ required: true, message: '请选择报价单' }]}
          >
            <Select
              showSearch
              placeholder="搜索报价单"
              optionFilterProp="label"
              options={async () => {
                try {
                  const res = await quotesApi.list({ page_size: 100 })
                  return res.items.map((q) => ({
                    value: q.id,
                    label: `${q.quote_no} - ${q.title} (${q.client_name})`,
                  }))
                } catch {
                  return []
                }
              }}
            />
          </Form.Item>
          <Form.Item
            label="一级审批人"
            name="first_approver"
            rules={[{ required: true, message: '请选择审批人' }]}
          >
            <Select
              options={users.map((u) => ({ value: u.id, label: u.full_name }))}
              placeholder="请选择"
            />
          </Form.Item>
          <Form.Item label="二级审批人（可选）" name="second_approver">
            <Select
              allowClear
              options={users.map((u) => ({ value: u.id, label: u.full_name }))}
              placeholder="请选择"
            />
          </Form.Item>
          <Form.Item label="三级审批人（可选）" name="third_approver">
            <Select
              allowClear
              options={users.map((u) => ({ value: u.id, label: u.full_name }))}
              placeholder="请选择"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
