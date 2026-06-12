import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  InputNumber,
  Checkbox,
  Row,
  Col,
  Badge,
} from 'antd';
import {
  CheckCircleOutlined,
  EyeOutlined,
  WarningOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { lossReportAPI, reviewAPI } from '@/api';
import {
  LossStatusMap,
  LossStatusColorMap,
  LossCategoryMap,
  AbnormalTypeMap,
  ReviewResultMap,
  type ReviewResult,
  type LossReport,
} from '@/types';
import { useAuthStore } from '@/store/auth';
import dayjs from 'dayjs';
import type { TableProps } from 'antd';

const { TextArea } = Input;

function ReviewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [selectedReport, setSelectedReport] = useState<LossReport | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm] = Form.useForm();
  const [filterStatus, setFilterStatus] = useState<string>('pending_review');

  const { data: reports, isLoading } = useQuery({
    queryKey: ['reviewReports', filterStatus],
    queryFn: () =>
      lossReportAPI
        .getLossReports({
          status: filterStatus,
        })
        .then((res) => res.data),
  });

  const reviewMutation = useMutation({
    mutationFn: reviewAPI.createReview,
    onSuccess: () => {
      message.success('复核完成');
      setShowReviewModal(false);
      reviewForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['reviewReports'] });
    },
  });

  const handleReview = (report: LossReport) => {
    setSelectedReport(report);
    reviewForm.setFieldsValue({
      verified_amount: report.cost_amount,
      follow_up_days: 3,
    });
    setShowReviewModal(true);
  };

  const handleSubmitReview = (values: any) => {
    if (!selectedReport) return;
    reviewMutation.mutate({
      ...values,
      loss_report_id: selectedReport.id,
    });
  };

  const statusOptions = [
    { value: 'pending_review', label: '待复核' },
    { value: 'reviewed', label: '已复核' },
    { value: 'following', label: '跟进中' },
  ];

  const columns: TableProps<LossReport>['columns'] = [
    {
      title: '报损单号',
      dataIndex: 'report_no',
      key: 'report_no',
      width: 140,
      render: (text, record) => (
        <div className="flex items-center">
          {record.is_abnormal && <Badge status="error" className="mr-2" />}
          <span className="font-mono text-sm">{text}</span>
        </div>
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (cat: string) => LossCategoryMap[cat as keyof typeof LossCategoryMap],
    },
    {
      title: '门店',
      dataIndex: 'store_name',
      key: 'store_name',
      width: 120,
    },
    {
      title: '成本金额',
      dataIndex: 'cost_amount',
      key: 'cost_amount',
      width: 110,
      render: (val) => (
        <span className="font-semibold text-red-500">¥{val.toFixed(2)}</span>
      ),
    },
    {
      title: '损耗率',
      dataIndex: 'loss_rate',
      key: 'loss_rate',
      width: 90,
      render: (rate: number, record) => (
        <span className={record.is_abnormal ? 'text-red-500 font-bold' : ''}>
          {rate.toFixed(2)}%
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={LossStatusColorMap[status as keyof typeof LossStatusColorMap]}>
          {LossStatusMap[status as keyof typeof LossStatusMap]}
        </Tag>
      ),
    },
    {
      title: '异常提醒',
      dataIndex: 'abnormal_type',
      key: 'abnormal_type',
      width: 120,
      render: (type, record) =>
        record.is_abnormal ? (
          <Tag color="red" icon={<WarningOutlined />}>
            {AbnormalTypeMap[type!]}
          </Tag>
        ) : (
          <span className="text-gray-400">正常</span>
        ),
    },
    {
      title: '创建人',
      dataIndex: 'creator_name',
      key: 'creator_name',
      width: 100,
    },
    {
      title: '报损日期',
      dataIndex: 'loss_date',
      key: 'loss_date',
      width: 110,
      render: (date) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() =>
              navigate({ to: '/loss-reports/$id', params: { id: record.id.toString() } })
            }
          >
            详情
          </Button>
          {record.status === 'pending_review' &&
            (user?.role === 'manager' || user?.store_id === record.store_id) && (
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleReview(record)}
              >
                复核
              </Button>
            )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card size="small" className="shadow-sm">
        <div className="flex items-center gap-4">
          <span className="text-gray-600">状态筛选：</span>
          <Select
            value={filterStatus}
            onChange={setFilterStatus}
            style={{ width: 140 }}
            options={statusOptions}
          />
          <div className="flex-1" />
          <div className="text-sm text-gray-500">
            共 <span className="font-bold text-coffee-600">{reports?.length || 0}</span> 条记录
          </div>
        </div>
      </Card>

      <Card className="shadow-sm">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={reports}
          loading={isLoading}
          scroll={{ x: 1200 }}
          rowClassName={(record) => (record.is_abnormal ? 'abnormal-row' : '')}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <span>复核处理</span>
            {selectedReport?.is_abnormal && (
              <Tag color="red" icon={<WarningOutlined />}>
                异常报损
              </Tag>
            )}
          </Space>
        }
        open={showReviewModal}
        onCancel={() => setShowReviewModal(false)}
        footer={null}
        width={650}
        maskClosable={false}
      >
        {selectedReport && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">报损单号：</span>
                  <span className="font-mono">{selectedReport.report_no}</span>
                </div>
                <div>
                  <span className="text-gray-500">报损标题：</span>
                  <span>{selectedReport.title}</span>
                </div>
                <div>
                  <span className="text-gray-500">门店：</span>
                  <span>{selectedReport.store_name}</span>
                </div>
                <div>
                  <span className="text-gray-500">申报金额：</span>
                  <span className="font-bold text-red-500">
                    ¥{selectedReport.cost_amount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <Form form={reviewForm} layout="vertical" onFinish={handleSubmitReview}>
              <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm">
                <p className="font-medium text-blue-700 mb-1">
                  <SearchOutlined className="mr-1" />
                  复核流程说明
                </p>
                <p className="text-blue-600">
                  1. 请先填写复核意见，说明损耗原因和责任认定
                  <br />
                  2. 核对责任门店是否正确
                  <br />
                  3. 核对成本金额是否准确
                  <br />
                  4. 选择复核结果，如有需要可设置跟进期限
                </p>
              </div>

              <Form.Item
                name="review_opinion"
                label={
                  <span className="font-medium">
                    复核意见 <span className="text-red-500">*</span>
                  </span>
                }
                rules={[{ required: true, message: '请输入复核意见' }]}
              >
                <TextArea
                  rows={4}
                  placeholder="请详细填写复核意见，包括：损耗原因分析、责任认定、改进建议等..."
                  showCount
                  maxLength={1000}
                />
              </Form.Item>

              <Form.Item
                name="result"
                label={
                  <span className="font-medium">
                    复核结果 <span className="text-red-500">*</span>
                  </span>
                }
                rules={[{ required: true, message: '请选择复核结果' }]}
              >
                <Select placeholder="请选择复核结果">
                  <Select.Option value="confirmed">
                    <Tag color="green">确认无误</Tag> - 数据准确，同意进入审批
                  </Select.Option>
                  <Select.Option value="needs_follow_up">
                    <Tag color="orange">需要跟进</Tag> - 存在问题，需责任人跟进整改
                  </Select.Option>
                  <Select.Option value="disputed">
                    <Tag color="red">存在争议</Tag> - 数据存疑，需进一步核实
                  </Select.Option>
                </Select>
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="verified_amount"
                    label={
                      <span className="font-medium">
                        核实金额 (元) <span className="text-red-500">*</span>
                      </span>
                    }
                    rules={[
                      { required: true, message: '请输入核实金额' },
                      { type: 'number', min: 0, message: '金额不能为负' },
                    ]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      step={0.01}
                      precision={2}
                      placeholder="请输入核实后的成本金额"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="follow_up_days"
                    label={<span className="font-medium">跟进期限 (天)</span>}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={1}
                      max={30}
                      placeholder="3"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <div className="flex gap-8 p-3 bg-gray-50 rounded-lg mb-4">
                <Form.Item
                  name="cost_verified"
                  valuePropName="checked"
                  initialValue={false}
                  noStyle
                >
                  <Checkbox>
                    <span className="font-medium">成本金额已核对</span>
                  </Checkbox>
                </Form.Item>
                <Form.Item
                  name="store_verified"
                  valuePropName="checked"
                  initialValue={false}
                  noStyle
                >
                  <Checkbox>
                    <span className="font-medium">责任门店已核对</span>
                  </Checkbox>
                </Form.Item>
              </div>

              <div className="flex justify-end gap-3">
                <Button onClick={() => setShowReviewModal(false)}>取消</Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={reviewMutation.isPending}
                  icon={<CheckCircleOutlined />}
                >
                  确认复核
                </Button>
              </div>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ReviewPage;
