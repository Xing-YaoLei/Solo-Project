'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Modal,
  Form,
  Popconfirm,
  message,
  Drawer,
  Row,
  Col,
  Descriptions,
  InputNumber,
  Switch,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import {
  samplingsApi,
  CreateSamplingRequest,
  UpdateSamplingRequest,
} from '@/lib/api/samplings';
import { tasksApi } from '@/lib/api/tasks';
import { usersApi } from '@/lib/api/users';
import { evidencesApi } from '@/lib/api/evidences';
import type {
  SamplingRecord,
  SamplingItem,
  AuditTask,
  User,
  Evidence,
} from '@/lib/api/types';
import {
  SamplingMethod,
  SamplingStatus,
} from '@/lib/api/types';
import { formatDateTime, formatNumber } from '@/lib/utils/format';

const { Option } = Select;
const { TextArea } = Input;

interface SampleForm {
  itemNo: string;
  documentNo?: string;
  description?: string;
  amount?: number;
}

const samplingMethodLabels: Record<SamplingMethod, string> = {
  [SamplingMethod.RANDOM]: '随机抽样',
  [SamplingMethod.SYSTEMATIC]: '系统抽样',
  [SamplingMethod.STRATIFIED]: '分层抽样',
  [SamplingMethod.JUDGMENT]: '判断抽样',
  [SamplingMethod.BLOCK]: '区块抽样',
};

const samplingStatusMap: Record<SamplingStatus, { color: string; label: string }> = {
  [SamplingStatus.DRAFT]: { color: 'default', label: '草稿' },
  [SamplingStatus.IN_PROGRESS]: { color: 'processing', label: '进行中' },
  [SamplingStatus.COMPLETED]: { color: 'blue', label: '已完成' },
  [SamplingStatus.APPROVED]: { color: 'success', label: '已审批' },
  [SamplingStatus.REJECTED]: { color: 'error', label: '已驳回' },
};

const defectLevels = ['轻微', '一般', '严重', '重大'];

export default function SamplingsPage() {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<SamplingRecord[]>([]);
  const [tasks, setTasks] = useState<AuditTask[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({
    status: undefined as SamplingStatus | undefined,
    taskId: '',
    keyword: '',
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SamplingRecord | null>(null);
  const [form] = Form.useForm();
  const [samplesForm, setSamplesForm] = useState<SampleForm[]>([
    { itemNo: '1', documentNo: '', description: '', amount: undefined },
  ]);

  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<SamplingRecord | null>(null);
  const [sampleEdits, setSampleEdits] = useState<Record<string, Partial<SamplingItem>>>({});

  useEffect(() => {
    fetchRecords();
    fetchTasks();
    fetchUsers();
    fetchEvidences();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [pagination.current, pagination.pageSize, filters]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await samplingsApi.getSamplings({
        page: pagination.current,
        pageSize: pagination.pageSize,
        keyword: filters.keyword || undefined,
        status: filters.status,
        taskId: filters.taskId || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      setRecords(res.items);
      setPagination({ ...pagination, total: res.total });
    } catch (e: any) {
      message.error(e.message || '获取抽样记录失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await tasksApi.getTasks({ page: 1, pageSize: 100 });
      setTasks(res.items);
    } catch (e) {}
  };

  const fetchUsers = async () => {
    try {
      const res = await usersApi.getUsers({ page: 1, pageSize: 100 });
      setUsers(res.items);
    } catch (e) {}
  };

  const fetchEvidences = async () => {
    try {
      const res = await evidencesApi.getEvidences({ page: 1, pageSize: 200 });
      setEvidences(res.items);
    } catch (e) {}
  };

  const handleCreate = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({
      method: SamplingMethod.RANDOM,
      confidenceLevel: 95,
    });
    setSamplesForm([{ itemNo: '1', documentNo: '', description: '', amount: undefined }]);
    setModalOpen(true);
  };

  const handleEdit = (record: SamplingRecord) => {
    if ([SamplingStatus.APPROVED, SamplingStatus.IN_PROGRESS].includes(record.status)) {
      message.warning('当前状态不可编辑');
      return;
    }
    setEditingRecord(record);
    form.setFieldsValue({
      title: record.title,
      taskId: record.taskId,
      method: record.method,
      population: record.population,
      sampleSize: record.sampleSize,
      confidenceLevel: record.confidenceLevel,
      remark: record.remark,
    });
    setSamplesForm(
      record.samples?.length
        ? record.samples.map((s) => ({
            itemNo: s.itemNo,
            documentNo: s.documentNo,
            description: s.description,
            amount: s.amount,
          }))
        : [{ itemNo: '1', documentNo: '', description: '', amount: undefined }],
    );
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const validSamples = samplesForm.filter((s) => s.itemNo.trim());
      if (validSamples.length === 0) {
        message.warning('请至少添加一条样本');
        return;
      }
      if (editingRecord) {
        const payload: UpdateSamplingRequest = {
          ...values,
          samples: validSamples.map((s) => ({ ...s })),
        };
        await samplingsApi.updateSampling(editingRecord.id, payload);
        message.success('更新成功');
      } else {
        const payload: CreateSamplingRequest = {
          ...values,
          samples: validSamples.map((s) => ({ ...s })),
        };
        await samplingsApi.createSampling(payload);
        message.success('创建成功');
      }
      setModalOpen(false);
      fetchRecords();
    } catch (e: any) {
      if (e.errorFields) return;
      message.error(e.message || '保存失败');
    }
  };

  const handleDelete = async (record: SamplingRecord) => {
    try {
      await samplingsApi.deleteSampling(record.id);
      message.success('删除成功');
      fetchRecords();
    } catch (e: any) {
      message.error(e.message || '删除失败');
    }
  };

  const handleApprove = async (record: SamplingRecord) => {
    try {
      await samplingsApi.approveSampling(record.id);
      message.success('审批通过');
      fetchRecords();
    } catch (e: any) {
      message.error(e.message || '审批失败');
    }
  };

  const handleReject = async (record: SamplingRecord) => {
    try {
      await samplingsApi.rejectSampling(record.id);
      message.success('已驳回');
      fetchRecords();
    } catch (e: any) {
      message.error(e.message || '驳回失败');
    }
  };

  const handleViewDetail = (record: SamplingRecord) => {
    const edits: Record<string, Partial<SamplingItem>> = {};
    record.samples?.forEach((s) => {
      edits[s.id] = {
        isDefect: s.isDefect,
        defectLevel: s.defectLevel,
        remark: s.remark,
        evidenceId: s.evidenceId,
      };
    });
    setSampleEdits(edits);
    setSelectedRecord(record);
    setDetailDrawerOpen(true);
  };

  const saveSampleEdit = async (sampleId: string) => {
    if (!selectedRecord) return;
    try {
      const edit = sampleEdits[sampleId] || {};
      const samples = selectedRecord.samples?.map((s) =>
        s.id === sampleId
          ? {
              id: s.id,
              itemNo: s.itemNo,
              documentNo: s.documentNo,
              description: s.description,
              amount: s.amount,
              ...edit,
            }
          : { ...s },
      );
      await samplingsApi.updateSampling(selectedRecord.id, { samples });
      message.success('样本更新成功');
      fetchRecords();
      if (selectedRecord) {
        const updated = await samplingsApi.getSampling(selectedRecord.id);
        const newEdits: Record<string, Partial<SamplingItem>> = {};
        updated.samples?.forEach((s) => {
          newEdits[s.id] = {
            isDefect: s.isDefect,
            defectLevel: s.defectLevel,
            remark: s.remark,
            evidenceId: s.evidenceId,
          };
        });
        setSelectedRecord(updated);
        setSampleEdits(newEdits);
      }
    } catch (e: any) {
      message.error(e.message || '保存失败');
    }
  };

  const addSampleRow = () => {
    const nextNo = String(samplesForm.length + 1);
    setSamplesForm([...samplesForm, { itemNo: nextNo, documentNo: '', description: '', amount: undefined }]);
  };

  const removeSampleRow = (index: number) => {
    const newSamples = samplesForm.filter((_, i) => i !== index);
    setSamplesForm(newSamples.map((s, i) => ({ ...s, itemNo: String(i + 1) })));
  };

  const canApprove = (record: SamplingRecord) =>
    [SamplingStatus.COMPLETED, SamplingStatus.REJECTED].includes(record.status);
  const canEdit = (record: SamplingRecord) =>
    [SamplingStatus.DRAFT, SamplingStatus.REJECTED].includes(record.status);

  const columns = [
    { title: '抽样编号', dataIndex: 'samplingNo', key: 'samplingNo', width: 140 },
    { title: '标题', dataIndex: 'title', key: 'title' },
    {
      title: '抽样方法',
      dataIndex: 'method',
      key: 'method',
      width: 110,
      render: (v: SamplingMethod) => samplingMethodLabels[v] || v,
    },
    {
      title: '总体/样本',
      key: 'sizes',
      width: 120,
      render: (_: any, r: SamplingRecord) => (
        <div>
          <div>总体: {formatNumber(r.population)}</div>
          <div>样本: {formatNumber(r.sampleSize)}</div>
        </div>
      ),
    },
    {
      title: '置信水平',
      dataIndex: 'confidenceLevel',
      key: 'confidenceLevel',
      width: 90,
      render: (v: number) => (v !== undefined && v !== null ? `${v}%` : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (v: SamplingStatus) => {
        const cfg = samplingStatusMap[v];
        return cfg ? <Tag color={cfg.color}>{cfg.label}</Tag> : v;
      },
    },
    {
      title: '创建人',
      dataIndex: ['createdBy', 'fullName'],
      key: 'createdBy',
      width: 100,
      render: (v: string) => v || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: '审批人',
      dataIndex: ['approvedBy', 'fullName'],
      key: 'approvedBy',
      width: 100,
      render: (v: string) => v || '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 280,
      render: (_: any, record: SamplingRecord) => (
        <Space size="small" wrap>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {canEdit(record) && (
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
              编辑
            </Button>
          )}
          {canApprove(record) && (
            <>
              <Popconfirm title="确认审批通过?" onConfirm={() => handleApprove(record)}>
                <Button type="link" size="small" icon={<CheckCircleOutlined />} style={{ color: '#52c41a' }}>
                  通过
                </Button>
              </Popconfirm>
              <Popconfirm title="确认驳回?" onConfirm={() => handleReject(record)}>
                <Button type="link" size="small" danger icon={<CloseCircleOutlined />}>
                  驳回
                </Button>
              </Popconfirm>
            </>
          )}
          {record.status === SamplingStatus.DRAFT && (
            <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record)}>
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          )}
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
              placeholder="状态"
              style={{ width: 140 }}
              allowClear
              value={filters.status}
              onChange={(v) => setFilters({ ...filters, status: v })}
            >
              {Object.entries(samplingStatusMap).map(([k, v]) => (
                <Option key={k} value={k}>
                  {v.label}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="关联任务"
              style={{ width: 220 }}
              allowClear
              showSearch
              optionFilterProp="label"
              value={filters.taskId || undefined}
              onChange={(v) => setFilters({ ...filters, taskId: v || '' })}
            >
              {tasks.map((t) => (
                <Option key={t.id} value={t.id} label={t.taskNo}>
                  {t.taskNo} - {t.title}
                </Option>
              ))}
            </Select>
            <Input
              placeholder="搜索编号/标题"
              style={{ width: 240 }}
              prefix={<SearchOutlined />}
              allowClear
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            />
            <Button icon={<ReloadOutlined />} onClick={fetchRecords}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新建抽样
            </Button>
          </Space>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          dataSource={records}
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
        title={editingRecord ? '编辑抽样记录' : '新建抽样记录'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={950}
        okText="保存"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
                <Input placeholder="请输入标题" />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="taskId" label="关联任务" rules={[{ required: true, message: '请选择任务' }]}>
                <Select placeholder="请选择任务" showSearch optionFilterProp="label">
                  {tasks.map((t) => (
                    <Option key={t.id} value={t.id} label={t.taskNo}>
                      {t.taskNo} - {t.title}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="method" label="抽样方法" rules={[{ required: true, message: '请选择方法' }]}>
                <Select>
                  {Object.entries(samplingMethodLabels).map(([k, v]) => (
                    <Option key={k} value={k}>
                      {v}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={5}>
              <Form.Item
                name="population"
                label="总体数量"
                rules={[{ required: true, message: '请输入总体数' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder="总数" />
              </Form.Item>
            </Col>
            <Col span={5}>
              <Form.Item
                name="sampleSize"
                label="样本数量"
                rules={[{ required: true, message: '请输入样本数' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder="样本数" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="confidenceLevel" label="置信水平(%)">
                <InputNumber min={50} max={99.99} step={0.1} style={{ width: '100%' }} placeholder="95" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="remark" label="备注">
            <TextArea rows={2} placeholder="备注说明" />
          </Form.Item>

          <Divider orientation="left" style={{ margin: '8px 0 12px' }}>
            样本列表
            <Button size="small" icon={<PlusOutlined />} onClick={addSampleRow} style={{ marginLeft: 12 }}>
              添加样本
            </Button>
          </Divider>

          <Table
            rowKey="itemNo"
            size="small"
            dataSource={samplesForm}
            pagination={false}
            columns={[
              {
                title: '样本号',
                dataIndex: 'itemNo',
                width: 90,
                render: (_v: string, _r: any, idx: number) => (
                  <Input
                    value={samplesForm[idx].itemNo}
                    style={{ width: '100%' }}
                    onChange={(e) => {
                      const next = [...samplesForm];
                      next[idx].itemNo = e.target.value;
                      setSamplesForm(next);
                    }}
                  />
                ),
              },
              {
                title: '凭证/单据号',
                dataIndex: 'documentNo',
                render: (_v: string, _r: any, idx: number) => (
                  <Input
                    value={samplesForm[idx].documentNo}
                    placeholder="单据号"
                    onChange={(e) => {
                      const next = [...samplesForm];
                      next[idx].documentNo = e.target.value;
                      setSamplesForm(next);
                    }}
                  />
                ),
              },
              {
                title: '描述',
                dataIndex: 'description',
                render: (_v: string, _r: any, idx: number) => (
                  <Input
                    value={samplesForm[idx].description}
                    placeholder="样本描述"
                    onChange={(e) => {
                      const next = [...samplesForm];
                      next[idx].description = e.target.value;
                      setSamplesForm(next);
                    }}
                  />
                ),
              },
              {
                title: '金额/数量',
                dataIndex: 'amount',
                width: 140,
                render: (_v: number, _r: any, idx: number) => (
                  <InputNumber
                    value={samplesForm[idx].amount}
                    style={{ width: '100%' }}
                    placeholder="金额"
                    onChange={(v) => {
                      const next = [...samplesForm];
                      next[idx].amount = v as number | undefined;
                      setSamplesForm(next);
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
                    disabled={samplesForm.length <= 1}
                    onClick={() => removeSampleRow(idx)}
                  >
                    删除
                  </Button>
                ),
              },
            ]}
          />
        </Form>
      </Modal>

      <Drawer
        title={`抽样详情 - ${selectedRecord?.samplingNo || ''}`}
        width={960}
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        destroyOnClose
      >
        {selectedRecord && (
          <>
            <Descriptions size="small" column={2} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="编号">{selectedRecord.samplingNo}</Descriptions.Item>
              <Descriptions.Item label="标题">{selectedRecord.title}</Descriptions.Item>
              <Descriptions.Item label="方法">
                {samplingMethodLabels[selectedRecord.method]}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={samplingStatusMap[selectedRecord.status]?.color}>
                  {samplingStatusMap[selectedRecord.status]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="总体">{formatNumber(selectedRecord.population)}</Descriptions.Item>
              <Descriptions.Item label="样本">{formatNumber(selectedRecord.sampleSize)}</Descriptions.Item>
              <Descriptions.Item label="置信水平">
                {selectedRecord.confidenceLevel ? `${selectedRecord.confidenceLevel}%` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建人">
                {selectedRecord.createdBy?.fullName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="审批人">
                {selectedRecord.approvedBy?.fullName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {formatDateTime(selectedRecord.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>
                {selectedRecord.remark || '-'}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left" style={{ margin: '8px 0 12px' }}>
              样本明细（可直接编辑缺陷标记）
            </Divider>

            <Table
              rowKey="id"
              size="small"
              dataSource={selectedRecord.samples || []}
              pagination={false}
              scroll={{ x: 1200 }}
              columns={[
                { title: '样本号', dataIndex: 'itemNo', width: 80 },
                { title: '单据号', dataIndex: 'documentNo', width: 140, render: (v) => v || '-' },
                { title: '描述', dataIndex: 'description', render: (v) => v || '-' },
                {
                  title: '金额',
                  dataIndex: 'amount',
                  width: 110,
                  render: (v: number) => (v !== undefined && v !== null ? formatNumber(v, 2) : '-'),
                },
                {
                  title: '是否缺陷',
                  width: 100,
                  align: 'center',
                  render: (_v: any, item: SamplingItem) => {
                    const cur = sampleEdits[item.id] || {};
                    return (
                      <Switch
                        size="small"
                        checked={!!cur.isDefect}
                        onChange={(c) => {
                          setSampleEdits({
                            ...sampleEdits,
                            [item.id]: { ...cur, isDefect: c },
                          });
                          setTimeout(() => saveSampleEdit(item.id), 0);
                        }}
                      />
                    );
                  },
                },
                {
                  title: '缺陷等级',
                  width: 120,
                  render: (_v: any, item: SamplingItem) => {
                    const cur = sampleEdits[item.id] || {};
                    return (
                      <Select
                        size="small"
                        allowClear
                        placeholder="等级"
                        value={cur.defectLevel}
                        style={{ width: '100%' }}
                        onChange={(v) => {
                          setSampleEdits({
                            ...sampleEdits,
                            [item.id]: { ...cur, defectLevel: v },
                          });
                          setTimeout(() => saveSampleEdit(item.id), 0);
                        }}
                      >
                        {defectLevels.map((d) => (
                          <Option key={d} value={d}>
                            {d}
                          </Option>
                        ))}
                      </Select>
                    );
                  },
                },
                {
                  title: '关联证据',
                  width: 180,
                  render: (_v: any, item: SamplingItem) => {
                    const cur = sampleEdits[item.id] || {};
                    return (
                      <Select
                        size="small"
                        allowClear
                        showSearch
                        placeholder="证据"
                        optionFilterProp="label"
                        value={cur.evidenceId}
                        style={{ width: '100%' }}
                        onChange={(v) => {
                          setSampleEdits({
                            ...sampleEdits,
                            [item.id]: { ...cur, evidenceId: v },
                          });
                          setTimeout(() => saveSampleEdit(item.id), 0);
                        }}
                      >
                        {evidences.map((e) => (
                          <Option key={e.id} value={e.id} label={e.evidenceNo}>
                            {e.evidenceNo} - {e.title}
                          </Option>
                        ))}
                      </Select>
                    );
                  },
                },
                {
                  title: '备注',
                  width: 180,
                  render: (_v: any, item: SamplingItem) => {
                    const cur = sampleEdits[item.id] || {};
                    return (
                      <Input
                        size="small"
                        value={cur.remark || ''}
                        placeholder="备注"
                        onBlur={() => saveSampleEdit(item.id)}
                        onChange={(e) =>
                          setSampleEdits({
                            ...sampleEdits,
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
