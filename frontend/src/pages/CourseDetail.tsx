import React, { useState, useMemo } from 'react';
import {
  Row, Col, Card, Tag, Button, Space, Modal, Form, Input, InputNumber,
  Select, Slider, Table, Progress, Timeline, Popover, Divider, message,
  Checkbox, Descriptions, Empty, List, Badge, Typography, Tooltip,
} from 'antd';
import {
  ArrowLeftOutlined, PlusOutlined, EditOutlined, CheckOutlined,
  HistoryOutlined, RiseOutlined, FallOutlined, MinusOutlined,
  PlayCircleOutlined, TrophyOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from '@tanstack/react-router';
import { courseApi, progressApi } from '@/api';
import type { Assignment, Chapter, ProgressRecord, Tag } from '@/types';
import { useAuthStore } from '@/store/auth';
import {
  formatDateTime, formatProgress, getProgressStatusClass, getProgressStatusText,
  getAssignmentTypeText,
} from '@/utils';

const { Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams({ from: '/courses/$courseId' });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const id = Number(courseId);

  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [chapterModal, setChapterModal] = useState(false);
  const [assignmentModal, setAssignmentModal] = useState<number | null>(null);
  const [editAssignment, setEditAssignment] = useState<Assignment | null>(null);
  const [progressModal, setProgressModal] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [chapterForm] = Form.useForm();
  const [assignmentForm] = Form.useForm();
  const [progressForm] = Form.useForm();

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: () => courseApi.get(id),
  });

  const { data: allTags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: () => courseApi.tags(),
  });

  const currentMember = course?.members.find((m) => m.member_id === selectedMemberId)
    || course?.members[0];

  const { data: currentProgress } = useQuery({
    queryKey: ['currentProgress', id, currentMember?.member_id],
    queryFn: () => currentMember ? progressApi.current(id, currentMember.member_id) : null,
    enabled: !!currentMember,
  });

  const { data: progressHistory = [] } = useQuery({
    queryKey: ['progressHistory', id, currentMember?.member_id],
    queryFn: () => currentMember ? progressApi.history(id, currentMember.member_id) : [],
    enabled: !!currentMember,
  });

  React.useEffect(() => {
    if (course?.members?.length && !selectedMemberId) {
      setSelectedMemberId(course.members[0].member_id);
    }
  }, [course]);

  const chapterOrder = useMemo(() => (course?.chapters?.length || 0) + 1, [course]);

  const createChapterMutation = useMutation({
    mutationFn: (data: any) => courseApi.createChapter(id, data),
    onSuccess: () => {
      message.success('章节创建成功');
      setChapterModal(false);
      chapterForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['course', id] });
    },
  });

  const createAssignmentMutation = useMutation({
    mutationFn: ({ chapterId, data }: { chapterId: number; data: any }) =>
      courseApi.createAssignment(chapterId, data),
    onSuccess: () => {
      message.success('作业创建成功');
      setAssignmentModal(null);
      setEditAssignment(null);
      assignmentForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['course', id] });
    },
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: ({ assignmentId, data }: { assignmentId: number; data: any }) =>
      courseApi.updateAssignment(assignmentId, data),
    onSuccess: () => {
      message.success('作业更新成功');
      setAssignmentModal(null);
      setEditAssignment(null);
      assignmentForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['course', id] });
    },
  });

  const toggleAssignmentCompleteMutation = useMutation({
    mutationFn: ({ assignmentId, isCompleted }: { assignmentId: number; isCompleted: boolean }) =>
      courseApi.updateAssignment(assignmentId, { is_completed: isCompleted }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', id] });
    },
  });

  const updateChapterMutation = useMutation({
    mutationFn: ({ chapterId, data }: { chapterId: number; data: any }) =>
      courseApi.updateChapter(chapterId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', id] });
    },
  });

  const createProgressMutation = useMutation({
    mutationFn: (data: any) => progressApi.create(data),
    onSuccess: () => {
      message.success('进度记录已保存');
      setProgressModal(false);
      progressForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['currentProgress', id, currentMember?.member_id] });
      queryClient.invalidateQueries({ queryKey: ['progressHistory', id, currentMember?.member_id] });
      queryClient.invalidateQueries({ queryKey: ['course', id] });
    },
  });

  const handleCreateChapter = async () => {
    const values = await chapterForm.validateFields();
    createChapterMutation.mutate({ course_id: id, ...values, chapter_order: values.chapter_order || chapterOrder });
  };

  const handleSubmitAssignment = async () => {
    const values = await assignmentForm.validateFields();
    if (editAssignment) {
      updateAssignmentMutation.mutate({ assignmentId: editAssignment.id, data: values });
    } else if (assignmentModal) {
      createAssignmentMutation.mutate({ chapterId: assignmentModal, data: values });
    }
  };

  const handleSubmitProgress = async () => {
    if (!currentMember || !user) return;
    const values = await progressForm.validateFields();
    createProgressMutation.mutate({
      course_id: id,
      member_id: currentMember.member_id,
      operator_id: user.id,
      ...values,
    });
  };

  const handleChapterComplete = async (chapter: Chapter) => {
    updateChapterMutation.mutate({
      chapterId: chapter.id,
      data: { is_completed: !chapter.is_completed },
    });
  };

  const handleToggleAssignment = async (assignment: Assignment) => {
    toggleAssignmentCompleteMutation.mutate({
      assignmentId: assignment.id,
      isCompleted: !assignment.is_completed,
    });
  };

  const openEditAssignment = (assignment: Assignment) => {
    setEditAssignment(assignment);
    setAssignmentModal(assignment.chapter_id);
    assignmentForm.setFieldsValue({
      title: assignment.title,
      description: assignment.description,
      assignment_type: assignment.assignment_type,
      sets: assignment.sets,
      reps: assignment.reps,
      weight: assignment.weight,
      duration_minutes: assignment.duration_minutes,
      member_note: assignment.member_note,
      trainer_feedback: assignment.trainer_feedback,
      is_completed: assignment.is_completed,
      tag_ids: assignment.tags.map((t) => t.tag_id),
    });
  };

  const sortedChapters = useMemo(
    () => [...(course?.chapters || [])].sort((a, b) => a.chapter_order - b.chapter_order),
    [course]
  );

  if (isLoading || !course) {
    return <div className="text-center p-8">加载中...</div>;
  }

  const totalAssignments = sortedChapters.reduce((acc, c) => acc + c.assignments.length, 0);
  const completedAssignments = sortedChapters.reduce(
    (acc, c) => acc + c.assignments.filter((a) => a.is_completed).length, 0
  );
  const completedChapters = sortedChapters.filter((c) => c.is_completed).length;

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate({ to: '/courses' })}>
          返回课程列表
        </Button>
      </Space>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 300 }}>
            <h2 style={{ margin: 0, marginBottom: 8 }}>{course.name}</h2>
            <Paragraph type="secondary" style={{ marginBottom: 16 }}>
              {course.description || '暂无描述'}
            </Paragraph>
            <Descriptions size="small" column={3} style={{ marginBottom: 8 }}>
              <Descriptions.Item label="教练">{course.trainer.full_name}</Descriptions.Item>
              <Descriptions.Item label="总课时">{course.total_sessions}节</Descriptions.Item>
              <Descriptions.Item label="总时长">{course.total_duration_hours}小时</Descriptions.Item>
              <Descriptions.Item label="开始">{course.start_date || '-'}</Descriptions.Item>
              <Descriptions.Item label="结束">{course.end_date || '-'}</Descriptions.Item>
              <Descriptions.Item label="学员数">{course.members.length}人</Descriptions.Item>
            </Descriptions>
          </div>

          <div style={{ minWidth: 280 }}>
            <div style={{ marginBottom: 12 }}>
              <Select
                style={{ width: '100%' }}
                placeholder="选择学员查看进度"
                value={currentMember?.member_id}
                onChange={(v) => setSelectedMemberId(v)}
              >
                {course.members.map((m) => (
                  <Option key={m.member_id} value={m.member_id}>
                    {m.member.full_name}
                  </Option>
                ))}
              </Select>
            </div>
            {currentProgress && currentMember && (
              <Row gutter={12}>
                <Col span={12}>
                  <Card size="small">
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>预期进度</div>
                    <Progress
                      percent={Math.round(currentProgress.expected_progress)}
                      size="small"
                      type="dashboard"
                      width={80}
                      strokeColor="#6366f1"
                    />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small">
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>实际进度</div>
                    <Progress
                      percent={Math.round(currentProgress.actual_progress)}
                      size="small"
                      type="dashboard"
                      width={80}
                      strokeColor={currentProgress.is_behind ? '#dc2626' : '#16a34a'}
                    />
                    <div style={{ marginTop: 4, textAlign: 'center' }}>
                      <span className={`progress-badge ${getProgressStatusClass(currentProgress.actual_progress, currentProgress.expected_progress)}`}>
                        {getProgressStatusText(currentProgress.actual_progress, currentProgress.expected_progress)}
                      </span>
                    </div>
                  </Card>
                </Col>
              </Row>
            )}
          </div>
        </div>

        {currentMember && (
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button icon={<HistoryOutlined />} onClick={() => setHistoryVisible(true)}>
              变更历史 ({progressHistory.length})
            </Button>
            <Button type="primary" icon={<EditOutlined />} onClick={() => setProgressModal(true)}>
              记录进度
            </Button>
          </div>
        )}
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card
            title={
              <Space>
                <span>📚 课程章节与作业</span>
                <Tag color="blue">{sortedChapters.length}章</Tag>
                <Tag color="purple">{totalAssignments}个作业</Tag>
                <Tag color="green">已完成{completedAssignments}个</Tag>
              </Space>
            }
            extra={
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setChapterModal(true)}>
                新增章节
              </Button>
            }
          >
            {sortedChapters.length === 0 ? (
              <Empty description="还没有章节，开始创建吧" />
            ) : (
              <div>
                {sortedChapters.map((chapter, idx) => {
                  const chCompleted = chapter.assignments.filter((a) => a.is_completed).length;
                  const chTotal = chapter.assignments.length;
                  const chProgress = chTotal > 0 ? Math.round((chCompleted / chTotal) * 100) : 0;

                  return (
                    <div key={chapter.id} style={{ marginBottom: idx === sortedChapters.length - 1 ? 0 : 24 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 16px',
                          background: chapter.is_completed ? '#f0fdf4' : '#f8fafc',
                          borderRadius: 8,
                          marginBottom: 12,
                          border: chapter.is_completed ? '1px solid #86efac' : '1px solid #e2e8f0',
                        }}
                      >
                        <Space>
                          <Badge
                            count={chapter.is_completed ? <CheckOutlined /> : idx + 1}
                            style={{
                              backgroundColor: chapter.is_completed ? '#16a34a' : '#3b82f6',
                              minWidth: 28,
                              height: 28,
                            }}
                          />
                          <div>
                            <div style={{ fontWeight: 500, fontSize: 15, color: chapter.is_completed ? '#16a34a' : '#1e293b' }}>
                              {chapter.title}
                              {chapter.duration_minutes > 0 && (
                                <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                                  <ClockCircleOutlined /> {chapter.duration_minutes}分钟
                                </Text>
                              )}
                            </div>
                            <div style={{ fontSize: 12, color: '#64748b' }}>
                              {chapter.description || '无描述'}
                            </div>
                          </div>
                        </Space>
                        <Space>
                          {chTotal > 0 && (
                            <Tooltip title={`${chCompleted}/${chTotal} 作业完成`}>
                              <Progress percent={chProgress} size="small" style={{ width: 120 }} />
                            </Tooltip>
                          )}
                          <Checkbox
                            checked={chapter.is_completed}
                            onChange={() => handleChapterComplete(chapter)}
                          >
                            <Text style={{ fontSize: 12 }}>章节完成</Text>
                          </Checkbox>
                          <Button
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={() => { setAssignmentModal(chapter.id); setEditAssignment(null); assignmentForm.resetFields(); }}
                          >
                            加作业
                          </Button>
                        </Space>
                      </div>

                      {chapter.assignments.length > 0 && (
                        <div style={{ marginLeft: 20, borderLeft: '2px dashed #cbd5e1', paddingLeft: 16 }}>
                          {chapter.assignments.map((assignment) => (
                            <div
                              key={assignment.id}
                              style={{
                                padding: 12,
                                marginBottom: 8,
                                borderRadius: 6,
                                background: assignment.is_completed ? '#f0fdf4' : '#fff',
                                border: '1px solid ' + (assignment.is_completed ? '#bbf7d0' : '#e2e8f0'),
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
                                <Space direction="vertical" size={4} style={{ flex: 1 }}>
                                  <Space>
                                    <Checkbox
                                      checked={assignment.is_completed}
                                      onChange={() => handleToggleAssignment(assignment)}
                                    />
                                    <span style={{
                                      fontWeight: 500,
                                      textDecoration: assignment.is_completed ? 'line-through' : 'none',
                                      color: assignment.is_completed ? '#94a3b8' : '#1e293b',
                                    }}>
                                      {assignment.title}
                                    </span>
                                    <Tag color="blue">{getAssignmentTypeText(assignment.assignment_type)}</Tag>
                                    {assignment.tags.map((at) => (
                                      <Tag key={at.id} color={at.tag.color} style={{ border: 0, color: '#fff' }}>
                                        {at.tag.name}
                                      </Tag>
                                    ))}
                                  </Space>
                                  <Space size="large" style={{ fontSize: 12, color: '#64748b' }}>
                                    {assignment.sets != null && <span>组数: {assignment.sets}</span>}
                                    {assignment.reps && <span>次数: {assignment.reps}</span>}
                                    {assignment.weight != null && <span>重量: {assignment.weight}kg</span>}
                                    {assignment.duration_minutes != null && <span>时长: {assignment.duration_minutes}分钟</span>}
                                  </Space>
                                  {assignment.description && (
                                    <div style={{ fontSize: 12, color: '#64748b' }}>
                                      说明: {assignment.description}
                                    </div>
                                  )}
                                  <Space style={{ marginTop: 4 }}>
                                    {assignment.member_note && (
                                      <Text type="secondary" style={{ fontSize: 12 }}>
                                        💬 学员备注: {assignment.member_note}
                                      </Text>
                                    )}
                                    {assignment.trainer_feedback && (
                                      <Text type="secondary" style={{ fontSize: 12 }}>
                                        🎯 教练反馈: {assignment.trainer_feedback}
                                      </Text>
                                    )}
                                  </Space>
                                  {assignment.completed_at && (
                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                      ✅ {formatDateTime(assignment.completed_at)} 完成
                                    </Text>
                                  )}
                                </Space>
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<EditOutlined />}
                                  onClick={() => openEditAssignment(assignment)}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <Card
            title={
              <Space>
                <span>🏷️ 题目标签</span>
                <Tag color="cyan">{allTags.length}</Tag>
              </Space>
            }
            style={{ marginBottom: 16 }}
            bodyStyle={{ padding: 12 }}
          >
            {allTags.length === 0 ? (
              <Empty description="暂无标签" style={{ padding: 16 }} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Space size={[8, 8]} wrap>
                {allTags.map((tag: Tag) => (
                  <Tag
                    key={tag.id}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 16,
                      background: tag.color,
                      color: '#fff',
                      border: 0,
                      fontSize: 13,
                    }}
                  >
                    {tag.name}
                  </Tag>
                ))}
              </Space>
            )}
          </Card>

          <Card
            title={
              <Space>
                <span>📊 统计概览</span>
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Row gutter={[8, 8]}>
              <Col span={12}>
                <div style={{ padding: 8, background: '#eff6ff', borderRadius: 6, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#1e40af', marginBottom: 2 }}>章节总数</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: '#1d4ed8' }}>{sortedChapters.length}</div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ padding: 8, background: '#f0fdf4', borderRadius: 6, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#166534', marginBottom: 2 }}>章节完成</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: '#15803d' }}>{completedChapters}</div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ padding: 8, background: '#fef3c7', borderRadius: 6, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#92400e', marginBottom: 2 }}>作业总数</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: '#b45309' }}>{totalAssignments}</div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ padding: 8, background: '#ede9fe', borderRadius: 6, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#6b21a8', marginBottom: 2 }}>作业完成</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: '#7c3aed' }}>{completedAssignments}</div>
                </div>
              </Col>
            </Row>
          </Card>

          <Card
            title={
              <Space>
                <HistoryOutlined style={{ color: '#6366f1' }} />
                <span>最近变更</span>
              </Space>
            }
            extra={
              progressHistory.length > 5 && (
                <a onClick={() => setHistoryVisible(true)}>查看全部</a>
              )
            }
          >
            {progressHistory.length === 0 ? (
              <Empty description="暂无进度记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Timeline
                style={{ padding: 0 }}
                items={progressHistory.slice(0, 5).map((record: ProgressRecord) => ({
                  dot: record.new_progress > record.old_progress
                    ? <RiseOutlined style={{ color: '#16a34a' }} />
                    : record.new_progress < record.old_progress
                    ? <FallOutlined style={{ color: '#dc2626' }} />
                    : <MinusOutlined style={{ color: '#64748b' }} />,
                  children: (
                    <div style={{ padding: 4 }}>
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                        {formatDateTime(record.created_at)}
                      </div>
                      <div style={{ fontSize: 13 }}>
                        <Text strong>{record.operator.full_name}</Text>
                        <span style={{ margin: '0 4px' }}>操作</span>
                        <span>
                          <Text delete={true} type={record.new_progress > record.old_progress ? 'danger' : 'success'}>
                            {record.old_progress.toFixed(2)}%
                          </Text>
                          <span style={{ margin: '0 6px' }}>→</span>
                          <Text strong style={{ color: record.new_progress > record.old_progress ? '#16a34a' : '#dc2626' }}>
                            {record.new_progress.toFixed(2)}%
                          </Text>
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                        消耗 {record.consumed_sessions} 节 · 剩余 {record.remaining_sessions} 节
                      </div>
                      {record.change_reason && (
                        <div style={{ fontSize: 12, color: '#6366f1', marginTop: 2 }}>
                          原因: {record.change_reason}
                        </div>
                      )}
                    </div>
                  ),
                }))}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title="新增章节"
        open={chapterModal}
        onOk={handleCreateChapter}
        onCancel={() => { setChapterModal(false); chapterForm.resetFields(); }}
        confirmLoading={createChapterMutation.isPending}
        destroyOnClose
        width={500}
      >
        <Form form={chapterForm} layout="vertical">
          <Form.Item name="title" label="章节标题" rules={[{ required: true }]}>
            <Input placeholder="如：第1章 - 基础力量训练" />
          </Form.Item>
          <Form.Item name="description" label="章节描述">
            <TextArea rows={2} />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item name="chapter_order" label="章节顺序" style={{ flex: 1 }} initialValue={chapterOrder}>
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="duration_minutes" label="预计时长(分钟)" style={{ flex: 1 }} initialValue={0}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>

      <Modal
        title={editAssignment ? "编辑作业" : "新增作业"}
        open={assignmentModal !== null}
        onOk={handleSubmitAssignment}
        onCancel={() => { setAssignmentModal(null); setEditAssignment(null); assignmentForm.resetFields(); }}
        confirmLoading={createAssignmentMutation.isPending || updateAssignmentMutation.isPending}
        destroyOnClose
        width={560}
      >
        <Form form={assignmentForm} layout="vertical">
          <Form.Item name="title" label="作业标题" rules={[{ required: true }]}>
            <Input placeholder="如：杠铃深蹲训练" />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item name="assignment_type" label="作业类型" style={{ flex: 1 }} rules={[{ required: true }]} initialValue="exercise">
              <Select>
                <Option value="exercise">力量训练</Option>
                <Option value="cardio">有氧运动</Option>
                <Option value="nutrition">饮食指导</Option>
                <Option value="assessment">评估测试</Option>
              </Select>
            </Form.Item>
            <Form.Item name="duration_minutes" label="时长(分钟)" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }}>
            <Form.Item name="sets" label="组数" style={{ flex: 1 }}>
              <InputNumber min={1} style={{ width: '100%' }} placeholder="如：4" />
            </Form.Item>
            <Form.Item name="reps" label="次数" style={{ flex: 1 }}>
              <Input placeholder="如：8-12" />
            </Form.Item>
            <Form.Item name="weight" label="重量(kg)" style={{ flex: 1 }}>
              <InputNumber min={0} step={2.5} style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Form.Item name="tag_ids" label="标签">
            <Select mode="multiple" placeholder="选择题目标签">
              {allTags.map((t: Tag) => (
                <Option key={t.id} value={t.id}>
                  <Tag color={t.color} style={{ margin: 0, color: '#fff', border: 0 }}>{t.name}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="description" label="作业说明">
            <TextArea rows={2} placeholder="详细动作说明、注意事项等" />
          </Form.Item>
          <Form.Item name="member_note" label="学员备注">
            <TextArea rows={1} placeholder="学员可填写的感受或问题" />
          </Form.Item>
          {editAssignment && user?.role !== 'member' && (
            <Form.Item name="trainer_feedback" label="教练反馈">
              <TextArea rows={2} placeholder="教练给予的反馈意见" />
            </Form.Item>
          )}
          {editAssignment && (
            <Form.Item name="is_completed" label="完成状态" valuePropName="checked">
              <Checkbox>标记为已完成</Checkbox>
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Modal
        title="记录学习进度"
        open={progressModal}
        onOk={handleSubmitProgress}
        onCancel={() => { setProgressModal(false); progressForm.resetFields(); }}
        confirmLoading={createProgressMutation.isPending}
        destroyOnClose
        width={520}
      >
        {currentMember && (
          <Form
            form={progressForm}
            layout="vertical"
            initialValues={{
              new_progress: currentProgress?.actual_progress || 0,
            }}
          >
            <div style={{
              padding: 12,
              background: '#f8fafc',
              borderRadius: 8,
              marginBottom: 16,
              fontSize: 13,
            }}>
              <div style={{ marginBottom: 8 }}>
                <strong>学员：</strong>{currentMember.member.full_name}
              </div>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>当前进度：</span>
                  <Text strong>{formatProgress(currentProgress?.actual_progress || 0)}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>预期进度：</span>
                  <Text strong>{formatProgress(currentProgress?.expected_progress || 0)}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>总课时：</span>
                  <Text strong>{course.total_sessions}节</Text>
                </div>
              </Space>
            </div>

            <Form.Item
              label={
                <Space>
                  <span>新进度值</span>
                </Space>
              }
              name="new_progress"
              rules={[{ required: true, message: '请设置进度' }]}
            >
              <div style={{ padding: '0 8px' }}>
                <Slider min={0} max={100} step={1} />
                <div style={{ textAlign: 'center', marginTop: -4, fontSize: 18, fontWeight: 600, color: '#3b82f6' }}>
                  <Form.Item name="new_progress" noStyle>
                    <InputNumber
                      min={0}
                      max={100}
                      step={0.1}
                      formatter={(v) => `${v}%`}
                      parser={(v) => Number((v || '0').replace('%', ''))}
                      style={{ width: 140, textAlign: 'center' }}
                    />
                  </Form.Item>
                </div>
              </div>
            </Form.Item>

            <Space style={{ width: '100%' }}>
              <Form.Item
                label="消耗课时"
                name="consumed_sessions"
                style={{ flex: 1 }}
                rules={[{ required: true }]}
                initialValue={0}
              >
                <InputNumber min={0} max={course.total_sessions} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item
                label="剩余课时"
                name="remaining_sessions"
                style={{ flex: 1 }}
                rules={[{ required: true }]}
                initialValue={course.total_sessions}
              >
                <InputNumber min={0} max={course.total_sessions} style={{ width: '100%' }} />
              </Form.Item>
            </Space>

            <Form.Item label="变更原因/备注" name="change_reason">
              <TextArea rows={3} placeholder="记录本次进度变化的原因" />
            </Form.Item>
          </Form>
        )}
      </Modal>

      <Modal
        title={
          <Space>
            <HistoryOutlined />
            <span>进度变更历史 - {currentMember?.member.full_name}</span>
          </Space>
        }
        open={historyVisible}
        onCancel={() => setHistoryVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        {progressHistory.length === 0 ? (
          <Empty description="暂无变更记录" />
        ) : (
          <Table
            rowKey="id"
            size="small"
            dataSource={progressHistory}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            columns={[
              {
                title: '时间',
                dataIndex: 'created_at',
                width: 160,
                render: (t) => formatDateTime(t),
              },
              {
                title: '操作人',
                dataIndex: ['operator', 'full_name'],
                width: 100,
              },
              {
                title: '进度变更',
                width: 200,
                render: (_: any, r: ProgressRecord) => {
                  const isUp = r.new_progress > r.old_progress;
                  const isDown = r.new_progress < r.old_progress;
                  return (
                    <Space>
                      <Tag color={isDown ? 'red' : isUp ? 'green' : 'default'} style={{ textDecoration: 'line-through' }}>
                        {r.old_progress.toFixed(2)}%
                      </Tag>
                      <span>→</span>
                      <Tag color={isDown ? 'volcano' : isUp ? 'cyan' : 'default'} style={{ fontWeight: 600 }}>
                        {r.new_progress.toFixed(2)}%
                      </Tag>
                      {isUp && <RiseOutlined style={{ color: '#16a34a' }} />}
                      {isDown && <FallOutlined style={{ color: '#dc2626' }} />}
                    </Space>
                  );
                },
              },
              {
                title: '课时',
                width: 140,
                render: (_: any, r: ProgressRecord) => (
                  <Space size="small">
                    <Tag color="blue">消耗 {r.consumed_sessions}</Tag>
                    <Tag color="purple">剩余 {r.remaining_sessions}</Tag>
                  </Space>
                ),
              },
              {
                title: '状态',
                dataIndex: 'progress_status',
                width: 80,
                render: (s) => {
                  const map: any = {
                    on_track: <Tag color="green">正常</Tag>,
                    behind: <Tag color="red">落后</Tag>,
                    ahead: <Tag color="blue">超前</Tag>,
                  };
                  return map[s] || s;
                },
              },
              {
                title: '变更原因',
                dataIndex: 'change_reason',
                ellipsis: true,
                render: (v) => v || '-',
              },
            ]}
          />
        )}
      </Modal>
    </div>
  );
};

export default CourseDetailPage;
