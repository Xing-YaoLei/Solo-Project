import { useState } from 'react'
import {
  Card,
  Descriptions,
  Tag,
  Typography,
  Button,
  Tabs,
  Table,
  Space,
  Spin,
  Alert,
  Progress,
  Statistic,
  Row,
  Col,
} from 'antd'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeftOutlined,
  EditOutlined,
  FileTextOutlined,
  MoneyCollectOutlined,
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { projectApi } from '@/api'
import {
  formatCurrency,
  documentStatusColors,
  documentStatusLabels,
  documentTypeLabels,
  amountConsistencyColors,
  amountConsistencyLabels,
  paymentStatusColors,
  paymentStatusLabels,
  userRoleLabels,
} from '@/config/status'
import { DocumentStatus, AmountConsistencyStatus, PaymentStatus, DocumentType } from '@/types'
import type { ColumnsType } from 'antd/es/table'
import type { DocumentItem, Payment } from '@/types'

const { Title, Text } = Typography

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('info')

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectApi.getProject(id!),
    enabled: !!id,
  })

  const { data: documents } = useQuery({
    queryKey: ['project', id, 'documents'],
    queryFn: () => projectApi.getProjectDocuments(id!),
    enabled: !!id && activeTab === 'documents',
  })

  const { data: payments } = useQuery({
    queryKey: ['project', id, 'payments'],
    queryFn: () => projectApi.getProjectPayments(id!),
    enabled: !!id && activeTab === 'payments',
  })

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (error || !project) {
    return <Alert type="error" message="加载项目详情失败，请稍后重试" />
  }

  const paymentProgress = project.totalBudget > 0 ? (project.paidAmount / project.totalBudget) * 100 : 0

  const documentColumns: ColumnsType<DocumentItem> = [
    {
      title: '单据编号',
      dataIndex: 'documentNumber',
      key: 'documentNumber',
      width: 140,
      render: (text, record) => (
        <Button type="link" onClick={() => navigate(`/documents/${(record as any).id}`)}>
          {text}
        </Button>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type) => documentTypeLabels[type as DocumentType] || type,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '预期金额',
      dataIndex: 'expectedAmount',
      key: 'expectedAmount',
      width: 130,
      render: (value) => formatCurrency(value),
    },
    {
      title: '实际金额',
      dataIndex: 'actualAmount',
      key: 'actualAmount',
      width: 130,
      render: (value) => (value ? formatCurrency(value) : '-'),
    },
    {
      title: '金额一致性',
      dataIndex: 'amountConsistency',
      key: 'amountConsistency',
      width: 120,
      render: (status) =>
        status ? (
          <Tag color={amountConsistencyColors[status as AmountConsistencyStatus]}>
            {amountConsistencyLabels[status as AmountConsistencyStatus]}
          </Tag>
        ) : (
          '-'
        ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => <Tag color={documentStatusColors[status as DocumentStatus]}>{documentStatusLabels[status as DocumentStatus]}</Tag>,
    },
    {
      title: '创建日期',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) => dayjs(date).format('YYYY-MM-DD'),
    },
  ]

  const paymentColumns: ColumnsType<Payment> = [
    {
      title: '付款编号',
      dataIndex: 'paymentNumber',
      key: 'paymentNumber',
      width: 140,
    },
    {
      title: '类型',
      dataIndex: 'paymentType',
      key: 'paymentType',
      width: 100,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 130,
      render: (value) => <Text strong>{formatCurrency(value)}</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => <Tag color={paymentStatusColors[status as PaymentStatus]}>{paymentStatusLabels[status as PaymentStatus]}</Tag>,
    },
    {
      title: '付款方式',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 100,
    },
    {
      title: '付款日期',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      width: 120,
      render: (date) => (date ? dayjs(date).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '关联单据',
      dataIndex: 'documentNumber',
      key: 'documentNumber',
      width: 140,
      render: (text, record) =>
        text ? (
          <Button type="link" onClick={() => navigate(`/documents/${record.documentId}`)}>
            {text}
          </Button>
        ) : (
          '-'
        ),
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      ellipsis: true,
    },
  ]

  const tabItems = [
    {
      key: 'info',
      label: '基本信息',
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="总预算"
                  value={project.totalBudget}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="已支付"
                  value={project.paidAmount}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="待支付"
                  value={project.remainingAmount}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
          </Row>

          <Card title="支付进度">
            <Progress
              percent={paymentProgress}
              format={(percent) => `${percent?.toFixed(1)}%`}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
              <Text type="secondary">已支付: {formatCurrency(project.paidAmount)}</Text>
              <Text type="secondary">剩余: {formatCurrency(project.remainingAmount)}</Text>
            </div>
          </Card>

          <Card title="项目详情">
            <Descriptions column={2} bordered size="middle">
              <Descriptions.Item label="项目编号">{project.projectNumber}</Descriptions.Item>
              <Descriptions.Item label="项目名称">{project.name}</Descriptions.Item>
              <Descriptions.Item label="项目地址" span={2}>
                {project.address}
              </Descriptions.Item>
              <Descriptions.Item label="项目描述" span={2}>
                {project.description || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="项目状态">
                <Tag color={documentStatusColors[project.status]}>{documentStatusLabels[project.status]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="开始日期">
                {dayjs(project.startDate).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="预计完成日期">
                {project.expectedEndDate ? dayjs(project.expectedEndDate).format('YYYY-MM-DD') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="实际完成日期">
                {project.actualEndDate ? dayjs(project.actualEndDate).format('YYYY-MM-DD') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="业主">
                {project.ownerName} ({userRoleLabels.Owner})
              </Descriptions.Item>
              <Descriptions.Item label="设计师">
                {project.designerName ? `${project.designerName} (${userRoleLabels.Designer})` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="工长">
                {project.foremanName ? `${project.foremanName} (${userRoleLabels.Foreman})` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="监理">
                {project.supervisorName ? `${project.supervisorName} (${userRoleLabels.Supervisor})` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="单据总数">{project.documentCount}</Descriptions.Item>
              <Descriptions.Item label="待审批数">
                {project.pendingApprovals > 0 ? (
                  <Tag color="orange">{project.pendingApprovals}</Tag>
                ) : (
                  '0'
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Space>
      ),
    },
    {
      key: 'documents',
      label: (
        <span>
          <FileTextOutlined /> 相关单据 ({(documents as any)?.items?.length || 0})
        </span>
      ),
      children: (
        <Table
          columns={documentColumns}
          dataSource={(documents as any)?.items || []}
          rowKey="id"
          loading={!documents}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      ),
    },
    {
      key: 'payments',
      label: (
        <span>
          <MoneyCollectOutlined /> 款项记录 ({(payments as any)?.items?.length || 0})
        </span>
      ),
      children: (
        <Table
          columns={paymentColumns}
          dataSource={(payments as any)?.items || []}
          rowKey="id"
          loading={!payments}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/projects')}>
            返回列表
          </Button>
          <Title level={3} style={{ margin: 0 }}>
            {project.name}
          </Title>
          <Tag color={documentStatusColors[project.status]}>{documentStatusLabels[project.status]}</Tag>
        </Space>
        <Space>
          <Button icon={<EditOutlined />}>编辑项目</Button>
          <Button type="primary" icon={<FileTextOutlined />}>
            新建单据
          </Button>
        </Space>
      </div>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Card>
    </div>
  )
}

export default ProjectDetailPage
