import { useState, useEffect } from 'react'
import { Table, Button, Space, Tag } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { getStores } from '@/api/business'
import type { Store } from '@/types'
import type { TableProps } from 'antd'
import dayjs from 'dayjs'

const Stores = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<Store[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const result = await getStores()
      setData(result)
    } catch (error) {
      console.error('Fetch stores error:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns: TableProps<Store>['columns'] = [
    { title: '门店编码', dataIndex: 'code', width: 120 },
    { title: '门店名称', dataIndex: 'name', width: 180 },
    { title: '地址', dataIndex: 'address' },
    { title: '联系电话', dataIndex: 'phone', width: 140 },
    {
      title: '状态',
      dataIndex: 'isActive',
      width: 100,
      render: (isActive) => (
        <Tag color={isActive ? 'success' : 'default'}>{isActive ? '营业中' : '已关闭'}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 160,
      render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">门店管理</div>
        <Button icon={<ReloadOutlined />} onClick={fetchData}>
          刷新
        </Button>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={data}
        pagination={false}
        size="middle"
      />
    </div>
  )
}

export default Stores
