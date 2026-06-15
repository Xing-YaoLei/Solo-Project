import { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Select,
  Progress,
  Tag,
  List,
  Badge,
  Descriptions,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Space,
  Divider,
  message,
} from 'antd';
import {
  BookOutlined,
  EditOutlined,
  FileTextOutlined,
  TagsOutlined,
  HistoryOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import type { LearningProgressDetail, ProgressHistory, ProgressStatus } from '../types';
import { progressApi, certificateApi } from '../api/progress';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const mockProgresses: LearningProgressDetail[] = [
  {
    progress: {
      id: 1,
      userId: 3,
      userName: '李学员',
      certificateId: 1,
      certificateName: '一级建造师',
      courseId: 1,
      courseName: '建设工程经济',
      completionRate: 35.5,
      targetRate: 60,
      startDate: '2025-03-01T00:00:00Z',
      targetDate: '2025-08-31T00:00:00Z',
      status: 3,
      statusText: '进度落后',
      note: '学习进度落后，需要加快节奏',
      createdAt: '2025-03-01T00:00:00Z',
      updatedAt: '2025-05-20T00:00:00Z',
    },
    chapters: [
      {
        id: 1,
        title: '第一章 资金时间价值',
        courseId: 1,
        sortOrder: 1,
        estimatedHours: 8,
        isActive: true,
        questionTags: [
          { id: 1, name: '资金等值计算', questionCount: 5, difficulty: 2, difficultyText: '中等' },
          { id: 2, name: '名义利率与有效利率', questionCount: 3, difficulty: 3, difficultyText: '困难' },
        ],
      },
      {
        id: 2,
        title: '第二章 工程经济评价',
        courseId: 1,
        sortOrder: 2,
        estimatedHours: 12,
        isActive: true,
        questionTags: [
          { id: 3, name: '净现值计算', questionCount: 6, difficulty: 2, difficultyText: '中等' },
        ],
      },
      {
        id: 3,
        title: '第三章 投资方案经济效果评价',
        courseId: 1,
        sortOrder: 3,
        estimatedHours: 10,
        isActive: true,
        questionTags: [],
      },
    ],
    assignmentRecords: [
      {
        id: 1,
        assignmentId: 1,
        assignmentTitle: '第一章课后练习',
        assignmentType: 3,
        assignmentTypeText: '课后作业',
        userId: 3,
        correctCount: 15,
        totalQuestions: 20,
        score: 75,
        startedAt: '2025-03-20T10:00:00Z',
        submittedAt: '2025-03-20T11:30:00Z',
        status: 2,
        statusText: '已提交',
      },
      {
        id: 2,
        assignmentId: 2,
        assignmentTitle: '第二章课后练习',
        assignmentType: 3,
        assignmentTypeText: '课后作业',
        userId: 3,
        correctCount: 0,
        totalQuestions: 25,
        score: 0,
        status: 0,
        statusText: '未开始',
      },
    ],
    questionTags: [
      { id: 1, name: '资金等值计算', questionCount: 5, difficulty: 2, difficultyText: '中等', chapterId: 1 },
      { id: 2, name: '名义利率与有效利率', questionCount: 3, difficulty: 3, difficultyText: '困难', chapterId: 1 },
      { id: 3, name: '净现值计算', questionCount: 6, difficulty: 2, difficultyText: '中等', chapterId: 2 },
    ],
    history: [
      {
        id: 2,
        learningProgressId: 1,
        oldCompletionRate: 20,
        newCompletionRate: 35.5,
        oldStatus: 1,
        oldStatusText: '进行中',
        newStatus: 3,
        newStatusText: '进度落后',
        oldNote: undefined,
        newNote: '学习进度落后，需要加快节奏',
        changedByUserId: 2,
        changedByName: '张老师',
        changeReason: '老师评估后调整状态',
        changedAt: '2025-05-20T00:00:00Z',
      },
      {
        id: 1,
        learningProgressId: 1,
        oldCompletionRate: 0,
        newCompletionRate: 20,
        oldStatus: 0,
        oldStatusText: '未开始',
        newStatus: 1,
        newStatusText: '进行中',
        changedByUserId: 3,
        changedByName: '李学员',
        changeReason: '开始学习第一章',
        changedAt: '2025-03-10T00:00:00Z',
      },
    ],
  },
  {
    progress: {
      id: 2,
      userId: 3,
      userName: '李学员',
      certificateId: 1,
      certificateName: '一级建造师',
      courseId: 2,
      courseName: '建设工程项目管理',
      completionRate: 72,
      targetRate: 65,
      startDate: '2025-03-15T00:00:00Z',
      targetDate: '2025-08-31T00:00:00Z',
      status: 2,
      statusText: '正常推进',
      note: '进度良好',
      createdAt: '2025-03-15T00:00:00Z',
      updatedAt: '2025-05-15T00:00:00Z',
    },
    chapters: [
      {
        id: 4,
        title: '第一章 项目组织与管理',
        courseId: 2,
        sortOrder: 1,
        estimatedHours: 6,
        isActive: true,
        questionTags: [],
      },
    ],
    assignmentRecords: [],
    questionTags: [],
    history: [],
  },
];

function RecordsPage() {
  const [selectedProgressId, setSelectedProgressId] = useState<number>(1);
  const [detail, setDetail] = useState<LearningProgressDetail | null>(null);
  const [progressList, setProgressList] = useState<{ id: number; courseName?: string; certificateName?: string }[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProgressList();
    loadDetail();
  }, [selectedProgressId]);

  const loadProgressList = () => {
    const list = mockProgresses.map((p) => ({
      id: p.progress.id,
      courseName: p.progress.courseName,
      certificateName: p.progress.certificateName,
    }));
    setProgressList(list);
  };

  const loadDetail = () => {
    const found = mockProgresses.find((p) => p.progress.id === selectedProgressId);
    setDetail(found || null);
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'default';
      case 1: return 'processing';
      case 2: return 'success';
      case 3: return 'warning';
      case 4: return 'success';
      case 5: return 'default';
      default: return 'default';
    }
  };

  const getDifficultyClass = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'tag-easy';
      case 2: return 'tag-medium';
      case 3: return 'tag-hard';
      default: return 'tag-medium';
    }
  };

  const handleEditProgress = () => {
    if (!detail) return;
    form.setFieldsValue({
      completionRate: detail.progress.completionRate,
      status: detail.progress.status,
      note: detail.progress.note,
      changeReason: '',
    });
    setEditModalVisible(true);
  };

  const handleSaveProgress = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      message.success('进度更新成功');
      setEditModalVisible(false);
      setLoading(false);

      if (detail) {
        const newHistory: ProgressHistory = {
          id: Date.now(),
          learningProgressId: detail.progress.id,
          oldCompletionRate: detail.progress.completionRate,
          newCompletionRate: values.completionRate,
          oldStatus: detail.progress.status,
          oldStatusText: detail.progress.statusText,
          newStatus: values.status,
          newStatusText: getStatusText(values.status),
          oldNote: detail.progress.note,
          newNote: values.note,
          changedByUserId: 2,
          changedByName: '张老师',
          changeReason: values.changeReason,
          changedAt: new Date().toISOString(),
        };

        setDetail({
          ...detail,
          progress: {
            ...detail.progress,
            completionRate: values.completionRate,
            status: values.status,
            statusText: getStatusText(values.status),
            note: values.note,
            updatedAt: new Date().toISOString(),
          },
          history: [newHistory, ...detail.history],
        });
      }
    } catch (error) {
      setLoading(false);
    }
  };

  const getStatusText = (status: number) => {
    const texts = ['未开始', '进行中', '正常推进', '进度落后', '已完成', '已暂停'];
    return texts[status] || '未知';
  };

  if (!detail) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>学习记录</h2>
        <Space>
          <Select
            style={{ width: 300 }}
            value={selectedProgressId}
            onChange={setSelectedProgressId}
            placeholder="选择学习进度"
          >
            {progressList.map((p) => (
              <Option key={p.id} value={p.id}>
                {p.certificateName} - {p.courseName}
              </Option>
            ))}
          </Select>
          <Button type="primary" icon={<EditOutlined />} onClick={handleEditProgress}>
            更新进度
          </Button>
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions title="学习进度概览" column={3}>
          <Descriptions.Item label="学员">{detail.progress.userName}</Descriptions.Item>
          <Descriptions.Item label="证书">{detail.progress.certificateName}</Descriptions.Item>
          <Descriptions.Item label="课程">{detail.progress.courseName}</Descriptions.Item>
          <Descriptions.Item label="当前进度">
            <Progress
              percent={detail.progress.completionRate}
              status={detail.progress.status === 3 ? 'exception' : 'active'}
            />
          </Descriptions.Item>
          <Descriptions.Item label="目标进度">
            <span style={{ color: '#52c41a', fontWeight: 'bold' }}>{detail.progress.targetRate}%</span>
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={getStatusColor(detail.progress.status)}>{detail.progress.statusText}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="开始日期">
            {dayjs(detail.progress.startDate).format('YYYY-MM-DD')}
          </Descriptions.Item>
          <Descriptions.Item label="目标日期">
            {dayjs(detail.progress.targetDate).format('YYYY-MM-DD')}
          </Descriptions.Item>
          <Descriptions.Item label="备注">{detail.progress.note || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Row gutter={16}>
        <Col span={12}>
          <Card
            title={
              <span>
                <BookOutlined style={{ marginRight: 8 }} />
                课程章节 ({detail.chapters.length})
              </span>
            }
            style={{ marginBottom: 16 }}
          >
            <List
              dataSource={detail.chapters}
              renderItem={(chapter) => (
                <List.Item className="chapter-item">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>{chapter.title}</div>
                    <div style={{ color: '#8c8c8c', fontSize: 13 }}>
                      预计 {chapter.estimatedHours} 小时
                    </div>
                    {chapter.questionTags && chapter.questionTags.length > 0 && (
                      <div style={{ marginTop: 6 }}>
                        {chapter.questionTags.map((tag) => (
                          <span
                            key={tag.id}
                            className={`question-tag ${getDifficultyClass(tag.difficulty)}`}
                          >
                            {tag.name} ({tag.questionCount}题)
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col span={12}>
          <Card
            title={
              <span>
                <FileTextOutlined style={{ marginRight: 8 }} />
                作业记录 ({detail.assignmentRecords.length})
              </span>
            }
            style={{ marginBottom: 16 }}
          >
            {detail.assignmentRecords.length > 0 ? (
              <List
                dataSource={detail.assignmentRecords}
                renderItem={(record) => (
                  <List.Item className="chapter-item">
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 500 }}>{record.assignmentTitle}</span>
                        <Tag>{record.assignmentTypeText}</Tag>
                      </div>
                      <div style={{ marginTop: 6 }}>
                        {record.status === 0 ? (
                          <span style={{ color: '#8c8c8c' }}>未开始</span>
                        ) : (
                          <span>
                            得分：<strong>{record.score}</strong> 分
                            （{record.correctCount}/{record.totalQuestions}）
                          </span>
                        )}
                      </div>
                      {record.submittedAt && (
                        <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 4 }}>
                          提交于 {dayjs(record.submittedAt).format('YYYY-MM-DD HH:mm')}
                        </div>
                      )}
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', color: '#8c8c8c', padding: 20 }}>
                暂无作业记录
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card
            title={
              <span>
                <TagsOutlined style={{ marginRight: 8 }} />
                题目标签 ({detail.questionTags.length})
              </span>
            }
            style={{ marginBottom: 16 }}
          >
            {detail.questionTags.length > 0 ? (
              <div>
                {detail.questionTags.map((tag) => (
                  <div
                    key={tag.id}
                    style={{
                      display: 'inline-block',
                      margin: 4,
                      padding: '6px 12px',
                      borderRadius: 4,
                      background: '#f5f5f5',
                    }}
                  >
                    <span className={`question-tag ${getDifficultyClass(tag.difficulty)}`}>
                      {tag.difficultyText}
                    </span>
                    <span style={{ marginLeft: 4 }}>{tag.name}</span>
                    <span style={{ color: '#8c8c8c', fontSize: 12, marginLeft: 6 }}>
                      {tag.questionCount}题
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#8c8c8c', padding: 20 }}>
                暂无标签
              </div>
            )}
          </Card>
        </Col>

        <Col span={12}>
          <Card
            title={
              <span>
                <HistoryOutlined style={{ marginRight: 8 }} />
                进度变更历史
              </span>
            }
            style={{ marginBottom: 16 }}
          >
            {detail.history.length > 0 ? (
              <List
                dataSource={detail.history}
                renderItem={(item) => (
                  <List.Item className="history-item">
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontWeight: 500 }}>
                          {item.newCompletionRate - item.oldCompletionRate >= 0 ? (
                            <ArrowUpOutlined style={{ color: '#52c41a' }} />
                          ) : (
                            <ArrowDownOutlined style={{ color: '#ff4d4f' }} />
                          )}
                          <span style={{ marginLeft: 4 }}>
                            {item.oldCompletionRate}% → {item.newCompletionRate}%
                          </span>
                        </span>
                        <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                          {dayjs(item.changedAt).format('YYYY-MM-DD HH:mm')}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: '#595959' }}>
                        状态变更：{item.oldStatusText} → {item.newStatusText}
                      </div>
                      <div style={{ fontSize: 13, color: '#595959' }}>
                        操作人：{item.changedByName}
                        {item.changeReason && ` · ${item.changeReason}`}
                      </div>
                      {item.newNote && item.newNote !== item.oldNote && (
                        <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                          备注：{item.oldNote || '无'} → {item.newNote}
                        </div>
                      )}
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', color: '#8c8c8c', padding: 20 }}>
                暂无变更记录
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title="更新学习进度"
        open={editModalVisible}
        onOk={handleSaveProgress}
        onCancel={() => setEditModalVisible(false)}
        confirmLoading={loading}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="completionRate"
            label="完成率 (%)"
            rules={[{ required: true, message: '请输入完成率' }]}
          >
            <InputNumber min={0} max={100} step={0.5} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select>
              <Option value={0}>未开始</Option>
              <Option value={1}>进行中</Option>
              <Option value={2}>正常推进</Option>
              <Option value={3}>进度落后</Option>
              <Option value={4}>已完成</Option>
              <Option value={5}>已暂停</Option>
            </Select>
          </Form.Item>

          <Form.Item name="note" label="备注">
            <TextArea rows={3} />
          </Form.Item>

          <Form.Item
            name="changeReason"
            label="变更原因"
            rules={[{ required: true, message: '请输入变更原因' }]}
          >
            <TextArea rows={2} placeholder="请说明此次变更的原因" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default RecordsPage;
