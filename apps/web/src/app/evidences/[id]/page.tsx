'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  Tabs,
  Descriptions,
  Tag,
  Button,
  Space,
  Table,
  Timeline,
  Modal,
  Form,
  Input,
  Select,
  Upload,
  message,
  Row,
  Col,
  Empty,
  Spin,
  Collapse,
  Divider,
  Drawer,
  List,
  Tooltip,
  Alert,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  UserOutlined,
  UploadOutlined,
  PlusOutlined,
  CheckOutlined,
  CloseOutlined,
  SendOutlined,
  DownloadOutlined,
  EyeOutlined,
  HistoryOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  FolderOpenOutlined,
  FileSearchOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  FileUnknownOutlined,
  ExclamationCircleOutlined,
  SnippetsOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UploadProps, UploadFile } from 'antd';
import dayjs from 'dayjs';

import { tasksApi } from '@/lib/api/tasks';
import { evidencesApi } from '@/lib/api/evidences';
import { reviewsApi } from '@/lib/api/reviews';
import { auditLogApi } from '@/lib/api/audit-log';
import type {
  AuditTask,
  Evidence,
  EvidenceStatus,
  EvidenceCategory,
  Attachment,
  EvidenceSupplement,
  ReviewRecord,
  ReviewResult,
  ReviewTargetType,
  OperationLog,
  OperationAction,
} from '@/lib/api/types';
import { UserRole, Permission } from '@/lib/api/types';
import { formatDate, formatDateTime, formatMoney, formatFileSize } from '@/lib/utils/format';
import { PermissionGuard } from '@/components/common/PermissionGuard';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

const evidenceStatusLabels: Record<EvidenceStatus, string> = {
  DRAFT: '草稿',
  SUBMITTED: '已提交',
  REVIEWING: '复核中',
  APPROVED: '已通过',
  REJECTED: '已驳回',
  NEED_SUPPLEMENT: '需补附件',
  ARCHIVED: '已归档',
};

const evidenceStatusColors: Record<EvidenceStatus, string> = {
  DRAFT: 'default',
  SUBMITTED: 'cyan',
  REVIEWING: 'geekblue',
  APPROVED: 'success',
  REJECTED: 'error',
  NEED_SUPPLEMENT: 'warning',
  ARCHIVED: 'default',
};

const evidenceCategoryLabels: Record<EvidenceCategory, string> = {
  DOCUMENT: '文档',
  FINANCIAL: '财务凭证',
  CONTRACT: '合同',
  REPORT: '报告',
  RECORD: '记录',
  MEETING_MINUTE: '会议纪要',
  OTHER: '其他',
};

const reviewResultLabels: Record<ReviewResult, string> = {
  APPROVED: '通过',
  REJECTED: '驳回',
  NEED_REVISION: '需修改',
};

const reviewResultColors: Record<ReviewResult, string> = {
  APPROVED: 'success',
  REJECTED: 'error',
  NEED_REVISION: 'warning',
};

const operationActionLabels: Record<OperationAction, string> = {
  CREATE: '创建',
  UPDATE: '更新',
  DELETE: '删除',
  SUBMIT: '提交',
  REVIEW: '复核',
  APPROVE: '审批',
  REJECT: '驳回',
  ASSIGN: '分派',
  UPLOAD: '上传',
  DOWNLOAD: '下载',
  EXPORT: '导出',
  BATCH_UPDATE: '批量更新',
  ARCHIVE: '归档',
  UNARCHIVE: '取消归档',
};

const operationActionIcons: Record<OperationAction, React.ReactNode> = {
  CREATE: <PlusOutlined />,
  UPDATE: <EditOutlined />,
  DELETE: <CloseOutlined />,
  SUBMIT: <SendOutlined />,
  REVIEW: <SafetyCertificateOutlined />,
  APPROVE: <CheckOutlined />,
  REJECT: <CloseOutlined />,
  ASSIGN: <UserOutlined />,
  UPLOAD: <UploadOutlined />,
  DOWNLOAD: <DownloadOutlined />,
  EXPORT: <DownloadOutlined />,
  BATCH_UPDATE: <EditOutlined />,
  ARCHIVE: <FileTextOutlined />,
  UNARCHIVE: <FileTextOutlined />,
};

const getFileIcon = (fileName: string): React.ReactNode => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (['pdf'].includes(ext || '')) return <FilePdfOutlined className="text-red-500 text-lg" />;
  if (['doc', 'docx'].includes(ext || '')) return <FileWordOutlined className="text-blue-500 text-lg" />;
  if (['xls', 'xlsx'].includes(ext || '')) return <FileExcelOutlined className="text-green-600 text-lg" />;
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext || ''))
    return <FileImageOutlined className="text-purple-500 text-lg" />;
  return <FileUnknownOutlined className="text-gray-500 text-lg" />;
};

export default function EvidenceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const evidenceId = params.id as string;

  const [supplementModalOpen, setSupplementModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [snapshotDrawerOpen, setSnapshotDrawerOpen] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<any>(null);

  const [supplementForm] = Form.useForm();
  const [reviewForm] = Form.useForm();

  const { data: evidence, isLoading: evidenceLoading } = useQuery({
    queryKey: ['evidence', evidenceId],
    queryFn: () => evidencesApi.getEvidence(evidenceId),
  });

  const { data: taskData } = useQuery({
    queryKey: ['evidenceTask', evidence?.taskId],
    queryFn: () => (evidence?.taskId ? tasksApi.getTask(evidence.taskId) : Promise.resolve(null)),
    enabled: !!evidence?.taskId,
  });

  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['evidenceReviews', evidenceId],
    queryFn: () => reviewsApi.getReviewsByTarget('EVIDENCE' as ReviewTargetType, evidenceId),
  });

  const { data: auditLogsData, isLoading: auditLogsLoading } = useQuery({
    queryKey: ['evidenceAuditLogs', evidenceId],
    queryFn: () => auditLogApi.getOperationLogsByTarget('Evidence', evidenceId, { pageSize: 100, sortBy: 'createdAt', sortOrder: 'desc' }),
  });

  const reviews = reviewsData || [];
  const auditLogs = auditLogsData?.items || [];

  const sortedAttachments = useMemo(() => {
    return [...(evidence?.attachments || [])].sort((a, b) => {
      if (b.version !== a.version) return b.version - a.version;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [evidence?.attachments]);

  const invalidateEvidenceQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['evidence', evidenceId] });
    queryClient.invalidateQueries({ queryKey: ['evidenceReviews', evidenceId] });
    queryClient.invalidateQueries({ queryKey: ['evidenceAuditLogs', evidenceId] });
    queryClient.invalidateQueries({ queryKey: ['evidenceTask', evidence?.taskId] });
  }, [queryClient, evidenceId, evidence?.taskId]);

  const submitEvidenceMutation = useMutation({
    mutationFn: () => evidencesApi.submitEvidence(evidenceId),
    onSuccess: () => {
      message.success('证据已提交');
      invalidateEvidenceQueries();
    },
    onError: (err) => {
      message.error(err instanceof Error ? err.message : '提交失败');
    },
  });

  const updateEvidenceMutation = useMutation({
    mutationFn: (data: any) => evidencesApi.updateEvidence(evidenceId, data),
    onSuccess: () => {
      message.success('更新成功');
      invalidateEvidenceQueries();
    },
    onError: (err) => {
      message.error(err instanceof Error ? err.message : '更新失败');
    },
  });

  const uploadAttachmentMutation = useMutation({
    mutationFn: ({ file, isSupplement }: { file: File; isSupplement?: boolean }) => {
      const pendingSupplement = isSupplement
        ? evidence?.supplementHistory?.find((s: any) => !s.isCompleted)
        : undefined;
      return evidencesApi.uploadAttachment(file, {
        evidenceId,
        isSupplement,
        supplementRequestId: pendingSupplement?.id,
      });
    },
    onSuccess: () => {
      message.success('附件上传成功');
      invalidateEvidenceQueries();
    },
    onError: (err) => {
      message.error(err instanceof Error ? err.message : '上传失败');
    },
  });

  const requestSupplementMutation = useMutation({
    mutationFn: (data: { evidenceId: string; reason: string }) =>
      evidencesApi.requestSupplement(data),
    onSuccess: () => {
      message.success('补附件请求已发送');
      setSupplementModalOpen(false);
      supplementForm.resetFields();
      invalidateEvidenceQueries();
    },
    onError: (err) => {
      message.error(err instanceof Error ? err.message : '请求失败');
    },
  });

  const completeSupplementMutation = useMutation({
    mutationFn: (supplementId: string) => evidencesApi.completeSupplement(supplementId),
    onSuccess: () => {
      message.success('补附件已完成');
      invalidateEvidenceQueries();
    },
    onError: (err) => {
      message.error(err instanceof Error ? err.message : '操作失败');
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: (data: any) => reviewsApi.createReview(data),
    onSuccess: () => {
      message.success('复核已提交');
      setReviewModalOpen(false);
      reviewForm.resetFields();
      invalidateEvidenceQueries();
    },
    onError: (err) => {
      message.error(err instanceof Error ? err.message : '复核失败');
    },
  });

  const handleNormalUpload: UploadProps['customRequest'] = (options) => {
    const { file } = options as any;
    if (file) {
      uploadAttachmentMutation.mutate({ file: file as File });
    }
  };

  const handleSupplementUpload: UploadProps['customRequest'] = (options) => {
    const { file } = options as any;
    if (file) {
      uploadAttachmentMutation.mutate({ file: file as File, isSupplement: true });
    }
  };

  const handleSupplementSubmit = (values: any) => {
    requestSupplementMutation.mutate({
      evidenceId,
      reason: values.reason,
    });
  };

  const handleReviewSubmit = (values: any) => {
    createReviewMutation.mutate({
      targetType: 'EVIDENCE' as ReviewTargetType,
      targetId: evidenceId,
      result: values.result,
      comment: values.comment,
    });
  };

  const handleViewSnapshot = (review: ReviewRecord) => {
    setSelectedSnapshot(review.snapshot);
    setSnapshotDrawerOpen(true);
  };

  const handleCompleteSupplement = () => {
    const pendingSupplement = evidence?.supplementHistory?.find((s) => !s.isCompleted);
    if (pendingSupplement) {
      completeSupplementMutation.mutate(pendingSupplement.id);
    }
  };

  const getBottomActions = () => {
    if (!evidence) return null;
    const actions: React.ReactNode[] = [];

    if (evidence.status === 'DRAFT') {
      actions.push(
        <PermissionGuard key="submit" permission={Permission.EVIDENCE_SUBMIT as any}>
          <Button
            type="primary"
            icon={<SendOutlined />}
            loading={submitEvidenceMutation.isPending}
            onClick={() => submitEvidenceMutation.mutate()}
          >
            提交证据
          </Button>
        </PermissionGuard>
      );
    }

    if (evidence.status === 'NEED_SUPPLEMENT') {
      actions.push(
        <PermissionGuard key="complete" permission={Permission.EVIDENCE_EDIT}>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            loading={completeSupplementMutation.isPending}
            onClick={handleCompleteSupplement}
          >
            完成补件
          </Button>
        </PermissionGuard>
      );
    }

    if (evidence.status === 'SUBMITTED' || evidence.status === 'REVIEWING') {
      actions.push(
        <PermissionGuard
          key="review"
          role={[UserRole.COMPLIANCE_OFFICER, UserRole.MANAGEMENT, UserRole.BUSINESS_OWNER]}
        >
          <Button
            type="primary"
            icon={<SafetyCertificateOutlined />}
            onClick={() => setReviewModalOpen(true)}
          >
            提交复核
          </Button>
        </PermissionGuard>
      );
    }

    return actions;
  };

  const attachmentColumns = [
    {
      title: '文件',
      key: 'file',
      render: (_: any, record: Attachment) => (
        <Space>
          {getFileIcon(record.originalName)}
          <div>
            <div className="font-medium">{record.originalName}</div>
            <div className="text-xs text-gray-400">{record.fileName}</div>
          </div>
          {record.isSupplement && (
            <Tag color="warning" icon={<ExclamationCircleOutlined />}>
              补附件
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 80,
      render: (v: number) => <Tag color="blue">v{v}</Tag>,
    },
    {
      title: '大小',
      dataIndex: 'fileSize',
      key: 'fileSize',
      width: 100,
      render: (size: number) => formatFileSize(size),
    },
    {
      title: '上传人',
      key: 'uploader',
      width: 120,
      render: (_: any, record: Attachment) => record.uploadedBy?.fullName || '-',
    },
    {
      title: '上传时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: 'MD5哈希',
      dataIndex: 'fileHash',
      key: 'fileHash',
      width: 280,
      render: (hash: string) =>
        hash ? (
          <Tooltip title={hash}>
            <code className="text-xs bg-gray-100 px-2 py-1 rounded truncate inline-block max-w-[260px] align-middle">
              {hash}
            </code>
          </Tooltip>
        ) : (
          '-'
        ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: () => (
        <Space size="small">
          <Tooltip title="预览">
            <Button type="link" size="small" icon={<EyeOutlined />} />
          </Tooltip>
          <Tooltip title="下载">
            <Button type="link" size="small" icon={<DownloadOutlined />} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const diffFields = (before: any, after: any): { field: string; before: any; after: any }[] => {
    const fields: { field: string; before: any; after: any }[] = [];
    const allKeys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
    allKeys.forEach((key) => {
      const b = before?.[key];
      const a = after?.[key];
      if (JSON.stringify(b) !== JSON.stringify(a)) {
        fields.push({ field: key, before: b, after: a });
      }
    });
    return fields;
  };

  if (evidenceLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!evidence) {
    return (
      <div className="p-8">
        <Empty description="证据不存在" />
      </div>
    );
  }

  const bottomActions = getBottomActions();

  return (
    <div className="p-6 pb-24">
      <Space direction="vertical" size="middle" className="w-full">
        <Card size="small">
          <Space className="w-full" align="center">
            <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
              返回
            </Button>
            <Divider type="vertical" />
            <Space className="flex-1">
              <SnippetsOutlined className="text-xl text-blue-500" />
              <Space>
                <span className="text-xl font-bold">{evidence.title}</span>
                <Tag color="blue">{evidence.evidenceNo}</Tag>
              </Space>
              <Tag color={evidenceStatusColors[evidence.status]} className="text-sm px-3 py-1">
                {evidenceStatusLabels[evidence.status]}
              </Tag>
              <Tag color="purple">{evidenceCategoryLabels[evidence.category]}</Tag>
            </Space>
            {taskData && (
              <a
                onClick={() => router.push(`/tasks/${taskData.id}`)}
                className="text-blue-500 hover:underline"
              >
                <Space>
                  <FileSearchOutlined />
                  <span>所属任务：{taskData.taskNo}</span>
                </Space>
              </a>
            )}
          </Space>
        </Card>

        {evidence.status === 'NEED_SUPPLEMENT' && (
          <Alert
            type="warning"
            showIcon
            icon={<ExclamationCircleOutlined />}
            message="该证据需要补充附件"
            description={
              evidence.supplementHistory?.find((s) => !s.isCompleted)?.reason ||
              '请按要求补充相关附件后提交。'
            }
          />
        )}

        <Card>
          <Tabs defaultActiveKey="info">
            <TabPane
              tab={
                <Space>
                  <FileTextOutlined />
                  基本信息与附件
                </Space>
              }
              key="info"
            >
              <Space direction="vertical" size="large" className="w-full">
                <Card title="基本信息" size="small">
                  <Descriptions column={2} bordered size="small">
                    <Descriptions.Item label="证据编号">{evidence.evidenceNo}</Descriptions.Item>
                    <Descriptions.Item label="证据分类">
                      {evidenceCategoryLabels[evidence.category]}
                    </Descriptions.Item>
                    <Descriptions.Item label="关联单据号">
                      {evidence.relatedDocumentNo || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="单据类型">
                      {evidence.relatedDocumentType || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="单据日期">
                      {formatDate(evidence.relatedDocumentDate)}
                    </Descriptions.Item>
                    <Descriptions.Item label="单据金额">
                      {formatMoney(evidence.relatedDocumentAmount)}
                    </Descriptions.Item>
                    <Descriptions.Item label="提交人">
                      {evidence.submittedBy?.fullName || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="提交时间">
                      {formatDateTime(evidence.submittedAt)}
                    </Descriptions.Item>
                    <Descriptions.Item label="创建时间">
                      {formatDateTime(evidence.createdAt)}
                    </Descriptions.Item>
                    <Descriptions.Item label="更新时间">
                      {formatDateTime(evidence.updatedAt)}
                    </Descriptions.Item>
                    <Descriptions.Item label="描述" span={2}>
                      {evidence.description || '-'}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>

                <Card
                  title={
                    <Space>
                      <FolderOpenOutlined />
                      <span>附件列表</span>
                      <Tag color="cyan">{sortedAttachments.length} 个文件</Tag>
                      {evidence.status === 'NEED_SUPPLEMENT' && (
                        <Tag color="warning">
                          补附件标记高亮
                        </Tag>
                      )}
                    </Space>
                  }
                  size="small"
                  extra={
                    <Space>
                      <PermissionGuard permission={Permission.EVIDENCE_UPLOAD}>
                        <Upload
                          showUploadList={false}
                          customRequest={handleNormalUpload}
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.bmp,.webp"
                        >
                          <Button
                            icon={<UploadOutlined />}
                            loading={uploadAttachmentMutation.isPending}
                          >
                            上传附件
                          </Button>
                        </Upload>
                      </PermissionGuard>
                      {evidence.status === 'NEED_SUPPLEMENT' && (
                        <PermissionGuard permission={Permission.EVIDENCE_UPLOAD}>
                          <Upload
                            showUploadList={false}
                            customRequest={handleSupplementUpload}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.bmp,.webp"
                          >
                            <Button
                              type="primary"
                              icon={<UploadOutlined />}
                              loading={uploadAttachmentMutation.isPending}
                            >
                              补附件上传
                            </Button>
                          </Upload>
                        </PermissionGuard>
                      )}
                      <PermissionGuard
                        role={[UserRole.COMPLIANCE_OFFICER, UserRole.MANAGEMENT]}
                      >
                        <Button
                          danger
                          icon={<ExclamationCircleOutlined />}
                          onClick={() => setSupplementModalOpen(true)}
                        >
                          发起补附件请求
                        </Button>
                      </PermissionGuard>
                    </Space>
                  }
                >
                  <Table
                    columns={attachmentColumns}
                    dataSource={sortedAttachments}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    rowClassName={(record) =>
                      record.isSupplement ? 'bg-orange-50 hover:!bg-orange-100' : ''
                    }
                    locale={{ emptyText: '暂无附件' }}
                  />
                </Card>

                {evidence.supplementHistory && evidence.supplementHistory.length > 0 && (
                  <Card
                    title={
                      <Space>
                        <ExclamationCircleOutlined className="text-orange-500" />
                        补附件历史
                      </Space>
                    }
                    size="small"
                  >
                    <Timeline
                      items={evidence.supplementHistory
                        .sort((a, b) =>
                          new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
                        )
                        .map((s) => ({
                          color: s.isCompleted ? 'green' : 'orange',
                          dot: s.isCompleted ? <CheckOutlined /> : <ExclamationCircleOutlined />,
                          children: (
                            <Card size="small">
                              <Space direction="vertical" size="small" className="w-full">
                                <div className="flex justify-between">
                                  <Space>
                                    <Tag color={s.isCompleted ? 'success' : 'warning'}>
                                      {s.isCompleted ? '已完成' : '待补件'}
                                    </Tag>
                                    <span className="text-sm text-gray-500">
                                      请求人：{s.requestedBy?.fullName}
                                    </span>
                                  </Space>
                                  <span className="text-sm text-gray-400">
                                    {formatDateTime(s.requestedAt)}
                                  </span>
                                </div>
                                <div className="text-sm bg-gray-50 p-2 rounded">
                                  <span className="text-gray-500">补件原因：</span>
                                  {s.reason}
                                </div>
                                {s.isCompleted && (
                                  <div className="text-sm text-gray-500">
                                    完成时间：{formatDateTime(s.completedAt)}
                                  </div>
                                )}
                                {s.supplementAttachments &&
                                  s.supplementAttachments.length > 0 && (
                                    <List
                                      size="small"
                                      header={<span className="text-sm">补充的附件：</span>}
                                      dataSource={s.supplementAttachments}
                                      renderItem={(item) => (
                                        <List.Item>
                                          <Space>
                                            {getFileIcon(item.originalName)}
                                            <span>{item.originalName}</span>
                                            <span className="text-xs text-gray-400">
                                              ({formatFileSize(item.fileSize)})
                                            </span>
                                          </Space>
                                        </List.Item>
                                      )}
                                    />
                                  )}
                              </Space>
                            </Card>
                          ),
                        }))}
                    />
                  </Card>
                )}
              </Space>
            </TabPane>

            <TabPane
              tab={
                <Space>
                  <SafetyCertificateOutlined />
                  复核记录
                </Space>
              }
              key="reviews"
            >
              <Card
                size="small"
                extra={
                  <PermissionGuard
                    role={[UserRole.COMPLIANCE_OFFICER, UserRole.MANAGEMENT, UserRole.BUSINESS_OWNER]}
                  >
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => setReviewModalOpen(true)}
                    >
                      发起复核
                    </Button>
                  </PermissionGuard>
                }
              >
                {reviewsLoading ? (
                  <div className="flex justify-center py-8">
                    <Spin />
                  </div>
                ) : reviews.length === 0 ? (
                  <Empty description="暂无复核记录" />
                ) : (
                  <Timeline
                    mode="left"
                    items={reviews
                      .sort((a, b) => (a.reviewRound < b.reviewRound ? 1 : -1))
                      .map((review) => ({
                        color:
                          review.result === 'APPROVED'
                            ? 'green'
                            : review.result === 'REJECTED'
                            ? 'red'
                            : 'gold',
                        dot: <SafetyCertificateOutlined />,
                        children: (
                          <Card size="small" className="mb-4">
                            <Space direction="vertical" size="small" className="w-full">
                              <div className="flex justify-between items-start">
                                <Space>
                                  <span className="font-bold">
                                    第 {review.reviewRound} 轮复核
                                  </span>
                                  <Tag color={reviewResultColors[review.result]}>
                                    {reviewResultLabels[review.result]}
                                  </Tag>
                                </Space>
                                <Space>
                                  {review.snapshot && (
                                    <Button
                                      type="link"
                                      size="small"
                                      icon={<EyeOutlined />}
                                      onClick={() => handleViewSnapshot(review)}
                                    >
                                      查看快照
                                    </Button>
                                  )}
                                  <span className="text-gray-500 text-sm">
                                    {formatDateTime(review.reviewedAt)}
                                  </span>
                                </Space>
                              </div>
                              <Descriptions column={2} size="small">
                                <Descriptions.Item label="复核人">
                                  {review.reviewer?.fullName || '-'}
                                </Descriptions.Item>
                                <Descriptions.Item label="复核人角色">
                                  {review.reviewer?.role ? (
                                    <Tag color="blue">{review.reviewer.role}</Tag>
                                  ) : (
                                    '-'
                                  )}
                                </Descriptions.Item>
                              </Descriptions>
                              {review.comment && (
                                <div className="text-sm bg-gray-50 p-3 rounded">
                                  <span className="text-gray-500">复核意见：</span>
                                  {review.comment}
                                </div>
                              )}
                            </Space>
                          </Card>
                        ),
                      }))}
                  />
                )}
              </Card>
            </TabPane>

            <TabPane
              tab={
                <Space>
                  <HistoryOutlined />
                  痕迹追踪
                </Space>
              }
              key="audit"
            >
              <Card size="small" title="操作日志时间线">
                {auditLogsLoading ? (
                  <div className="flex justify-center py-8">
                    <Spin />
                  </div>
                ) : auditLogs.length === 0 ? (
                  <Empty description="暂无操作日志" />
                ) : (
                  <Timeline
                    mode="left"
                    items={auditLogs.map((log) => {
                      const diffs = diffFields(log.beforeData, log.afterData);
                      return {
                        dot: operationActionIcons[log.action],
                        children: (
                          <Collapse ghost size="small">
                            <Collapse.Panel
                              header={
                                <Space className="w-full" size="small">
                                  <Tag color="blue">
                                    {operationActionLabels[log.action]}
                                  </Tag>
                                  <span className="font-medium">
                                    {log.description || log.action}
                                  </span>
                                  <span className="text-gray-500 text-sm">
                                    - {log.operator?.fullName || log.operatorName}
                                  </span>
                                  {log.ipAddress && (
                                    <span className="text-gray-400 text-xs">
                                      IP: {log.ipAddress}
                                    </span>
                                  )}
                                  {diffs.length > 0 && (
                                    <Tag color="orange">{diffs.length} 处变更</Tag>
                                  )}
                                  <span className="ml-auto text-gray-400 text-sm">
                                    {formatDateTime(log.createdAt)}
                                  </span>
                                </Space>
                              }
                              key={log.id}
                            >
                              <div className="pl-4 space-y-3 text-sm">
                                {diffs.length > 0 ? (
                                  <div>
                                    <div className="text-gray-500 mb-2 font-medium">
                                      变更对比：
                                    </div>
                                    <Table
                                      size="small"
                                      pagination={false}
                                      dataSource={diffs}
                                      rowKey="field"
                                      columns={[
                                        {
                                          title: '字段',
                                          dataIndex: 'field',
                                          key: 'field',
                                          width: 160,
                                          render: (f) => (
                                            <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                                              {f}
                                            </code>
                                          ),
                                        },
                                        {
                                          title: '变更前',
                                          dataIndex: 'before',
                                          key: 'before',
                                          render: (v) => (
                                            <span className="text-red-500">
                                              {v === undefined || v === null
                                                ? '-'
                                                : typeof v === 'object'
                                                ? JSON.stringify(v)
                                                : String(v)}
                                            </span>
                                          ),
                                        },
                                        {
                                          title: '变更后',
                                          dataIndex: 'after',
                                          key: 'after',
                                          render: (v) => (
                                            <span className="text-green-600">
                                              {v === undefined || v === null
                                                ? '-'
                                                : typeof v === 'object'
                                                ? JSON.stringify(v)
                                                : String(v)}
                                            </span>
                                          ),
                                        },
                                      ]}
                                    />
                                  </div>
                                ) : (
                                  <>
                                    {log.beforeData &&
                                      Object.keys(log.beforeData).length > 0 && (
                                        <div>
                                          <div className="text-gray-500 mb-1">变更前：</div>
                                          <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                                            {JSON.stringify(log.beforeData, null, 2)}
                                          </pre>
                                        </div>
                                      )}
                                    {log.afterData &&
                                      Object.keys(log.afterData).length > 0 && (
                                        <div>
                                          <div className="text-gray-500 mb-1">变更后：</div>
                                          <pre className="bg-green-50 p-3 rounded text-xs overflow-x-auto">
                                            {JSON.stringify(log.afterData, null, 2)}
                                          </pre>
                                        </div>
                                      )}
                                  </>
                                )}
                              </div>
                            </Collapse.Panel>
                          </Collapse>
                        ),
                      };
                    })}
                  />
                )}
              </Card>
            </TabPane>
          </Tabs>
        </Card>
      </Space>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
          <Space>
            <span className="text-gray-500 text-sm">当前状态：</span>
            <Tag color={evidenceStatusColors[evidence.status]}>
              {evidenceStatusLabels[evidence.status]}
            </Tag>
            {evidence.status === 'NEED_SUPPLEMENT' &&
              evidence.supplementHistory?.find((s) => !s.isCompleted) && (
                <span className="text-orange-500 text-sm">
                  未完成补件：
                  {evidence.supplementHistory.find((s) => !s.isCompleted)?.reason}
                </span>
              )}
          </Space>
          <Space>{bottomActions}</Space>
        </div>
      </div>

      <Modal
        title="发起补附件请求"
        open={supplementModalOpen}
        onCancel={() => setSupplementModalOpen(false)}
        footer={null}
        width={500}
      >
        <Form form={supplementForm} layout="vertical" onFinish={handleSupplementSubmit}>
          <Form.Item
            name="reason"
            label="补附件原因"
            rules={[{ required: true, message: '请输入补附件原因' }]}
          >
            <TextArea
              rows={4}
              placeholder="请详细说明需要补充哪些附件及原因..."
              showCount
              maxLength={500}
            />
          </Form.Item>
          <Alert
            type="info"
            showIcon
            message="说明"
            description="发起补附件请求后，证据状态将变为「需补附件」，相关人员会收到通知。"
          />
          <Divider />
          <Form.Item className="mb-0">
            <Space className="w-full" style={{ justifyContent: 'flex-end' }}>
              <Button onClick={() => setSupplementModalOpen(false)}>取消</Button>
              <Button
                type="primary"
                danger
                htmlType="submit"
                loading={requestSupplementMutation.isPending}
              >
                确认发起
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="发起复核"
        open={reviewModalOpen}
        onCancel={() => setReviewModalOpen(false)}
        footer={null}
        width={500}
      >
        <Form form={reviewForm} layout="vertical" onFinish={handleReviewSubmit}>
          <Form.Item
            name="result"
            label="复核结果"
            rules={[{ required: true, message: '请选择复核结果' }]}
          >
            <Select placeholder="请选择复核结果">
              <Option value="APPROVED">
                <Space>
                  <CheckOutlined className="text-green-500" />
                  <span>通过</span>
                </Space>
              </Option>
              <Option value="NEED_REVISION">
                <Space>
                  <ExclamationCircleOutlined className="text-yellow-500" />
                  <span>需修改</span>
                </Space>
              </Option>
              <Option value="REJECTED">
                <Space>
                  <CloseOutlined className="text-red-500" />
                  <span>驳回</span>
                </Space>
              </Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="comment"
            label="复核意见"
            rules={[{ required: true, message: '请输入复核意见' }]}
          >
            <TextArea
              rows={4}
              placeholder="请详细填写复核意见..."
              showCount
              maxLength={1000}
            />
          </Form.Item>
          <Divider />
          <Form.Item className="mb-0">
            <Space className="w-full" style={{ justifyContent: 'flex-end' }}>
              <Button onClick={() => setReviewModalOpen(false)}>取消</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createReviewMutation.isPending}
              >
                提交复核
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="复核快照信息"
        open={snapshotDrawerOpen}
        onClose={() => {
          setSnapshotDrawerOpen(false);
          setSelectedSnapshot(null);
        }}
        width={640}
      >
        {selectedSnapshot ? (
          <div className="space-y-4">
            <Alert
              type="info"
              showIcon
              message="快照信息"
              description="此为该轮复核时证据的完整状态快照，用于追溯历史。"
            />
            <pre className="bg-gray-50 p-4 rounded text-xs overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(selectedSnapshot, null, 2)}
            </pre>
          </div>
        ) : (
          <Empty description="无快照数据" />
        )}
      </Drawer>
    </div>
  );
}
