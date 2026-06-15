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
  Popconfirm,
  Tag,
  Row,
  Col,
  DatePicker,
  Card,
  Timeline,
  Badge,
  Tooltip,
  Alert,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  CalendarOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { api } from '../services/api'
import { conflictLevelLabels, conflictStatusLabels, weekDayLabels } from '../utils/enumLabels'
import type { CourseSchedule, Conflict, Course, Classroom, TimeSlot, WeekDay } from '../types'
import dayjs from 'dayjs'

const { Option } = Select
const { RangePicker } = DatePicker

const ScheduleBoard = () => {
  const [loading, setLoading] = useState(false)
  const [schedules, setSchedules] = useState<CourseSchedule[]>([])
  const [conflicts, setConflicts] = useState<Conflict[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<CourseSchedule | null>(null)
  const [searchText, setSearchText] = useState('')
  const [semesterId, setSemesterId] = useState<number>()
  const [form] = Form.useForm()
  const [detecting, setDetecting] = useState(false)
  const [detectResult, setDetectResult] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [page, pageSize, searchText, semesterId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [schedulesRes, conflictsRes, coursesRes, classroomsRes, timeSlotsRes] = await Promise.all([
        api.schedules.getList({
          page,
          pageSize,
          search: searchText,
          semesterId,
        }),
        api.conflicts.getList({ status: 'Pending', pageSize: 100 }),
        api.courses.getList({ pageSize: 1000 }),
        api.classrooms.getList({ pageSize: 1000 }),
        api.timeSlots.getList(),
      ])

      setSchedules(schedulesRes.data.items)
      setTotal(schedulesRes.data.total)
      setConflicts(conflictsRes.data.items)
      setCourses(coursesRes.data.items)
      setClassrooms(classroomsRes.data.items)
      setTimeSlots(timeSlotsRes.data)
    } catch (error) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingSchedule(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (schedule: CourseSchedule) => {
    setEditingSchedule(schedule)
    form.setFieldsValue(schedule)
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await api.schedules.delete(id)
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
        startDate: values.startDate?.format('YYYY-MM-DD'),
        endDate: values.endDate?.format('YYYY-MM-DD'),
      }
      if (editingSchedule) {
        await api.schedules.update(editingSchedule.id, data)
        message.success('更新成功')
      } else {
        await api.schedules.create(data)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadData()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleDetectConflict = async () => {
    if (!semesterId) {
      message.warning('请先选择学期')
      return
    }
    setDetecting(true)
    setDetectResult(null)
    try {
      const response = await api.schedules.detectConflicts(semesterId)
      const conflicts = response.data
      setDetectResult(conflicts)
      if (conflicts && conflicts.length > 0) {
        message.warning(`检测到 ${conflicts.length} 个冲突`)
      } else {
        message.success('未检测到冲突')
      }
      loadData()
    } catch (error) {
      message.error('冲突检测失败')
    } finally {
      setDetecting(false)
    }
  }

  const handleSubmitForApproval = async (id: number) => {
    try {
      await api.schedules.submitForApproval(id)
      message.success('已提交审核')
      loadData()
    } catch (error) {
      message.error('提交失败')
    }
  }

  const getConflictLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      Low: 'success',
      Medium: 'warning',
      High: 'orange',
      Critical: 'error',
    }
    return colors[level] || 'default'
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Draft: 'default',
      Pending: 'processing',
      Approved: 'success',
      Rejected: 'error',
      NeedsRevision: 'warning',
    }
    return colors[status] || 'default'
  }

  const getScheduleConflicts = (scheduleId: number) => {
    return conflicts.filter(
      (c) => c.schedule1Id === scheduleId || c.schedule2Id === scheduleId
    )
  }

  const getWeekDayNumber = (day: string): number => {
    const map: Record<string, number> = {
      Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7,
    }
    return map[day] || 1
  }

  const columns = [
    {
      title: '课程',
      key: 'course',
      width: 180,
      render: (_: any, record: CourseSchedule) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.course?.name}</div>
          <div style={{ color: '#999', fontSize: 12 }}>{record.course?.courseCode}</div>
        </div>
      ),
    },
    {
      title: '教室',
      key: 'classroom',
      width: 150,
      render: (_: any, record: CourseSchedule) => record.classroom?.name || '-',
    },
    {
      title: '星期',
      key: 'weekDay',
      width: 80,
      render: (_: any, record: CourseSchedule) => {
        return weekDayLabels[record.dayOfWeek as unknown as WeekDay] || record.dayOfWeek
      },
    },
    {
      title: '节次',
      key: 'timeSlot',
      width: 120,
      render: (_: any, record: CourseSchedule) => {
        const slot = timeSlots.find((s) => s.id === record.timeSlotId)
        return slot ? `${slot.startTime} - ${slot.endTime}` : '-'
      },
    },
    {
      title: '授课教师',
      key: 'teacher',
      width: 100,
      render: (_: any, record: CourseSchedule) => {
        const mainTeacher = record.course?.teacherCourses?.find(tc => tc.isMainTeacher)
        return mainTeacher?.teacher?.realName || '-'
      },
    },
    {
      title: '周次',
      key: 'weeks',
      width: 200,
      render: (_: any, record: CourseSchedule) => (
        <div>
          <div>第 {record.startWeek} 周</div>
          <div style={{ color: '#999', fontSize: 12 }}>至 第 {record.endWeek} 周</div>
        </div>
      ),
    },
    {
      title: '冲突风险',
      key: 'conflicts',
      width: 120,
      render: (_: any, record: CourseSchedule) => {
        const scheduleConflicts = getScheduleConflicts(record.id)
        if (scheduleConflicts.length === 0) {
          return <Tag icon={<CheckCircleOutlined />} color="success">无冲突</Tag>
        }
        const highestLevel = scheduleConflicts.reduce((max, c) => {
          const levels = ['Low', 'Medium', 'High', 'Critical']
          return levels.indexOf(c.level) > levels.indexOf(max) ? c.level : max
        }, 'Low')
        return (
          <Tooltip title={scheduleConflicts.map((c) => c.description).join('\n')}>
            <Badge count={scheduleConflicts.length} size="small">
              <Tag color={getConflictLevelColor(highestLevel)}>
                <WarningOutlined /> {conflictLevelLabels[highestLevel as keyof typeof conflictLevelLabels]}
              </Tag>
            </Badge>
          </Tooltip>
        )
      },
    },
    {
      title: '状态',
      dataIndex: 'approvalStatus',
      key: 'approvalStatus',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status === 'Draft' && <ClockCircleOutlined />}
          {status === 'Approved' && <CheckCircleOutlined />}
          {status === 'Pending' && <ClockCircleOutlined />}
          {' '}{conflictStatusLabels[status as keyof typeof conflictStatusLabels] || status}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: CourseSchedule) => (
        <Space size="small">
          {record.approvalStatus === 'Draft' && (
            <Button type="link" size="small" onClick={() => handleSubmitForApproval(record.id)}>
              提交审核
            </Button>
          )}
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

  const weekView = () => {
    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const dayNumberMap: Record<string, number> = {
      Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7,
    }
    return (
      <Card title="周视图" style={{ marginBottom: 16 }}>
        <Row gutter={[8, 8]}>
          {weekDays.map((day) => (
            <Col span={24 / 7} key={day}>
              <Card
                size="small"
                title={weekDayLabels[day as unknown as WeekDay]}
                style={{ minHeight: 200 }}
                bodyStyle={{ padding: 8 }}
              >
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  {schedules
                    .filter((s) => s.dayOfWeek === dayNumberMap[day])
                    .map((schedule) => {
                      const scheduleConflicts = getScheduleConflicts(schedule.id)
                      const hasConflict = scheduleConflicts.length > 0
                      const slot = timeSlots.find((s) => s.id === schedule.timeSlotId)
                      return (
                        <div
                          key={schedule.id}
                          style={{
                            padding: 6,
                            background: hasConflict ? '#fff1f0' : '#f0f5ff',
                            borderRadius: 4,
                            borderLeft: `3px solid ${hasConflict ? '#f5222d' : '#1890ff'}`,
                            fontSize: 12,
                          }}
                        >
                          <div style={{ fontWeight: 500 }}>{schedule.course?.name}</div>
                          <div style={{ color: '#666' }}>{schedule.classroom?.name}</div>
                          <div style={{ color: '#999', fontSize: 11 }}>
                            {slot?.startTime} - {slot?.endTime}
                          </div>
                          {hasConflict && (
                            <div style={{ color: '#f5222d', fontSize: 11, marginTop: 2 }}>
                              <WarningOutlined /> 存在冲突
                            </div>
                          )}
                        </div>
                      )
                    })}
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    )
  }

  return (
    <div>
      {detectResult && detectResult.hasConflicts && (
        <Alert
          message={`检测到 ${detectResult.conflictCount} 个排课冲突`}
          description={
            <div>
              <p>请尽快处理以下冲突：</p>
              <Timeline
                items={detectResult.conflicts?.map((c: any, i: number) => ({
                  color: getConflictLevelColor(c.level),
                  children: (
                    <div>
                      <Tag color={getConflictLevelColor(c.level)}>
                        {conflictLevelLabels[c.level as keyof typeof conflictLevelLabels]}
                      </Tag>
                      {c.description}
                    </div>
                  ),
                }))}
              />
            </div>
          }
          type="warning"
          showIcon
          closable
          onClose={() => setDetectResult(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Input.Search
            placeholder="搜索课程或教室"
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
              setSemesterId(value)
              setPage(1)
            }}
          >
            <Option value={1}>2024-2025学年第一学期</Option>
            <Option value={2}>2024-2025学年第二学期</Option>
          </Select>
        </Space>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            loading={detecting}
            onClick={handleDetectConflict}
          >
            冲突检测
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增排课
          </Button>
        </Space>
      </div>

      {weekView()}

      <Card title="排课列表" size="small">
        <Table
          columns={columns}
          dataSource={schedules}
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
        title={editingSchedule ? '编辑排课' : '新增排课'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="courseId"
                label="选择课程"
                rules={[{ required: true, message: '请选择课程' }]}
              >
                <Select placeholder="请选择课程" showSearch optionFilterProp="children">
                  {courses.map((course) => (
                    <Option key={course.id} value={course.id}>
                      {course.name} ({course.courseCode})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="classroomId"
                label="选择教室"
                rules={[{ required: true, message: '请选择教室' }]}
              >
                <Select placeholder="请选择教室" showSearch optionFilterProp="children">
                  {classrooms.map((classroom) => (
                    <Option key={classroom.id} value={classroom.id}>
                      {classroom.name} ({classroom.roomNumber}, 容量: {classroom.capacity})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="weekDay"
                label="星期"
                rules={[{ required: true, message: '请选择星期' }]}
              >
                <Select placeholder="请选择星期">
                  {Object.entries(weekDayLabels).map(([key, label]) => (
                    <Option key={key} value={key}>{label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="timeSlotId"
                label="节次"
                rules={[{ required: true, message: '请选择节次' }]}
              >
                <Select placeholder="请选择节次">
                  {timeSlots.map((slot) => (
                    <Option key={slot.id} value={slot.id}>
                      {slot.name} ({slot.startTime}-{slot.endTime})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="teacherId"
                label="授课教师"
                rules={[{ required: true, message: '请选择教师' }]}
              >
                <Select placeholder="请选择教师">
                  <Option value={1}>张教授</Option>
                  <Option value={2}>李副教授</Option>
                  <Option value={3}>王讲师</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="startDate"
                label="开始日期"
                rules={[{ required: true, message: '请选择开始日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="endDate"
                label="结束日期"
                rules={[{ required: true, message: '请选择结束日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
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

export default ScheduleBoard
