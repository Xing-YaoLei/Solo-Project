import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, Space, message, Popconfirm, Tag, Row, Col, DatePicker, Upload } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, UploadOutlined, ImportOutlined } from '@ant-design/icons'
import { api } from '../services/api'
import type { Student } from '../types'
import dayjs from 'dayjs'

const { Option } = Select

const Students = () => {
  const [loading, setLoading] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [modalVisible, setModalVisible] = useState(false)
  const [importModalVisible, setImportModalVisible] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [searchText, setSearchText] = useState('')
  const [form] = Form.useForm()
  const [importForm] = Form.useForm()

  useEffect(() => {
    loadStudents()
  }, [page, pageSize, searchText])

  const loadStudents = async () => {
    setLoading(true)
    try {
      const response = await api.students.getList({
        page,
        pageSize,
        search: searchText,
      })
      setStudents(response.data.items)
      setTotal(response.data.total)
    } catch (error) {
      message.error('加载学生列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingStudent(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (student: Student) => {
    setEditingStudent(student)
    form.setFieldsValue({
      ...student,
      enrollmentDate: student.enrollmentDate ? dayjs(student.enrollmentDate) : null,
      dateOfBirth: student.dateOfBirth ? dayjs(student.dateOfBirth) : null,
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await api.students.delete(id)
      message.success('删除成功')
      loadStudents()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const data = {
        ...values,
        enrollmentDate: values.enrollmentDate?.format('YYYY-MM-DD'),
        dateOfBirth: values.dateOfBirth?.format('YYYY-MM-DD'),
      }
      if (editingStudent) {
        await api.students.update(editingStudent.id, data)
        message.success('更新成功')
      } else {
        await api.students.create(data)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadStudents()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleImport = async () => {
    try {
      const values = await importForm.validateFields()
      message.success('导入成功')
      setImportModalVisible(false)
      loadStudents()
    } catch (error) {
      message.error('导入失败')
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Active: 'success',
      Suspended: 'warning',
      Graduated: 'default',
      Withdrawn: 'error',
    }
    return colors[status] || 'default'
  }

  const statusLabels: Record<string, string> = {
    Active: '在读',
    Suspended: '休学',
    Graduated: '已毕业',
    Withdrawn: '退学',
  }

  const columns = [
    {
      title: '学号',
      dataIndex: 'studentNumber',
      key: 'studentNumber',
      width: 120,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100,
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 60,
    },
    {
      title: '年级',
      dataIndex: 'grade',
      key: 'grade',
      width: 80,
    },
    {
      title: '专业',
      dataIndex: 'major',
      key: 'major',
      width: 120,
    },
    {
      title: '学院',
      dataIndex: 'departmentName',
      key: 'departmentName',
      width: 120,
    },
    {
      title: '入学日期',
      dataIndex: 'enrollmentDate',
      key: 'enrollmentDate',
      width: 120,
      render: (date: string) => date && new Date(date).toLocaleDateString(),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => <Tag color={getStatusColor(status)}>{statusLabels[status]}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: Student) => (
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
          placeholder="搜索学号、姓名或专业"
          allowClear
          enterButton={<SearchOutlined />}
          size="middle"
          style={{ width: 300 }}
          onSearch={(value) => {
            setSearchText(value)
            setPage(1)
          }}
        />
        <Space>
          <Button icon={<ImportOutlined />} onClick={() => setImportModalVisible(true)}>
            批量导入
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增学生
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={students}
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
        title={editingStudent ? '编辑学生' : '新增学生'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="studentNumber"
                label="学号"
                rules={[{ required: true, message: '请输入学号' }]}
              >
                <Input placeholder="如：2024001" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="name"
                label="姓名"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="gender"
                label="性别"
                rules={[{ required: true, message: '请选择性别' }]}
              >
                <Select>
                  <Option value="男">男</Option>
                  <Option value="女">女</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="grade"
                label="年级"
                rules={[{ required: true, message: '请输入年级' }]}
              >
                <Input placeholder="如：2024级" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="major"
                label="专业"
                rules={[{ required: true, message: '请输入专业' }]}
              >
                <Input placeholder="如：计算机科学与技术" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="departmentId"
                label="学院"
                rules={[{ required: true, message: '请选择学院' }]}
              >
                <Select placeholder="请选择学院">
                  <Option value={1}>计算机学院</Option>
                  <Option value={2}>电子工程学院</Option>
                  <Option value={3}>经济管理学院</Option>
                  <Option value={4}>外国语学院</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="enrollmentDate"
                label="入学日期"
                rules={[{ required: true, message: '请选择入学日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="dateOfBirth"
                label="出生日期"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select>
                  <Option value="Active">在读</Option>
                  <Option value="Suspended">休学</Option>
                  <Option value="Graduated">已毕业</Option>
                  <Option value="Withdrawn">退学</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="email" label="邮箱">
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="联系电话">
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="address" label="家庭住址">
            <Input.TextArea rows={2} placeholder="请输入家庭住址" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="批量导入学生"
        open={importModalVisible}
        onOk={handleImport}
        onCancel={() => setImportModalVisible(false)}
      >
        <Form form={importForm} layout="vertical">
          <Form.Item
            name="file"
            label="选择文件"
            rules={[{ required: true, message: '请选择要导入的文件' }]}
          >
            <Upload
              maxCount={1}
              accept=".xlsx,.xls,.csv"
              beforeUpload={() => false}
            >
              <Button icon={<UploadOutlined />}>点击上传</Button>
            </Upload>
          </Form.Item>
          <div style={{ color: '#999', fontSize: 12 }}>
            <p>支持 Excel (.xlsx, .xls) 和 CSV 格式文件</p>
            <p>文件需包含：学号、姓名、性别、年级、专业、学院等字段</p>
            <a href="#">下载导入模板</a>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

export default Students
