import { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Select,
  DatePicker,
  Progress,
  message,
  Spin,
  Row,
  Col,
  Statistic,
  Tabs
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  AreaChartOutlined,
  BarChartOutlined,
  FileTextOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import {
  getMaterialCompleteRateList,
  getAreaStatistics,
  getPersonStatistics,
  getMaterialStatistics,
  exportReviewReport
} from '@/services/statistics'
import { getAreaList, getPersonInChargeList } from '@/services/site'
import type {
  MaterialCompleteRate,
  AreaStatistics,
  PersonStatistics,
  MaterialStatistics,
  ReviewQuery,
  Area,
  PersonInCharge
} from '@/types'


const { RangePicker } = DatePicker
const { Option } = Select
const { TabPane } = Tabs

function Review() {
  const [loading, setLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [rateData, setRateData] = useState<MaterialCompleteRate[]>([])
  const [areaData, setAreaData] = useState<AreaStatistics[]>([])
  const [personData, setPersonData] = useState<PersonStatistics[]>([])
  const [materialData, setMaterialData] = useState<MaterialStatistics[]>([])
  const [total, setTotal] = useState(0)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [queryParams, setQueryParams] = useState<ReviewQuery>({})
  const [areas, setAreas] = useState<Area[]>([])
  const [persons, setPersons] = useState<PersonInCharge[]>([])
  const [activeTab, setActiveTab] = useState('rate')

  useEffect(() => {
    fetchSelectData()
  }, [])

  useEffect(() => {
    if (activeTab === 'rate') {
      fetchRateData()
    } else if (activeTab === 'area') {
      fetchAreaData()
    } else if (activeTab === 'person') {
      fetchPersonData()
    } else if (activeTab === 'material') {
      fetchMaterialData()
    }
  }, [activeTab, pagination.current, pagination.pageSize, queryParams])

  const fetchSelectData = async () => {
    try {
      const [areaData, personData] = await Promise.all([
        getAreaList(),
        getPersonInChargeList()
      ])
      setAreas(areaData)
      setPersons(personData)
    } catch (error) {
      console.error('获取下拉数据失败', error)
    }
  }

  const fetchRateData = async () => {
    setLoading(true)
    try {
      const result = await getMaterialCompleteRateList({
        ...queryParams,
        pageIndex: pagination.current,
        pageSize: pagination.pageSize
      })
      setRateData(result.items)
      setTotal(result.totalCount)
    } catch (error) {
      message.error('获取资料完整率数据失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAreaData = async () => {
    setLoading(true)
    try {
      const data = await getAreaStatistics(queryParams)
      setAreaData(data)
    } catch (error) {
      message.error('获取区域统计数据失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPersonData = async () => {
    setLoading(true)
    try {
      const data = await getPersonStatistics(queryParams)
      setPersonData(data)
    } catch (error) {
      message.error('获取负责人统计数据失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMaterialData = async () => {
    setLoading(true)
    try {
      const data = await getMaterialStatistics(queryParams)
      setMaterialData(data)
    } catch (error) {
      message.error('获取材料统计数据失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 })
    if (activeTab === 'rate') {
      fetchRateData()
    } else if (activeTab === 'area') {
      fetchAreaData()
    } else if (activeTab === 'person') {
      fetchPersonData()
    } else if (activeTab === 'material') {
      fetchMaterialData()
    }
  }

  const handleReset = () => {
    setQueryParams({})
    setPagination({ current: 1, pageSize: 10 })
  }

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const blob = await exportReviewReport(queryParams)
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `资料复盘报告_${dayjs().format('YYYYMMDD')}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      message.success('导出成功')
    } catch (error) {
      message.error('导出失败')
      console.error(error)
    } finally {
      setExportLoading(false)
    }
  }

  const getProgressColor = (rate: number) => {
    if (rate >= 90) return '#52c41a'
    if (rate >= 70) return '#faad14'
    return '#f5222d'
  }

  const rateColumns = [
    {
      title: '工地名称',
      dataIndex: 'siteName',
      key: 'siteName'
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
      title: '应提交',
      dataIndex: 'totalRequiredCount',
      key: 'totalRequiredCount',
      width: 100
    },
    {
      title: '已提交',
      dataIndex: 'submittedCount',
      key: 'submittedCount',
      width: 100
    },
    {
      title: '已通过',
      dataIndex: 'approvedCount',
      key: 'approvedCount',
      width: 100
    },
    {
      title: '缺失',
      dataIndex: 'missingCount',
      key: 'missingCount',
      width: 100,
      render: (count: number) => (
        <span style={{ color: count > 0 ? '#f5222d' : 'inherit' }}>{count}</span>
      )
    },
    {
      title: '完整率',
      dataIndex: 'completeRate',
      key: 'completeRate',
      width: 200,
      render: (rate: number) => (
        <Progress
          percent={Math.round(rate)}
          size="small"
          strokeColor={getProgressColor(rate)}
          format={(percent) => `${percent}%`}
        />
      )
    },
    {
      title: '通过率',
      dataIndex: 'approvedRate',
      key: 'approvedRate',
      width: 200,
      render: (rate: number) => (
        <Progress
          percent={Math.round(rate)}
          size="small"
          strokeColor="#52c41a"
          format={(percent) => `${percent}%`}
        />
      )
    }
  ]

  const areaColumns = [
    {
      title: '区域',
      dataIndex: 'areaName',
      key: 'areaName'
    },
    {
      title: '工地数量',
      dataIndex: 'siteCount',
      key: 'siteCount',
      width: 120
    },
    {
      title: '平均完整率',
      dataIndex: 'avgCompleteRate',
      key: 'avgCompleteRate',
      width: 250,
      render: (rate: number) => (
        <Progress
          percent={Math.round(rate)}
          size="small"
          strokeColor={getProgressColor(rate)}
          format={(percent) => `${percent}%`}
        />
      )
    },
    {
      title: '缺失材料总数',
      dataIndex: 'missingMaterialCount',
      key: 'missingMaterialCount',
      render: (count: number) => (
        <span style={{ color: count > 0 ? '#f5222d' : 'inherit' }}>{count}</span>
      )
    }
  ]

  const personColumns = [
    {
      title: '负责人',
      dataIndex: 'personName',
      key: 'personName'
    },
    {
      title: '工地数量',
      dataIndex: 'siteCount',
      key: 'siteCount',
      width: 120
    },
    {
      title: '平均完整率',
      dataIndex: 'avgCompleteRate',
      key: 'avgCompleteRate',
      width: 250,
      render: (rate: number) => (
        <Progress
          percent={Math.round(rate)}
          size="small"
          strokeColor={getProgressColor(rate)}
          format={(percent) => `${percent}%`}
        />
      )
    },
    {
      title: '缺失材料总数',
      dataIndex: 'missingMaterialCount',
      key: 'missingMaterialCount',
      render: (count: number) => (
        <span style={{ color: count > 0 ? '#f5222d' : 'inherit' }}>{count}</span>
      )
    }
  ]

  const materialColumns = [
    {
      title: '材料名称',
      dataIndex: 'materialName',
      key: 'materialName'
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category'
    },
    {
      title: '工地总数',
      dataIndex: 'totalSites',
      key: 'totalSites',
      width: 120
    },
    {
      title: '已提交数',
      dataIndex: 'submittedCount',
      key: 'submittedCount',
      width: 120
    },
    {
      title: '已通过数',
      dataIndex: 'approvedCount',
      key: 'approvedCount',
      width: 120
    },
    {
      title: '提交率',
      dataIndex: 'submissionRate',
      key: 'submissionRate',
      width: 200,
      render: (rate: number) => (
        <Progress
          percent={Math.round(rate)}
          size="small"
          strokeColor={getProgressColor(rate)}
          format={(percent) => `${percent}%`}
        />
      )
    },
    {
      title: '通过率',
      dataIndex: 'approvalRate',
      key: 'approvalRate',
      width: 200,
      render: (rate: number) => (
        <Progress
          percent={Math.round(rate)}
          size="small"
          strokeColor="#52c41a"
          format={(percent) => `${percent}%`}
        />
      )
    }
  ]

  const summaryStats = {
    totalSites: rateData.length,
    avgCompleteRate: rateData.length > 0
      ? rateData.reduce((sum, item) => sum + item.completeRate, 0) / rateData.length
      : 0,
    avgApprovedRate: rateData.length > 0
      ? rateData.reduce((sum, item) => sum + item.approvedRate, 0) / rateData.length
      : 0,
    totalMissing: rateData.reduce((sum, item) => sum + item.missingCount, 0)
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '16px' }}>
          <Space wrap>
            <RangePicker
              placeholder={['开始日期', '结束日期']}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setQueryParams({
                    ...queryParams,
                    startDate: dates[0].format('YYYY-MM-DD'),
                    endDate: dates[1].format('YYYY-MM-DD')
                  })
                } else {
                  setQueryParams({
                    ...queryParams,
                    startDate: undefined,
                    endDate: undefined
                  })
                }
              }}
            />
            <Select
              placeholder="区域"
              style={{ width: 150 }}
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
              style={{ width: 150 }}
              allowClear
              value={queryParams.personInChargeId}
              onChange={(value) => setQueryParams({ ...queryParams, personInChargeId: value })}
            >
              {persons.map((item) => (
                <Option key={item.id} value={item.id}>{item.name}</Option>
              ))}
            </Select>
            <Select
              placeholder="标签分组"
              style={{ width: 150 }}
              allowClear
              value={queryParams.tagGroup}
              onChange={(value) => setQueryParams({ ...queryParams, tagGroup: value })}
            >
              <Option value="group1">分组1</Option>
              <Option value="group2">分组2</Option>
            </Select>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              查询
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleExport}
              loading={exportLoading}
            >
              导出报告
            </Button>
          </Space>
        </div>

        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="工地总数"
                value={summaryStats.totalSites}
                prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="平均完整率"
                value={summaryStats.avgCompleteRate}
                precision={1}
                suffix="%"
                prefix={<BarChartOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: getProgressColor(summaryStats.avgCompleteRate) }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="平均通过率"
                value={summaryStats.avgApprovedRate}
                precision={1}
                suffix="%"
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="缺失材料数"
                value={summaryStats.totalMissing}
                prefix={<ExclamationCircleOutlined style={{ color: '#f5222d' }} />}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
        </Row>

        <Spin spinning={loading}>
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane
              tab={
                <span>
                  <FileTextOutlined />
                  资料完整率
                </span>
              }
              key="rate"
            >
              <Table
                columns={rateColumns}
                dataSource={rateData}
                rowKey="siteId"
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
            </TabPane>

            <TabPane
              tab={
                <span>
                  <AreaChartOutlined />
                  区域统计
                </span>
              }
              key="area"
            >
              <Table
                columns={areaColumns}
                dataSource={areaData}
                rowKey="areaId"
                pagination={false}
              />
            </TabPane>

            <TabPane
              tab={
                <span>
                  <UserOutlined />
                  负责人统计
                </span>
              }
              key="person"
            >
              <Table
                columns={personColumns}
                dataSource={personData}
                rowKey="personId"
                pagination={false}
              />
            </TabPane>

            <TabPane
              tab={
                <span>
                  <BarChartOutlined />
                  材料统计
                </span>
              }
              key="material"
            >
              <Table
                columns={materialColumns}
                dataSource={materialData}
                rowKey="materialId"
                pagination={false}
              />
            </TabPane>
          </Tabs>
        </Spin>
      </Card>
    </div>
  )
}

export default Review
