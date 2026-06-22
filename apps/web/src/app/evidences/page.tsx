'use client';

import React, { useState, useMemo } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Input,
  Select,
  Modal,
  Form,
  DatePicker,
  InputNumber,
  App as AntdApp,
  Popconfirm,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  FileTextOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import AppLayout from '@/components/layout/AppLayout';
import {
  evidencesApi,
  CreateEvidenceRequest,
  EvidenceFilters,
} from '@/lib/api/evidences';
import { tasksApi } from '@/lib/api/tasks';
import {
  Evidence,
  EvidenceStatus,
  EvidenceCategory,
  PaginationParams,
  PaginatedResult,
} from '@/lib/api/types';
import { usePermission } from '@/lib/hooks/usePermission';
import { formatDate, formatDateTime, formatMoney } from '@/lib/utils/format';

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const evidenceStatusConfig: Record<EvidenceStatus, { label: string; color: string }> = {
  [EvidenceStatus.DRAFT]: { label: '草稿', color: 'default' },
  [EvidenceStatus.SUBMITTED]: { label: '已提交', color: 'blue' },
  [EvidenceStatus.REVIEWING]: { label: '复核中', color: 'purple' },
  [EvidenceStatus.APPROVED]: { label: '已通过', color: 'green' },
  [EvidenceStatus.REJECTED]: { label: '已驳回', color: 'red' },
  [EvidenceStatus.NEED_SUPPLEMENT]: { label: '需补充', color: 'orange' },
  [EvidenceStatus.ARCHIVED]: { label: '已归档', color: 'gray' },
};

const evidenceCategoryLabels: Record<EvidenceCategory, string> = {
  [EvidenceCategory.DOCUMENT]: '文档',
  [EvidenceCategory.FINANCIAL]: '财务凭证',
  [EvidenceCategory.CONTRACT]: '合同',
  [EvidenceCategory.REPORT]: '报告',
  [EvidenceCategory.RECORD]: '记录',
  [EvidenceCategory.MEETING_MINUTE]: '会议纪要',
  [EvidenceCategory.OTHER]: '其他',
};

interface QueryParams extends PaginationParams, EvidenceFilters {}

const EvidencesPage: React.FC = () => {
  const router = useRouter();
  const { message } = AntdApp.useApp();
  const queryClient = useQueryClient();
  const permission = usePermission();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<EvidenceFilters>({});
  const [keyword, setKeyword] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm<CreateEvidenceRequest>();

  const queryParams: QueryParams = useMemo(
    () => ({
      page,
      pageSize,
      keyword: searchKeyword || undefined,
      ...filters,
    }),
    [page, pageSize, searchKeyword, filters]
  );

  const { data, isLoading, refetch } = useQuery<PaginatedResult<Evidence>>({
    queryKey: ['evidences', queryParams],
    queryFn: () => evidencesApi.getEvidences(queryParams),
  });

  const { data: tasksData } = useQuery({
    queryKey: ['tasks', 'all'],
    queryFn: () => tasksApi.getTasks({ page: 1, pageSize: 500 }),
  });

  const tasks = useMemo(() => tasksData?.items || [], [tasksData]);

  const createMutation = useMutation({
    mutationFn: (data: CreateEvidenceRequest) => evidencesApi.createEvidence(data),
    onSuccess: () => {
      message.success('证据创建成功');
      setCreateModalOpen(false);
      createForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['evidences'] });
    },
    onError: () => {
      message.error('证据创建失败');
    },
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => evidencesApi.submitEvidence(id),
    onSuccess: () => {
      message.success('证据提交成功');
      queryClient.invalidateQueries({ queryKey: ['evidences'] });
    },
    onError: () => {
      message.error('证据提交失败');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => evidencesApi.deleteEvidence(id),
    onSuccess: (res) => {
      message.success(res.message || '删除成功');
      queryClient.invalidateQueries({ queryKey: ['evidences'] });
    },
    onError: () => {
      message.error('删除失败');
    },
  });

  const handleSearch = () => {
    setSearchKeyword(keyword.trim());
    setPage(1);
  };

  const handleReset = () => {
    setKeyword('');
    setSearchKeyword('');
    setFilters({});
    setPage(1);
  };

  const handleCreateSubmit = (values: CreateEvidenceRequest) => {
    const submitData: CreateEvidenceRequest = {
      ...values,
      relatedDocumentDate: values.relatedDocumentDate
        ? dayjs(values.relatedDocumentDate).toISOString()
        : undefined,
    };
    createMutation.mutate(submitData);
  };

  const columns = [
    {
      title: '证据编号',
      dataIndex: 'evidenceNo',
      key: 'evidenceNo',
      width: 140,
      render: (text: string, record: Evidence) => (
        <a
          className="text-blue-600 hover:text-blue-800 cursor-pointer"
          onClick={() => router.push(`/evidences/${record.id}`)}
        >
          {text}
        </a>
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string, record: Evidence) => (
        <a
          className="hover:text-blue-600 cursor-pointer"
          onClick={() => router.push(`/evidences/${record.id}`)}
        >
          {text}
        </a>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: EvidenceCategory) => (
        <Tag>{evidenceCategoryLabels[category] || category}</Tag>
      ),
    },
    {
      title: '关联任务',
      dataIndex: ['task', 'taskNo'],
      key: 'taskNo',
      width: 130,
      render: (taskNo: string, record: Evidence) => (
        <a
          className="text-blue-600 hover:text-blue-800 cursor-pointer"
          onClick={() => router.push(`/tasks/${record.taskId}`)}
        >
          {taskNo || '-'}
        </a>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: EvidenceStatus) => {
        const config = evidenceStatusConfig[status];
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: '关联凭证',
      key: 'document',
      width: 180,
      render: (_: unknown, record: Evidence) => (
        <div className="text-xs text-gray-600">
          {record.relatedDocumentNo ? (
            <div>
              <span className="text-gray-500">单号：</span>
              {record.relatedDocumentNo}
            </div>
          ) : null}
          {record.relatedDocumentAmount ? (
            <div>
              <span className="text-gray-500">金额：</span>
              {formatMoney(record.relatedDocumentAmount)}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      title: '附件数',
      dataIndex: ['_count', 'attachments'],
      key: 'attachments',
      width: 80,
      align: 'center' as const,
      render: (count: number) => (
        <span className="flex items-center justify-center gap-1 text-gray-600">
          <FileTextOutlined />
          {count || 0}
        </span>
      ),
    },
    {
      title: '提交人',
      dataIndex: ['submittedBy', 'fullName'],
      key: 'submittedBy',
      width: 100,
      render: (name: string) => name || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: unknown, record: Evidence) => {
        const isDraft = record.status === EvidenceStatus.DRAFT;
        const canSubmit = isDraft && permission.canSubmitEvidence;
        const canDelete = isDraft && permission.canDeleteEvidence;
        return (
          <Space size="small">
            <Tooltip title="查看详情">
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => router.push(`/evidences/${record.id}`)}
              >
                查看
              </Button>
            </Tooltip>
            {canSubmit && (
              <Popconfirm
                title="确认提交该证据?"
                onConfirm={() => submitMutation.mutate(record.id)}
                okText="确认"
                cancelText="取消"
              >
                <Button
                  type="link"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  loading={submitMutation.isPending}
                >
                  提交
                </Button>
              </Popconfirm>
            )}
            {canDelete && (
              <Popconfirm
                title="确认删除该草稿?"
                onConfirm={() => deleteMutation.mutate(record.id)}
                okText="确认"
                cancelText="取消"
                okButtonProps={{ danger: true }}
              >
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  loading={deleteMutation.isPending}
                >
                  删除
                </Button>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">证据归档列表</h1>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
              刷新
            </Button>
            {(permission.canCreateEvidence || permission.canUploadEvidence) && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateModalOpen(true)}
              >
                新建证据
              </Button>
            )}
          </Space>
        </div>

        <Card>
          <div className="flex flex-wrap gap-4 items-end mb-4">
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">关键词搜索</label>
              <Input
                placeholder="搜索编号/标题/描述"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onPressEnter={handleSearch}
                style={{ width: 240 }}
                prefix={<SearchOutlined className="text-gray-400" />}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">状态</label>
              <Select
                placeholder="全部状态"
                allowClear
                style={{ width: 140 }}
                value={filters.status}
                onChange={(value) => {
                  setFilters((prev) => ({ ...prev, status: value }));
                  setPage(1);
                }}
              >
                {Object.entries(evidenceStatusConfig).map(([value, config]) => (
                  <Option key={value} value={value}>
                    {config.label}
                  </Option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">分类</label>
              <Select
                placeholder="全部分类"
                allowClear
                style={{ width: 140 }}
                value={filters.category}
                onChange={(value) => {
                  setFilters((prev) => ({ ...prev, category: value }));
                  setPage(1);
                }}
              >
                {Object.entries(evidenceCategoryLabels).map(([value, label]) => (
                  <Option key={value} value={value}>
                    {label}
                  </Option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">关联任务</label>
              <Select
                placeholder="全部任务"
                allowClear
                showSearch
                optionFilterProp="label"
                style={{ width: 200 }}
                value={filters.taskId}
                onChange={(value) => {
                  setFilters((prev) => ({ ...prev, taskId: value }));
                  setPage(1);
                }}
              >
                {tasks.map((task) => (
                  <Option key={task.id} value={task.id} label={`${task.taskNo} ${task.title}`}>
                    {task.taskNo} - {task.title}
                  </Option>
                ))}
              </Select>
            </div>
            <Space>
              <Button type="primary" onClick={handleSearch} icon={<SearchOutlined />}>
                搜索
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </div>
        </Card>

        <Card>
          <Table
            rowKey="id"
            loading={isLoading}
            columns={columns}
            dataSource={data?.items || []}
            pagination={{
              current: page,
              pageSize,
              total: data?.total || 0,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
              onChange: (p, ps) => {
                setPage(p);
                setPageSize(ps);
              },
            }}
            scroll={{ x: 1400 }}
          />
        </Card>
      </div>

      <Modal
        title="新建证据"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateSubmit}
          initialValues={{ category: EvidenceCategory.DOCUMENT }}
        >
          <Form.Item
            label="证据标题"
            name="title"
            rules={[{ required: true, message: '请输入证据标题' }]}
          >
            <Input placeholder="请输入证据标题" />
          </Form.Item>

          <Form.Item label="描述说明" name="description">
            <TextArea rows={3} placeholder="请输入描述说明" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="证据分类"
              name="category"
              rules={[{ required: true, message: '请选择证据分类' }]}
            >
              <Select placeholder="请选择">
                {Object.entries(evidenceCategoryLabels).map(([value, label]) => (
                  <Option key={value} value={value}>
                    {label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="关联任务"
              name="taskId"
              rules={[{ required: true, message: '请选择关联任务' }]}
            >
              <Select
                placeholder="请选择关联任务"
                showSearch
                optionFilterProp="label"
              >
                {tasks.map((task) => (
                  <Option key={task.id} value={task.id} label={`${task.taskNo} ${task.title}`}>
                    {task.taskNo} - {task.title}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <div className="border-t pt-4 mt-2">
            <h4 className="text-sm font-medium text-gray-700 mb-3">关联凭证信息（可选）</h4>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item label="凭证单号" name="relatedDocumentNo">
                <Input placeholder="请输入凭证单号" />
              </Form.Item>

              <Form.Item label="凭证类型" name="relatedDocumentType">
                <Input placeholder="如：发票、收据等" />
              </Form.Item>

              <Form.Item label="凭证日期" name="relatedDocumentDate">
                <DatePicker className="w-full" />
              </Form.Item>

              <Form.Item label="凭证金额" name="relatedDocumentAmount">
                <InputNumber
                  className="w-full"
                  placeholder="请输入金额"
                  min={0}
                  precision={2}
                  prefix="¥"
                />
              </Form.Item>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button onClick={() => setCreateModalOpen(false)}>取消</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={createMutation.isPending}
            >
              创建
            </Button>
          </div>
        </Form>
      </Modal>
    </AppLayout>
  );
};

export default EvidencesPage;
