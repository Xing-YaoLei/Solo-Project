import { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Select,
  Progress,
  Tag,
  List,
  Descriptions,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Space,
  message,
  Spin,
  Empty,
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
import { progressApi } from '../api/progress';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

function RecordsPage() {
  const [selectedProgressId, setSelectedProgressId] = useState<number | undefined>();
  const [detail, setDetail] = useState<LearningProgressDetail | null>(null);
  const [progressList, setProgressList] = useState<{ id: number; courseName?: string; certificateName?: string }[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);

  useEffect(() => {
    loadProgressList();
  }, []);

  useEffect(() => {
    if (selectedProgressId) {
      loadDetail();
    }
  }, [selectedProgressId]);

  const loadProgressList = async () => {
    setListLoading(true);
    try {
      const result = await progressApi.getList({ userId: 3, pageIndex: 1, pageSize: 100 });
      const list = result.items.map((p) => ({
        id: p.id,
        courseName: p.courseName,
        certificateName: p.certificateName,
      }));
      setProgressList(list);
      if (list.length > 0 && !selectedProgressId) {
        setSelectedProgressId(list[0].id);
      }
    } catch (error) {
      console.error('加载进度列表失败:', error);
      message.error('加载进度列表失败');
    } finally {
      setListLoading(false);
    }
  };

  const loadDetail = async () => {
    if (!selectedProgressId) return;
    setDetailLoading(true);
    try {
      const data = await progressApi.getDetail(selectedProgressId);
      setDetail(data);
    } catch (error) {
      console.error('加载详情失败:', error);
      message.error('加载详情失败');
    } finally {
      setDetailLoading(false);
    }
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
    if (!selectedProgressId) return;
    try {
      const values = await form.validateFields();
      setLoading(true);

      await progressApi.update(selectedProgressId, {
        completionRate: values.completionRate,
        status: values.status,
        note: values.note,
        changeReason: values.changeReason,
        changedByUserId: 2,
      });

      message.success('进度更新成功，历史记录已保存');
      setEditModalVisible(false);
      setLoading(false);
      await loadDetail();
      await loadProgressList();
    } catch (error) {
      console.error('更新进度失败:', error);
      message.error('更新进度失败');
      setLoading(false);
    }
  };

  const getStatusText = (status: number) => {
    const texts = ['未开始', '进行中', '正常推进', '进度落后', '已完成', '已暂停'];
    return texts[status] || '未知';
  };

  if (listLoading) {
    return <Spin tip="加载中..." />;
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
            loading={listLoading}
          >
            {progressList.map((p) => (
              <Option key={p.id} value={p.id}>
                {p.certificateName} - {p.courseName}
              </Option>
            ))}
          </Select>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={handleEditProgress}
            disabled={!detail}
          >
            更新进度
          </Button>
        </Space>
      </div>

      {detailLoading ? (
        <Card>
          <Spin tip="加载详情中..." />
        </Card>
      ) : !detail ? (
        <Card>
          <Empty description="暂无学习进度数据" />
        </Card>
      ) : (
        <>
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
                {detail.progress.startDate ? dayjs(detail.progress.startDate).format('YYYY-MM-DD') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="目标日期">
                {detail.progress.targetDate ? dayjs(detail.progress.targetDate).format('YYYY-MM-DD') : '-'}
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
                {detail.chapters.length > 0 ? (
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
                ) : (
                  <Empty description="暂无章节数据" />
                )}
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
                  <Empty description="暂无作业记录" />
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
                  <Empty description="暂无标签" />
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
                  <Empty description="暂无变更记录" />
                )}
              </Card>
            </Col>
          </Row>
        </>
      )}

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
            <TextArea rows={2} placeholder="请说明此次变更的原因（将保存到历史记录）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default RecordsPage;
