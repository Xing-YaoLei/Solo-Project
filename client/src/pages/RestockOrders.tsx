import { useState, useEffect } from 'react'
import { Table, Button, Input, Select, DatePicker, Form, Space, Tag, Drawer, Descriptions } from 'antd'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import { getRestockOrders, getRestockOrderById, getStores } from '@/api/business'
import { useUserStore } from '@/store/user'
import { UserRole } from '@/types'
import type { RestockOrder, Store, RestockOrderQuery } from '@/types'
import type { TableProps } from 'antd'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { Option } = Select

const RestockOrders = () => {
  const { hasRole } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<RestockOrder[]>([])
  const [total, setTotal] = useState(0)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 })
  const [query, setQuery] = useState<RestockOrderQuery>({})
  const [stores, setStores] = useState<Store[]>([])
  const [detailVisible, setDetailVisible] = useState(false)
  const [detail, setDetail] = useState<any>(null)

  useEffect(() => {
    fetchStores()
  }, [])

  useEffect(() => {
    fetchData()
  }, [pagination.current, pagination.pageSize, query])

  const fetchStores = async () => {
    try {
      const data = await getStores()
      setStores(data)
    } catch (error) {
      console.error('Fetch stores error:', error)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const result = await getRestockOrders({
        ...query,
        pageIndex: pagination.current,
        pageSize: pagination.pageSize,
      })
      setData(result.items)
      setTotal(result.totalCount)
    } catch (error) {
      console.error('Fetch restock orders error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (values: any) => {
    const newQuery: RestockOrderQuery = {}
    if (values.keyword) newQuery.keyword = values.keyword
    if (values.storeId) newQuery.storeId = values.storeId
    if (values.status) newQuery.status = values.status
    if (values.dateRange) {
      newQuery.startDate = values.dateRange[0].format('YYYY-MM-DD')
      newQuery.endDate = values.dateRange[1].format('YYYY-MM-DD')
    }
    setQuery(newQuery)
    setPagination((prev) => ({ ...prev, current: 1 }))
  }

  const handleReset = () => {
    setQuery({})
    setPagination((prev) => ({ ...prev, current: 1 }))
  }

  const handleViewDetail = async (id: number) => {
    try {
      const data = await getRestockOrderById(id)
      setDetail(data)
      setDetailVisible(true)
    } catch (error) {
      console.error('Fetch detail error:', error)
    }
  }

  const columns: TableProps<RestockOrder>['columns'] = [
    {
      title: '补货单号',
      dataIndex: 'orderNo',
      width: 160,
      render: (text, record) => (
        <a onClick={() => handleViewDetail(record.id)}>{text}</a>
      ),
    },
    { title: '门店', dataIndex: 'storeName', width: 140 },
    {
      title: '关联处方',
      dataIndex: 'prescriptionNo',
      width: 160,
      render: (text) => text || '-',
    },
    { title: '补货日期', dataIndex: 'orderDate', width: 120, render: (t) => dayjs(t).format('YYYY-MM-DD') },
    { title: '商品种数', dataIndex: 'itemCount', width: 100, render: (v) => `${v} 种` },
    {
      title: '总金额',
      dataIndex: 'totalAmount',
      width: 120,
      render: (v: number) => `¥${v.toFixed(2)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status) => {
        const colorMap: Record<string, string> = {
          已完成: 'success',
          处理中: 'processing',
          待处理: 'default',
        }
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>
      },
    },
    { title: '操作人', dataIndex: 'operatorName', width: 100 },
    { title: '创建时间', dataIndex: 'createdAt', width: 160, render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => handleViewDetail(record.id)}>
          详情
        </Button>
      ),
    },
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">补货单核对</div>
        <Button icon={<ReloadOutlined />} onClick={fetchData}>
          刷新
        </Button>
      </div>

      <div className="filter-section">
        <Form layout="inline" onFinish={handleSearch}>
          <Form.Item name="keyword" label="关键词">
            <Input placeholder="补货单号" style={{ width: 200 }} allowClear />
          </Form.Item>
          {hasRole([UserRole.Headquarters, UserRole.StoreManager]) && (
            <Form.Item name="storeId" label="门店">
              <Select placeholder="全部" style={{ width: 160 }} allowClear>
                {stores.map((s) => (
                  <Option key={s.id} value={s.id}>
                    {s.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}
          <Form.Item name="status" label="状态">
            <Select placeholder="全部" style={{ width: 140 }} allowClear>
              <Option value="待处理">待处理</Option>
              <Option value="处理中">处理中</Option>
              <Option value="已完成">已完成</Option>
            </Select>
          </Form.Item>
          <Form.Item name="dateRange" label="日期范围">
            <RangePicker />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                查询
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={data}
        pagination={{
          ...pagination,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
        onChange={(pag) =>
          setPagination({ current: pag.current || 1, pageSize: pag.pageSize || 20 })
        }
        scroll={{ x: 1200 }}
        size="middle"
      />

      <Drawer
        title="补货单详情"
        width={720}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {detail && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Descriptions title="基本信息" column={2} bordered size="small">
              <Descriptions.Item label="补货单号">{detail.orderNo}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag>{detail.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="门店">{detail.storeName}</Descriptions.Item>
              <Descriptions.Item label="关联处方">
                {detail.prescriptionNo || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="补货日期">
                {dayjs(detail.orderDate).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="操作人">{detail.operatorName}</Descriptions.Item>
              <Descriptions.Item label="商品种数">{detail.itemCount} 种</Descriptions.Item>
              <Descriptions.Item label="总金额">
                ¥{detail.totalAmount.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>
                {detail.remark || '-'}
              </Descriptions.Item>
            </Descriptions>

            <div>
              <h4 style={{ marginBottom: 12 }}>商品明细</h4>
              <Table
                rowKey="id"
                dataSource={detail.items}
                size="small"
                bordered
                pagination={false}
                columns={[
                  { title: '药品名称', dataIndex: 'drugName' },
                  { title: '规格', dataIndex: 'specification', width: 120 },
                  { title: '数量', dataIndex: 'quantity', width: 80 },
                  { title: '单位', dataIndex: 'unit', width: 60 },
                  { title: '单价', dataIndex: 'price', width: 100, render: (v) => `¥${v.toFixed(2)}` },
                  { title: '金额', dataIndex: 'amount', width: 100, render: (v) => `¥${v.toFixed(2)}` },
                  { title: '批号', dataIndex: 'batchNo', width: 120 },
                  {
                    title: '有效期',
                    dataIndex: 'expireDate',
                    width: 120,
                    render: (v) => (v ? dayjs(v).format('YYYY-MM-DD') : '-'),
                  },
                ]}
              />
            </div>
          </Space>
        )}
      </Drawer>
    </div>
  )
}

export default RestockOrders
