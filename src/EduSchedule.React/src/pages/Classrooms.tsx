import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, InputNumber, Select, Space, message, Popconfirm, Tag, Row, Col, Switch } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { api } from '../services/api'
import { roomTypeLabels } from '../utils/enumLabels'
import type { Classroom } from '../types'

const { Option } = Select

const Classrooms = () => {
  const [loading, setLoading] = useState(false)
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null)
  const [searchText, setSearchText] = useState('')
  const [form] = Form.useForm()

  useEffect(() => {
    loadClassrooms()
  }, [page, pageSize, searchText])

  const loadClassrooms = async () => {
    setLoading(true)
    try {
      const response = await api.classrooms.getList({
        page,
        pageSize,
        search: searchText,
      })
      setClassrooms(response.data.items)
      setTotal(response.data.total)
    } catch (error) {
      message.error('加载教室列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingClassroom(null)
    form.resetFields()
    form.setFieldsValue({ isActive: true, hasProjector: true, hasWhiteboard: true })
    setModalVisible(true)
  }

  const handleEdit = (classroom: Classroom) => {
    setEditingClassroom(classroom)
    form.setFieldsValue(classroom)
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await api.classrooms.delete(id)
      message.success('删除成功')
      loadClassrooms()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingClassroom) {
        await api.classrooms.update(editingClassroom.id, values)
        message.success('更新成功')
      } else {
        await api.classrooms.create(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadClassrooms()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const getRoomTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      Lecture: 'blue',
      Seminar: 'green',
      Lab: 'purple',
      Computer: 'cyan',
      Office: 'default',
    }
    return colors[type] || 'default'
  }

  const columns = [
    {
      title: '教室编号',
      dataIndex: 'roomNumber',
      key: 'roomNumber',
      width: 100,
    },
    {
      title: '教室名称',
      dataIndex: 'roomName',
      key: 'roomName',
      width: 150,
    },
    {
      title: '教学楼',
      dataIndex: 'building',
      key: 'building',
      width: 100,
    },
    {
      title: '楼层',
      dataIndex: 'floor',
      key: 'floor',
      width: 80,
    },
    {
      title: '容量',
      dataIndex: 'capacity',
      key: 'capacity',
      width: 80,
    },
    {
      title: '类型',
      dataIndex: 'roomType',
      key: 'roomType',
      width: 100,
      render: (type: string) => <Tag color={getRoomTypeColor(type)}>{roomTypeLabels[type]}</Tag>,
    },
    {
      title: '设备',
      key: 'equipment',
      width: 150,
      render: (_: any, record: Classroom) => (
        <Space size={4}>
          {record.hasProjector && <Tag color="blue">投影</Tag>}
          {record.hasWhiteboard && <Tag color="green">白板</Tag>}
          {record.hasComputer && <Tag color="purple">电脑</Tag>}
          {record.hasAudioSystem && <Tag color="cyan">音响</Tag>}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'default'}>{active ? '可用' : '停用'}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: Classroom) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Input.Search
          placeholder="搜索教室编号或名称"
          allowClear
          enterButton={<SearchOutlined />}
          size="middle"
          style={{ width: 300 }}
          onSearch={(value) => {
            setSearchText(value)
            setPage(1)
          }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增教室
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={classrooms}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (t) => `共 ${t} 条记录`,
          onChange: (p, ps) => {
            setPage(p)
            setPageSize(ps)
          },
        }}
      />

      <Modal
        title={editingClassroom ? '编辑教室' : '新增教室'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="roomNumber"
                label="教室编号"
                rules={[{ required: true, message: '请输入教室编号' }]}
              >
                <Input placeholder="如：A101" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="roomName"
                label="教室名称"
                rules={[{ required: true, message: '请输入教室名称' }]}
              >
                <Input placeholder="如：第一教学楼101" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="roomType"
                label="教室类型"
                rules={[{ required: true, message: '请选择教室类型' }]}
              >
                <Select>
                  <Option value="Lecture">阶梯教室</Option>
                  <Option value="Seminar">研讨室</Option>
                  <Option value="Lab">实验室</Option>
                  <Option value="Computer">计算机房</Option>
                  <Option value="Office">办公室</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="building"
                label="教学楼"
                rules={[{ required: true, message: '请输入教学楼' }]}
              >
                <Input placeholder="如：A栋" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="floor"
                label="楼层"
                rules={[{ required: true, message: '请输入楼层' }]}
              >
                <InputNumber min={1} max={20} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="capacity"
                label="容量"
                rules={[{ required: true, message: '请输入容量' }]}
              >
                <InputNumber min={1} max={500} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="设备配置">
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item name="hasProjector" valuePropName="checked" noStyle>
                  <Switch checkedChildren="有" unCheckedChildren="无" /> 投影仪
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="hasWhiteboard" valuePropName="checked" noStyle>
                  <Switch checkedChildren="有" unCheckedChildren="无" /> 白板
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="hasComputer" valuePropName="checked" noStyle>
                  <Switch checkedChildren="有" unCheckedChildren="无" /> 电脑
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="hasAudioSystem" valuePropName="checked" noStyle>
                  <Switch checkedChildren="有" unCheckedChildren="无" /> 音响系统
                </Form.Item>
              </Col>
            </Row>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="isActive" label="是否可用" valuePropName="checked">
                <Switch checkedChildren="可用" unCheckedChildren="停用" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Classrooms
