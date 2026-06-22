'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Tag,
  Avatar,
  Button,
  Drawer,
  Form,
  Input,
  Select,
  DatePicker,
  Checkbox,
  Space,
  Dropdown,
  Modal,
  Spin,
  Empty,
  App as AntdApp,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  UserOutlined,
  CheckSquareOutlined,
  TeamOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { tasksApi, CreateTaskRequest, UpdateTaskRequest, BatchUpdateRequest } from '@/lib/api/tasks';
import { usersApi } from '@/lib/api/users';
import {
  AuditTask,
  TaskStatus,
  TaskPriority,
  AuditType,
  User,
  KanbanData,
} from '@/lib/api/types';
import { usePermission } from '@/lib/hooks/usePermission';
import { formatDate } from '@/lib/utils/format';

const { Option } = Select;
const { TextArea } = Input;

const taskStatusConfig: Record<TaskStatus, { label: string; color: string }> = {
  [TaskStatus.DRAFT]: { label: '草稿', color: 'default' },
  [TaskStatus.PENDING]: { label: '待分派', color: 'orange' },
  [TaskStatus.ASSIGNED]: { label: '已分派', color: 'cyan' },
  [TaskStatus.IN_PROGRESS]: { label: '进行中', color: 'blue' },
  [TaskStatus.SUBMITTED]: { label: '已提交', color: 'purple' },
  [TaskStatus.REVIEWING]: { label: '复核中', color: 'geekblue' },
  [TaskStatus.APPROVED]: { label: '已通过', color: 'green' },
  [TaskStatus.REJECTED]: { label: '已驳回', color: 'red' },
  [TaskStatus.ARCHIVED]: { label: '已归档', color: 'gray' },
};

const taskPriorityConfig: Record<TaskPriority, { label: string; color: string }> = {
  [TaskPriority.LOW]: { label: '低', color: 'green' },
  [TaskPriority.MEDIUM]: { label: '中', color: 'blue' },
  [TaskPriority.HIGH]: { label: '高', color: 'orange' },
  [TaskPriority.URGENT]: { label: '紧急', color: 'red' },
};

const auditTypeLabels: Record<AuditType, string> = {
  [AuditType.ROUTINE]: '常规审计',
  [AuditType.SPECIAL]: '专项审计',
  [AuditType.COMPLIANCE]: '合规审计',
  [AuditType.INVESTIGATION]: '调查审计',
};

const kanbanStatusOrder: TaskStatus[] = [
  TaskStatus.PENDING,
  TaskStatus.ASSIGNED,
  TaskStatus.IN_PROGRESS,
  TaskStatus.SUBMITTED,
  TaskStatus.REVIEWING,
  TaskStatus.APPROVED,
];

interface DragState {
  taskId: string | null;
  fromStatus: TaskStatus | null;
}

const DashboardPage: React.FC = () => {
  const router = useRouter();
  const { message } = AntdApp.useApp();
  const queryClient = useQueryClient();
  const permission = usePermission();

  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchActionType, setBatchActionType] = useState<'status' | 'assign'>('status');
  const [dragState, setDragState] = useState<DragState>({ taskId: null, fromStatus: null });
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assigningTask, setAssigningTask] = useState<AuditTask | null>(null);

  const { data: kanbanData, isLoading: kanbanLoading } = useQuery<KanbanData>({
    queryKey: ['tasks', 'kanban'],
    queryFn: tasksApi.getKanban,
  });

  const { data: usersData } = useQuery({
    queryKey: ['users', 'list'],
    queryFn: () => usersApi.getUsers({ page: 1, pageSize: 100 }),
  });

  const users = useMemo(() => usersData?.items || [], [usersData]);

  const createForm = Form.useForm<CreateTaskRequest>();

  const stats = useMemo(() => {
    if (!kanbanData) {
      return {
        total: 0,
        pending: 0,
        inProgress: 0,
        overdue: 0,
        archived: 0,
      };
    }
    const kanban = kanbanData.kanban;
    let total = 0;
    Object.values(kanban).forEach((tasks) => {
      total += tasks.length;
    });
    const pending = kanban[TaskStatus.PENDING]?.length || 0;
    const assigned = kanban[TaskStatus.ASSIGNED]?.length || 0;
    const inProgress = (kanban[TaskStatus.IN_PROGRESS]?.length || 0) + assigned;
    const archived = kanban[TaskStatus.ARCHIVED]?.length || 0;
    const overdue = kanbanData.stats?.overdue || 0;
    return { total, pending, inProgress, overdue, archived };
  }, [kanbanData]);

  const allTasks = useMemo(() => {
    if (!kanbanData) return [];
    return Object.values(kanbanData.kanban).flat();
  }, [kanbanData]);

  const createMutation = useMutation({
    mutationFn: (data: CreateTaskRequest) => tasksApi.createTask(data),
    onSuccess: () => {
      message.success('任务创建成功');
      setCreateDrawerOpen(false);
      createForm[0].resetFields();
      queryClient.invalidateQueries({ queryKey: ['tasks', 'kanban'] });
    },
    onError: () => {
      message.error('任务创建失败');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskRequest }) =>
      tasksApi.updateTask(id, data),
    onSuccess: () => {
      message.success('任务更新成功');
      queryClient.invalidateQueries({ queryKey: ['tasks', 'kanban'] });
    },
    onError: () => {
      message.error('任务更新失败');
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { assignedToId: string; dueDate?: string } }) =>
      tasksApi.assignTask(id, data),
    onSuccess: () => {
      message.success('任务分派成功');
      setAssignModalOpen(false);
      setAssigningTask(null);
      queryClient.invalidateQueries({ queryKey: ['tasks', 'kanban'] });
    },
    onError: () => {
      message.error('任务分派失败');
    },
  });

  const batchUpdateMutation = useMutation({
    mutationFn: (data: BatchUpdateRequest) => tasksApi.batchUpdateTasks(data),
    onSuccess: (res) => {
      message.success(`批量更新成功，共更新 ${res.updatedCount} 条记录`);
      setBatchModalOpen(false);
      setSelectedTaskIds([]);
      queryClient.invalidateQueries({ queryKey: ['tasks', 'kanban'] });
    },
    onError: () => {
      message.error('批量更新失败');
    },
  });

  const handleCreateSubmit = (values: CreateTaskRequest) => {
    const submitData: CreateTaskRequest = {
      ...values,
      dueDate: values.dueDate ? dayjs(values.dueDate).toISOString() : undefined,
    };
    createMutation.mutate(submitData);
  };

  const handleTaskSelect = (taskId: string, checked: boolean) => {
    setSelectedTaskIds((prev) =>
      checked ? [...prev, taskId] : prev.filter((id) => id !== taskId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTaskIds(allTasks.map((t) => t.id));
    } else {
      setSelectedTaskIds([]);
    }
  };

  const handleBatchSubmit = (values: any) => {
    const data: BatchUpdateRequest = {
      taskIds: selectedTaskIds,
    };
    if (batchActionType === 'status') {
      data.status = values.status;
    } else {
      data.assignedToId = values.assignedToId;
    }
    batchUpdateMutation.mutate(data);
  };

  const handleDragStart = (taskId: string, fromStatus: TaskStatus) => {
    setDragState({ taskId, fromStatus });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (toStatus: TaskStatus) => {
    if (dragState.taskId && dragState.fromStatus && dragState.fromStatus !== toStatus) {
      updateMutation.mutate({
        id: dragState.taskId,
        data: { status: toStatus },
      });
    }
    setDragState({ taskId: null, fromStatus: null });
  };

  const handleAssignSubmit = (values: { assignedToId: string; dueDate?: any }) => {
    if (!assigningTask) return;
    assignMutation.mutate({
      id: assigningTask.id,
      data: {
        assignedToId: values.assignedToId,
        dueDate: values.dueDate ? dayjs(values.dueDate).toISOString() : undefined,
      },
    });
  };

  const isOverdue = (task: AuditTask): boolean => {
    if (!task.dueDate) return false;
    return dayjs(task.dueDate).isBefore(dayjs()) && task.status !== TaskStatus.ARCHIVED && task.status !== TaskStatus.APPROVED;
  };

  const getUserById = (id?: string): User | undefined => {
    return users.find((u) => u.id === id);
  };

  const renderTaskCard = (task: AuditTask) => {
    const isSelected = selectedTaskIds.includes(task.id);
    const overdue = isOverdue(task);
    const assignedUser = getUserById(task.assignedToId);
    const priorityConfig = taskPriorityConfig[task.priority];
    const evidenceCount = task._count?.evidences || 0;

    return (
      <div
        key={task.id}
        draggable
        onDragStart={() => handleDragStart(task.id, task.status)}
        className={`bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-all cursor-move mb-3 ${
          isSelected ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200'
        } ${overdue ? 'border-red-300 bg-red-50' : ''}`}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={isSelected}
              onChange={(e) => handleTaskSelect(task.id, e.target.checked)}
              onClick={(e) => e.stopPropagation()}
            />
            <Tag color={priorityConfig.color} className="!m-0">
              {priorityConfig.label}
            </Tag>
          </div>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'assign',
                  label: '分派任务',
                  icon: <TeamOutlined />,
                  disabled: !permission.canAssignTask,
                  onClick: () => {
                    setAssigningTask(task);
                    setAssignModalOpen(true);
                  },
                },
                {
                  key: 'view',
                  label: '查看详情',
                  icon: <FileTextOutlined />,
                  onClick: () => router.push(`/tasks/${task.id}`),
                },
              ],
            }}
            trigger={['click']}
          >
            <Button type="text" size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </div>

        <div
          className="text-sm font-medium text-gray-800 mb-1 truncate cursor-pointer hover:text-blue-600"
          onClick={() => router.push(`/tasks/${task.id}`)}
        >
          {task.title}
        </div>

        <div className="text-xs text-gray-500 mb-3">
          {task.taskNo} · {auditTypeLabels[task.auditType]}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tooltip title={assignedUser?.fullName || '未分派'}>
              <Avatar size="small" icon={<UserOutlined />} src={assignedUser?.avatarUrl} />
            </Tooltip>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <FileTextOutlined />
              <span>{evidenceCount}</span>
            </div>
          </div>
          <div
            className={`text-xs flex items-center gap-1 ${
              overdue ? 'text-red-600 font-medium' : 'text-gray-500'
            }`}
          >
            <ClockCircleOutlined />
            <span>{task.dueDate ? formatDate(task.dueDate) : '-'}</span>
          </div>
        </div>

        {overdue && (
          <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
            <WarningOutlined />
            <span>已超期</span>
          </div>
        )}
      </div>
    );
  };

  const renderKanbanColumn = (status: TaskStatus) => {
    const statusConfig = taskStatusConfig[status];
    const tasks = kanbanData?.kanban[status] || [];
    const isDropTarget = dragState.fromStatus !== null && dragState.fromStatus !== status;

    return (
      <div
        key={status}
        className={`flex-shrink-0 w-80 bg-gray-50 rounded-lg p-3 transition-colors ${
          isDropTarget ? 'bg-blue-50 ring-2 ring-blue-300 ring-dashed' : ''
        }`}
        onDragOver={handleDragOver}
        onDrop={() => handleDrop(status)}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Tag color={statusConfig.color} className="!m-0">
              {statusConfig.label}
            </Tag>
            <span className="text-sm text-gray-500">{tasks.length}</span>
          </div>
        </div>

        <div className="space-y-1 max-h-[calc(100vh-400px)] overflow-y-auto pr-1">
          {tasks.length === 0 ? (
            <div className="py-8">
              <Empty description="暂无任务" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>
          ) : (
            tasks.map(renderTaskCard)
          )}
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">任务分派台</h1>
          <Space>
            {permission.canCreateTask && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateDrawerOpen(true)}
              >
                创建任务
              </Button>
            )}
          </Space>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6} lg={6}>
            <Card className="hover:shadow-md transition-shadow">
              <Statistic
                title={<span className="text-gray-600">总任务</span>}
                value={stats.total}
                prefix={<FileTextOutlined className="text-blue-500" />}
                valueStyle={{ color: '#3b82f6' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6} lg={6}>
            <Card className="hover:shadow-md transition-shadow">
              <Statistic
                title={<span className="text-gray-600">待分派</span>}
                value={stats.pending}
                prefix={<ClockCircleOutlined className="text-orange-500" />}
                valueStyle={{ color: '#f97316' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6} lg={6}>
            <Card className="hover:shadow-md transition-shadow">
              <Statistic
                title={<span className="text-gray-600">进行中</span>}
                value={stats.inProgress}
                prefix={<SyncOutlined className="text-blue-500" />}
                valueStyle={{ color: '#3b82f6' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6} lg={6}>
            <Card className="hover:shadow-md transition-shadow">
              <Statistic
                title={<span className="text-gray-600">超期任务</span>}
                value={stats.overdue}
                prefix={<WarningOutlined className="text-red-500" />}
                valueStyle={{ color: '#ef4444' }}
              />
            </Card>
          </Col>
        </Row>

        {selectedTaskIds.length > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedTaskIds.length === allTasks.length && allTasks.length > 0}
                  indeterminate={
                    selectedTaskIds.length > 0 && selectedTaskIds.length < allTasks.length
                  }
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
                <span className="text-gray-700">
                  已选择 <strong>{selectedTaskIds.length}</strong> 个任务
                </span>
              </div>
              <Space>
                <Button
                  icon={<CheckSquareOutlined />}
                  onClick={() => {
                    setBatchActionType('status');
                    setBatchModalOpen(true);
                  }}
                  disabled={!permission.canEditTask}
                >
                  批量改状态
                </Button>
                <Button
                  icon={<TeamOutlined />}
                  onClick={() => {
                    setBatchActionType('assign');
                    setBatchModalOpen(true);
                  }}
                  disabled={!permission.canAssignTask}
                >
                  批量分派
                </Button>
                <Button onClick={() => setSelectedTaskIds([])}>取消选择</Button>
              </Space>
            </div>
          </Card>
        )}

        <Card className="bg-gray-100">
          <Spin spinning={kanbanLoading}>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {kanbanStatusOrder.map(renderKanbanColumn)}
            </div>
          </Spin>
        </Card>
      </div>

      <Drawer
        title="创建任务"
        width={500}
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        extra={
          <Space>
            <Button onClick={() => setCreateDrawerOpen(false)}>取消</Button>
            <Button
              type="primary"
              loading={createMutation.isPending}
              onClick={() => createForm[0].submit()}
            >
              创建
            </Button>
          </Space>
        }
      >
        <Form
          form={createForm[0]}
          layout="vertical"
          onFinish={handleCreateSubmit}
          initialValues={{ priority: TaskPriority.MEDIUM, auditType: AuditType.ROUTINE }}
        >
          <Form.Item
            label="任务标题"
            name="title"
            rules={[{ required: true, message: '请输入任务标题' }]}
          >
            <Input placeholder="请输入任务标题" />
          </Form.Item>

          <Form.Item label="任务描述" name="description">
            <TextArea rows={4} placeholder="请输入任务描述" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="审计类型"
                name="auditType"
                rules={[{ required: true, message: '请选择审计类型' }]}
              >
                <Select placeholder="请选择">
                  {Object.entries(auditTypeLabels).map(([value, label]) => (
                    <Option key={value} value={value}>
                      {label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="优先级" name="priority">
                <Select placeholder="请选择">
                  {Object.entries(taskPriorityConfig).map(([value, config]) => (
                    <Option key={value} value={value}>
                      {config.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="分派给" name="assignedToId">
                <Select placeholder="请选择审计人员" showSearch optionFilterProp="label">
                  {users.map((u) => (
                    <Option key={u.id} value={u.id} label={u.fullName}>
                      {u.fullName} - {u.department || '-'}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="截止日期" name="dueDate">
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="业务负责人" name="businessOwnerId">
            <Select placeholder="请选择业务负责人" showSearch optionFilterProp="label" allowClear>
              {users.map((u) => (
                <Option key={u.id} value={u.id} label={u.fullName}>
                  {u.fullName} - {u.department || '-'}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="所属部门" name="department">
            <Input placeholder="请输入所属部门" />
          </Form.Item>
        </Form>
      </Drawer>

      <Modal
        title={batchActionType === 'status' ? '批量修改状态' : '批量分派任务'}
        open={batchModalOpen}
        onCancel={() => setBatchModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          layout="vertical"
          onFinish={handleBatchSubmit}
        >
          {batchActionType === 'status' ? (
            <Form.Item
              label="任务状态"
              name="status"
              rules={[{ required: true, message: '请选择任务状态' }]}
            >
              <Select placeholder="请选择要修改的状态">
                {Object.entries(taskStatusConfig).map(([value, config]) => (
                  <Option key={value} value={value}>
                    {config.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          ) : (
            <>
              <Form.Item
                label="分派给"
                name="assignedToId"
                rules={[{ required: true, message: '请选择审计人员' }]}
              >
                <Select placeholder="请选择审计人员" showSearch optionFilterProp="label">
                  {users.map((u) => (
                    <Option key={u.id} value={u.id} label={u.fullName}>
                      {u.fullName} - {u.department || '-'}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setBatchModalOpen(false)}>取消</Button>
            <Button type="primary" htmlType="submit" loading={batchUpdateMutation.isPending}>
              确认
            </Button>
          </div>
        </Form>
      </Modal>

      <Modal
        title={`分派任务: ${assigningTask?.taskNo || ''}`}
        open={assignModalOpen}
        onCancel={() => {
          setAssignModalOpen(false);
          setAssigningTask(null);
        }}
        footer={null}
        destroyOnClose
      >
        <Form layout="vertical" onFinish={handleAssignSubmit}>
          <Form.Item
            label="分派给"
            name="assignedToId"
            rules={[{ required: true, message: '请选择审计人员' }]}
          >
            <Select placeholder="请选择审计人员" showSearch optionFilterProp="label">
              {users.map((u) => (
                <Option key={u.id} value={u.id} label={u.fullName}>
                  {u.fullName} - {u.department || '-'}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="截止日期" name="dueDate">
            <DatePicker className="w-full" />
          </Form.Item>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              onClick={() => {
                setAssignModalOpen(false);
                setAssigningTask(null);
              }}
            >
              取消
            </Button>
            <Button type="primary" htmlType="submit" loading={assignMutation.isPending}>
              确认分派
            </Button>
          </div>
        </Form>
      </Modal>
    </AppLayout>
  );
};

export default DashboardPage;
