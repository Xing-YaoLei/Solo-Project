import { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  Tag,
  Modal,
  Form,
  message,
  Spin,
  Progress,
  Popconfirm
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import {
  getSiteList,
  createSite,
  updateSite,
  deleteSite,
  getAreaList,
  getPersonInChargeList
} from '@/services/site'
import { getCustomerList } from '@/services/customer'
import type {
  ConstructionSite,
  ConstructionSiteQuery,
  ConstructionSiteCreate,
  ConstructionSiteUpdate,
  Area,
  PersonInCharge,
  CustomerProfile
} from '@/types'
import { SiteStatus, SiteStatusText } from '@/types'
import { formatDate } from '@/utils/date'

const { RangePicker } = DatePicker
const { Option } = Select

function SiteList() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ConstructionSite[]>([])
  const [total, setTotal] = useState(0)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [queryParams, setQueryParams] = useState<ConstructionSiteQuery>({})
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<ConstructionSite | null>(null)
  const [form] = Form.useForm()
  const [areas, setAreas] = useState<Area[]>([])
  const [persons, setPersons] = useState<PersonInCharge[]>([])
  const [customers, setCustomers] = useState<CustomerProfile[]>([])

  useEffect(() => {
    fetchData()
    fetchSelectData()
  }, [pagination.current, pagination.pageSize])

  const fetchData = async () => {
    setLoading(true)
    try {
      const result = await getSiteList({
        ...queryParams,
        pageIndex: pagination.current,
        pageSize: pagination.pageSize
      })
      setData(result.items)
      setTotal(result.totalCount)
    } catch (error) {
      message.error('获取工地列表失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSelectData = async () => {
    try {
      const [areaData, personData, customerData] = await Promise.all([
        getAreaList(),
        getPersonInChargeList(),
        getCustomerList({ pageIndex: 1, pageSize: 100 })
      ])
      setAreas(areaData)
      setPersons(personData)
      setCustomers(customerData.items)
    } catch (error) {
      console.error('获取下拉数据失败', error)
    }
  }

  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 })
    fetchData()
  }

  const handleReset = () => {
    setQueryParams({})
    setPagination({ current: 1, pageSize: 10 })
  }

  const handleAdd = () => {
    setEditingItem(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: ConstructionSite) => {
    setEditingItem(record)
    form.setFieldsValue({
      ...record,
      plannedStartDate: record.plannedStartDate ? dayjs(record.plannedStartDate) : undefined,
      plannedEndDate: record.plannedEndDate ? dayjs(record.plannedEndDate) : undefined,
      actualStartDate: record.actualStartDate ? dayjs(record.actualStartDate) : undefined,
      actualEndDate: record.actualEndDate ? dayjs(record.actualEndDate) : undefined,
      confirmationDeadline: record.confirmationDeadline ? dayjs(record.confirmationDeadline) : undefined
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteSite(id)
      message.success('删除成功')
      fetchData()
    } catch (error) {
      message.error('删除失败')
      console.error(error)
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const submitData = {
        ...values,
        plannedStartDate: values.plannedStartDate ? dayjs(values.plannedStartDate).format('YYYY-MM-DD') : undefined,
        plannedEndDate: values.plannedEndDate ? dayjs(values.plannedEndDate).format('YYYY-MM-DD') : undefined,
        actualStartDate: values.actualStartDate ? dayjs(values.actualStartDate).format('YYYY-MM-DD') : undefined,
        actualEndDate: values.actualEndDate ? dayjs(values.actualEndDate).format('YYYY-MM-DD') : undefined,
        confirmationDeadline: values.confirmationDeadline ? dayjs(values.confirmationDeadline).format('YYYY-MM-DD') : undefined
      }

      if (editingItem) {
        await updateSite({ ...submitData, id: editingItem.id } as ConstructionSiteUpdate)
        message.success('更新成功')
      } else {
        await createSite(submitData as ConstructionSiteCreate)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchData()
    } catch (error) {
      console.error(error)
    }
  }

  const getStatusColor = (status: SiteStatus) => {
    switch (status) {
      case SiteStatus.Pending:
        return 'default'
      case SiteStatus.InProgress:
        return 'processing'
      case SiteStatus.ToBeConfirmed:
        return 'warning'
      case SiteStatus.Confirmed:
        return 'success'
      case SiteStatus.Completed:
        return 'success'
      case SiteStatus.Closed:
        return 'default'
      default:
        return 'default'
    }
  }

  const columns = [
    {
      title: '工地名称',
      dataIndex: 'siteName',
      key: 'siteName',
      render: (text: string, record: ConstructionSite) => (
        <a onClick={() => navigate(`/sites/${record.id}`)}>{text}</a>
      )
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true
    },
    {
      title: '客户',
      dataIndex: 'customerName',
      key: 'customerName'
    },
    {
      title: '区域',
      dataIndex: 'areaName',
      key: 'areaName'
    },
    {
      title: '负责人',
      dataIndex: 'personInChargeName',
      key: 'personInChargeName'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: SiteStatus) => (
        <Tag color={getStatusColor(status)}>{SiteStatusText[status]}</Tag>
      )
    },
    {
      title: '资料完整率',
      dataIndex: 'materialCompleteRate',
      key: 'materialCompleteRate',
      render: (rate: number) => (
        <Progress percent={Math.round(rate)} size="small" />
      )
    },
    {
      title: '计划开工',
      dataIndex: 'plannedStartDate',
      key: 'plannedStartDate',
      render: (date: string) => formatDate(date)
    },
    {
      title: '计划完工',
      dataIndex: 'plannedEndDate',
      key: 'plannedEndDate',
      render: (date: string) => formatDate(date)
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: unknown, record: ConstructionSite) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/sites/${record.id}`)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除该工地吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '16px' }}>
          <Space wrap>
            <Input
              placeholder="工地名称"
              style={{ width: 200 }}
              allowClear
              value={queryParams.siteName}
              onChange={(e) => setQueryParams({ ...queryParams, siteName: e.target.value })}
              prefix={<SearchOutlined />}
            />
            <Input
              placeholder="客户名称"
              style={{ width: 150 }}
              allowClear
              value={queryParams.customerName}
              onChange={(e) => setQueryParams({ ...queryParams, customerName: e.target.value })}
            />
            <Select
              placeholder="状态"
              style={{ width: 120 }}
              allowClear
              value={queryParams.status}
              onChange={(value) => setQueryParams({ ...queryParams, status: value })}
            >
              {Object.entries(SiteStatusText).map(([key, text]) => (
                <Option key={key} value={Number(key)}>{text}</Option>
              ))}
            </Select>
            <Select
              placeholder="区域"
              style={{ width: 120 }}
              allowClear
              value={queryParams.areaId}
              onChange={(value) => setQueryParams({ ...queryParams, areaId: value })}
            >
              {areas.map((item) => (
                <Option key={item.id} value={item.id}>{item.name}</Option>
              ))}
            </Select>
            <Select
              placeholder="负责人"
              style={{ width: 120 }}
              allowClear
              value={queryParams.personInChargeId}
              onChange={(value) => setQueryParams({ ...queryParams, personInChargeId: value })}
            >
              {persons.map((item) => (
                <Option key={item.id} value={item.id}>{item.name}</Option>
              ))}
            </Select>
            <RangePicker
              placeholder={['开工日期起', '开工日期止']}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setQueryParams({
                    ...queryParams,
                    startDateFrom: dates[0].format('YYYY-MM-DD'),
                    startDateTo: dates[1].format('YYYY-MM-DD')
                  })
                } else {
                  setQueryParams({
                    ...queryParams,
                    startDateFrom: undefined,
                    startDateTo: undefined
                  })
                }
              }}
            />
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              搜索
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
          </Space>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新加工地
          </Button>
        </div>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条`,
              onChange: (page, pageSize) => {
                setPagination({ current: page, pageSize })
              }
            }}
          />
        </Spin>
      </Card>

      <Modal
        title={editingItem ? '编辑工地' : '新加工地'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
        okText="确定"
        cancelText="取消"
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ status: SiteStatus.Pending }}
        >
          <Form.Item
            name="siteName"
            label="工地名称"
            rules={[{ required: true, message: '请输入工地名称' }]}
          >
            <Input placeholder="请输入工地名称" />
          </Form.Item>
          <Form.Item
            name="address"
            label="地址"
            rules={[{ required: true, message: '请输入地址' }]}
          >
            <Input placeholder="请输入地址" />
          </Form.Item>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="customerId"
              label="客户"
              rules={[{ required: true, message: '请选择客户' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="请选择客户">
                {customers.map((item) => (
                  <Option key={item.id} value={item.id}>{item.customerName}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="areaId"
              label="区域"
              rules={[{ required: true, message: '请选择区域' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="请选择区域">
                {areas.map((item) => (
                  <Option key={item.id} value={item.id}>{item.name}</Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          <Form.Item
            name="personInChargeId"
            label="负责人"
            rules={[{ required: true, message: '请选择负责人' }]}
          >
            <Select placeholder="请选择负责人">
              {persons.map((item) => (
                <Option key={item.id} value={item.id}>{item.name} - {item.phone}</Option>
              ))}
            </Select>
          </Form.Item>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item name="status" label="状态" style={{ flex: 1 }}>
              <Select>
                {Object.entries(SiteStatusText).map(([key, text]) => (
                  <Option key={key} value={Number(key)}>{text}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="tagGroup" label="标签分组" style={{ flex: 1 }}>
              <Input placeholder="请输入标签分组" />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item name="plannedStartDate" label="计划开工日期" style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="plannedEndDate" label="计划完工日期" style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>
          {editingItem && (
            <div style={{ display: 'flex', gap: '16px' }}>
              <Form.Item name="actualStartDate" label="实际开工日期" style={{ flex: 1 }}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="actualEndDate" label="实际完工日期" style={{ flex: 1 }}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </div>
          )}
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item name="confirmationDeadline" label="确认截止日期" style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="budget" label="预算金额" style={{ flex: 1 }}>
              <Input placeholder="请输入预算金额" prefix="¥" />
            </Form.Item>
          </div>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default SiteList
