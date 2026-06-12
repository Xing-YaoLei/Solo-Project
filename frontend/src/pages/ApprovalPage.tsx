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
  Row,
  Col,
  Badge,
  Descriptions,
  Alert,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  WarningOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { lossReportAPI, approvalAPI } from '@/api';
import {
  LossStatusMap,
  LossStatusColorMap,
  LossCategoryMap,
  AbnormalTypeMap,
  type LossReport,
} from '@/types';
import dayjs from 'dayjs';
import type { TableProps } from 'antd';

const { TextArea } = Input;

function ApprovalPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState<LossReport | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalForm] = Form.useForm();
  const [filterStatus, setFilterStatus] = useState<string>('pending_approval');

  const { data: reports, isLoading } = useQuery({
    queryKey: ['approvalReports', filterStatus],
    queryFn: () =>
      lossReportAPI
        .getLossReports({
          status: filterStatus,
        })
        .then((res) => res.data),
  });

  const approvalMutation = useMutation({
    mutationFn: approvalAPI.createApproval,
    onSuccess: (_, variables) => {
      message.success(
        variables.result === 'approved' ? '审批通过' : '已驳回'
      );
      setShowApprovalModal(false);
      approvalForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['approvalReports'] });
    },
  });

  const handleApproval = (report: LossReport, result: 'approved' | 'rejected') => {
    setSelectedReport(report);
    approvalForm.setFieldsValue({ result });
    setShowApprovalModal(true);
  };

  const handleSubmitApproval = (values: any) => {
    if (!selectedReport) return;
    approvalMutation.mutate({
      ...values,
      loss_report_id: selectedReport.id,
    });
  };

  const statusOptions = [
    { value: 'pending_approval', label: '待审批' },
    { value: 'approved', label: '已通过' },
    { value: 'rejected', label: '已驳回' },
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
      title: '异常',
      dataIndex: 'abnormal_type',
      key: 'abnormal_type',
      width: 100,
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
      title: '责任人',
      dataIndex: 'responsible_staff_name',
      key: 'responsible_staff_name',
      width: 100,
      render: (name) => name || '-',
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
      width: 180,
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
          {record.status === 'pending_approval' && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleApproval(record, 'approved')}
              >
                通过
              </Button>
              <Button
                size="small"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleApproval(record, 'rejected')}
              >
                驳回
              </Button>
            </>
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

      {filterStatus === 'pending_approval' && (
        <Alert
          message="审批须知"
          description={
            <div>
              <p>• 请仔细核对报损金额、责任门店和复核意见</p>
              <p>• 对于异常报损（高损耗率、大额、高频），请重点关注</p>
              <p>• 审批通过后，报损单将计入门店损耗统计</p>
              <p>• 审批驳回后，需重新提交复核</p>
            </div>
          }
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
        />
      )}

      <Card className="shadow-sm">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={reports}
          loading={isLoading}
          scroll={{ x: 1300 }}
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
            <span>
              {approvalForm.getFieldValue('result') === 'approved' ? '审批通过' : '审批驳回'}
            </span>
            {selectedReport?.is_abnormal && (
              <Tag color="red" icon={<WarningOutlined />}>
                异常报损
              </Tag>
            )}
          </Space>
        }
        open={showApprovalModal}
        onCancel={() => setShowApprovalModal(false)}
        footer={null}
        width={600}
        maskClosable={false}
      >
        {selectedReport && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <Descriptions size="small" column={2} bordered>
                <Descriptions.Item label="报损单号">
                  {selectedReport.report_no}
                </Descriptions.Item>
                <Descriptions.Item label="门店">
                  {selectedReport.store_name}
                </Descriptions.Item>
                <Descriptions.Item label="报损标题">
                  {selectedReport.title}
                </Descriptions.Item>
                <Descriptions.Item label="类别">
                  {LossCategoryMap[selectedReport.category]}
                </Descriptions.Item>
                <Descriptions.Item label="成本金额">
                  <span className="text-red-500 font-bold">
                    ¥{selectedReport.cost_amount.toFixed(2)}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="损耗率">
                  <span
                    className={selectedReport.is_abnormal ? 'text-red-500 font-bold' : ''}
                  >
                    {selectedReport.loss_rate.toFixed(2)}%
                  </span>
                </Descriptions.Item>
              </Descriptions>
            </div>

            {selectedReport.is_abnormal && (
              <Alert
                message="异常提醒"
                description={`此报损单存在异常：${AbnormalTypeMap[selectedReport.abnormal_type!]}，请谨慎审批`}
                type="warning"
                showIcon
                icon={<WarningOutlined />}
              />
            )}

            <Form form={approvalForm} layout="vertical" onFinish={handleSubmitApproval}>
              <Form.Item
                name="approval_opinion"
                label={
                  <span className="font-medium">
                    审批意见 <span className="text-red-500">*</span>
                  </span>
                }
                rules={[{ required: true, message: '请输入审批意见' }]}
              >
                <TextArea
                  rows={4}
                  placeholder={
                    approvalForm.getFieldValue('result') === 'approved'
                      ? '请输入同意的理由...'
                      : '请输入驳回的理由及整改要求...'
                  }
                  showCount
                  maxLength={500}
                />
              </Form.Item>

              <Form.Item name="result" hidden>
                <Input />
              </Form.Item>

              <div className="flex justify-end gap-3">
                <Button onClick={() => setShowApprovalModal(false)}>取消</Button>
                <Button
                  type={approvalForm.getFieldValue('result') === 'approved' ? 'primary' : 'default'}
                  danger={approvalForm.getFieldValue('result') !== 'approved'}
                  htmlType="submit"
                  loading={approvalMutation.isPending}
                  icon={
                    approvalForm.getFieldValue('result') === 'approved' ? (
                      <CheckCircleOutlined />
                    ) : (
                      <CloseCircleOutlined />
                    )
                  }
                >
                  {approvalForm.getFieldValue('result') === 'approved' ? '确认通过' : '确认驳回'}
                </Button>
              </div>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ApprovalPage;
