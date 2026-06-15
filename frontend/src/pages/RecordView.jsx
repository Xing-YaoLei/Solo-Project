import { useEffect, useState } from 'react'
import { Select, Input, Tag, Empty, Space, Tooltip, Divider, Button, Descriptions, Badge, List, Card, Timeline, Spin, message, Modal, Form, Checkbox, Drawer, Alert } from 'antd'
import {
  SearchOutlined, TeamOutlined, FileTextOutlined, FileSearchOutlined,
  PaperClipOutlined, WarningOutlined, CheckCircleOutlined, ClockCircleOutlined,
  EyeOutlined, ReloadOutlined,
} from '@ant-design/icons'
import { reviewsApi, scoresApi, auditApi, advisorsApi } from '../services'
import dayjs from 'dayjs'

const statusMap = {
  pending: { label: '待处理', color: 'default' },
  under_review: { label: '复核中', color: 'processing' },
  materials_missing: { label: '材料缺失', color: 'warning' },
  approved: { label: '已通过', color: 'success' },
  rejected: { label: '已驳回', color: 'error' },
  closed: { label: '已关闭', color: 'default' },
}

export default function RecordView() {
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ grade: '', major: '', class_name: '', review_status: '' })
  const [data, setData] = useState({ students: [], scores: [], reviews: [] })
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [keyword, setKeyword] = useState('')
  const [selectedReview, setSelectedReview] = useState(null)
  const [auditLogs, setAuditLogs] = useState([])
  const [auditDrawer, setAuditDrawer] = useState(false)
  const [materialsModal, setMaterialsModal] = useState(false)
  const [materialForm] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [filters])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await reviewsApi.recordView(filters)
      setData(res.data)
    } catch {}
    setLoading(false)
  }

  const filteredStudents = data.students.filter(s =>
    !keyword || s.name.includes(keyword) || s.student_id.includes(keyword)
  )

  const studentScores = selectedStudent
    ? data.scores.filter(s => s.student_id === selectedStudent.id)
    : []

  const studentReviews = selectedStudent
    ? data.reviews.filter(r => r.student_id === selectedStudent.id)
    : []

  const handleSelectReview = async (review) => {
    setSelectedReview(review)
    if (review.id) {
      try {
        const res = await auditApi.byReview(review.id)
        setAuditLogs(res.data)
      } catch { setAuditLogs([]) }
    }
  }

  const handleMaterialsCheck = async () => {
    const vals = await materialForm.validateFields()
    try {
      await reviewsApi.checkMaterials(selectedReview.id, vals.missing || [])
      message.success('已发送材料缺失通知')
      setMaterialsModal(false)
      loadData()
    } catch {}
  }

  const viewAudit = async (review) => {
    handleSelectReview(review)
    setAuditDrawer(true)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="page-title" style={{ margin: 0 }}>记录台 · 学生名单 / 成绩单 / 复核材料 三栏视图</div>
        <Space>
          <Select
            placeholder="年级"
            allowClear
            style={{ width: 110 }}
            value={filters.grade || undefined}
            onChange={v => setFilters(f => ({ ...f, grade: v || '' }))}
            options={[...new Set(data.students.map(s => s.grade))].filter(Boolean).map(g => ({ label: g, value: g }))}
          />
          <Select
            placeholder="专业"
            allowClear
            style={{ width: 160 }}
            value={filters.major || undefined}
            onChange={v => setFilters(f => ({ ...f, major: v || '' }))}
            options={[...new Set(data.students.map(s => s.major))].filter(Boolean).map(m => ({ label: m, value: m }))}
          />
          <Select
            placeholder="班级"
            allowClear
            style={{ width: 130 }}
            value={filters.class_name || undefined}
            onChange={v => setFilters(f => ({ ...f, class_name: v || '' }))}
            options={[...new Set(data.students.map(s => s.class_name))].filter(Boolean).map(c => ({ label: c, value: c }))}
          />
          <Select
            placeholder="复核状态"
            allowClear
            style={{ width: 130 }}
            value={filters.review_status || undefined}
            onChange={v => setFilters(f => ({ ...f, review_status: v || '' }))}
            options={Object.entries(statusMap).map(([v, { label }]) => ({ label, value: v }))}
          />
          <Button icon={<ReloadOutlined />} onClick={loadData}>刷新</Button>
        </Space>
      </div>

      <div className="record-view">
        <div className="record-panel">
          <div className="record-panel-header">
            <span><TeamOutlined /> 学生名单</span>
            <Tag color="blue">{filteredStudents.length}</Tag>
          </div>
          <div style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="搜索姓名/学号"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              size="small"
              allowClear
            />
          </div>
          <div className="record-panel-body">
            <Spin spinning={loading}>
              {filteredStudents.length === 0 ? (
                <Empty description="无学生" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 40 }} />
              ) : filteredStudents.map(s => {
                const sReviews = data.reviews.filter(r => r.student_id === s.id)
                const hasIssues = sReviews.some(r => r.status === 'materials_missing' || r.status === 'pending')
                return (
                  <div
                    key={s.id}
                    className={`student-item ${selectedStudent?.id === s.id ? 'active' : ''}`}
                    onClick={() => setSelectedStudent(s)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="name">
                        {hasIssues && <Badge dot color="#ff4d4f" offset={[-2, 0]} />} {s.name}
                      </span>
                      {sReviews.length > 0 && <Tag size="small" color="blue">{sReviews.length}条复核</Tag>}
                    </div>
                    <div className="meta">
                      {s.student_id} · {s.major} · {s.class_name}
                    </div>
                    <div className="meta" style={{ color: '#1677ff' }}>
                      导师: {s.advisor_name || '未分配'}
                    </div>
                  </div>
                )
              })}
            </Spin>
          </div>
        </div>

        <div className="record-panel">
          <div className="record-panel-header">
            <span><FileTextOutlined /> 成绩单</span>
            <Space>
              <Tag color="geekblue">{studentScores.length} 门课</Tag>
              {selectedStudent && (
                <Tag color="green">
                  平均 {studentScores.length ? (studentScores.reduce((a, b) => a + b.total_score, 0) / studentScores.length).toFixed(1) : 0}
                </Tag>
              )}
            </Space>
          </div>
          <div className="record-panel-body">
            {!selectedStudent ? (
              <Empty description="请先选择左侧学生" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 60 }} />
            ) : studentScores.length === 0 ? (
              <Empty description="暂无成绩" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 60 }} />
            ) : (
              <div style={{ padding: 4 }}>
                {studentScores.map(sc => {
                  const relatedReview = studentReviews.find(r => r.course_id === sc.course_id)
                  const fail = sc.total_score < 60
                  return (
                    <Card size="small" key={sc.id} style={{ marginBottom: 8, borderLeft: fail ? '3px solid #ff4d4f' : relatedReview ? '3px solid #faad14' : undefined }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500 }}>{sc.course_name}</div>
                          <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
                            {sc.course_code} · {sc.semester} · {sc.teacher_name}
                          </div>
                          <Space size="small" style={{ marginTop: 4 }}>
                            <Tag color={fail ? 'error' : sc.total_score >= 90 ? 'green' : 'default'}>平时 {sc.usual_score}</Tag>
                            <Tag color="blue">期中 {sc.midterm_score}</Tag>
                            <Tag color="purple">期末 {sc.final_score}</Tag>
                          </Space>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 22, fontWeight: 700, color: fail ? '#ff4d4f' : sc.total_score >= 90 ? '#52c41a' : '#262626' }}>
                            {sc.total_score}
                          </div>
                          <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                            绩点 {sc.grade_point} · {sc.score_level}
                          </div>
                          {relatedReview && (
                            <Tag
                              color={statusMap[relatedReview.status]?.color}
                              style={{ marginTop: 4, cursor: 'pointer' }}
                              onClick={() => handleSelectReview(relatedReview)}
                            >
                              复核: {statusMap[relatedReview.status]?.label}
                            </Tag>
                          )}
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="record-panel">
          <div className="record-panel-header">
            <span><FileSearchOutlined /> 复核申请 & 材料</span>
            <Tag color="orange">{studentReviews.length}</Tag>
          </div>
          <div className="record-panel-body">
            {!selectedStudent ? (
              <Empty description="请先选择左侧学生" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 60 }} />
            ) : studentReviews.length === 0 ? (
              <Empty description="暂无复核申请" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 60 }} />
            ) : (
              <div style={{ padding: 4 }}>
                {studentReviews.map(r => {
                  const cfg = statusMap[r.status]
                  return (
                    <Card
                      size="small"
                      key={r.id}
                      style={{
                        marginBottom: 8,
                        border: selectedReview?.id === r.id ? '2px solid #1677ff' : '1px solid #f0f0f0',
                      }}
                      onClick={() => handleSelectReview(r)}
                      hoverable
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ fontWeight: 500 }}>{r.course_name}</div>
                        <Tag color={cfg.color} icon={r.status === 'materials_missing' ? <WarningOutlined /> : r.status === 'approved' ? <CheckCircleOutlined /> : <ClockCircleOutlined />}>
                          {cfg.label}
                        </Tag>
                      </div>
                      <div style={{ fontSize: 12, color: '#595959', marginBottom: 6 }}>
                        申请编号: {r.application_no}
                      </div>
                      <Descriptions size="small" column={2} style={{ marginBottom: 6 }}>
                        <Descriptions.Item label="当前分数" span={1}>{r.current_score}</Descriptions.Item>
                        <Descriptions.Item label="期望分数" span={1}>{r.expected_score || '-'}</Descriptions.Item>
                        <Descriptions.Item label="审核人" span={1}>{r.reviewer_name || '-'}</Descriptions.Item>
                        <Descriptions.Item label="经办人" span={1}>{r.handler_name || '-'}</Descriptions.Item>
                      </Descriptions>
                      <Divider style={{ margin: '8px 0' }} />
                      <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 6 }}>
                        <b>申请理由:</b> {r.reason}
                      </div>
                      {r.materials && r.materials.length > 0 && (
                        <>
                          <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>
                            <PaperClipOutlined /> 已提交材料:
                          </div>
                          <List
                            size="small"
                            dataSource={r.materials}
                            renderItem={m => (
                              <List.Item style={{ padding: '2px 0' }}>
                                <Space>
                                  <PaperClipOutlined />
                                  <a href={m.url} target="_blank">{m.name}</a>
                                  <Tag color="blue">{m.type}</Tag>
                                </Space>
                              </List.Item>
                            )}
                          />
                        </>
                      )}
                      {r.missing_materials && r.missing_materials.length > 0 && (
                        <Alert type="warning" showIcon style={{ marginTop: 6 }} message={
                          <Space>
                            <WarningOutlined />
                            <span>缺失材料:</span>
                            {r.missing_materials.map((mm, i) => <Tag key={i} color="error">{mm}</Tag>)}
                          </Space>
                        } />
                      )}
                      <Space style={{ marginTop: 8 }} wrap>
                        <Button size="small" icon={<EyeOutlined />} onClick={(e) => { e.stopPropagation(); viewAudit(r) }}>审计日志</Button>
                        {r.status === 'under_review' && (
                          <Button size="small" type="primary" danger icon={<WarningOutlined />} onClick={(e) => { e.stopPropagation(); setSelectedReview(r); setMaterialsModal(true) }}>
                            标记材料缺失
                          </Button>
                        )}
                      </Space>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <Drawer
        title={`复核申请审计轨迹${selectedReview ? ` - ${selectedReview.application_no}` : ''}`}
        placement="right"
        width={480}
        open={auditDrawer}
        onClose={() => setAuditDrawer(false)}
      >
        <Timeline
          items={auditLogs.map(l => ({
            color: l.action === 'create' ? 'blue' : l.action === 'status_change' ? 'green' : l.action === 'notify' ? 'orange' : 'gray',
            children: (
              <div>
                <div>
                  <Tag>{l.action}</Tag>
                  <b>{l.operator_name}</b>
                  <span style={{ color: '#8c8c8c', fontSize: 12, marginLeft: 8 }}>{dayjs(l.created_at).format('YYYY-MM-DD HH:mm:ss')}</span>
                </div>
                {l.reason && <div style={{ color: '#595959', marginTop: 4 }}><b>原因:</b> {l.reason}</div>}
                {l.action_taken && <div style={{ color: '#1677ff', marginTop: 4 }}><b>处理动作:</b> {l.action_taken}</div>}
                {l.closed_at && <div style={{ color: '#52c41a', marginTop: 4 }}><b>关闭时间:</b> {dayjs(l.closed_at).format('YYYY-MM-DD HH:mm')}</div>}
                {l.old_values && Object.keys(l.old_values).length > 0 && (
                  <div style={{ marginTop: 4, background: '#fafafa', padding: 6, borderRadius: 4, fontSize: 12 }}>
                    <b style={{ color: '#ff4d4f' }}>原值:</b> {JSON.stringify(l.old_values)}
                  </div>
                )}
                {l.new_values && Object.keys(l.new_values).length > 0 && (
                  <div style={{ marginTop: 4, background: '#f6ffed', padding: 6, borderRadius: 4, fontSize: 12 }}>
                    <b style={{ color: '#52c41a' }}>新值:</b> {JSON.stringify(l.new_values)}
                  </div>
                )}
              </div>
            ),
          }))}
        />
      </Drawer>

      <Modal
        title="标记材料缺失"
        open={materialsModal}
        onCancel={() => setMaterialsModal(false)}
        onOk={handleMaterialsCheck}
        okText="确认并通知相关人员"
      >
        <Form form={materialForm} layout="vertical">
          <Form.Item name="missing" label="请勾选缺失的材料" rules={[{ required: true, message: '请选择缺失材料' }]}>
            <Checkbox.Group>
              <Space direction="vertical">
                <Checkbox value="考试答卷复印件">考试答卷复印件</Checkbox>
                <Checkbox value="平时作业证明">平时作业证明（电子版/纸质扫描）</Checkbox>
                <Checkbox value="考勤记录">考勤记录</Checkbox>
                <Checkbox value="课堂表现证明">课堂表现证明</Checkbox>
                <Checkbox value="实验/实践报告">实验/实践报告</Checkbox>
                <Checkbox value="申诉理由书面说明">申诉理由书面说明（学生签字）</Checkbox>
                <Checkbox value="其他补充材料">其他补充材料</Checkbox>
              </Space>
            </Checkbox.Group>
          </Form.Item>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>
            确认后系统将自动发送通知给学生导师和学工处
          </div>
        </Form>
      </Modal>
    </div>
  )
}
