import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, InputNumber, Select, Space, message, Popconfirm, Tag, Row, Col } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { api } from '../services/api'
import { courseStatusLabels } from '../utils/enumLabels'
import type { Course } from '../types'

const { Option } = Select

const Courses = () => {
  const [loading, setLoading] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [searchText, setSearchText] = useState('')
  const [form] = Form.useForm()

  useEffect(() => {
    loadCourses()
  }, [page, pageSize, searchText])

  const loadCourses = async () => {
    setLoading(true)
    try {
      const response = await api.courses.getList({
        page,
        pageSize,
        search: searchText,
      })
      setCourses(response.data.items)
      setTotal(response.data.total)
    } catch (error) {
      message.error('加载课程列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingCourse(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (course: Course) => {
    setEditingCourse(course)
    form.setFieldsValue(course)
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await api.courses.delete(id)
      message.success('删除成功')
      loadCourses()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingCourse) {
        await api.courses.update(editingCourse.id, values)
        message.success('更新成功')
      } else {
        await api.courses.create(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadCourses()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Draft: 'default',
      Published: 'processing',
      Scheduled: 'blue',
      InProgress: 'success',
      Completed: 'default',
      Cancelled: 'error',
    }
    return colors[status] || 'default'
  }

  const columns = [
    {
      title: '课程代码',
      dataIndex: 'courseCode',
      key: 'courseCode',
      width: 120,
    },
    {
      title: '课程名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '学分',
      dataIndex: 'credits',
      key: 'credits',
      width: 80,
    },
    {
      title: '学时',
      dataIndex: 'totalHours',
      key: 'totalHours',
      width: 80,
    },
    {
      title: '周学时',
      dataIndex: 'weeklyHours',
      key: 'weeklyHours',
      width: 80,
    },
    {
      title: '开课院系',
      dataIndex: ['department', 'name'],
      key: 'departmentName',
      width: 120,
      render: (_: any, record: Course) => record.department?.name || '-',
    },
    {
      title: '先修课程',
      dataIndex: ['prerequisiteCourse', 'name'],
      key: 'prerequisiteCourse',
      width: 150,
      ellipsis: true,
      render: (_: any, record: Course) => record.prerequisiteCourse?.name || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <Tag color={getStatusColor(status)}>{courseStatusLabels[status as keyof typeof courseStatusLabels] || status}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: Course) => (
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
          placeholder="搜索课程名称或代码"
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
          新增课程
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={courses}
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
        title={editingCourse ? '编辑课程' : '新增课程'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="courseCode"
                label="课程代码"
                rules={[{ required: true, message: '请输入课程代码' }]}
              >
                <Input placeholder="如：CS101" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label="课程名称"
                rules={[{ required: true, message: '请输入课程名称' }]}
              >
                <Input placeholder="如：计算机基础" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="credits"
                label="学分"
                rules={[{ required: true, message: '请输入学分' }]}
              >
                <InputNumber min={1} max={10} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="totalHours"
                label="总学时"
                rules={[{ required: true, message: '请输入总学时' }]}
              >
                <InputNumber min={1} max={200} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select>
                  <Option value="Draft">草稿</Option>
                  <Option value="Published">已发布</Option>
                  <Option value="Scheduled">已排课</Option>
                  <Option value="InProgress">进行中</Option>
                  <Option value="Completed">已完成</Option>
                  <Option value="Cancelled">已取消</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="课程描述">
            <Input.TextArea rows={3} placeholder="请输入课程描述" />
          </Form.Item>
          <Form.Item name="prerequisite" label="先修课程">
            <Input placeholder="请输入先修课程要求" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Courses
