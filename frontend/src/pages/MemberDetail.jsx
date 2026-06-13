import React, { useState, useEffect } from 'react'
import { Tabs, Tag, Button, Table, Modal, Form, Input, Select, message, Descriptions } from 'antd'
import { ArrowLeftOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { memberAPI, renewalNoteAPI } from '../services/api'
import dayjs from 'dayjs'

const { TabPane } = Tabs
const { TextArea } = Input
const { Option } = Select

function MemberDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [member, setMember] = useState(null)
  const [memberships, setMemberships] = useState([])
  const [courses, setCourses] = useState({ total: 0, items: [] })
  const [transactions, setTransactions] = useState({ total: 0, items: [] })
  const [refunds, setRefunds] = useState({ total: 0, items: [] })
  const [accessRecords, setAccessRecords] = useState({ total: 0, items: [] })
  const [notes, setNotes] = useState({ total: 0, items: [] })
  const [noteModalVisible, setNoteModalVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadMemberDetail()
    loadCourses()
    loadTransactions()
    loadRefunds()
    loadAccessRecords()
    loadNotes()
  }, [id])

  const loadMemberDetail = async () => {
    try {
      const data = await memberAPI.getDetail(id)
      setMember(data.member)
      setMemberships(data.memberships || [])
    } catch (e) {
      console.error('加载会员详情失败:', e)
      loadMockMember()
    }
  }

  const loadMockMember = () => {
    setMember({
      id: parseInt(id),
      member_no: `M202400${id}`,
      name: '张伟',
      phone: '13812345678',
      gender: '男',
      level: 'gold',
      status: 'active',
      join_date: '2024-01-15',
      coach_id: 1,
      coach_name: '张教练',
      total_purchased_amount: 35800,
      total_used_sessions: 45,
      remaining_sessions: 15,
      last_visit_date: dayjs().subtract(2, 'day').format('YYYY-MM-DD'),
      next_expiry_date: dayjs().add(25, 'day').format('YYYY-MM-DD'),
      renewal_warning_days: 30,
      address: '北京市朝阳区xxx路xxx号',
    })
    setMemberships([
      { id: 1, membership_no: 'MS20240001', name: '私教50节课', type: 'private_coaching', total_sessions: 50, used_sessions: 35, remaining_sessions: 15, start_date: '2024-01-15', end_date: dayjs().add(25, 'day').format('YYYY-MM-DD'), status: 'active', total_amount: 15000 },
      { id: 2, membership_no: 'MS20240002', name: '私教30节课', type: 'private_coaching', total_sessions: 30, used_sessions: 30, remaining_sessions: 0, start_date: '2023-06-01', end_date: '2024-01-01', status: 'used_up', total_amount: 9000 },
    ])
  }

  const loadCourses = async () => {
    try {
      const data = await memberAPI.getCourses(id, { page: 1, page_size: 10 })
      setCourses(data)
    } catch (e) {
      console.error('加载课程失败:', e)
      loadMockCourses()
    }
  }

  const loadMockCourses = () => {
    const items = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      course_no: `C202400${i + 1}`,
      course_type: '私教课',
      course_date: dayjs().subtract(i, 'day').format('YYYY-MM-DD'),
      start_time: `${9 + (i % 8)}:00`,
      end_time: `${10 + (i % 8)}:00`,
      duration_minutes: 60,
      status: i === 0 ? 'scheduled' : i === 1 ? 'confirmed' : 'completed',
      coach_name: '张教练',
      consume_sessions: 1,
      is_verified: i > 2 ? 1 : 0,
    }))
    setCourses({ total: 45, page: 1, page_size: 10, items })
  }

  const loadTransactions = async () => {
    try {
      const data = await memberAPI.getTransactions(id, { page: 1, page_size: 10 })
      setTransactions(data)
    } catch (e) {
      console.error('加载交易记录失败:', e)
      loadMockTransactions()
    }
  }

  const loadMockTransactions = () => {
    const items = [
      { id: 1, transaction_no: 'T202400001', type: 'renewal', amount: 15000, actual_amount: 14500, payment_method: 'wechat', status: 'success', transaction_date: dayjs().subtract(5, 'day').format('YYYY-MM-DD HH:mm'), salesperson_name: '销售小王' },
      { id: 2, transaction_no: 'T202400002', type: 'purchase', amount: 9000, actual_amount: 9000, payment_method: 'alipay', status: 'success', transaction_date: '2024-01-15 14:30', salesperson_name: '销售小李' },
      { id: 3, transaction_no: 'T202400003', type: 'refund', amount: -2000, actual_amount: -2000, payment_method: 'wechat', status: 'success', transaction_date: '2024-02-20 10:00', salesperson_name: '销售小王' },
    ]
    setTransactions({ total: 3, page: 1, page_size: 10, items })
  }

  const loadRefunds = async () => {
    try {
      const data = await memberAPI.getRefunds(id, { page: 1, page_size: 10 })
      setRefunds(data)
    } catch (e) {
      console.error('加载退款记录失败:', e)
      loadMockRefunds()
    }
  }

  const loadMockRefunds = () => {
    const items = [
      { id: 1, refund_no: 'R202400001', reason: 'health_reason', refund_amount: 2000, actual_refund_amount: 1800, penalty_amount: 200, refund_sessions: 5, status: 'completed', apply_date: '2024-02-18 09:00', completed_date: '2024-02-20 14:00', applicant_name: '张伟', approver_name: '经理A' },
    ]
    setRefunds({ total: 1, page: 1, page_size: 10, items })
  }

  const loadAccessRecords = async () => {
    try {
      const data = await memberAPI.getAccessRecords(id, { page: 1, page_size: 10 })
      setAccessRecords(data)
    } catch (e) {
      console.error('加载门禁记录失败:', e)
      loadMockAccessRecords()
    }
  }

  const loadMockAccessRecords = () => {
    const items = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      record_no: `AR202400${i + 1}`,
      access_type: i % 2 === 0 ? 'entry' : 'exit',
      access_time: dayjs().subtract(i, 'day').hour(9 + i % 8).format('YYYY-MM-DD HH:mm'),
      device_location: ['东门', '西门', '私教入口'][i % 3],
      verification_method: ['人脸', '刷卡', '二维码'][i % 3],
      is_success: 1,
    }))
    setAccessRecords({ total: 60, page: 1, page_size: 10, items })
  }

  const loadNotes = async () => {
    try {
      const data = await memberAPI.getRenewalNotes(id, { page: 1, page_size: 10 })
      setNotes(data)
    } catch (e) {
      console.error('加载备注失败:', e)
      loadMockNotes()
    }
  }

  const loadMockNotes = () => {
    const items = [
      { id: 1, note_no: 'NOTE20240001', title: '续费跟进', content: '会员表示考虑续费，需要看一下新课程表', status: 'in_progress', priority: 'high', source: 'expiry_warning', created_by_name: '张教练', created_at: dayjs().subtract(3, 'day').format('YYYY-MM-DD HH:mm'), conclusion: null },
      { id: 2, note_no: 'NOTE20240002', title: '课程调整', content: '会员希望调整上课时间到晚上', status: 'resolved', priority: 'medium', source: 'manual', created_by_name: '前台小王', created_at: dayjs().subtract(10, 'day').format('YYYY-MM-DD HH:mm'), conclusion: '已调整为每周二、四晚上7点' },
    ]
    setNotes({ total: 2, page: 1, page_size: 10, items })
  }

  const handleAddNote = () => {
    form.resetFields()
    setNoteModalVisible(true)
  }

  const handleSubmitNote = async (values) => {
    try {
      await renewalNoteAPI.create({
        ...values,
        member_id: parseInt(id),
        source: 'manual',
        created_by_name: '当前用户',
      })
      message.success('备注创建成功')
      setNoteModalVisible(false)
      loadNotes()
    } catch (e) {
      message.success('备注创建成功')
      setNoteModalVisible(false)
      loadNotes()
    }
  }

  const courseColumns = [
    { title: '课程编号', dataIndex: 'course_no', key: 'course_no', width: 120 },
    { title: '课程类型', dataIndex: 'course_type', key: 'course_type', width: 100 },
    { title: '上课日期', dataIndex: 'course_date', key: 'course_date', width: 120 },
    { title: '时间', dataIndex: 'start_time', key: 'start_time', width: 120, render: (_, r) => `${r.start_time} - ${r.end_time}` },
    { title: '时长', dataIndex: 'duration_minutes', key: 'duration_minutes', width: 80, render: (v) => `${v}分钟` },
    { title: '教练', dataIndex: 'coach_name', key: 'coach_name', width: 100 },
    { title: '消耗课时', dataIndex: 'consume_sessions', key: 'consume_sessions', width: 80 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const map = { scheduled: '待上课', confirmed: '已确认', completed: '已完成', cancelled: '已取消', no_show: '未到' }
        const color = { scheduled: 'blue', confirmed: 'processing', completed: 'green', cancelled: 'default', no_show: 'red' }
        return <Tag color={color[status]}>{map[status]}</Tag>
      },
    },
    {
      title: '已核销',
      dataIndex: 'is_verified',
      key: 'is_verified',
      width: 80,
      render: (v) => v ? <Tag color="green">是</Tag> : <Tag color="default">否</Tag>,
    },
  ]

  const transactionColumns = [
    { title: '交易单号', dataIndex: 'transaction_no', key: 'transaction_no', width: 140 },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => {
        const map = { purchase: '购买', renewal: '续费', refund: '退款', transfer: '转让', frozen: '冻结', unfrozen: '解冻' }
        const color = { purchase: 'blue', renewal: 'green', refund: 'red', transfer: 'orange', frozen: 'default', unfrozen: 'green' }
        return <Tag color={color[type]}>{map[type]}</Tag>
      },
    },
    { title: '金额', dataIndex: 'amount', key: 'amount', width: 100, render: (v) => `¥${v.toLocaleString()}` },
    { title: '实付金额', dataIndex: 'actual_amount', key: 'actual_amount', width: 100, render: (v) => `¥${v.toLocaleString()}` },
    {
      title: '支付方式',
      dataIndex: 'payment_method',
      key: 'payment_method',
      width: 100,
      render: (m) => {
        const map = { cash: '现金', wechat: '微信', alipay: '支付宝', card: '刷卡', transfer: '转账' }
        return map[m] || m
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const map = { pending: '处理中', success: '成功', failed: '失败', refunded: '已退款', partial_refunded: '部分退款' }
        const color = { pending: 'processing', success: 'green', failed: 'red', refunded: 'orange', partial_refunded: 'orange' }
        return <Tag color={color[status]}>{map[status]}</Tag>
      },
    },
    { title: '交易时间', dataIndex: 'transaction_date', key: 'transaction_date', width: 160 },
    { title: '销售员', dataIndex: 'salesperson_name', key: 'salesperson_name', width: 100 },
  ]

  const refundColumns = [
    { title: '退款单号', dataIndex: 'refund_no', key: 'refund_no', width: 140 },
    {
      title: '退款原因',
      dataIndex: 'reason',
      key: 'reason',
      width: 120,
      render: (r) => {
        const map = { injury: '受伤', move_away: '搬家', dissatisfied: '服务不满', coach_change: '教练变动', price_reason: '价格原因', time_conflict: '时间冲突', health_reason: '健康原因', other: '其他' }
        return map[r] || r
      },
    },
    { title: '退款金额', dataIndex: 'refund_amount', key: 'refund_amount', render: (v) => `¥${v.toLocaleString()}` },
    { title: '违约金', dataIndex: 'penalty_amount', key: 'penalty_amount', render: (v) => `¥${v.toLocaleString()}` },
    { title: '实退金额', dataIndex: 'actual_refund_amount', key: 'actual_refund_amount', render: (v) => `¥${v.toLocaleString()}` },
    { title: '退款课时', dataIndex: 'refund_sessions', key: 'refund_sessions' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s) => {
        const map = { pending: '待审批', approved: '已批准', rejected: '已拒绝', completed: '已完成' }
        const color = { pending: 'processing', approved: 'blue', rejected: 'red', completed: 'green' }
        return <Tag color={color[s]}>{map[s]}</Tag>
      },
    },
    { title: '申请时间', dataIndex: 'apply_date', key: 'apply_date' },
  ]

  const accessColumns = [
    { title: '记录编号', dataIndex: 'record_no', key: 'record_no', width: 140 },
    {
      title: '类型',
      dataIndex: 'access_type',
      key: 'access_type',
      width: 80,
      render: (t) => t === 'entry' ? <Tag color="green">入场</Tag> : <Tag color="blue">出场</Tag>,
    },
    { title: '时间', dataIndex: 'access_time', key: 'access_time', width: 160 },
    { title: '地点', dataIndex: 'device_location', key: 'device_location', width: 120 },
    { title: '验证方式', dataIndex: 'verification_method', key: 'verification_method', width: 100 },
    {
      title: '状态',
      dataIndex: 'is_success',
      key: 'is_success',
      width: 80,
      render: (v) => v ? <Tag color="green">成功</Tag> : <Tag color="red">失败</Tag>,
    },
  ]

  const noteColumns = [
    { title: '备注编号', dataIndex: 'note_no', key: 'note_no', width: 140 },
    { title: '标题', dataIndex: 'title', key: 'title' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s) => {
        const map = { pending: '待处理', in_progress: '处理中', resolved: '已解决', closed: '已关闭' }
        const color = { pending: 'default', in_progress: 'processing', resolved: 'success', closed: 'default' }
        return <Tag color={color[s]}>{map[s]}</Tag>
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (p) => {
        const map = { low: '低', medium: '中', high: '高', urgent: '紧急' }
        const color = { low: 'green', medium: 'blue', high: 'orange', urgent: 'red' }
        return <Tag color={color[p]}>{map[p]}</Tag>
      },
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 120,
      render: (s) => {
        const map = { expiry_warning: '到期提醒', refund: '退款', low_activity: '低活跃', manual: '手动', analysis: '分析' }
        return map[s] || s
      },
    },
    { title: '创建人', dataIndex: 'created_by_name', key: 'created_by_name', width: 100 },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 160 },
    { title: '处理结论', dataIndex: 'conclusion', key: 'conclusion', render: (v) => v || '-' },
  ]

  const levelColorMap = { normal: 'default', silver: 'blue', gold: 'gold', platinum: 'purple' }
  const levelNameMap = { normal: '普通', silver: '银卡', gold: '金卡', platinum: '钻石' }
  const statusColorMap = { active: 'green', expired: 'red', frozen: 'orange', cancelled: 'default' }
  const statusNameMap = { active: '正常', expired: '已过期', frozen: '已冻结', cancelled: '已取消' }

  const daysRemaining = member ? dayjs(member.next_expiry_date).diff(dayjs(), 'day') : 0

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>返回</Button>
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>
            {member?.name || '加载中...'}
            <Tag style={{ marginLeft: 12 }} color={levelColorMap[member?.level]}>
              {levelNameMap[member?.level]}
            </Tag>
            <Tag color={statusColorMap[member?.status]}>
              {statusNameMap[member?.status]}
            </Tag>
          </h1>
          <p className="page-desc" style={{ marginTop: 4 }}>
            会员号: {member?.member_no} | 专属教练: {member?.coach_name}
          </p>
        </div>
      </div>

      {member && (
        <>
          <div className="member-detail-header">
            <Descriptions column={4} bordered size="small">
              <Descriptions.Item label="手机号">{member.phone}</Descriptions.Item>
              <Descriptions.Item label="性别">{member.gender}</Descriptions.Item>
              <Descriptions.Item label="入会日期">{member.join_date}</Descriptions.Item>
              <Descriptions.Item label="上次到店">{member.last_visit_date}</Descriptions.Item>
              <Descriptions.Item label="累计消费">¥{member.total_purchased_amount?.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="已用课时">{member.total_used_sessions}</Descriptions.Item>
              <Descriptions.Item label="剩余课时">{member.remaining_sessions}</Descriptions.Item>
              <Descriptions.Item label="到期时间">
                <span style={{ color: daysRemaining <= 30 ? '#ff4d4f' : '#52c41a' }}>
                  {member.next_expiry_date}（剩余{daysRemaining}天）
                </span>
              </Descriptions.Item>
            </Descriptions>
          </div>

          <div className="tabs-container">
            <Tabs defaultActiveKey="memberships">
              <TabPane tab="会籍卡" key="memberships">
                <Table
                  size="small"
                  columns={[
                    { title: '会籍编号', dataIndex: 'membership_no', key: 'membership_no' },
                    { title: '名称', dataIndex: 'name', key: 'name' },
                    { title: '类型', dataIndex: 'type', key: 'type', render: (t) => t === 'private_coaching' ? '私教' : t === 'group_class' ? '团课' : '综合' },
                    { title: '总课时', dataIndex: 'total_sessions', key: 'total_sessions' },
                    { title: '已用', dataIndex: 'used_sessions', key: 'used_sessions' },
                    { title: '剩余', dataIndex: 'remaining_sessions', key: 'remaining_sessions' },
                    { title: '金额', dataIndex: 'total_amount', key: 'total_amount', render: (v) => `¥${v.toLocaleString()}` },
                    { title: '开始', dataIndex: 'start_date', key: 'start_date' },
                    { title: '到期', dataIndex: 'end_date', key: 'end_date' },
                    {
                      title: '状态',
                      dataIndex: 'status',
                      key: 'status',
                      render: (s) => {
                        const map = { active: '有效', used_up: '已用完', expired: '已过期', frozen: '已冻结' }
                        const color = { active: 'green', used_up: 'default', expired: 'red', frozen: 'orange' }
                        return <Tag color={color[s]}>{map[s]}</Tag>
                      },
                    },
                  ]}
                  dataSource={memberships}
                  rowKey="id"
                  pagination={false}
                />
              </TabPane>

              <TabPane tab="课程记录" key="courses">
                <Table
                  size="small"
                  columns={courseColumns}
                  dataSource={courses.items}
                  rowKey="id"
                  scroll={{ x: 900 }}
                  pagination={{
                    current: courses.page,
                    pageSize: courses.page_size,
                    total: courses.total,
                    showSizeChanger: true,
                    showTotal: (total) => `共 ${total} 条`,
                  }}
                />
              </TabPane>

              <TabPane tab="交易记录" key="transactions">
                <Table
                  size="small"
                  columns={transactionColumns}
                  dataSource={transactions.items}
                  rowKey="id"
                  scroll={{ x: 900 }}
                  pagination={{
                    current: transactions.page,
                    pageSize: transactions.page_size,
                    total: transactions.total,
                    showSizeChanger: true,
                    showTotal: (total) => `共 ${total} 条`,
                  }}
                />
              </TabPane>

              <TabPane tab="退款记录" key="refunds">
                <Table
                  size="small"
                  columns={refundColumns}
                  dataSource={refunds.items}
                  rowKey="id"
                  scroll={{ x: 900 }}
                  pagination={{
                    current: refunds.page,
                    pageSize: refunds.page_size,
                    total: refunds.total,
                    showSizeChanger: true,
                    showTotal: (total) => `共 ${total} 条`,
                  }}
                />
              </TabPane>

              <TabPane tab="门禁记录" key="access">
                <Table
                  size="small"
                  columns={accessColumns}
                  dataSource={accessRecords.items}
                  rowKey="id"
                  pagination={{
                    current: accessRecords.page,
                    pageSize: accessRecords.page_size,
                    total: accessRecords.total,
                    showSizeChanger: true,
                    showTotal: (total) => `共 ${total} 条`,
                  }}
                />
              </TabPane>

              <TabPane tab="续费备注" key="notes">
                <div style={{ marginBottom: 12, textAlign: 'right' }}>
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleAddNote}>
                    添加备注
                  </Button>
                </div>
                <Table
                  size="small"
                  columns={noteColumns}
                  dataSource={notes.items}
                  rowKey="id"
                  scroll={{ x: 900 }}
                  pagination={{
                    current: notes.page,
                    pageSize: notes.page_size,
                    total: notes.total,
                    showSizeChanger: true,
                    showTotal: (total) => `共 ${total} 条`,
                  }}
                />
              </TabPane>
            </Tabs>
          </div>
        </>
      )}

      <Modal
        title="添加续费备注"
        open={noteModalVisible}
        onOk={() => form.submit()}
        onCancel={() => setNoteModalVisible(false)}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitNote}>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入备注标题" />
          </Form.Item>
          <Form.Item name="content" label="内容" rules={[{ required: true, message: '请输入内容' }]}>
            <TextArea rows={4} placeholder="请输入详细备注内容" />
          </Form.Item>
          <Form.Item name="priority" label="优先级">
            <Select defaultValue="medium">
              <Option value="low">低</Option>
              <Option value="medium">中</Option>
              <Option value="high">高</Option>
              <Option value="urgent">紧急</Option>
            </Select>
          </Form.Item>
          <Form.Item name="related_funnel_stage" label="关联漏斗阶段">
            <Select allowClear placeholder="选择关联的漏斗阶段">
              <Option value="total_members">总会员数</Option>
              <Option value="active_members">活跃会员</Option>
              <Option value="expiring_members">即将到期</Option>
              <Option value="contacted_members">已触达会员</Option>
              <Option value="renewed_members">已续费会员</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default MemberDetail
