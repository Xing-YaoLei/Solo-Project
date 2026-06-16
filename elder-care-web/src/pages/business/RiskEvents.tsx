import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, Tag, Space, Row, Col, DatePicker,
  Drawer, Timeline, message, Popconfirm,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { riskEvents, areas, staffApi, elderly } from '../../api/apiClient';
import type { RiskEvent, RiskEventReminder, Area, Staff, ElderlyProfile } from '../../types';
import {
  RiskEventTypeLabel, RiskEventSeverityLabel, RiskEventStatusLabel,
  ReminderActionTypeLabel,
} from '../../types';

const eventTypeColors: Record<string, string> = {
  Fall: 'red',
  Wander: 'orange',
  Choking: 'volcano',
  Other: 'blue',
};

const severityColors: Record<string, string> = {
  Low: 'green',
  Medium: 'blue',
  High: 'orange',
  Critical: 'red',
};

const statusColors: Record<string, string> = {
  Open: 'red',
  Processing: 'orange',
  Resolved: 'green',
  Closed: 'default',
};

const actionTypeColors: Record<string, string> = {
  Pushed: 'blue',
  Supplemented: 'cyan',
  Retried: 'orange',
  Closed: 'green',
};

const RiskEvents: React.FC = () => {
  const [data, setData] = useState<RiskEvent[]>([]);
  const [areaList, setAreaList] = useState<Area[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [elderlyList, setElderlyList] = useState<ElderlyProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RiskEvent | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [timelineData, setTimelineData] = useState<RiskEventReminder[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<RiskEvent | null>(null);
  const [supplementModalOpen, setSupplementModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [supplementForm] = Form.useForm();
  const [closeForm] = Form.useForm();
  const [form] = Form.useForm();

  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterSeverity, setFilterSeverity] = useState<string | undefined>();
  const [filterArea, setFilterArea] = useState<number | undefined>();
  const [filterStaff, setFilterStaff] = useState<number | undefined>();
  const [filterDateRange, setFilterDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await riskEvents.getAll();
      setData(res.data);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDeps = useCallback(async () => {
    try {
      const [areaRes, staffRes, elderlyRes] = await Promise.all([
        areas.getAll(),
        staffApi.getAll(),
        elderly.getAll(),
      ]);
      setAreaList(areaRes.data);
      setStaffList(staffRes.data);
      setElderlyList(elderlyRes.data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchData();
    fetchDeps();
  }, [fetchData, fetchDeps]);

  const handleAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ eventType: 'Fall', severity: 'Medium', status: 'Open' });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (values.eventTime) {
        values.eventTime = values.eventTime.format('YYYY-MM-DDTHH:mm:ss');
      }
      if (editing) {
        await riskEvents.update(editing.id, values);
        message.success('更新成功');
      } else {
        await riskEvents.create(values);
        message.success('创建成功');
      }
      setModalOpen(false);
      fetchData();
    } catch {}
  };

  const handleViewTimeline = async (record: RiskEvent) => {
    setSelectedEvent(record);
    try {
      const res = await riskEvents.getTimeline(record.id);
      setTimelineData(res.data.reminders || []);
    } catch {
      setTimelineData([]);
    }
    setDrawerOpen(true);
  };

  const handlePush = async (record: RiskEvent) => {
    try {
      await riskEvents.push(record.id, { message: `${RiskEventTypeLabel[record.eventType] || '风险'}事件提醒 - ${record.elderlyName || '老人'}` });
      message.success('推送成功');
      fetchData();
    } catch {}
  };

  const handleSupplement = (record: RiskEvent) => {
    setSelectedEvent(record);
    supplementForm.resetFields();
    setSupplementModalOpen(true);
  };

  const handleSupplementSubmit = async () => {
    try {
      const values = await supplementForm.validateFields();
      await riskEvents.supplement(selectedEvent!.id, { message: '补录信息', notes: values.notes });
      message.success('补录成功');
      setSupplementModalOpen(false);
      fetchData();
    } catch {}
  };

  const handleRetry = async (record: RiskEvent) => {
    try {
      const res = await riskEvents.getTimeline(record.id);
      const reminders: RiskEventReminder[] = res.data.reminders || [];
      const failedReminder = reminders.filter(r => !r.isSuccessful).sort((a, b) => new Date(b.actionTime).getTime() - new Date(a.actionTime).getTime())[0];
      if (!failedReminder) {
        message.warning('没有可重试的提醒');
        return;
      }
      await riskEvents.retry(record.id, failedReminder.id, { message: '重试提醒' });
      message.success('重试成功');
      fetchData();
    } catch {}
  };

  const handleClose = (record: RiskEvent) => {
    setSelectedEvent(record);
    closeForm.resetFields();
    setCloseModalOpen(true);
  };

  const handleCloseSubmit = async () => {
    try {
      const values = await closeForm.validateFields();
      const res = await riskEvents.getTimeline(selectedEvent!.id);
      const reminders: RiskEventReminder[] = res.data.reminders || [];
      const latestReminder = reminders.sort((a, b) => new Date(b.actionTime).getTime() - new Date(a.actionTime).getTime())[0];
      if (!latestReminder) {
        message.warning('没有可关闭的提醒');
        return;
      }
      await riskEvents.close(selectedEvent!.id, latestReminder.id, { message: values.resolution || '关闭事件' });
      message.success('关闭成功');
      setCloseModalOpen(false);
      fetchData();
    } catch {}
  };

  const filteredData = data.filter((item) => {
    if (filterStatus && item.status !== filterStatus) return false;
    if (filterSeverity && item.severity !== filterSeverity) return false;
    if (filterArea && item.areaId !== filterArea) return false;
    if (filterStaff && item.assignedStaffId !== filterStaff) return false;
    if (filterDateRange && filterDateRange[0] && filterDateRange[1]) {
      const eventDay = dayjs(item.eventTime);
      if (eventDay.isBefore(filterDateRange[0], 'day') || eventDay.isAfter(filterDateRange[1], 'day')) return false;
    }
    return true;
  });

  const columns = [
    {
      title: '老人',
      dataIndex: 'elderlyId',
      key: 'elderlyId',
      render: (_: number, record: RiskEvent) => record.elderlyName || '-',
    },
    {
      title: '事件类型',
      dataIndex: 'eventType',
      key: 'eventType',
      render: (val: string) => <Tag color={eventTypeColors[val] || 'blue'}>{RiskEventTypeLabel[val] || val}</Tag>,
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      render: (val: string) => <Tag color={severityColors[val] || 'blue'}>{RiskEventSeverityLabel[val] || val}</Tag>,
    },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: '事件时间', dataIndex: 'eventTime', key: 'eventTime', render: (val: string) => val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-' },
    {
      title: '区域',
      dataIndex: 'areaId',
      key: 'areaId',
      render: (_: number, record: RiskEvent) => record.areaName || '-',
    },
    {
      title: '负责人',
      dataIndex: 'assignedStaffId',
      key: 'assignedStaffId',
      render: (_: number, record: RiskEvent) => record.assignedStaffName || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => <Tag color={statusColors[val] || 'default'}>{RiskEventStatusLabel[val] || val}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: RiskEvent) => (
        <Space direction="vertical" size={2}>
          <Space size={4}>
            <Button type="link" size="small" onClick={() => handleViewTimeline(record)}>详情</Button>
            <Button type="link" size="small" onClick={() => { setEditing(record); form.setFieldsValue({ ...record, eventTime: record.eventTime ? dayjs(record.eventTime) : undefined }); setModalOpen(true); }}>编辑</Button>
          </Space>
          <Space size={4}>
            {record.status === 'Open' && (
              <Popconfirm title="确认推送提醒?" onConfirm={() => handlePush(record)}>
                <Button type="link" size="small" style={{ color: '#1677ff' }}>推送提醒</Button>
              </Popconfirm>
            )}
            {record.status === 'Processing' && (
              <>
                <Button type="link" size="small" style={{ color: '#13c2c2' }} onClick={() => handleSupplement(record)}>补录</Button>
                <Button type="link" size="small" style={{ color: '#fa8c16' }} onClick={() => handleRetry(record)}>重试</Button>
                <Button type="link" size="small" style={{ color: '#999' }} onClick={() => handleClose(record)}>关闭</Button>
              </>
            )}
          </Space>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Row gutter={[16, 12]}>
          <Col>
            <Select placeholder="状态" value={filterStatus} onChange={setFilterStatus} allowClear style={{ width: 120 }}>
              {Object.entries(RiskEventStatusLabel).map(([k, v]) => (
                <Select.Option key={k} value={k}>{v}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Select placeholder="严重程度" value={filterSeverity} onChange={setFilterSeverity} allowClear style={{ width: 120 }}>
              {Object.entries(RiskEventSeverityLabel).map(([k, v]) => (
                <Select.Option key={k} value={k}>{v}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Select placeholder="区域" value={filterArea} onChange={setFilterArea} allowClear style={{ width: 140 }}>
              {areaList.map((a) => (
                <Select.Option key={a.id} value={a.id}>{a.name}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Select placeholder="负责人" value={filterStaff} onChange={setFilterStaff} allowClear style={{ width: 140 }}>
              {staffList.map((s) => (
                <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col>
            <DatePicker.RangePicker
              value={filterDateRange}
              onChange={(val) => setFilterDateRange(val)}
              style={{ width: 240 }}
            />
          </Col>
          <Col flex="auto" />
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增事件
            </Button>
          </Col>
        </Row>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
      />

      <Modal
        title={editing ? '编辑风险事件' : '新增风险事件'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => { setModalOpen(false); setEditing(null); }}
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="elderlyId" label="老人" rules={[{ required: true, message: '请选择老人' }]}>
                <Select showSearch optionFilterProp="children">
                  {elderlyList.map((e) => (
                    <Select.Option key={e.id} value={e.id}>{e.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="eventType" label="事件类型" rules={[{ required: true }]}>
                <Select>
                  {Object.entries(RiskEventTypeLabel).map(([k, v]) => (
                    <Select.Option key={k} value={k}>{v}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="severity" label="严重程度" rules={[{ required: true }]}>
                <Select>
                  {Object.entries(RiskEventSeverityLabel).map(([k, v]) => (
                    <Select.Option key={k} value={k}>{v}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="eventTime" label="事件时间" rules={[{ required: true, message: '请选择事件时间' }]}>
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="描述" rules={[{ required: true, message: '请输入描述' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="location" label="地点">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="areaId" label="区域" rules={[{ required: true, message: '请选择区域' }]}>
                <Select>
                  {areaList.map((a) => (
                    <Select.Option key={a.id} value={a.id}>{a.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="assignedStaffId" label="指派负责人">
            <Select allowClear>
              {staffList.map((s) => (
                <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={`事件详情 - ${selectedEvent?.description || ''}`}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={480}
      >
        {selectedEvent && (
          <div style={{ marginBottom: 24 }}>
            <p><strong>老人：</strong>{selectedEvent.elderlyName}</p>
            <p><strong>类型：</strong><Tag color={eventTypeColors[selectedEvent.eventType]}>{RiskEventTypeLabel[selectedEvent.eventType]}</Tag></p>
            <p><strong>严重程度：</strong><Tag color={severityColors[selectedEvent.severity]}>{RiskEventSeverityLabel[selectedEvent.severity]}</Tag></p>
            <p><strong>状态：</strong><Tag color={statusColors[selectedEvent.status]}>{RiskEventStatusLabel[selectedEvent.status]}</Tag></p>
            <p><strong>事件时间：</strong>{selectedEvent.eventTime ? dayjs(selectedEvent.eventTime).format('YYYY-MM-DD HH:mm') : '-'}</p>
            <p><strong>地点：</strong>{selectedEvent.location || '-'}</p>
            <p><strong>负责人：</strong>{selectedEvent.assignedStaffName || '-'}</p>
          </div>
        )}
        <h4>提醒操作记录</h4>
        {timelineData.length === 0 ? (
          <p style={{ color: '#999' }}>暂无提醒记录</p>
        ) : (
          <Timeline
            items={timelineData.map((r) => ({
              color: actionTypeColors[r.actionType] || 'blue',
              children: (
                <div>
                  <div>
                    <Tag color={actionTypeColors[r.actionType]}>{ReminderActionTypeLabel[r.actionType] || r.actionType}</Tag>
                    <span style={{ marginLeft: 8 }}>{r.staffName || '-'}</span>
                  </div>
                  <div style={{ color: '#666', fontSize: 12 }}>{r.actionTime ? dayjs(r.actionTime).format('YYYY-MM-DD HH:mm:ss') : '-'}</div>
                  {r.message && <div style={{ marginTop: 4 }}>{r.message}</div>}
                  {r.isSuccessful !== undefined && (
                    <div style={{ marginTop: 2, fontSize: 12 }}>
                      {r.isSuccessful ? <Tag color="success">成功</Tag> : <Tag color="error">失败</Tag>}
                      {r.retryCount > 0 && <span style={{ marginLeft: 8 }}>重试次数: {r.retryCount}</span>}
                    </div>
                  )}
                  {r.notes && <div style={{ color: '#999', fontSize: 12, marginTop: 2 }}>{r.notes}</div>}
                </div>
              ),
            }))}
          />
        )}
      </Drawer>

      <Modal
        title="补录信息"
        open={supplementModalOpen}
        onOk={handleSupplementSubmit}
        onCancel={() => setSupplementModalOpen(false)}
        destroyOnClose
      >
        <Form form={supplementForm} layout="vertical">
          <Form.Item name="notes" label="补录备注" rules={[{ required: true, message: '请输入补录备注' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="关闭事件"
        open={closeModalOpen}
        onOk={handleCloseSubmit}
        onCancel={() => setCloseModalOpen(false)}
        destroyOnClose
      >
        <Form form={closeForm} layout="vertical">
          <Form.Item name="resolution" label="处理结果" rules={[{ required: true, message: '请输入处理结果' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RiskEvents;
