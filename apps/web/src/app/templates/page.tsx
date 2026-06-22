'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
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
  Drawer,
  Row,
  Col,
  Descriptions,
  Divider,
  Typography,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  SendOutlined,
} from '@ant-design/icons';
import {
  notificationsApi,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  SendTemplatedRequest,
} from '@/lib/api/notifications';
import { usersApi } from '@/lib/api/users';
import type { NotificationTemplate, User } from '@/lib/api/types';
import { formatDateTime } from '@/lib/utils/format';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Paragraph, Text } = Typography;

const commonCategories = [
  '任务分配',
  '任务提醒',
  '证据审核',
  '补充材料',
  '审批通过',
  '审批驳回',
  '系统通知',
  '审计完成',
];

export default function TemplatesPage() {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({
    category: '',
    isActive: undefined as boolean | undefined,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [form] = Form.useForm();
  const [variablesInput, setVariablesInput] = useState('');

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<NotificationTemplate | null>(null);

  const [sendOpen, setSendOpen] = useState(false);
  const [sendTemplate, setSendTemplate] = useState<NotificationTemplate | null>(null);
  const [sendForm] = Form.useForm();
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchTemplates();
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [pagination.current, pagination.pageSize, filters]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await notificationsApi.getTemplates({
        page: pagination.current,
        pageSize: pagination.pageSize,
        category: filters.category || undefined,
        isActive: filters.isActive,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      setTemplates(res.items);
      setPagination({ ...pagination, total: res.total });
    } catch (e: any) {
      message.error(e.message || '获取模板列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await usersApi.getUsers({ page: 1, pageSize: 100, isActive: true });
      setUsers(res.items);
    } catch (e) {}
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setVariablesInput('');
    setModalOpen(true);
  };

  const handleEdit = (record: NotificationTemplate) => {
    setEditingTemplate(record);
    form.setFieldsValue({
      name: record.name,
      category: record.category,
      subject: record.subject,
      content: record.content,
      isActive: record.isActive,
    });
    setVariablesInput((record.variables || []).join(', '));
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const variablesArr = variablesInput
        .split(/[,，\s]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      const payload: CreateTemplateRequest | UpdateTemplateRequest = {
        ...values,
        variables: variablesArr,
      };

      if (editingTemplate) {
        await notificationsApi.updateTemplate(editingTemplate.id, payload);
        message.success('模板更新成功');
      } else {
        await notificationsApi.createTemplate(payload as CreateTemplateRequest);
        message.success('模板创建成功');
      }
      setModalOpen(false);
      fetchTemplates();
    } catch (e: any) {
      if (e.errorFields) return;
      message.error(e.message || '保存失败');
    }
  };

  const handleToggleActive = async (record: NotificationTemplate, checked: boolean) => {
    try {
      await notificationsApi.updateTemplate(record.id, { isActive: checked });
      message.success(`${checked ? '启用' : '禁用'}成功`);
      fetchTemplates();
    } catch (e: any) {
      message.error(e.message || '操作失败');
    }
  };

  const handleDelete = async (record: NotificationTemplate) => {
    try {
      await notificationsApi.deleteTemplate(record.id);
      message.success('删除成功');
      fetchTemplates();
    } catch (e: any) {
      message.error(e.message || '删除失败');
    }
  };

  const handlePreview = (record: NotificationTemplate) => {
    setPreviewTemplate(record);
    setPreviewOpen(true);
  };

  const handleSend = (record: NotificationTemplate) => {
    setSendTemplate(record);
    sendForm.resetFields();
    const vars: Record<string, string> = {};
    (record.variables || []).forEach((v) => {
      vars[v] = '';
    });
    setVariableValues(vars);
    setSendOpen(true);
  };

  const handleSendSubmit = async () => {
    if (!sendTemplate) return;
    try {
      const values = await sendForm.validateFields();
      const payload: SendTemplatedRequest = {
        templateId: sendTemplate.id,
        recipientIds: values.recipientIds,
        variables: variableValues,
      };
      const res = await notificationsApi.sendTemplatedNotification(payload);
      message.success(`发送成功，共 ${res.sentCount} 条`);
      setSendOpen(false);
    } catch (e: any) {
      if (e.errorFields) return;
      message.error(e.message || '发送失败');
    }
  };

  const replaceVariablesMock = (text: string, vars: string[]): string => {
    if (!text) return '';
    let result = text;
    vars.forEach((v) => {
      const regex = new RegExp(`\\{${v}\\}`, 'g');
      const mock = mockValueFor(v);
      result = result.replace(regex, mock);
    });
    return result;
  };

  const mockValueFor = (varName: string): string => {
    const name = varName.toLowerCase();
    if (name.includes('date') || name.includes('time')) return '2026-06-22';
    if (name.includes('name') || name.includes('user')) return '张三';
    if (name.includes('no') || name.includes('number') || name.includes('id'))
      return 'AUD-2026-001';
    if (name.includes('title') || name.includes('task')) return '2026年度财务审计';
    if (name.includes('amount') || name.includes('money')) return '¥12,500.00';
    if (name.includes('status')) return '进行中';
    if (name.includes('dept') || name.includes('department')) return '审计部';
    if (name.includes('due') || name.includes('deadline')) return '2026-07-15';
    return `【${varName}示例值】`;
  };

  const categories = useMemo(() => {
    const set = new Set<string>(commonCategories);
    templates.forEach((t) => t.category && set.add(t.category));
    return Array.from(set);
  }, [templates]);

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name', width: 200 },
    { title: '分类', dataIndex: 'category', key: 'category', width: 130 },
    {
      title: '主题摘要',
      dataIndex: 'subject',
      key: 'subject',
      ellipsis: true,
      render: (v: string) => (v && v.length > 40 ? v.slice(0, 40) + '...' : v || '-'),
    },
    {
      title: '变量',
      dataIndex: 'variables',
      key: 'variables',
      width: 260,
      render: (v: string[]) =>
        v && v.length ? (
          <Space size={[4, 4]} wrap>
            {v.map((varName) => (
              <Tag key={varName} color="blue">
                {'{'}
                {varName}
                {'}'}
              </Tag>
            ))}
          </Space>
        ) : (
          '-'
        ),
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 70,
      render: (v: number) => `v${v}`,
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 90,
      render: (v: boolean, record: NotificationTemplate) => (
        <Switch checked={v} size="small" onChange={(c) => handleToggleActive(record, c)} />
      ),
    },
    {
      title: '创建人',
      dataIndex: ['createdBy', 'fullName'],
      key: 'createdBy',
      width: 100,
      render: (v: string) => v || '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      render: (_: any, record: NotificationTemplate) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handlePreview(record)}>
            预览
          </Button>
          <Button
            type="link"
            size="small"
            icon={<SendOutlined />}
            onClick={() => handleSend(record)}
            disabled={!record.isActive}
          >
            发送测试
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除此模板?" onConfirm={() => handleDelete(record)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Select
              placeholder="分类"
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
          columns={columns}
          scroll={{ x: 1400 }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize }),
          }}
        />
      </Card>

      <Modal
        title={editingTemplate ? '编辑通报模板' : '新建通报模板'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={760}
        okText="保存"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
                <Input placeholder="模板名称，如：任务分配通知" />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="category" label="分类" rules={[{ required: true, message: '请输入或选择分类' }]}>
                <Select allowClear showSearch placeholder="选择或输入分类">
                  {categories.map((c) => (
                    <Option key={c} value={c}>
                      {c}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={18}>
              <Form.Item name="subject" label="主题" rules={[{ required: true, message: '请输入主题' }]}>
                <Input placeholder="通知主题，支持变量如 {taskTitle}" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="isActive" label="是否启用" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="变量（逗号分隔，如：userName, taskNo, taskTitle）">
            <Input
              placeholder="输入变量名，用逗号分隔，使用时用 {变量名} 包裹"
              value={variablesInput}
              onChange={(e) => setVariablesInput(e.target.value)}
            />
          </Form.Item>
          <Form.Item name="content" label="内容（支持变量占位符如 {userName} {taskTitle}）" rules={[{ required: true, message: '请输入内容' }]}>
            <TextArea
              rows={6}
              placeholder={`尊敬的 {userName}：\n您有一项新任务《{taskTitle}》需要处理，任务编号 {taskNo}。\n\n请在 {dueDate} 前完成。`}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <Space>
            <EyeOutlined />
            模板预览 - {previewTemplate?.name || ''}
          </Space>
        }
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        width={720}
        footer={[
          <Button key="close" onClick={() => setPreviewOpen(false)}>
            关闭
          </Button>,
        ]}
        destroyOnClose
      >
        {previewTemplate ? (
          <div>
            <Descriptions size="small" column={2} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="名称">{previewTemplate.name}</Descriptions.Item>
              <Descriptions.Item label="分类">{previewTemplate.category}</Descriptions.Item>
              <Descriptions.Item label="版本">v{previewTemplate.version}</Descriptions.Item>
              <Descriptions.Item label="状态">
                {previewTemplate.isActive ? '已启用' : '已禁用'}
              </Descriptions.Item>
              <Descriptions.Item label="变量" span={2}>
                {(previewTemplate.variables || []).length ? (
                  <Space size={[4, 4]} wrap>
                    {previewTemplate.variables.map((v) => (
                      <Tag key={v} color="blue">
                        {'{'}
                        {v}
                        {'}'}
                      </Tag>
                    ))}
                  </Space>
                ) : (
                  '-'
                )}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">原始定义</Divider>
            <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 6, marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>
                <Text strong>主题：</Text>
                <Text code>{previewTemplate.subject}</Text>
              </div>
              <div>
                <Text strong>内容：</Text>
                <pre
                  style={{
                    margin: '4px 0 0 0',
                    padding: 8,
                    background: '#fff',
                    border: '1px solid #e8e8e8',
                    borderRadius: 4,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {previewTemplate.content}
                </pre>
              </div>
            </div>

            <Divider orientation="left">模拟渲染效果（变量填入示例值）</Divider>
            <Card size="small" title={<Text strong>主题：{replaceVariablesMock(previewTemplate.subject, previewTemplate.variables || [])}</Text>}>
              <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                {replaceVariablesMock(previewTemplate.content, previewTemplate.variables || [])}
              </Paragraph>
            </Card>
          </div>
        ) : (
          <Empty />
        )}
      </Modal>

      <Modal
        title={
          <Space>
            <SendOutlined />
            发送测试 - {sendTemplate?.name || ''}
          </Space>
        }
        open={sendOpen}
        onOk={handleSendSubmit}
        onCancel={() => setSendOpen(false)}
        width={720}
        okText="发送"
        destroyOnClose
      >
        {sendTemplate && (
          <Form form={sendForm} layout="vertical">
            <Form.Item
              name="recipientIds"
              label="接收人"
              rules={[{ required: true, message: '请选择接收人' }]}
            >
              <Select
                mode="multiple"
                placeholder="选择接收人"
                showSearch
                optionFilterProp="label"
                maxTagCount={6}
              >
                {users.map((u) => (
                  <Option key={u.id} value={u.id} label={u.fullName}>
                    {u.fullName} ({u.email})
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {(sendTemplate.variables || []).length > 0 && (
              <>
                <Divider orientation="left">填写变量值</Divider>
                <Row gutter={16}>
                  {sendTemplate.variables.map((v) => (
                    <Col span={12} key={v}>
                      <Form.Item label={`{${v}}`}>
                        <Input
                          placeholder={`请输入 ${v} 的值`}
                          value={variableValues[v] || ''}
                          onChange={(e) =>
                            setVariableValues({ ...variableValues, [v]: e.target.value })
                          }
                        />
                      </Form.Item>
                    </Col>
                  ))}
                </Row>
              </>
            )}

            <Divider orientation="left">预览效果</Divider>
            <Card size="small" title={<Text strong>主题：{replaceVariablesMock(sendTemplate.subject, Object.keys(variableValues).length ? Object.keys(variableValues) : sendTemplate.variables || [])}</Text>}>
              <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                {Object.keys(variableValues).length || (sendTemplate.variables || []).length
                  ? replaceVariablesMock(
                      sendTemplate.content,
                      Object.keys(variableValues).length
                        ? Object.keys(variableValues)
                        : sendTemplate.variables || [],
                    )
                  : sendTemplate.content}
              </Paragraph>
            </Card>
          </Form>
        )}
      </Modal>
    </div>
  );
}
