import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  message,
  Tag,
  Card,
  Row,
  Col,
  Statistic,
  InputNumber,
  DatePicker,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  FileTextOutlined,
  DownloadOutlined,
  PrinterOutlined,
} from '@ant-design/icons'
import { api } from '../services/api'
import type { Transcript } from '../types'
import dayjs from 'dayjs'

const { Option } = Select

const Transcripts = () => {
  const [loading, setLoading] = useState(false)
  const [transcripts, setTranscripts] = useState<Transcript[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingTranscript, setEditingTranscript] = useState<Transcript | null>(null)
  const [searchText, setSearchText] = useState('')
  const [semesterFilter, setSemesterFilter] = useState<string>()
  const [form] = Form.useForm()
  const [stats, setStats] = useState<any>({})

  useEffect(() => {
    loadData()
  }, [page, pageSize, searchText, semesterFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      const [transcriptsRes, statsRes] = await Promise.all([
        api.transcripts.getList({
          page,
          pageSize,
          search: searchText,
          semester: semesterFilter,
        }),
        api.transcripts.getStats(),
      ])

      setTranscripts(transcriptsRes.data.items)
      setTotal(transcriptsRes.data.total)
      setStats(statsRes.data)
    } catch (error) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingTranscript(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (transcript: Transcript) => {
    setEditingTranscript(transcript)
    form.setFieldsValue({
      ...transcript,
      examDate: transcript.examDate ? dayjs(transcript.examDate) : null,
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await api.transcripts.delete(id)
      message.success('删除成功')
      loadData()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const data = {
        ...values,
        examDate: values.examDate?.format('YYYY-MM-DD'),
      }
      if (editingTranscript) {
        await api.transcripts.update(editingTranscript.id, data)
        message.success('更新成功')
      } else {
        await api.transcripts.create(data)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadData()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'success'
    if (grade >= 80) return 'blue'
    if (grade >= 60) return 'default'
    return 'error'
  }

  const getGradeTag = (grade: number, points: number) => {
    return (
      <Tag color={getGradeColor(grade)}>
        {grade} 分 ({points} 绩点)
      </Tag>
    )
  }

  const columns = [
    {
      title: '学号',
      dataIndex: 'studentNumber',
      key: 'studentNumber',
      width: 120,
    },
    {
      title: '学生姓名',
      dataIndex: 'studentName',
      key: 'studentName',
      width: 100,
    },
    {
      title: '课程',
      dataIndex: 'courseName',
      key: 'courseName',
      width: 180,
    },
    {
      title: '学期',
      dataIndex: 'semester',
      key: 'semester',
      width: 150,
    },
    {
      title: '平时成绩',
      dataIndex: 'regularScore',
      key: 'regularScore',
      width: 100,
      render: (score: number) => score ?? '-',
    },
    {
      title: '期末成绩',
      dataIndex: 'finalScore',
      key: 'finalScore',
      width: 100,
      render: (score: number) => score ?? '-',
    },
    {
      title: '总成绩',
      dataIndex: 'finalGrade',
      key: 'finalGrade',
      width: 140,
      render: (grade: number, record: Transcript) =>
        grade !== null ? getGradeTag(grade, record.gradePoints) : '-',
    },
    {
      title: '是否通过',
      dataIndex: 'isPassed',
      key: 'isPassed',
      width: 100,
      render: (passed: boolean) => (
        <Tag color={passed ? 'success' : 'error'}>
          {passed ? '通过' : '未通过'}
        </Tag>
      ),
    },
    {
      title: '录入时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_: any, record: Transcript) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<PrinterOutlined />}
          >
            打印
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="已录入成绩"
              value={stats.total || 0}
              prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均分"
              value={stats.avgGrade || 0}
              precision={1}
              suffix="分"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="及格率"
              value={stats.passRate || 0}
              suffix="%"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="不及格人数"
              value={stats.failedCount || 0}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      <Card size="small">
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Input.Search
              placeholder="搜索学号、姓名或课程"
              allowClear
              enterButton={<SearchOutlined />}
              size="middle"
              style={{ width: 250 }}
              onSearch={(value) => {
                setSearchText(value)
                setPage(1)
              }}
            />
            <Select
              placeholder="选择学期"
              style={{ width: 150 }}
              allowClear
              onChange={(value) => {
                setSemesterFilter(value)
                setPage(1)
              }}
            >
              <Option value="2024-2025-1">2024-2025学年第一学期</Option>
              <Option value="2024-2025-2">2024-2025学年第二学期</Option>
            </Select>
            <Button icon={<DownloadOutlined />}>导出成绩单</Button>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            录入成绩
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={transcripts}
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
      </Card>

      <Modal
        title={editingTranscript ? '编辑成绩' : '录入成绩'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="studentId"
                label="选择学生"
                rules={[{ required: true, message: '请选择学生' }]}
              >
                <Select placeholder="请选择学生" showSearch optionFilterProp="children">
                  <Option value={1}>2024001 - 张三</Option>
                  <Option value={2}>2024002 - 李四</Option>
                  <Option value={3}>2024003 - 王五</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="courseId"
                label="选择课程"
                rules={[{ required: true, message: '请选择课程' }]}
              >
                <Select placeholder="请选择课程" showSearch optionFilterProp="children">
                  <Option value={1}>CS101 - 计算机基础</Option>
                  <Option value={2}>MA101 - 高等数学</Option>
                  <Option value={3}>EN101 - 大学英语</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="semester"
                label="学期"
                rules={[{ required: true, message: '请输入学期' }]}
              >
                <Input placeholder="如：2024-2025-1" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="regularScore"
                label="平时成绩"
              >
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="finalScore"
                label="期末成绩"
              >
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="finalGrade"
                label="总成绩"
                rules={[{ required: true, message: '请输入总成绩' }]}
              >
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="gradePoints"
                label="绩点"
                rules={[{ required: true, message: '请输入绩点' }]}
              >
                <InputNumber min={0} max={4} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="examDate"
                label="考试日期"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="isPassed"
                label="是否通过"
                rules={[{ required: true, message: '请选择' }]}
              >
                <Select>
                  <Option value={true}>通过</Option>
                  <Option value={false}>未通过</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Transcripts
