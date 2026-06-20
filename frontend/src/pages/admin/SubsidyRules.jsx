import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Form,
  Modal,
  message,
  Popconfirm,
  InputNumber,
} from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons'
import { subsidyRulesAPI, addressDictAPI } from '../../api'

const { Option } = Select
const { TextArea } = Input

export default function SubsidyRules() {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [keyword, setKeyword] = useState('')
  const [ruleType, setRuleType] = useState(undefined)
  const [area, setArea] = useState(undefined)
  const [areas, setAreas] = useState([])
  const [subsidyTypes, setSubsidyTypes] = useState([])
  const [isActive, setIsActive] = useState(undefined)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
    loadAreas()
    loadTypes()
  }, [page, pageSize])

  const loadAreas = async () => {
    try {
      const res = await addressDictAPI.getAreas()
      setAreas(res.data || [])
    } catch (e) {
      console.error(e)
    }
  }

  const loadTypes = async () => {
    try {
      const res = await subsidyRulesAPI.getTypes()
      setSubsidyTypes(res.data || [])
    } catch (e) {
      console.error(e)
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await subsidyRulesAPI.list({
        page,
        page_size: pageSize,
        keyword: keyword || undefined,
        rule_type: ruleType,
        area: area,
        is_active: isActive,
      })
      setData(res.data || [])
      setTotal(res.total || 0)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    loadData()
  }

  const handleReset = () => {
    setKeyword('')
    setRuleType(undefined)
    setArea(undefined)
    setIsActive(undefined)
    setPage(1)
    loadData()
  }

  const handleAdd = () => {
    setEditingId(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingId(record.id)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await subsidyRulesAPI.delete(id)
      message.success('删除成功')
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingId) {
        await subsidyRulesAPI.update(editingId, values)
        message.success('更新成功')
      } else {
        await subsidyRulesAPI.create(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      form.resetFields()
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const getTypeLabel = (type) => {
    const opt = subsidyTypes.find((t) => t.value === type)
    return opt?.label || type
  }

  const columns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
    },
    {
      title: '补贴类型',
      dataIndex: 'rule_type',
      key: 'rule_type',
      width: 120,
      render: (val) => getTypeLabel(val),
    },
    {
      title: '适用区域',
      dataIndex: 'area',
      key: 'area',
      width: 120,
      render: (val) => val || '全部区域',
    },
    {
      title: '阈值',
      dataIndex: 'threshold',
      key: 'threshold',
      width: 120,
      render: (val, record) => {
        let unit = ''
        if (record.rule_type === 'distance') unit = '米'
        else if (record.rule_type === 'weight') unit = 'kg'
        else if (record.rule_type === 'peak') unit = '小时'
        else if (record.rule_type === 'night') unit = '点'
        return `${val}${unit}`
      },
    },
    {
      title: '补贴金额',
      dataIndex: 'subsidy_amount',
      key: 'subsidy_amount',
      width: 120,
      render: (val, record) =>
        record.subsidy_unit === 'percent' ? `${val}%` : `¥${val}`,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (val) => `P${val}`,
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      render: (val) =>
        val ? <Tag color="green">启用</Tag> : <Tag color="default">停用</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="page-title">补贴规则阈值</div>

      <div className="filter-form">
        <Space size="large">
          <Input
            placeholder="搜索规则名称"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 200 }}
            allowClear
            prefix={<SearchOutlined />}
          />
          <Select
            placeholder="补贴类型"
            value={ruleType}
            onChange={setRuleType}
            style={{ width: 140 }}
            allowClear
          >
            {subsidyTypes.map((t) => (
              <Option key={t.value} value={t.value}>
                {t.label}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="适用区域"
            value={area}
            onChange={setArea}
            style={{ width: 140 }}
            allowClear
          >
            {areas.map((a) => (
              <Option key={a} value={a}>
                {a}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="状态"
            value={isActive}
            onChange={setIsActive}
            style={{ width: 120 }}
            allowClear
          >
            <Option value={true}>启用</Option>
            <Option value={false}>停用</Option>
          </Select>
          <Space>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              搜索
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
          </Space>
        </Space>
      </div>

      <div className="table-toolbar">
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增规则
          </Button>
          <span style={{ color: '#666' }}>共 {total} 条记录</span>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1100 }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (p, ps) => {
            setPage(p)
            setPageSize(ps)
          },
        }}
      />

      <Modal
        title={editingId ? '编辑补贴规则' : '新增补贴规则'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="规则名称"
            rules={[{ required: true, message: '请输入规则名称' }]}
          >
            <Input placeholder="请输入规则名称" />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="rule_type"
              label="补贴类型"
              rules={[{ required: true, message: '请选择补贴类型' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="请选择补贴类型">
                {subsidyTypes.map((t) => (
                  <Option key={t.value} value={t.value}>
                    {t.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="area" label="适用区域" style={{ flex: 1 }}>
              <Select placeholder="全部区域" allowClear>
                {areas.map((a) => (
                  <Option key={a} value={a}>
                    {a}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="threshold"
              label="触发阈值"
              rules={[{ required: true, message: '请输入阈值' }]}
              style={{ flex: 1 }}
            >
              <InputNumber style={{ width: '100%' }} min={0} placeholder="阈值" />
            </Form.Item>
            <Form.Item
              name="subsidy_amount"
              label="补贴金额/比例"
              rules={[{ required: true, message: '请输入补贴金额' }]}
              style={{ flex: 1 }}
            >
              <InputNumber style={{ width: '100%' }} min={0} placeholder="补贴值" />
            </Form.Item>
            <Form.Item
              name="subsidy_unit"
              label="单位"
              rules={[{ required: true, message: '请选择单位' }]}
              style={{ flex: 1 }}
            >
              <Select>
                <Option value="yuan">元</Option>
                <Option value="percent">百分比%</Option>
              </Select>
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="priority" label="优先级" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={0} placeholder="数字越大越优先" />
            </Form.Item>
            <Form.Item name="is_active" label="是否启用" style={{ flex: 1 }}>
              <Select>
                <Option value={true}>启用</Option>
                <Option value={false}>停用</Option>
              </Select>
            </Form.Item>
          </div>
          <Form.Item name="description" label="规则描述">
            <TextArea rows={3} placeholder="规则说明" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
