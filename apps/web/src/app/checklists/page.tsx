'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Switch,
  Modal,
  Form,
  Popconfirm,
  message,
  Progress,
  Drawer,
  Row,
  Col,
  Descriptions,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import {
  checklistsApi,
  CreateChecklistRequest,
  UpdateChecklistRequest,
} from '@/lib/api/checklists';
import { usersApi } from '@/lib/api/users';
import { tasksApi } from '@/lib/api/tasks';
import type {
  Checklist,
  ChecklistExecution,
  ChecklistItem,
  User,
  AuditTask,
} from '@/lib/api/types';
import { formatDateTime } from '@/lib/utils/format';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

interface ChecklistItemForm {
  order: number;
  content: string;
  requirement?: string;
  evidenceNeeded: boolean;
}

export default function ChecklistsPage() {
  const [activeTab, setActiveTab] = useState('templates');
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<Checklist[]>([]);
  const [executions, setExecutions] = useState<ChecklistExecution[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<AuditTask[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [execPagination, setExecPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({ category: '', isActive: undefined as boolean | undefined, keyword: '' });
  const [execFilters, setExecFilters] = useState({ checklistId: '', taskId: '', executedById: '' });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Checklist | null>(null);
  const [form] = Form.useForm();
  const [itemsForm, setItemsForm] = useState<ChecklistItemForm[]>([
    { order: 1, content: '', requirement: '', evidenceNeeded: false },
  ]);

  const [executeModalOpen, setExecuteModalOpen] = useState(false);
  const [executeTarget, setExecuteTarget] = useState<Checklist | null>(null);
  const [executeForm] = Form.useForm();

  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState<ChecklistExecution | null>(null);
  const [itemResults, setItemResults] = useState<Record<string, { isPass?: boolean; remark?: string }>>({});

  useEffect(() => {
    fetchTemplates();
    fetchUsers();
    fetchTasks();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'executions') {
      fetchExecutions();
    }
  }, [activeTab, execPagination.current, execPagination.pageSize, execFilters]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await checklistsApi.getChecklists({
        page: pagination.current,
        pageSize: pagination.pageSize,
        keyword: filters.keyword || undefined,
        category: filters.category || undefined,
        isActive: filters.isActive,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      setTemplates(res.items);
      setPagination({ ...pagination, total: res.total });
    } catch (e: any) {
      message.error(e.message || '获取清单模板失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchExecutions = async () => {
    setLoading(true);
    try {
      const res = await checklistsApi.getChecklistExecutions({
        page: execPagination.current,
        pageSize: execPagination.pageSize,
        checklistId: execFilters.checklistId || undefined,
        taskId: execFilters.taskId || undefined,
        executedById: execFilters.executedById || undefined,
        sortBy: 'startedAt',
        sortOrder: 'desc',
      });
      setExecutions(res.items);
      setExecPagination({ ...execPagination, total: res.total });
    } catch (e: any) {
      message.error(e.message || '获取执行记录失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await usersApi.getUsers({ page: 1, pageSize: 100 });
      setUsers(res.items);
    } catch (e) {}
  };

  const fetchTasks = async () => {
    try {
      const res = await tasksApi.getTasks({ page: 1, pageSize: 100 });
      setTasks(res.items);
    } catch (e) {}
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setItemsForm([{ order: 1, content: '', requirement: '', evidenceNeeded: false }]);
    setModalOpen(true);
  };

  const handleEdit = (record: Checklist) => {
    setEditingTemplate(record);
    form.setFieldsValue({
      title: record.title,
      description: record.description,
      category: record.category,
      version: record.version,
      isActive: record.isActive,
    });
    setItemsForm(
      record.items.map((it) => ({
        order: it.order,
        content: it.content,
        requirement: it.requirement,
        evidenceNeeded: it.evidenceNeeded,
      })),
    );
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const validItems = itemsForm.filter((it) => it.content.trim());
      if (validItems.length === 0) {
        message.warning('请至少添加一条检查项');
        return;
      }
      const payload: CreateChecklistRequest | UpdateChecklistRequest = {
        ...values,
        items: validItems.map((it, idx) => ({
          order: idx + 1,
          content: it.content,
          requirement: it.requirement,
          evidenceNeeded: it.evidenceNeeded,
        })),
      };
      if (editingTemplate) {
        await checklistsApi.updateChecklist(editingTemplate.id, payload);
        message.success('模板更新成功');
      } else {
        await checklistsApi.createChecklist(payload as CreateChecklistRequest);
        message.success('模板创建成功');
      }
      setModalOpen(false);
      fetchTemplates();
    } catch (e: any) {
      if (e.errorFields) return;
      message.error(e.message || '保存失败');
    }
  };

  const handleToggleActive = async (record: Checklist, checked: boolean) => {
    try {
      await checklistsApi.updateChecklist(record.id, { isActive: checked });
      message.success(`${checked ? '启用' : '禁用'}成功`);
      fetchTemplates();
    } catch (e: any) {
      message.error(e.message || '操作失败');
    }
  };

  const handleDelete = async (record: Checklist) => {
    try {
      await checklistsApi.deleteChecklist(record.id);
      message.success('删除成功');
      fetchTemplates();
    } catch (e: any) {
      message.error(e.message || '删除失败');
    }
  };

  const handleExecute = (record: Checklist) => {
    setExecuteTarget(record);
    executeForm.resetFields();
    setExecuteModalOpen(true);
  };

  const handleExecuteSubmit = async () => {
    try {
      const values = await executeForm.validateFields();
      if (!executeTarget) return;
      await checklistsApi.executeChecklist(executeTarget.id, values);
      message.success('开始执行清单');
      setExecuteModalOpen(false);
      setActiveTab('executions');
      fetchExecutions();
    } catch (e: any) {
      if (e.errorFields) return;
      message.error(e.message || '执行失败');
    }
  };

  const handleContinueExecute = (execution: ChecklistExecution) => {
    setSelectedExecution(execution);
    const results: Record<string, { isPass?: boolean; remark?: string }> = {};
    execution.results?.forEach((r) => {
      results[r.itemId] = { isPass: r.isPass, remark: r.remark };
    });
    setItemResults(results);
    setDetailDrawerOpen(true);
  };

  const handleSaveItemResult = async (itemId: string) => {
    if (!selectedExecution) return;
    try {
      await checklistsApi.updateChecklistItemResult({
        executionId: selectedExecution.id,
        itemId,
        ...itemResults[itemId],
      });
      message.success('保存成功');
      fetchExecutions();
    } catch (e: any) {
      message.error(e.message || '保存失败');
    }
  };

  const addItemRow = () => {
    setItemsForm([...itemsForm, { order: itemsForm.length + 1, content: '', requirement: '', evidenceNeeded: false }]);
  };

  const removeItemRow = (index: number) => {
    const newItems = itemsForm.filter((_, i) => i !== index);
    setItemsForm(newItems.map((it, i) => ({ ...it, order: i + 1 })));
  };

  const calcProgress = (exec: ChecklistExecution) => {
    const total = exec.checklist?.items?.length || 0;
    const checked = exec.results?.filter((r) => r.isPass !== undefined && r.isPass !== null).length || 0;
    return { total, checked, percent: total ? Math.round((checked / total) * 100) : 0 };
  };

  const categories = Array.from(new Set(templates.map((t) => t.category).filter(Boolean))) as string[];

  const templateColumns = [
    { title: '标题', dataIndex: 'title', key: 'title' },
    { title: '分类', dataIndex: 'category', key: 'category', render: (v: string) => v || '-' },
    { title: '版本', dataIndex: 'version', key: 'version', render: (v: string) => v || '-' },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (v: boolean, record: Checklist) => (
        <Switch checked={v} onChange={(c) => handleToggleActive(record, c)} size="small" />
      ),
    },
    {
      title: '创建人',
      dataIndex: ['createdBy', 'fullName'],
      key: 'createdBy',
      render: (v: string) => v || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => formatDateTime(v),
    },
    {
      title: '执行次数',
      dataIndex: ['_count', 'executions'],
      key: 'executions',
      render: (v: number) => v || 0,
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Checklist) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => handleToggleActive(record, !record.isActive)}
          >
            {record.isActive ? '禁用' : '启用'}
          </Button>
          <Popconfirm title="确定删除此模板?" onConfirm={() => handleDelete(record)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
          <Button
            type="link"
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={() => handleExecute(record)}
            disabled={!record.isActive}
          >
            执行
          </Button>
        </Space>
      ),
    },
  ];

  const executionColumns = [
    {
      title: '清单名称',
      dataIndex: ['checklist', 'title'],
      key: 'checklistTitle',
      render: (v: string) => v || '-',
    },
    {
      title: '关联任务',
      dataIndex: ['task', 'taskNo'],
      key: 'taskNo',
      render: (v: string, r: ChecklistExecution) => (v ? `${v} - ${r.task?.title}` : '-'),
    },
    {
      title: '执行人',
      dataIndex: ['executedBy', 'fullName'],
      key: 'executedBy',
      render: (v: string) => v || '-',
    },
    {
      title: '开始时间',
      dataIndex: 'startedAt',
      key: 'startedAt',
      render: (v: string) => formatDateTime(v),
    },
    {
      title: '结束时间',
      dataIndex: 'completedAt',
      key: 'completedAt',
      render: (v: string) => formatDateTime(v),
    },
    {
      title: '完成进度',
      key: 'progress',
      render: (_: any, record: ChecklistExecution) => {
        const { total, checked, percent } = calcProgress(record);
        return (
          <div>
            <Progress percent={percent} size="small" />
            <div style={{ fontSize: 12, color: '#666' }}>
              {checked}/{total}
            </div>
          </div>
        );
      },
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: ChecklistExecution) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleContinueExecute(record)}>
            继续执行
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="清单模板列表" key="templates">
            <div style={{ marginBottom: 16 }}>
              <Space wrap>
                <Select
                  placeholder="筛选分类"
                  style={{ width: 160 }}
                  allowClear
                  value={filters.category || undefined}
                  onChange={(v) => setFilters({ ...filters, category: v || '' })}
                >
                  {categories.map((c) => (
                    <Option key={c} value={c}>
                      {c}
                    </Option>
                  ))}
                </Select>
                <Select
                  placeholder="状态"
                  style={{ width: 140 }}
                  allowClear
                  value={filters.isActive === undefined ? undefined : String(filters.isActive)}
                  onChange={(v) =>
                    setFilters({ ...filters, isActive: v === undefined ? undefined : v === 'true' })
                  }
                >
                  <Option value="true">启用</Option>
                  <Option value="false">禁用</Option>
                </Select>
                <Input
                  placeholder="搜索标题/描述"
                  style={{ width: 240 }}
                  prefix={<SearchOutlined />}
                  allowClear
                  value={filters.keyword}
                  onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                />
                <Button icon={<ReloadOutlined />} onClick={fetchTemplates}>
                  刷新
                </Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                  新建模板
                </Button>
              </Space>
            </div>
            <Table
              rowKey="id"
              loading={loading}
              dataSource={templates}
              columns={templateColumns}
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (t) => `共 ${t} 条`,
                onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize }),
              }}
            />
          </TabPane>

          <TabPane tab="执行记录列表" key="executions">
            <div style={{ marginBottom: 16 }}>
              <Space wrap>
                <Select
                  placeholder="清单模板"
                  style={{ width: 200 }}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  value={execFilters.checklistId || undefined}
                  onChange={(v) => setExecFilters({ ...execFilters, checklistId: v || '' })}
                >
                  {templates.map((t) => (
                    <Option key={t.id} value={t.id} label={t.title}>
                      {t.title}
                    </Option>
                  ))}
                </Select>
                <Select
                  placeholder="关联任务"
                  style={{ width: 220 }}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  value={execFilters.taskId || undefined}
                  onChange={(v) => setExecFilters({ ...execFilters, taskId: v || '' })}
                >
                  {tasks.map((t) => (
                    <Option key={t.id} value={t.id} label={t.taskNo}>
                      {t.taskNo} - {t.title}
                    </Option>
                  ))}
                </Select>
                <Select
                  placeholder="执行人"
                  style={{ width: 160 }}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  value={execFilters.executedById || undefined}
                  onChange={(v) => setExecFilters({ ...execFilters, executedById: v || '' })}
                >
                  {users.map((u) => (
                    <Option key={u.id} value={u.id} label={u.fullName}>
                      {u.fullName}
                    </Option>
                  ))}
                </Select>
                <Button icon={<ReloadOutlined />} onClick={fetchExecutions}>
                  刷新
                </Button>
              </Space>
            </div>
            <Table
              rowKey="id"
              loading={loading}
              dataSource={executions}
              columns={executionColumns}
              pagination={{
                ...execPagination,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (t) => `共 ${t} 条`,
                onChange: (page, pageSize) =>
                  setExecPagination({ ...execPagination, current: page, pageSize }),
              }}
            />
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title={editingTemplate ? '编辑清单模板' : '新建清单模板'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={900}
        okText="保存"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
                <Input placeholder="请输入清单标题" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="分类">
                <Input placeholder="如：财务审计、合规检查等" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="version" label="版本">
                <Input placeholder="如：v1.0.0" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isActive" label="是否启用" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="描述">
            <TextArea rows={2} placeholder="请输入描述信息" />
          </Form.Item>

          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>检查项列表</strong>
            <Button size="small" icon={<PlusOutlined />} onClick={addItemRow}>
              添加项
            </Button>
          </div>
          <Table
            rowKey="order"
            size="small"
            dataSource={itemsForm}
            pagination={false}
            columns={[
              {
                title: '序号',
                dataIndex: 'order',
                width: 70,
                render: (_v, _r, i) => i + 1,
              },
              {
                title: '检查内容',
                dataIndex: 'content',
                render: (_v: string, _r: any, idx: number) => (
                  <Input
                    value={itemsForm[idx].content}
                    placeholder="检查内容"
                    onChange={(e) => {
                      const next = [...itemsForm];
                      next[idx].content = e.target.value;
                      setItemsForm(next);
                    }}
                  />
                ),
              },
              {
                title: '要求/标准',
                dataIndex: 'requirement',
                render: (_v: string, _r: any, idx: number) => (
                  <Input
                    value={itemsForm[idx].requirement}
                    placeholder="要求标准"
                    onChange={(e) => {
                      const next = [...itemsForm];
                      next[idx].requirement = e.target.value;
                      setItemsForm(next);
                    }}
                  />
                ),
              },
              {
                title: '需证据',
                dataIndex: 'evidenceNeeded',
                width: 90,
                align: 'center',
                render: (_v: boolean, _r: any, idx: number) => (
                  <Switch
                    size="small"
                    checked={itemsForm[idx].evidenceNeeded}
                    onChange={(c) => {
                      const next = [...itemsForm];
                      next[idx].evidenceNeeded = c;
                      setItemsForm(next);
                    }}
                  />
                ),
              },
              {
                title: '操作',
                width: 70,
                render: (_v, _r, idx) => (
                  <Button
                    type="link"
                    size="small"
                    danger
                    disabled={itemsForm.length <= 1}
                    onClick={() => removeItemRow(idx)}
                  >
                    删除
                  </Button>
                ),
              },
            ]}
          />
        </Form>
      </Modal>

      <Modal
        title={`执行清单 - ${executeTarget?.title || ''}`}
        open={executeModalOpen}
        onOk={handleExecuteSubmit}
        onCancel={() => setExecuteModalOpen(false)}
        okText="开始执行"
        destroyOnClose
      >
        <Form form={executeForm} layout="vertical">
          <Form.Item
            name="taskId"
            label="关联任务"
            rules={[{ required: true, message: '请选择关联任务' }]}
          >
            <Select placeholder="请选择关联任务" showSearch optionFilterProp="label">
              {tasks.map((t) => (
                <Option key={t.id} value={t.id} label={t.taskNo}>
                  {t.taskNo} - {t.title}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={`继续执行 - ${selectedExecution?.checklist?.title || ''}`}
        width={800}
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        destroyOnClose
      >
        {selectedExecution && (
          <>
            <Descriptions size="small" column={2} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="清单">
                {selectedExecution.checklist?.title || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="任务">
                {selectedExecution.task?.taskNo
                  ? `${selectedExecution.task.taskNo} - ${selectedExecution.task.title}`
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="执行人">
                {selectedExecution.executedBy?.fullName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="开始时间">
                {formatDateTime(selectedExecution.startedAt)}
              </Descriptions.Item>
            </Descriptions>

            <Table
              rowKey="id"
              size="small"
              dataSource={selectedExecution.checklist?.items || []}
              pagination={false}
              columns={[
                { title: '序号', dataIndex: 'order', width: 60 },
                { title: '检查内容', dataIndex: 'content' },
                { title: '要求', dataIndex: 'requirement', render: (v) => v || '-' },
                {
                  title: '需证据',
                  dataIndex: 'evidenceNeeded',
                  width: 70,
                  align: 'center',
                  render: (v: boolean) => (v ? '是' : '否'),
                },
                {
                  title: '结果',
                  width: 160,
                  render: (_v, item: ChecklistItem) => {
                    const cur = itemResults[item.id] || {};
                    return (
                      <Space size="small">
                        <Button
                          type={cur.isPass === true ? 'primary' : 'default'}
                          icon={<CheckCircleOutlined />}
                          size="small"
                          shape="circle"
                          onClick={() => {
                            setItemResults({
                              ...itemResults,
                              [item.id]: { ...cur, isPass: true },
                            });
                            setTimeout(() => handleSaveItemResult(item.id), 0);
                          }}
                        />
                        <Button
                          type={cur.isPass === false ? 'primary' : 'default'}
                          danger
                          icon={<CloseCircleOutlined />}
                          size="small"
                          shape="circle"
                          onClick={() => {
                            setItemResults({
                              ...itemResults,
                              [item.id]: { ...cur, isPass: false },
                            });
                            setTimeout(() => handleSaveItemResult(item.id), 0);
                          }}
                        />
                        <Button
                          type={cur.isPass === undefined ? 'primary' : 'default'}
                          icon={<ExclamationCircleOutlined />}
                          size="small"
                          shape="circle"
                          onClick={() => {
                            setItemResults({
                              ...itemResults,
                              [item.id]: { ...cur, isPass: undefined },
                            });
                            setTimeout(() => handleSaveItemResult(item.id), 0);
                          }}
                        />
                      </Space>
                    );
                  },
                },
                {
                  title: '备注',
                  width: 180,
                  render: (_v, item: ChecklistItem) => {
                    const cur = itemResults[item.id] || {};
                    return (
                      <Input
                        size="small"
                        value={cur.remark || ''}
                        placeholder="备注"
                        onBlur={(e) => {
                          setItemResults({
                            ...itemResults,
                            [item.id]: { ...cur, remark: e.target.value },
                          });
                          handleSaveItemResult(item.id);
                        }}
                        onChange={(e) =>
                          setItemResults({
                            ...itemResults,
                            [item.id]: { ...cur, remark: e.target.value },
                          })
                        }
                      />
                    );
                  },
                },
              ]}
            />
          </>
        )}
      </Drawer>
    </div>
  );
}
