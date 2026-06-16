import { useState, useEffect } from 'react'
import { Table, Button, Input, Select, DatePicker, Form, Space, Tag, Drawer, Descriptions } from 'antd'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import { getInsuranceRecords, getInsuranceRecordById, getStores } from '@/api/business'
import { useUserStore } from '@/store/user'
import { UserRole } from '@/types'
import type { InsuranceRecord, Store, InsuranceRecordQuery } from '@/types'
import type { TableProps } from 'antd'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { Option } = Select

const InsuranceRecords = () => {
  const { hasRole } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<InsuranceRecord[]>([])
  const [total, setTotal] = useState(0)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 })
  const [query, setQuery] = useState<InsuranceRecordQuery>({})
  const [stores, setStores] = useState<Store[]>([])
  const [detailVisible, setDetailVisible] = useState(false)
  const [detail, setDetail] = useState<InsuranceRecord | null>(null)

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
      const result = await getInsuranceRecords({
        ...query,
        pageIndex: pagination.current,
        pageSize: pagination.pageSize,
      })
      setData(result.items)
      setTotal(result.totalCount)
    } catch (error) {
      console.error('Fetch insurance records error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (values: any) => {
    const newQuery: InsuranceRecordQuery = {}
    if (values.keyword) newQuery.keyword = values.keyword
    if (values.storeId) newQuery.storeId = values.storeId
    if (values.status) newQuery.status = values.status
    if (values.patientName) newQuery.patientName = values.patientName
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
      const data = await getInsuranceRecordById(id)
      setDetail(data)
      setDetailVisible(true)
    } catch (error) {
      console.error('Fetch detail error:', error)
    }
  }

  const columns: TableProps<InsuranceRecord>['columns'] = [
    {
      title: '流水单号',
      dataIndex: 'recordNo',
      width: 160,
      render: (text, record) => (
        <a onClick={() => handleViewDetail(record.id)}>{text}</a>
      ),
    },
    { title: '患者姓名', dataIndex: 'patientName', width: 100 },
    { title: '身份证号', dataIndex: 'idCard', width: 160 },
    { title: '医保卡号', dataIndex: 'insuranceCardNo', width: 140 },
    { title: '门店', dataIndex: 'storeName', width: 140 },
    {
      title: '关联处方',
      dataIndex: 'prescriptionNo',
      width: 140,
      render: (text) => text || '-',
    },
    {
      title: '交易日期',
      dataIndex: 'tradeDate',
      width: 120,
      render: (t) => dayjs(t).format('YYYY-MM-DD'),
    },
    {
      title: '总金额',
      dataIndex: 'totalAmount',
      width: 100,
      render: (v: number) => `¥${v.toFixed(2)}`,
    },
    {
      title: '医保支付',
      dataIndex: 'insurancePay',
      width: 100,
      render: (v: number) => `¥${v.toFixed(2)}`,
    },
    {
      title: '自付金额',
      dataIndex: 'selfPay',
      width: 100,
      render: (v: number) => `¥${v.toFixed(2)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status) => {
        const colorMap: Record<string, string> = {
          已结算: 'success',
          待对账: 'processing',
        }
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
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
        <div className="page-title">医保流水</div>
        <Button icon={<ReloadOutlined />} onClick={fetchData}>
          刷新
        </Button>
      </div>

      <div className="filter-section">
        <Form layout="inline" onFinish={handleSearch}>
          <Form.Item name="keyword" label="关键词">
            <Input placeholder="流水单号" style={{ width: 180 }} allowClear />
          </Form.Item>
          <Form.Item name="patientName" label="患者姓名">
            <Input placeholder="请输入" style={{ width: 120 }} allowClear />
          </Form.Item>
          {hasRole([UserRole.Headquarters, UserRole.StoreManager]) && (
            <Form.Item name="storeId" label="门店">
              <Select placeholder="全部" style={{ width: 140 }} allowClear>
                {stores.map((s) => (
                  <Option key={s.id} value={s.id}>
                    {s.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}
          <Form.Item name="status" label="状态">
            <Select placeholder="全部" style={{ width: 120 }} allowClear>
              <Option value="已结算">已结算</Option>
              <Option value="待对账">待对账</Option>
            </Select>
          </Form.Item>
          <Form.Item name="dateRange" label="交易日期">
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
        scroll={{ x: 1400 }}
        size="middle"
      />

      <Drawer
        title="医保流水详情"
        width={600}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {detail && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="流水单号">{detail.recordNo}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag>{detail.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="患者姓名">{detail.patientName}</Descriptions.Item>
            <Descriptions.Item label="身份证号">{detail.idCard}</Descriptions.Item>
            <Descriptions.Item label="医保卡号">{detail.insuranceCardNo}</Descriptions.Item>
            <Descriptions.Item label="门店">{detail.storeName}</Descriptions.Item>
            <Descriptions.Item label="关联处方">
              {detail.prescriptionNo || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="交易日期">
              {dayjs(detail.tradeDate).format('YYYY-MM-DD')}
            </Descriptions.Item>
            <Descriptions.Item label="交易类型">{detail.tradeType}</Descriptions.Item>
            <Descriptions.Item label="总金额">
              <strong style={{ color: '#1677ff' }}>¥{detail.totalAmount.toFixed(2)}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="医保支付">¥{detail.insurancePay.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="自付金额">¥{detail.selfPay.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="备注">{detail.remark || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  )
}

export default InsuranceRecords
