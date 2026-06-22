'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  DatePicker,
  Upload,
  message,
  Popconfirm,
  Row,
  Col,
  Radio,
  Checkbox,
  Tooltip,
  Divider,
  Empty,
  Spin,
  Collapse,
} from 'antd';
import {
  EditOutlined,
  UserOutlined,
  ClockCircleOutlined,
  UploadOutlined,
  PlusOutlined,
  CheckOutlined,
  CloseOutlined,
  SendOutlined,
  DownloadOutlined,
  EyeOutlined,
  HistoryOutlined,
  FileTextOutlined,
  AuditOutlined,
  OrderedListOutlined,
  FolderOpenOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UploadFile, UploadProps } from 'antd';
import dayjs from 'dayjs';

import { tasksApi } from '@/lib/api/tasks';
import { evidencesApi } from '@/lib/api/evidences';
import { reviewsApi } from '@/lib/api/reviews';
import { checklistsApi } from '@/lib/api/checklists';
import { samplingsApi } from '@/lib/api/samplings';
import { auditLogApi } from '@/lib/api/audit-log';
import { usersApi } from '@/lib/api/users';
import {
  TaskStatus,
  TaskPriority,
  AuditType,
  EvidenceStatus,
  EvidenceCategory,
  ReviewResult,
  ReviewTargetType,
  SamplingStatus,
  SamplingMethod,
  OperationAction,
  UserRole,
  Permission,
} from '@/lib/api/types';
import type {
  AuditTask,
  Evidence,
  ReviewRecord,
  ChecklistExecution,
  ChecklistItemResult,
  SamplingRecord,
  OperationLog,
  User,
  PaginatedResult,
} from '@/lib/api/types';
import { formatDate, formatDateTime, formatMoney, formatFileSize } from '@/lib/utils/format';
import { PermissionGuard } from '@/components/common/PermissionGuard';

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

const taskStatusLabels: Record<TaskStatus, string> = {
  DRAFT: '草稿',
  PENDING: '待分派',
  ASSIGNED: '已分派',
  IN_PROGRESS: '进行中',
  SUBMITTED: '已提交',
  REVIEWING: '复核中',
  APPROVED: '已通过',
  REJECTED: '已驳回',
  ARCHIVED: '已归档',
};

const taskStatusColors: Record<TaskStatus, string> = {
  DRAFT: 'default',
  PENDING: 'warning',
  ASSIGNED: 'processing',
  IN_PROGRESS: 'processing',
  SUBMITTED: 'cyan',
  REVIEWING: 'geekblue',
  APPROVED: 'success',
  REJECTED: 'error',
  ARCHIVED: 'default',
};

const taskPriorityLabels: Record<TaskPriority, string> = {
  LOW: '低',
  MEDIUM: '中',
  HIGH: '高',
  URGENT: '紧急',
};

const taskPriorityColors: Record<TaskPriority, string> = {
  LOW: 'green',
  MEDIUM: 'blue',
  HIGH: 'orange',
  URGENT: 'red',
};

const auditTypeLabels: Record<AuditType, string> = {
  ROUTINE: '常规审计',
  SPECIAL: '专项审计',
  COMPLIANCE: '合规审计',
  INVESTIGATION: '调查审计',
};

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

const samplingStatusLabels: Record<SamplingStatus, string> = {
  DRAFT: '草稿',
  IN_PROGRESS: '进行中',
  COMPLETED: '已完成',
  APPROVED: '已通过',
  REJECTED: '已驳回',
};

const samplingStatusColors: Record<SamplingStatus, string> = {
  DRAFT: 'default',
  IN_PROGRESS: 'processing',
  COMPLETED: 'cyan',
  APPROVED: 'success',
  REJECTED: 'error',
};

const samplingMethodLabels: Record<SamplingMethod, string> = {
  RANDOM: '随机抽样',
  SYSTEMATIC: '系统抽样',
  STRATIFIED: '分层抽样',
  JUDGMENT: '判断抽样',
  BLOCK: '整群抽样',
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
  REVIEW: <AuditOutlined />,
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

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const taskId = params.id as string;

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [checklistExecModalOpen, setChecklistExecModalOpen] = useState(false);
  const [samplingModalOpen, setSamplingModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState<ChecklistExecution | null>(null);
  const [checklistResults, setChecklistResults] = useState<Record<string, { isPass?: boolean; remark?: string }>>({});

  const [assignForm] = Form.useForm();
  const [statusForm] = Form.useForm();
  const [evidenceForm] = Form.useForm();
  const [checklistForm] = Form.useForm();
  const [samplingForm] = Form.useForm();
  const [reviewForm] = Form.useForm();

  const { data: task, isLoading: taskLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => tasksApi.getTask(taskId),
  });

  const { data: evidencesData, isLoading: evidencesLoading } = useQuery({
    queryKey: ['evidences', taskId],
    queryFn: () => evidencesApi.getEvidences({ taskId, pageSize: 100 }),
  });

  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['taskReviews', taskId],
    queryFn: () => reviewsApi.getReviewsByTarget(ReviewTargetType.TASK, taskId),
  });

  const { data: checklistExecsData, isLoading: checklistExecsLoading } = useQuery({
    queryKey: ['checklistExecs', taskId],
    queryFn: () => checklistsApi.getChecklistExecutions({ taskId, pageSize: 100 }),
  });

  const { data: checklistsData } = useQuery({
    queryKey: ['checklists'],
    queryFn: () => checklistsApi.getChecklists({ isActive: true, pageSize: 100 }),
  });

  const { data: samplingsData, isLoading: samplingsLoading } = useQuery({
    queryKey: ['taskSamplings', taskId],
    queryFn: () => samplingsApi.getSamplings({ taskId, pageSize: 100 }),
  });

  const { data: auditLogsData, isLoading: auditLogsLoading } = useQuery({
    queryKey: ['taskAuditLogs', taskId],
    queryFn: () => auditLogApi.getOperationLogsByTarget('AuditTask', taskId, { pageSize: 100, sortBy: 'createdAt', sortOrder: 'desc' }),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getUsers({ pageSize: 100, isActive: true }),
  });

  const evidences = evidencesData?.items || [];
  const reviews = reviewsData || [];
  const checklistExecs = checklistExecsData?.items || [];
  const checklists = checklistsData?.items || [];
  const samplings = samplingsData?.items || [];
  const auditLogs = auditLogsData?.items || [];
  const users = usersData?.items || [];

  const invalidateTaskQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['task', taskId] });
    queryClient.invalidateQueries({ queryKey: ['evidences', taskId] });
    queryClient.invalidateQueries({ queryKey: ['taskReviews', taskId] });
    queryClient.invalidateQueries({ queryKey: ['checklistExecs', taskId] });
    queryClient.invalidateQueries({ queryKey: ['taskSamplings', taskId] });
    queryClient.invalidateQueries({ queryKey: ['taskAuditLogs', taskId] });
  }, [queryClient, taskId]);

  const assignMutation = useMutation({
    mutationFn: (data: { assignedToId: string; businessOwnerId?: string; dueDate?: string }) =>
      tasksApi.assignTask(taskId, data),
    onSuccess: () => {
      message.success('任务分派成功');
      setAssignModalOpen(false);
      assignForm.resetFields();
      invalidateTaskQueries();
    },
    onError: (err) => {
      message.error(err instanceof Error ? err.message : '分派失败');
    },
  });

  const statusMutation = useMutation({
    mutationFn: (data: { status: TaskStatus }) => tasksApi.updateTask(taskId, data),
    onSuccess: () => {
      message.success('状态更新成功');
      setStatusModalOpen(false);
      statusForm.resetFields();
      invalidateTaskQueries();
    },
    onError: (err) => {
      message.error(err instanceof Error ? err.message : '状态更新失败');
    },
  });

  const submitTaskMutation = useMutation({
    mutationFn: () => tasksApi.updateTask(taskId, { status: TaskStatus.SUBMITTED }),
    onSuccess: () => {
      message.success('任务已提交');
      invalidateTaskQueries();
    },
    onError: (err) => {
      message.error(err instanceof Error ? err.message : '提交失败');
    },
  });

  const createEvidenceMutation = useMutation({
    mutationFn: (data: {
      title: string;
      category: EvidenceCategory;
      taskId: string;
      relatedDocumentNo?: string;
      relatedDocumentType?: string;
      relatedDocumentDate?: string;
      relatedDocumentAmount?: number;
      description?: string;
    }) => evidencesApi.createEvidence(data),
    onSuccess: () => {
      message.success('证据创建成功');
      setEvidenceModalOpen(false);
      evidenceForm.resetFields();
      invalidateTaskQueries();
    },
    onError: (err) => {
      message.error(err instanceof Error ? err.message : '创建失败');
    },
  });

  const submitEvidenceMutation = useMutation({
    mutationFn: (id: string) => evidencesApi.submitEvidence(id),
    onSuccess: () => {
      message.success('证据已提交');
      invalidateTaskQueries();
    },
    onError: (err) => {
      message.error(err instanceof Error ? err.message : '提交失败');
    },
  });

  const uploadAttachmentMutation = useMutation({
    mutationFn: ({ file, evidenceId }: { file: File; evidenceId: string }) =>
      evidencesApi.uploadAttachment(file, { evidenceId }),
    onSuccess: () => {
      message.success('附件上传成功');
      invalidateTaskQueries();
    },
    onError: (err) => {
      message.error(err instanceof Error ? err.message : '上传失败');
    },
  });

  const executeChecklistMutation = useMutation({
    mutationFn: ({ checklistId, taskId }: { checklistId: string; taskId: string }) =>
      checklistsApi.executeChecklist(checklistId, { taskId }),
    onSuccess: () => {
      message.success('清单已创建执行记录');
      setChecklistExecModalOpen(false);
      checklistForm.resetFields();
      invalidateTaskQueries();
    },
    onError: (err) => {
      message.error(err instanceof Error ? err.message : '执行失败');
    },
  });

  const updateChecklistResultMutation = useMutation({
    mutationFn: (data: {
      executionId: string;
      itemId: string;
      isPass?: boolean;
      remark?: string;
    }) => checklistsApi.updateChecklistItemResult(data),
  });

  const createSamplingMutation = useMutation({
    mutationFn: (data: {
      title: string;
      method: SamplingMethod;
      population: number;
      sampleSize: number;
      taskId: string;
      confidenceLevel?: number;
      remark?: string;
    }) => samplingsApi.createSampling(data),
    onSuccess: () => {
      message.success('抽样方案创建成功');
      setSamplingModalOpen(false);
      samplingForm.resetFields();
      invalidateTaskQueries();
    },
    onError: (err) => {
      message.error(err instanceof Error ? err.message : '创建失败');
    },
  });

  const approveSamplingMutation = useMutation({
    mutationFn: (id: string) => samplingsApi.approveSampling(id),
    onSuccess: () => {
      message.success('抽样已审批通过');
      invalidateTaskQueries();
    },
    onError: (err) => {
      message.error(err instanceof Error ? err.message : '审批失败');
    },
  });

  const rejectSamplingMutation = useMutation({
    mutationFn: (id: string) => samplingsApi.rejectSampling(id),
    onSuccess: () => {
      message.success('抽样已驳回');
      invalidateTaskQueries();
    },
    onError: (err) => {
      message.error(err instanceof Error ? err.message : '驳回失败');
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: (data: {
      targetType: ReviewTargetType;
      targetId: string;
      result: ReviewResult;
      comment?: string;
    }) => reviewsApi.createReview(data),
    onSuccess: () => {
      message.success('复核已提交');
      setReviewModalOpen(false);
      reviewForm.resetFields();
      invalidateTaskQueries();
    },
    onError: (err) => {
      message.error(err instanceof Error ? err.message : '复核失败');
    },
  });

  const handleAssignSubmit = (values: {
    assignedToId: string;
    businessOwnerId?: string;
    dueDate?: { format: (fmt: string) => string };
  }) => {
    assignMutation.mutate({
      assignedToId: values.assignedToId,
      businessOwnerId: values.businessOwnerId,
      dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : undefined,
    });
  };

  const handleStatusSubmit = (values: { status: TaskStatus }) => {
    statusMutation.mutate({ status: values.status });
  };

  const handleEvidenceSubmit = (values: {
    title: string;
    category: EvidenceCategory;
    relatedDocumentNo?: string;
    relatedDocumentType?: string;
    relatedDocumentDate?: { format: (fmt: string) => string };
    relatedDocumentAmount?: number;
    description?: string;
  }) => {
    createEvidenceMutation.mutate({
      ...values,
      taskId,
      relatedDocumentDate: values.relatedDocumentDate ? values.relatedDocumentDate.format('YYYY-MM-DD') : undefined,
    });
  };

  const handleChecklistExecSubmit = (values: { checklistId: string }) => {
    executeChecklistMutation.mutate({ checklistId: values.checklistId, taskId });
  };

  const handleSamplingSubmit = (values: {
    title: string;
    method: SamplingMethod;
    population: number;
    sampleSize: number;
    confidenceLevel?: number;
    remark?: string;
  }) => {
    createSamplingMutation.mutate({
      ...values,
      taskId,
    });
  };

  const handleReviewSubmit = (values: { result: ReviewResult; comment?: string }) => {
    createReviewMutation.mutate({
      targetType: ReviewTargetType.TASK,
      targetId: taskId,
      result: values.result,
      comment: values.comment,
    });
  };

  const handleFileUpload: UploadProps['customRequest'] = (options) => {
    const opts = options as { file?: File; data?: { evidenceId?: string } };
    const { file, data } = opts;
    const evidenceId = data?.evidenceId;
    if (evidenceId && file) {
      uploadAttachmentMutation.mutate({ file, evidenceId });
    }
  };

  const handleOpenChecklistExecution = (exec: ChecklistExecution) => {
    setSelectedExecution(exec);
    const results: Record<string, { isPass?: boolean; remark?: string }> = {};
    exec.results?.forEach((r) => {
      results[r.itemId] = { isPass: r.isPass, remark: r.remark };
    });
    setChecklistResults(results);
  };

  const handleSaveChecklistResults = async () => {
    if (!selectedExecution) return;
    try {
      const promises = Object.entries(checklistResults).map(([itemId, result]) =>
        updateChecklistResultMutation.mutateAsync({
          executionId: selectedExecution.id,
          itemId,
          isPass: result.isPass,
          remark: result.remark,
        })
      );
      await Promise.all(promises);
      message.success('检查结果已保存');
      setSelectedExecution(null);
      setChecklistResults({});
      invalidateTaskQueries();
    } catch (err) {
      message.error(err instanceof Error ? err.message : '保存失败');
    }
  };

  const getNextTaskStatuses = (current: TaskStatus): TaskStatus[] => {
    const transitions: Record<TaskStatus, TaskStatus[]> = {
      [TaskStatus.DRAFT]: [TaskStatus.PENDING, TaskStatus.ASSIGNED, TaskStatus.ARCHIVED],
      [TaskStatus.PENDING]: [TaskStatus.ASSIGNED, TaskStatus.ARCHIVED],
      [TaskStatus.ASSIGNED]: [TaskStatus.IN_PROGRESS, TaskStatus.PENDING, TaskStatus.ARCHIVED],
      [TaskStatus.IN_PROGRESS]: [TaskStatus.SUBMITTED, TaskStatus.ASSIGNED, TaskStatus.ARCHIVED],
      [TaskStatus.SUBMITTED]: [TaskStatus.REVIEWING, TaskStatus.IN_PROGRESS, TaskStatus.ARCHIVED],
      [TaskStatus.REVIEWING]: [TaskStatus.APPROVED, TaskStatus.REJECTED, TaskStatus.SUBMITTED, TaskStatus.ARCHIVED],
      [TaskStatus.APPROVED]: [TaskStatus.ARCHIVED],
      [TaskStatus.REJECTED]: [TaskStatus.IN_PROGRESS, TaskStatus.ARCHIVED],
      [TaskStatus.ARCHIVED]: [TaskStatus.DRAFT],
    };
    return transitions[current] || [];
  };

  if (taskLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-8">
        <Empty description="任务不存在" />
      </div>
    );
  }

  const evidenceColumns = [
    {
      title: '证据编号',
      dataIndex: 'evidenceNo',
      key: 'evidenceNo',
      render: (text: string, record: Evidence) => (
        <a onClick={() => router.push(`/evidences/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (cat: EvidenceCategory) => evidenceCategoryLabels[cat] || cat,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: EvidenceStatus) => (
        <Tag color={evidenceStatusColors[status]}>{evidenceStatusLabels[status]}</Tag>
      ),
    },
    {
      title: '关联单据',
      key: 'document',
      render: (_: unknown, record: Evidence) => (
        <span>
          {record.relatedDocumentNo || '-'}
          {record.relatedDocumentAmount && (
            <span className="ml-2 text-gray-500">({formatMoney(record.relatedDocumentAmount)})</span>
          )}
        </span>
      ),
    },
    {
      title: '附件数',
      dataIndex: ['_count', 'attachments'],
      key: 'attachments',
      render: (count: number) => count || 0,
    },
    {
      title: '提交人',
      key: 'submittedBy',
      render: (_: unknown, record: Evidence) => record.submittedBy?.fullName || '-',
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: Evidence) => (
        <Space size="small">
          <PermissionGuard permission={Permission.EVIDENCE_UPLOAD}>
            <Upload
              showUploadList={false}
              customRequest={handleFileUpload}
              data={{ evidenceId: record.id }}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
            >
              <Button type="link" size="small" icon={<UploadOutlined />} loading={uploadAttachmentMutation.isPending}>
                上传附件
              </Button>
            </Upload>
          </PermissionGuard>
          {record.status === EvidenceStatus.DRAFT && (
            <PermissionGuard permission={Permission.EVIDENCE_SUBMIT}>
              <Button
                type="link"
                size="small"
                icon={<SendOutlined />}
                loading={submitEvidenceMutation.isPending}
                onClick={() => submitEvidenceMutation.mutate(record.id)}
              >
                提交
              </Button>
            </PermissionGuard>
          )}
        </Space>
      ),
    },
  ];

  const checklistColumns = [
    {
      title: '清单名称',
      key: 'checklist',
      render: (_: unknown, record: ChecklistExecution) => record.checklist?.title || '-',
    },
    {
      title: '版本',
      key: 'version',
      render: (_: unknown, record: ChecklistExecution) => record.checklist?.version || '-',
    },
    {
      title: '总项数',
      key: 'totalItems',
      render: (_: unknown, record: ChecklistExecution) => record.checklist?.items?.length || 0,
    },
    {
      title: '已完成',
      key: 'completed',
      render: (_: unknown, record: ChecklistExecution) => {
        const done = record.results?.filter((r) => r.isPass !== undefined).length || 0;
        return done;
      },
    },
    {
      title: '通过率',
      key: 'passRate',
      render: (_: unknown, record: ChecklistExecution) => {
        const total = record.results?.length || 0;
        const passed = record.results?.filter((r) => r.isPass === true).length || 0;
        if (total === 0) return '-';
        return `${((passed / total) * 100).toFixed(1)}%`;
      },
    },
    {
      title: '执行人',
      key: 'executedBy',
      render: (_: unknown, record: ChecklistExecution) => record.executedBy?.fullName || '-',
    },
    {
      title: '开始时间',
      dataIndex: 'startedAt',
      key: 'startedAt',
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '完成时间',
      dataIndex: 'completedAt',
      key: 'completedAt',
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: ChecklistExecution) => (
        <Space size="small">
          <PermissionGuard permission={Permission.CHECKLIST_EXECUTE}>
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleOpenChecklistExecution(record)}
            >
              执行
            </Button>
          </PermissionGuard>
        </Space>
      ),
    },
  ];

  const samplingColumns = [
    {
      title: '抽样编号',
      dataIndex: 'samplingNo',
      key: 'samplingNo',
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '抽样方法',
      dataIndex: 'method',
      key: 'method',
      render: (m: SamplingMethod) => samplingMethodLabels[m] || m,
    },
    {
      title: '总体量',
      dataIndex: 'population',
      key: 'population',
    },
    {
      title: '样本量',
      dataIndex: 'sampleSize',
      key: 'sampleSize',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: SamplingStatus) => (
        <Tag color={samplingStatusColors[s]}>{samplingStatusLabels[s]}</Tag>
      ),
    },
    {
      title: '创建人',
      key: 'createdBy',
      render: (_: unknown, record: SamplingRecord) => record.createdBy?.fullName || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: SamplingRecord) => (
        <Space size="small">
          {record.status === SamplingStatus.COMPLETED && (
            <PermissionGuard permission={Permission.SAMPLING_APPROVE}>
              <Popconfirm title="确认审批通过？" onConfirm={() => approveSamplingMutation.mutate(record.id)}>
                <Button type="link" size="small" icon={<CheckOutlined />}>
                  审批
                </Button>
              </Popconfirm>
              <Popconfirm title="确认驳回？" onConfirm={() => rejectSamplingMutation.mutate(record.id)}>
                <Button type="link" size="small" danger icon={<CloseOutlined />}>
                  驳回
                </Button>
              </Popconfirm>
            </PermissionGuard>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card
        title={
          <Space>
            <span className="text-xl font-bold">{task.title}</span>
            <Tag color={taskStatusColors[task.status]} className="text-sm">
              {taskStatusLabels[task.status]}
            </Tag>
          </Space>
        }
        extra={
          <Space>
            <PermissionGuard permission={Permission.TASK_ASSIGN}>
              <Button icon={<UserOutlined />} onClick={() => setAssignModalOpen(true)}>
                分派
              </Button>
            </PermissionGuard>
            <PermissionGuard permission={Permission.TASK_EDIT}>
              <Button icon={<EditOutlined />} onClick={() => setStatusModalOpen(true)}>
                改状态
              </Button>
            </PermissionGuard>
            {(task.status === TaskStatus.IN_PROGRESS || task.status === TaskStatus.DRAFT || task.status === TaskStatus.ASSIGNED) && (
              <PermissionGuard permission={Permission.TASK_EDIT}>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  loading={submitTaskMutation.isPending}
                  onClick={() => submitTaskMutation.mutate()}
                >
                  提交
                </Button>
              </PermissionGuard>
            )}
          </Space>
        }
      >
        <Tabs defaultActiveKey="overview" className="mt-4">
          <TabPane tab="概览" key="overview">
            <Space direction="vertical" size="large" className="w-full">
              <Card title="任务基本信息" size="small">
                <Descriptions column={2} bordered size="small">
                  <Descriptions.Item label="任务编号">{task.taskNo}</Descriptions.Item>
                  <Descriptions.Item label="审计类型">
                    <Tag>{auditTypeLabels[task.auditType]}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="优先级">
                    <Tag color={taskPriorityColors[task.priority]}>{taskPriorityLabels[task.priority]}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="部门">{task.department || '-'}</Descriptions.Item>
                  <Descriptions.Item label="审计期间">{task.auditPeriod || '-'}</Descriptions.Item>
                  <Descriptions.Item label="截止日期">
                    <Space>
                      <ClockCircleOutlined />
                      {formatDate(task.dueDate)}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="创建人">{task.createdBy?.fullName || '-'}</Descriptions.Item>
                  <Descriptions.Item label="创建时间">{formatDateTime(task.createdAt)}</Descriptions.Item>
                  <Descriptions.Item label="审计员">
                    {task.assignedTo ? (
                      <Space>
                        <UserOutlined />
                        {task.assignedTo.fullName}
                        <Tag color="blue">{task.assignedTo.department}</Tag>
                      </Space>
                    ) : (
                      <span className="text-gray-400">未分派</span>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="业务负责人">
                    {task.businessOwner ? (
                      <Space>
                        <UserOutlined />
                        {task.businessOwner.fullName}
                      </Space>
                    ) : (
                      <span className="text-gray-400">未设置</span>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="分派时间">{formatDateTime(task.assignedAt)}</Descriptions.Item>
                  <Descriptions.Item label="提交时间">{formatDateTime(task.submittedAt)}</Descriptions.Item>
                  <Descriptions.Item label="描述" span={2}>
                    {task.description || '-'}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Row gutter={16}>
                <Col span={6}>
                  <Card size="small">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-500">{task._count?.evidences || 0}</div>
                      <div className="text-gray-500 text-sm mt-1">证据数量</div>
                    </div>
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-500">{task._count?.checklistExecs || 0}</div>
                      <div className="text-gray-500 text-sm mt-1">检查清单执行</div>
                    </div>
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-500">{task._count?.samplingRecords || 0}</div>
                      <div className="text-gray-500 text-sm mt-1">抽样方案</div>
                    </div>
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-500">{task._count?.reviews || 0}</div>
                      <div className="text-gray-500 text-sm mt-1">复核次数</div>
                    </div>
                  </Card>
                </Col>
              </Row>
            </Space>
          </TabPane>

          <TabPane tab="证据列表" key="evidences">
            <Card
              size="small"
              title={
                <Space>
                  <FolderOpenOutlined />
                  <span>证据列表</span>
                </Space>
              }
              extra={
                <PermissionGuard permission={Permission.EVIDENCE_CREATE}>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setEvidenceModalOpen(true)}>
                    新建证据
                  </Button>
                </PermissionGuard>
              }
            >
              <Table
                columns={evidenceColumns}
                dataSource={evidences}
                rowKey="id"
                loading={evidencesLoading}
                pagination={false}
                size="small"
              />
            </Card>
          </TabPane>

          <TabPane tab="检查清单" key="checklists">
            <Card
              size="small"
              title={
                <Space>
                  <OrderedListOutlined />
                  <span>检查清单执行记录</span>
                </Space>
              }
              extra={
                <PermissionGuard permission={Permission.CHECKLIST_EXECUTE}>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setChecklistExecModalOpen(true)}>
                    执行清单
                  </Button>
                </PermissionGuard>
              }
            >
              <Table
                columns={checklistColumns}
                dataSource={checklistExecs}
                rowKey="id"
                loading={checklistExecsLoading}
                pagination={false}
                size="small"
              />
            </Card>
          </TabPane>

          <TabPane tab="抽样记录" key="samplings">
            <Card
              size="small"
              title={
                <Space>
                  <AuditOutlined />
                  <span>抽样方案记录</span>
                </Space>
              }
              extra={
                <PermissionGuard permission={Permission.SAMPLING_CREATE}>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setSamplingModalOpen(true)}>
                    新建抽样
                  </Button>
                </PermissionGuard>
              }
            >
              <Table
                columns={samplingColumns}
                dataSource={samplings}
                rowKey="id"
                loading={samplingsLoading}
                pagination={false}
                size="small"
              />
            </Card>
          </TabPane>

          <TabPane tab="复核记录" key="reviews">
            <Card
              size="small"
              title={
                <Space>
                  <SafetyCertificateOutlined />
                  <span>复核历史</span>
                </Space>
              }
              extra={
                <PermissionGuard permission={Permission.REVIEW_CONDUCT}>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setReviewModalOpen(true)}>
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
                        review.result === ReviewResult.APPROVED
                          ? 'green'
                          : review.result === ReviewResult.REJECTED
                          ? 'red'
                          : 'gold',
                      dot: <AuditOutlined />,
                      children: (
                        <Card size="small" className="mb-4">
                          <Space className="w-full" direction="vertical" size="small">
                            <div className="flex justify-between items-start">
                              <Space>
                                <span className="font-bold">第 {review.reviewRound} 轮复核</span>
                                <Tag color={reviewResultColors[review.result]}>
                                  {reviewResultLabels[review.result]}
                                </Tag>
                              </Space>
                              <span className="text-gray-500 text-sm">{formatDateTime(review.reviewedAt)}</span>
                            </div>
                            <div className="text-sm text-gray-600">
                              <span>复核人：</span>
                              <span className="font-medium">{review.reviewer?.fullName || '-'}</span>
                            </div>
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

          <TabPane tab="操作日志" key="auditLog">
            <Card
              size="small"
              title={
                <Space>
                  <HistoryOutlined />
                  <span>操作痕迹时间线</span>
                </Space>
              }
            >
              {auditLogsLoading ? (
                <div className="flex justify-center py-8">
                  <Spin />
                </div>
              ) : auditLogs.length === 0 ? (
                <Empty description="暂无操作日志" />
              ) : (
                <Timeline
                  mode="left"
                  items={auditLogs.map((log) => ({
                    dot: operationActionIcons[log.action],
                    children: (
                      <Collapse ghost size="small">
                        <Collapse.Panel
                          header={
                            <Space className="w-full" size="small">
                              <Tag color="blue">{operationActionLabels[log.action]}</Tag>
                              <span className="font-medium">{log.description || log.action}</span>
                              <span className="text-gray-500 text-sm">
                                - {log.operator?.fullName || log.operatorName}
                              </span>
                              {log.ipAddress && (
                                <span className="text-gray-400 text-xs">IP: {log.ipAddress}</span>
                              )}
                              <span className="ml-auto text-gray-400 text-sm">
                                {formatDateTime(log.createdAt)}
                              </span>
                            </Space>
                          }
                          key={log.id}
                        >
                          <div className="pl-4 space-y-2 text-sm">
                            {log.beforeData && Object.keys(log.beforeData).length > 0 && (
                              <div>
                                <div className="text-gray-500 mb-1">变更前：</div>
                                <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                                  {JSON.stringify(log.beforeData, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.afterData && Object.keys(log.afterData).length > 0 && (
                              <div>
                                <div className="text-gray-500 mb-1">变更后：</div>
                                <pre className="bg-green-50 p-3 rounded text-xs overflow-x-auto">
                                  {JSON.stringify(log.afterData, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </Collapse.Panel>
                      </Collapse>
                    ),
                  }))}
                />
              )}
            </Card>
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title="分派任务"
        open={assignModalOpen}
        onCancel={() => setAssignModalOpen(false)}
        footer={null}
      >
        <Form form={assignForm} layout="vertical" onFinish={handleAssignSubmit}>
          <Form.Item
            name="assignedToId"
            label="指派审计员"
            rules={[{ required: true, message: '请选择审计员' }]}
          >
            <Select placeholder="请选择审计员" showSearch optionFilterProp="children">
              {users
                .filter((u) => u.role === UserRole.AUDITOR)
                .map((u) => (
                  <Option key={u.id} value={u.id}>
                    {u.fullName} - {u.department}
                  </Option>
                ))}
            </Select>
          </Form.Item>
          <Form.Item name="businessOwnerId" label="业务负责人">
            <Select placeholder="请选择业务负责人" showSearch optionFilterProp="children" allowClear>
              {users
                .filter((u) => u.role === UserRole.BUSINESS_OWNER)
                .map((u) => (
                  <Option key={u.id} value={u.id}>
                    {u.fullName} - {u.department}
                  </Option>
                ))}
            </Select>
          </Form.Item>
          <Form.Item name="dueDate" label="截止日期">
            <DatePicker className="w-full" format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item>
            <Space className="w-full" style={{ justifyContent: 'flex-end' }}>
              <Button onClick={() => setAssignModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={assignMutation.isPending}>
                确认分派
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="修改任务状态"
        open={statusModalOpen}
        onCancel={() => setStatusModalOpen(false)}
        footer={null}
      >
        <Form form={statusForm} layout="vertical" onFinish={handleStatusSubmit}>
          <Form.Item
            name="status"
            label="目标状态"
            rules={[{ required: true, message: '请选择状态' }]}
            initialValue={task.status}
          >
            <Select placeholder="请选择状态">
              {getNextTaskStatuses(task.status).map((s) => (
                <Option key={s} value={s}>
                  {taskStatusLabels[s]}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space className="w-full" style={{ justifyContent: 'flex-end' }}>
              <Button onClick={() => setStatusModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={statusMutation.isPending}>
                确认修改
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="新建证据"
        open={evidenceModalOpen}
        onCancel={() => setEvidenceModalOpen(false)}
        footer={null}
        width={600}
      >
        <Form form={evidenceForm} layout="vertical" onFinish={handleEvidenceSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="title"
                label="证据标题"
                rules={[{ required: true, message: '请输入标题' }]}
              >
                <Input placeholder="请输入标题" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="证据分类"
                rules={[{ required: true, message: '请选择分类' }]}
              >
                <Select placeholder="请选择分类">
                  {Object.entries(evidenceCategoryLabels).map(([key, label]) => (
                    <Option key={key} value={key}>
                      {label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="relatedDocumentNo" label="关联单据号">
                <Input placeholder="请输入单据号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="relatedDocumentType" label="单据类型">
                <Input placeholder="请输入单据类型" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="relatedDocumentDate" label="单据日期">
                <DatePicker className="w-full" format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="relatedDocumentAmount" label="单据金额">
                <Input type="number" placeholder="请输入金额" prefix="¥" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>
          <Form.Item>
            <Space className="w-full" style={{ justifyContent: 'flex-end' }}>
              <Button onClick={() => setEvidenceModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={createEvidenceMutation.isPending}>
                创建
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="执行检查清单"
        open={checklistExecModalOpen}
        onCancel={() => setChecklistExecModalOpen(false)}
        footer={null}
      >
        <Form form={checklistForm} layout="vertical" onFinish={handleChecklistExecSubmit}>
          <Form.Item
            name="checklistId"
            label="选择检查清单"
            rules={[{ required: true, message: '请选择清单' }]}
          >
            <Select placeholder="请选择清单" showSearch optionFilterProp="children">
              {checklists.map((c) => (
                <Option key={c.id} value={c.id}>
                  {c.title} {c.version ? `(${c.version})` : ''}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space className="w-full" style={{ justifyContent: 'flex-end' }}>
              <Button onClick={() => setChecklistExecModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={executeChecklistMutation.isPending}>
                创建执行
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={selectedExecution ? '执行检查项' : '新建抽样方案'}
        open={selectedExecution ? true : samplingModalOpen}
        onCancel={() => {
          if (selectedExecution) {
            setSelectedExecution(null);
            setChecklistResults({});
          } else {
            setSamplingModalOpen(false);
          }
        }}
        footer={selectedExecution ? null : null}
        width={selectedExecution ? 700 : 600}
      >
        {selectedExecution ? (
          <Space direction="vertical" size="large" className="w-full">
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="清单名称">
                {selectedExecution.checklist?.title}
              </Descriptions.Item>
              <Descriptions.Item label="版本">{selectedExecution.checklist?.version || '-'}</Descriptions.Item>
            </Descriptions>
            <Divider orientation="left">检查项</Divider>
            <Space direction="vertical" size="middle" className="w-full">
              {selectedExecution.checklist?.items
                ?.sort((a, b) => a.order - b.order)
                .map((item) => (
                  <Card key={item.id} size="small">
                    <Space direction="vertical" size="small" className="w-full">
                      <div className="flex items-start gap-3">
                        <span className="font-bold text-lg">{item.order}.</span>
                        <div className="flex-1">
                          <div className="font-medium">{item.content}</div>
                          {item.requirement && (
                            <div className="text-sm text-gray-500 mt-1">要求：{item.requirement}</div>
                          )}
                          {item.evidenceNeeded && (
                            <Tag color="orange" className="mt-1">
                              需证据
                            </Tag>
                          )}
                        </div>
                      </div>
                      <div className="pl-8">
                        <Space direction="vertical" size="small" className="w-full">
                          <Radio.Group
                            value={checklistResults[item.id]?.isPass}
                            onChange={(e) =>
                              setChecklistResults((prev) => ({
                                ...prev,
                                [item.id]: { ...prev[item.id], isPass: e.target.value },
                              }))
                            }
                          >
                            <Radio value={true}>
                              <span className="text-green-600">通过</span>
                            </Radio>
                            <Radio value={false}>
                              <span className="text-red-500">不通过</span>
                            </Radio>
                          </Radio.Group>
                          <Input.TextArea
                            rows={2}
                            placeholder="填写备注（可选）"
                            value={checklistResults[item.id]?.remark || ''}
                            onChange={(e) =>
                              setChecklistResults((prev) => ({
                                ...prev,
                                [item.id]: { ...prev[item.id], remark: e.target.value },
                              }))
                            }
                          />
                        </Space>
                      </div>
                    </Space>
                  </Card>
                ))}
            </Space>
            <Divider />
            <Space className="w-full" style={{ justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setSelectedExecution(null);
                  setChecklistResults({});
                }}
              >
                取消
              </Button>
              <Button type="primary" onClick={handleSaveChecklistResults}>
                保存结果
              </Button>
            </Space>
          </Space>
        ) : (
          <Form form={samplingForm} layout="vertical" onFinish={handleSamplingSubmit}>
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name="title"
                  label="抽样标题"
                  rules={[{ required: true, message: '请输入标题' }]}
                >
                  <Input placeholder="请输入标题" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="method"
                  label="抽样方法"
                  rules={[{ required: true, message: '请选择方法' }]}
                >
                  <Select placeholder="请选择抽样方法">
                    {Object.entries(samplingMethodLabels).map(([key, label]) => (
                      <Option key={key} value={key}>
                        {label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="confidenceLevel"
                  label="置信水平(%)"
                >
                  <Input type="number" placeholder="如 95" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="population"
                  label="总体量"
                  rules={[{ required: true, message: '请输入总体量' }]}
                >
                  <Input type="number" placeholder="请输入总体量" min={1} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="sampleSize"
                  label="样本量"
                  rules={[{ required: true, message: '请输入样本量' }]}
                >
                  <Input type="number" placeholder="请输入样本量" min={1} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="remark" label="备注">
              <TextArea rows={3} placeholder="请输入备注" />
            </Form.Item>
            <Form.Item>
              <Space className="w-full" style={{ justifyContent: 'flex-end' }}>
                <Button onClick={() => setSamplingModalOpen(false)}>取消</Button>
                <Button type="primary" htmlType="submit" loading={createSamplingMutation.isPending}>
                  创建
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>

      <Modal
        title="发起复核"
        open={reviewModalOpen}
        onCancel={() => setReviewModalOpen(false)}
        footer={null}
      >
        <Form form={reviewForm} layout="vertical" onFinish={handleReviewSubmit}>
          <Form.Item
            name="result"
            label="复核结果"
            rules={[{ required: true, message: '请选择结果' }]}
          >
            <Select placeholder="请选择复核结果">
              {Object.entries(reviewResultLabels).map(([key, label]) => (
                <Option key={key} value={key}>
                  {label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="comment" label="复核意见">
            <TextArea rows={4} placeholder="请输入复核意见" />
          </Form.Item>
          <Form.Item>
            <Space className="w-full" style={{ justifyContent: 'flex-end' }}>
              <Button onClick={() => setReviewModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={createReviewMutation.isPending}>
                提交
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
