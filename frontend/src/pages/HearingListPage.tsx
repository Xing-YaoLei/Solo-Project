import { useState, useEffect, useCallback } from 'react';
import { Table, Card, Space, Button, Select, DatePicker, TimePicker, Tag, Modal, Form, Input, message, Popconfirm, Tooltip, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useHearingStore } from '../stores/hearingStore';
import { HearingStatus, HearingStatusLabel } from '../types';
import { getStatusColor, formatDate } from '../utils/helpers';
import { canCreateHearing, canDeleteHearing, canEditHearing } from '../utils/permissions';
import { useAuthStore } from '../stores/authStore';

const { RangePicker } = DatePicker;

export default function HearingListPage() {
  const { hearings, loading, fetchHearings, changeStatus, batchChangeStatus, deleteHearing } = useHearingStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<HearingStatus>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>();
  const [conflictFilter, setConflictFilter] = useState<boolean>();
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [currentHearingId, setCurrentHearingId] = useState<string>();
  const [batchStatusModalOpen, setBatchStatusModalOpen] = useState(false);
  const [statusForm] = Form.useForm();
  const [createForm] = Form.useForm();
  const [batchStatusForm] = Form.useForm();

  useEffect(() => { fetchHearings(1, 20); }, []);

  const handleTableChange = useCallback((page: number, pageSize: number) => {
    fetchHearings(page, pageSize, {
      status: statusFilter,
      fromDate: dateRange?.[0]?.format('YYYY-MM-DD'),
      toDate: dateRange?.[1]?.format('YYYY-MM-DD'),
      conflictFlagged: conflictFilter,
    });
  }, [statusFilter, dateRange, conflictFilter, fetchHearings]);

  const handleCreate = async (values: any) => {
    try {
      const data = {
        caseNumber: values.caseNumber,
        caseName: values.caseName,
        courtName: values.courtName,
        courtRoom: values.courtRoom,
        hearingDate: values.hearingDate.format('YYYY-MM-DD'),
        startTime: values.timeRange?.[0]?.format('HH:mm'),
        endTime: values.timeRange?.[1]?.format('HH:mm'),
        assignedLawyerId: values.assignedLawyerId,
        notes: values.notes,
      };
      const newHearing = await useHearingStore.getState().createHearing(data);
      message.success('创建成功');
      setCreateModalOpen(false);
      createForm.resetFields();
      fetchHearings(1, 20);
      navigate(`/hearings/${newHearing.id}`);
    } catch { message.error('创建失败'); }
  };

  const handleStatusChange = async (values: any) => {
    try {
      if (currentHearingId) {
        await changeStatus(currentHearingId, values.status, values.reason);
        message.success('状态已更新');
      }
      setStatusModalOpen(false);
      statusForm.resetFields();
      fetchHearings(1, 20);
    } catch { message.error('操作失败'); }
  };

  const handleBatchStatus = async (values: any) => {
    try {
      await batchChangeStatus(selectedRowKeys, values.status, values.reason);
      message.success('批量更新成功');
      setBatchStatusModalOpen(false);
      setSelectedRowKeys([]);
      batchStatusForm.resetFields();
      fetchHearings(1, 20);
    } catch { message.error('批量操作失败'); }
  };

  const columns = [
    { title: '案号', dataIndex: 'caseNumber', key: 'caseNumber', render: (text: string, record: any) => <a onClick={() => navigate(`/hearings/${record.id}`)}>{text}</a> },
    { title: '案名', dataIndex: 'caseName', key: 'caseName', ellipsis: true },
    { title: '法院', dataIndex: 'courtName', key: 'courtName' },
    { title: '法庭', dataIndex: 'courtRoom', key: 'courtRoom' },
    { title: '开庭日期', dataIndex: 'hearingDate', key: 'hearingDate', render: (d: string) => formatDate(d) },
    { title: '时段', key: 'time', render: (_: any, r: any) => `${r.startTime?.substring(0,5)}-${r.endTime?.substring(0,5)}` },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: HearingStatus) => <Tag color={getStatusColor(s)}>{HearingStatusLabel[s]}</Tag> },
    { title: '冲突', dataIndex: 'isConflictFlagged', key: 'conflict', render: (f: boolean) => f ? <Tag color="red">利益冲突</Tag> : '-' },
    { title: '操作', key: 'actions', render: (_: any, record: any) => (
      <Space>
        <Button size="small" onClick={() => navigate(`/hearings/${record.id}`)}>详情</Button>
        {canEditHearing(user!.role) && <Tooltip title="变更状态"><Button size="small" icon={<EditOutlined />} onClick={() => { setCurrentHearingId(record.id); setStatusModalOpen(true); }} /></Tooltip>}
        {canDeleteHearing(user!.role) && <Popconfirm title="确认删除？" onConfirm={async () => { await deleteHearing(record.id); message.success('已删除'); fetchHearings(1, 20); }}><Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm>}
      </Space>
    )},
  ];

  return (
    <Card title="排程列表" extra={
      <Space>
        {canCreateHearing(user!.role) && <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>新建排程</Button>}
        {selectedRowKeys.length > 0 && canEditHearing(user!.role) && <Button onClick={() => setBatchStatusModalOpen(true)}>批量变更状态 ({selectedRowKeys.length})</Button>}
      </Space>
    }>
      <Space style={{ marginBottom: 16 }} wrap>
        <Select allowClear placeholder="按状态筛选" style={{ width: 140 }} value={statusFilter} onChange={(v) => { setStatusFilter(v); fetchHearings(1, 20, { status: v, fromDate: dateRange?.[0]?.format('YYYY-MM-DD'), toDate: dateRange?.[1]?.format('YYYY-MM-DD'), conflictFlagged: conflictFilter }); }}
          options={Object.entries(HearingStatusLabel).map(([k, v]) => ({ value: Number(k), label: v }))} />
        <RangePicker onChange={(dates) => { setDateRange(dates as any); fetchHearings(1, 20, { status: statusFilter, fromDate: dates?.[0]?.format('YYYY-MM-DD'), toDate: dates?.[1]?.format('YYYY-MM-DD'), conflictFlagged: conflictFilter }); }} />
        <span>冲突标记</span>
        <Switch checked={conflictFilter || false} onChange={(v) => { setConflictFilter(v || undefined); fetchHearings(1, 20, { status: statusFilter, fromDate: dateRange?.[0]?.format('YYYY-MM-DD'), toDate: dateRange?.[1]?.format('YYYY-MM-DD'), conflictFlagged: v || undefined }); }} />
      </Space>
      <Table rowKey="id" dataSource={hearings?.items || []} columns={columns} loading={loading}
        rowSelection={{ selectedRowKeys, onChange: (keys) => setSelectedRowKeys(keys as string[]) }}
        pagination={{ current: hearings?.page, pageSize: hearings?.pageSize, total: hearings?.totalCount, onChange: handleTableChange }}
      />

      <Modal title="新建排程" open={createModalOpen} onCancel={() => setCreateModalOpen(false)} onOk={() => createForm.submit()} width={600} destroyOnClose>
        <Form form={createForm} onFinish={handleCreate} layout="vertical">
          <Form.Item name="caseNumber" label="案号" rules={[{ required: true, message: '请输入案号' }]}>
            <Input placeholder="如：(2024)沪民初字第001号" />
          </Form.Item>
          <Form.Item name="caseName" label="案名" rules={[{ required: true, message: '请输入案名' }]}>
            <Input placeholder="如：某公司诉某合同纠纷案" />
          </Form.Item>
          <Form.Item name="courtName" label="法院" rules={[{ required: true, message: '请输入法院名称' }]}>
            <Input placeholder="如：上海市浦东新区人民法院" />
          </Form.Item>
          <Form.Item name="courtRoom" label="法庭" rules={[{ required: true, message: '请输入法庭' }]}>
            <Input placeholder="如：第一法庭" />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item name="hearingDate" label="开庭日期" rules={[{ required: true }]} style={{ flex: 1, marginBottom: 0 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="timeRange" label="时段" rules={[{ required: true }]} style={{ flex: 1.5, marginBottom: 0 }}>
              <TimePicker.RangePicker style={{ width: '100%' }} format="HH:mm" />
            </Form.Item>
          </Space>
          <Form.Item name="assignedLawyerId" label="负责律师ID">
            <Input placeholder="可选，输入律师用户ID" />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="变更状态" open={statusModalOpen} onCancel={() => setStatusModalOpen(false)} onOk={() => statusForm.submit()}>
        <Form form={statusForm} onFinish={handleStatusChange}>
          <Form.Item name="status" label="新状态" rules={[{ required: true }]}><Select options={Object.entries(HearingStatusLabel).map(([k, v]) => ({ value: Number(k), label: v }))} /></Form.Item>
          <Form.Item name="reason" label="原因"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
      <Modal title="批量变更状态" open={batchStatusModalOpen} onCancel={() => setBatchStatusModalOpen(false)} onOk={() => batchStatusForm.submit()}>
        <Form form={batchStatusForm} onFinish={handleBatchStatus}>
          <Form.Item name="status" label="新状态" rules={[{ required: true }]}><Select options={Object.entries(HearingStatusLabel).map(([k, v]) => ({ value: Number(k), label: v }))} /></Form.Item>
          <Form.Item name="reason" label="原因"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
