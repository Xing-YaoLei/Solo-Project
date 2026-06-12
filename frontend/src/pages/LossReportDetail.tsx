import { useState } from 'react';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  List,
  Comment,
  Avatar,
  Input,
  Form,
  Modal,
  message,
  Row,
  Col,
  Statistic,
  Timeline,
  Popconfirm,
  Badge,
  Select,
  Checkbox,
} from 'antd';
import {
  ArrowLeftOutlined,
  SendOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  UserOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import {
  lossReportAPI,
  reviewAPI,
  approvalAPI,
  communicationAPI,
} from '@/api';
import {
  LossStatusMap,
  LossStatusColorMap,
  LossCategoryMap,
  ReviewResultMap,
  ApprovalResultMap,
  AbnormalTypeMap,
  UserRoleMap,
  type LossReportDetail,
} from '@/types';
import { useAuthStore } from '@/store/auth';
import dayjs from 'dayjs';

const { TextArea } = Input;

function LossReportDetail() {
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [messageInput, setMessageInput] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [reviewForm] = Form.useForm();
  const [approvalForm] = Form.useForm();

  const reportId = Number(params.id);

  const { data: report, isLoading } = useQuery({
    queryKey: ['lossReport', reportId],
    queryFn: () => lossReportAPI.getLossReport(reportId).then((res) => res.data),
  });

  const { data: threshold } = useQuery({
    queryKey: ['threshold'],
    queryFn: () => lossReportAPI.getLossReports().then(() => ({ data: { threshold: 5 } })),
  });

  const sendMessageMutation = useMutation({
    mutationFn: communicationAPI.createCommunication,
    onSuccess: () => {
      message.success('发送成功');
      setMessageInput('');
      queryClient.invalidateQueries({ queryKey: ['lossReport', reportId] });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: reviewAPI.createReview,
    onSuccess: () => {
      message.success('复核完成');
      setShowReviewModal(false);
      reviewForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['lossReport', reportId] });
    },
  });

  const approvalMutation = useMutation({
    mutationFn: approvalAPI.createApproval,
    onSuccess: () => {
      message.success('审批完成');
      setShowApprovalModal(false);
      approvalForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['lossReport', reportId] });
    },
  });

  const submitForApprovalMutation = useMutation({
    mutationFn: lossReportAPI.submitForApproval,
    onSuccess: () => {
      message.success('已提交审批');
      queryClient.invalidateQueries({ queryKey: ['lossReport', reportId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: lossReportAPI.deleteLossReport,
    onSuccess: () => {
      message.success('删除成功');
      navigate({ to: '/loss-reports' });
    },
  });

  const submitForReviewMutation = useMutation({
    mutationFn: lossReportAPI.submitForReview,
    onSuccess: () => {
      message.success('提交成功');
      queryClient.invalidateQueries({ queryKey: ['lossReport', reportId] });
    },
  });

  if (isLoading || !report) {
    return <div className="text-center py-12">加载中...</div>;
  }

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    sendMessageMutation.mutate({
      message: messageInput.trim(),
      loss_report_id: reportId,
    });
  };

  const handleReview = (values: any) => {
    reviewMutation.mutate({
      ...values,
      loss_report_id: reportId,
    });
  };

  const handleApproval = (values: any) => {
    approvalMutation.mutate({
      ...values,
      loss_report_id: reportId,
    });
  };

  const getTimelineItems = (report: LossReportDetail) => {
    const items = [
      {
        color: 'blue',
        children: (
          <div>
            <p className="font-medium">创建报损单</p>
            <p className="text-sm text-gray-500">
              {report.creator_name} 创建于 {dayjs(report.created_at).format('YYYY-MM-DD HH:mm')}
            </p>
          </div>
        ),
      },
    ];

    if (report.status !== 'draft') {
      items.push({
        color: 'green',
        children: (
          <div>
            <p className="font-medium">提交复核</p>
            <p className="text-sm text-gray-500">
              {report.creator_name} 提交于 {dayjs(report.created_at).format('YYYY-MM-DD HH:mm')}
            </p>
          </div>
        ),
      });
    }

    report.reviews.forEach((review) => {
      items.push({
        color: review.result === 'confirmed' ? 'green' : 'orange',
        children: (
          <div>
            <p className="font-medium">
              复核完成 - {ReviewResultMap[review.result]}
            </p>
            <p className="text-sm text-gray-500">
              {review.reviewer_name} 复核于 {dayjs(review.review_time).format('YYYY-MM-DD HH:mm')}
            </p>
            <p className="text-sm mt-1">复核意见：{review.review_opinion}</p>
            {review.cost_verified && (
              <Tag color="green" className="mt-1">
                <CheckCircleOutlined /> 成本金额已核对
              </Tag>
            )}
            {review.store_verified && (
              <Tag color="green" className="mt-1">
                <CheckCircleOutlined /> 责任门店已核对
              </Tag>
            )}
          </div>
        ),
      });
    });

    report.approvals.forEach((approval) => {
      items.push({
        color: approval.result === 'approved' ? 'green' : 'red',
        children: (
          <div>
            <p className="font-medium">
              审批完成 - {ApprovalResultMap[approval.result]}
            </p>
            <p className="text-sm text-gray-500">
              {approval.approver_name} 审批于 {dayjs(approval.approval_time).format('YYYY-MM-DD HH:mm')}
            </p>
            <p className="text-sm mt-1">审批意见：{approval.approval_opinion}</p>
          </div>
        ),
      });
    });

    if (report.status === 'closed') {
      items.push({
        color: 'gray',
        children: (
          <div>
            <p className="font-medium">已关闭</p>
            <p className="text-sm text-gray-500">报损流程已完成</p>
          </div>
        ),
      });
    }

    return items;
  };

  return (
    <div className="space-y-4">
      <Card size="small" className="shadow-sm">
        <div className="flex items-center justify-between">
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate({ to: '/loss-reports' })}
            >
              返回列表
            </Button>
            <h2 className="text-xl font-bold">
              {report.report_no} - {report.title}
            </h2>
            <Tag color={LossStatusColorMap[report.status]} className="text-base px-3 py-1">
              {LossStatusMap[report.status]}
            </Tag>
            {report.is_abnormal && (
              <Badge
                status="error"
                text={
                  <span className="text-red-500 font-medium">
                    <WarningOutlined /> 异常：{AbnormalTypeMap[report.abnormal_type!]}
                  </span>
                }
              />
            )}
          </Space>
          <Space>
            {report.status === 'draft' && report.created_by === user?.id && (
              <>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => navigate({ to: '/loss-reports/create', search: { edit_id: report.id } })}
                >
                  编辑
                </Button>
                <Popconfirm
                  title="确认删除此报损单？"
                  onConfirm={() => deleteMutation.mutate(report.id)}
                  okText="确认"
                  cancelText="取消"
                >
                  <Button danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={() => submitForReviewMutation.mutate(report.id)}
                  loading={submitForReviewMutation.isPending}
                >
                  提交复核
                </Button>
              </>
            )}
            {report.status === 'pending_review' &&
              (user?.role === 'manager' || user?.store_id === report.store_id) && (
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => setShowReviewModal(true)}
                >
                  复核处理
                </Button>
              )}
            {report.status === 'reviewed' && user?.role === 'manager' && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => setShowApprovalModal(true)}
              >
                审批处理
              </Button>
            )}
            {report.status === 'reviewed' && user?.role !== 'manager' && (
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={() => submitForApprovalMutation.mutate(report.id)}
                loading={submitForApprovalMutation.isPending}
              >
                提交审批
              </Button>
            )}
            {report.status === 'following' &&
              (report.responsible_staff_id === user?.id ||
                report.created_by === user?.id) && (
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={() => submitForApprovalMutation.mutate(report.id)}
                  loading={submitForApprovalMutation.isPending}
                >
                  完成跟进，提交审批
                </Button>
              )}
          </Space>
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="基本信息" className="shadow-sm">
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="报损单号">{report.report_no}</Descriptions.Item>
              <Descriptions.Item label="报损类别">{LossCategoryMap[report.category]}</Descriptions.Item>
              <Descriptions.Item label="责任门店">{report.store_name}</Descriptions.Item>
              <Descriptions.Item label="责任人">{report.responsible_staff_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="报损日期">{dayjs(report.loss_date).format('YYYY-MM-DD')}</Descriptions.Item>
              <Descriptions.Item label="创建人">{report.creator_name}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{dayjs(report.created_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {report.updated_at ? dayjs(report.updated_at).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="报损明细" className="shadow-sm mt-4">
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={8}>
                <Card size="small" className="bg-red-50">
                  <Statistic
                    title="成本金额"
                    value={report.cost_amount}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ color: '#cf1322' }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={8}>
                <Card size="small" className="bg-blue-50">
                  <Statistic
                    title="销售金额"
                    value={report.sale_amount}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={8}>
                <Card size="small" className="bg-orange-50">
                  <Statistic
                    title="损耗率"
                    value={report.loss_rate}
                    precision={2}
                    suffix="%"
                    valueStyle={{
                      color: report.is_abnormal ? '#cf1322' : '#fa8c16',
                      fontWeight: 'bold',
                    }}
                    prefix={report.is_abnormal && <WarningOutlined className="mr-1" />}
                  />
                </Card>
              </Col>
            </Row>
            <Descriptions bordered column={2} size="small" className="mt-4">
              <Descriptions.Item label="报损数量">
                {report.quantity} {report.unit}
              </Descriptions.Item>
              <Descriptions.Item label="单价">
                ¥{(report.cost_amount / report.quantity).toFixed(2)} / {report.unit}
              </Descriptions.Item>
              <Descriptions.Item label="报损说明" span={2}>
                {report.description || '无'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card
            title={
              <span>
                <MessageOutlined className="mr-2" />
                沟通记录 ({report.communications.length})
              </span>
            }
            className="shadow-sm mt-4"
          >
            {report.communications.length > 0 ? (
              <List
                className="chat-list"
                dataSource={report.communications}
                renderItem={(item) => (
                  <List.Item className={item.sender_id === user?.id ? 'chat-message self' : 'chat-message'}>
                    <Comment
                      author={
                        <span>
                          {item.sender_name}
                          <Tag color={item.sender_role === 'manager' ? 'blue' : 'default'} className="ml-2">
                            {UserRoleMap[item.sender_role as 'manager' | 'staff']}
                          </Tag>
                        </span>
                      }
                      avatar={<Avatar icon={<UserOutlined />} />}
                      content={item.message}
                      datetime={dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                暂无沟通记录
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <TextArea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="输入沟通消息..."
                rows={2}
                onPressEnter={(e) => {
                  if (!e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendMessage}
                loading={sendMessageMutation.isPending}
                className="self-end"
              >
                发送
              </Button>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={
              <span>
                <ClockCircleOutlined className="mr-2" />
                处理流程
              </span>
            }
            className="shadow-sm"
          >
            <Timeline mode="left" items={getTimelineItems(report)} />
          </Card>

          {report.reviews.length > 0 && (
            <Card
              title={
                <span>
                  <CheckCircleOutlined className="mr-2" />
                  复核记录
                </span>
              }
              className="shadow-sm mt-4"
            >
              {report.reviews.map((review, index) => (
                <div key={review.id} className={index > 0 ? 'pt-4 border-t border-gray-100' : ''}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{review.reviewer_name}</span>
                    <Tag
                      color={
                        review.result === 'confirmed'
                          ? 'green'
                          : review.result === 'needs_follow_up'
                          ? 'orange'
                          : 'red'
                      }
                    >
                      {ReviewResultMap[review.result]}
                    </Tag>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    <FileTextOutlined className="mr-1" />
                    复核意见：{review.review_opinion}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Tag color={review.cost_verified ? 'green' : 'default'}>
                      {review.cost_verified ? (
                        <CheckCircleOutlined />
                      ) : (
                        <ClockCircleOutlined />
                      )}{' '}
                      成本金额{review.cost_verified ? '已核对' : '未核对'}
                    </Tag>
                    <Tag color={review.store_verified ? 'green' : 'default'}>
                      {review.store_verified ? (
                        <CheckCircleOutlined />
                      ) : (
                        <ClockCircleOutlined />
                      )}{' '}
                      责任门店{review.store_verified ? '已核对' : '未核对'}
                    </Tag>
                  </div>
                  {review.verified_amount !== undefined && (
                    <p className="text-sm text-gray-500">
                      核实金额：¥{review.verified_amount.toFixed(2)}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    复核时间：{dayjs(review.review_time).format('YYYY-MM-DD HH:mm')}
                  </p>
                </div>
              ))}
            </Card>
          )}

          {report.approvals.length > 0 && (
            <Card
              title={
                <span>
                  <CheckCircleOutlined className="mr-2" />
                  审批记录
                </span>
              }
              className="shadow-sm mt-4"
            >
              {report.approvals.map((approval, index) => (
                <div key={approval.id} className={index > 0 ? 'pt-4 border-t border-gray-100' : ''}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{approval.approver_name}</span>
                    <Tag color={approval.result === 'approved' ? 'green' : 'red'}>
                      {ApprovalResultMap[approval.result]}
                    </Tag>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    <FileTextOutlined className="mr-1" />
                    审批意见：{approval.approval_opinion}
                  </p>
                  <p className="text-xs text-gray-400">
                    审批时间：{dayjs(approval.approval_time).format('YYYY-MM-DD HH:mm')}
                  </p>
                </div>
              ))}
            </Card>
          )}
        </Col>
      </Row>

      <Modal
        title="复核处理"
        open={showReviewModal}
        onCancel={() => setShowReviewModal(false)}
        footer={null}
        width={600}
      >
        <Form form={reviewForm} layout="vertical" onFinish={handleReview}>
          <Form.Item
            name="review_opinion"
            label="复核意见"
            rules={[{ required: true, message: '请输入复核意见' }]}
          >
            <TextArea rows={4} placeholder="请输入复核意见，说明损耗原因、责任认定等..." />
          </Form.Item>
          <Form.Item
            name="result"
            label="复核结果"
            rules={[{ required: true, message: '请选择复核结果' }]}
          >
            <Select>
              <Select.Option value="confirmed">确认无误</Select.Option>
              <Select.Option value="needs_follow_up">需要跟进</Select.Option>
              <Select.Option value="disputed">存在争议</Select.Option>
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="verified_amount"
                label="核实金额 (元)"
                rules={[{ required: true, message: '请输入核实金额' }]}
              >
                <Input type="number" step="0.01" placeholder={report.cost_amount.toString()} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="follow_up_days"
                label="跟进期限 (天)"
                initialValue={3}
              >
                <Input type="number" min="1" placeholder="3" />
              </Form.Item>
            </Col>
          </Row>
          <div className="flex gap-4 mb-4">
            <Form.Item name="cost_verified" valuePropName="checked" initialValue={false}>
              <Checkbox>
                <span className="font-medium">成本金额已核对</span>
              </Checkbox>
            </Form.Item>
            <Form.Item name="store_verified" valuePropName="checked" initialValue={false}>
              <Checkbox>
                <span className="font-medium">责任门店已核对</span>
              </Checkbox>
            </Form.Item>
          </div>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setShowReviewModal(false)}>取消</Button>
            <Button type="primary" htmlType="submit" loading={reviewMutation.isPending}>
              确认复核
            </Button>
          </div>
        </Form>
      </Modal>

      <Modal
        title="审批处理"
        open={showApprovalModal}
        onCancel={() => setShowApprovalModal(false)}
        footer={null}
        width={500}
      >
        <Form form={approvalForm} layout="vertical" onFinish={handleApproval}>
          <Form.Item
            name="approval_opinion"
            label="审批意见"
            rules={[{ required: true, message: '请输入审批意见' }]}
          >
            <TextArea rows={4} placeholder="请输入审批意见..." />
          </Form.Item>
          <Form.Item
            name="result"
            label="审批结果"
            rules={[{ required: true, message: '请选择审批结果' }]}
          >
            <Select>
              <Select.Option value="approved">同意</Select.Option>
              <Select.Option value="rejected">驳回</Select.Option>
            </Select>
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setShowApprovalModal(false)}>取消</Button>
            <Button type="primary" htmlType="submit" loading={approvalMutation.isPending}>
              确认审批
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

export default LossReportDetail;
