import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, Row, Col, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { schedules, medicationDict, elderly, staffApi } from '../../api/apiClient';
import type { MedicationSchedule, MedicationDictionary, MedicationReminderLog, ElderlyProfile, Staff } from '../../types';
import { MedicationStatusLabel, ReminderStatusLabel } from '../../types';

const statusColors: Record<string, string> = {
  Active: 'green',
  Paused: 'orange',
  Completed: 'blue',
};

const reminderStatusColors: Record<string, string> = {
  Pending: 'default',
  Sent: 'blue',
  Acknowledged: 'green',
  Missed: 'red',
};

const MedicationSchedules: React.FC = () => {
  const [data, setData] = useState<MedicationSchedule[]>([]);
  const [medDictList, setMedDictList] = useState<MedicationDictionary[]>([]);
  const [elderlyList, setElderlyList] = useState<ElderlyProfile[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [reminderLogs, setReminderLogs] = useState<Record<number, MedicationReminderLog[]>>({});
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MedicationSchedule | null>(null);
  const [filterElderly, setFilterElderly] = useState<number | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [ackModalOpen, setAckModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<MedicationReminderLog | null>(null);
  const [ackForm] = Form.useForm();
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await schedules.getAll();
      setData(res.data);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDeps = useCallback(async () => {
    try {
      const [medRes, elderRes, staffRes] = await Promise.all([
        medicationDict.getAll(),
        elderly.getAll(),
        staffApi.getAll(),
      ]);
      setMedDictList(medRes.data.filter((m: MedicationDictionary) => m.isActive));
      setElderlyList(elderRes.data);
      setStaffList(staffRes.data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchData();
    fetchDeps();
  }, [fetchData, fetchDeps]);

  const handleAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ status: 'Active' });
    setModalOpen(true);
  };

  const handleEdit = (record: MedicationSchedule) => {
    setEditing(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleMedDictChange = (dictId: number) => {
    const med = medDictList.find((m) => m.id === dictId);
    if (med) {
      form.setFieldsValue({
        dosage: med.defaultDosage,
        frequency: med.frequency,
      });
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (values.startTime) values.startTime = dayjs(values.startTime).format('YYYY-MM-DD');
      if (values.endTime) values.endTime = dayjs(values.endTime).format('YYYY-MM-DD');
      if (editing) {
        await schedules.update(editing.id, values);
        message.success('更新成功');
      } else {
        await schedules.create(values);
        message.success('创建成功');
      }
      setModalOpen(false);
      fetchData();
    } catch {}
  };

  const handleExpand = async (expanded: boolean, record: MedicationSchedule) => {
    if (expanded && !reminderLogs[record.id]) {
      try {
        const res = await schedules.getReminderLogs(record.id);
        setReminderLogs((prev) => ({ ...prev, [record.id]: res.data }));
      } catch {}
    }
  };

  const handleAcknowledge = (log: MedicationReminderLog) => {
    setSelectedLog(log);
    ackForm.resetFields();
    setAckModalOpen(true);
  };

  const handleAckSubmit = async () => {
    if (!selectedLog) return;
    try {
      const values = await ackForm.validateFields();
      await schedules.acknowledge(selectedLog.id, values);
      message.success('确认成功');
      setAckModalOpen(false);
      setReminderLogs((prev) => {
        const newLogs = { ...prev };
        delete newLogs[selectedLog.scheduleId];
        return newLogs;
      });
      fetchData();
    } catch {}
  };

  const filteredData = data.filter((item) => {
    if (filterElderly && item.elderlyId !== filterElderly) return false;
    if (filterStatus && item.status !== filterStatus) return false;
    return true;
  });

  const columns = [
    {
      title: '老人',
      dataIndex: 'elderlyId',
      key: 'elderlyId',
      render: (_: number, record: MedicationSchedule) => record.elderlyName || '-',
    },
    {
      title: '药品',
      dataIndex: 'medicationDictId',
      key: 'medicationDictId',
      render: (_: number, record: MedicationSchedule) => record.medicineName || '-',
    },
    { title: '剂量', dataIndex: 'dosage', key: 'dosage' },
    { title: '频次', dataIndex: 'frequency', key: 'frequency' },
    { title: '用药时间', dataIndex: 'timeOfDay', key: 'timeOfDay' },
    { title: '开始日期', dataIndex: 'startTime', key: 'startTime', render: (val: string) => val ? dayjs(val).format('YYYY-MM-DD') : '-' },
    { title: '结束日期', dataIndex: 'endTime', key: 'endTime', render: (val: string) => val ? dayjs(val).format('YYYY-MM-DD') : '-' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => <Tag color={statusColors[val] || 'default'}>{MedicationStatusLabel[val] || val}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: MedicationSchedule) => (
        <Button type="link" size="small" onClick={() => handleEdit(record)}>编辑</Button>
      ),
    },
  ];

  const reminderColumns = [
    { title: '提醒时间', dataIndex: 'reminderTime', key: 'reminderTime', render: (val: string) => val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => <Tag color={reminderStatusColors[val] || 'default'}>{ReminderStatusLabel[val] || val}</Tag>,
    },
    { title: '确认时间', dataIndex: 'acknowledgedAt', key: 'acknowledgedAt', render: (val: string) => val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-' },
    { title: '确认人', dataIndex: 'acknowledgedByName', key: 'acknowledgedByName', render: (val: string) => val || '-' },
    { title: '备注', dataIndex: 'notes', key: 'notes', render: (val: string) => val || '-' },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: MedicationReminderLog) =>
        record.status === 'Pending' || record.status === 'Sent' ? (
          <Button type="link" size="small" onClick={() => handleAcknowledge(record)}>确认</Button>
        ) : null,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col>
            <Select
              placeholder="选择老人"
              value={filterElderly}
              onChange={setFilterElderly}
              allowClear
              showSearch
              optionFilterProp="children"
              style={{ width: 180 }}
            >
              {elderlyList.map((e) => (
                <Select.Option key={e.id} value={e.id}>{e.name}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Select
              placeholder="选择状态"
              value={filterStatus}
              onChange={setFilterStatus}
              allowClear
              style={{ width: 140 }}
            >
              {Object.entries(MedicationStatusLabel).map(([k, v]) => (
                <Select.Option key={k} value={k}>{v}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col flex="auto" />
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增排程
            </Button>
          </Col>
        </Row>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        expandable={{
          onExpand: handleExpand,
          expandedRowRender: (record) => (
            <Table
              rowKey="id"
              columns={reminderColumns}
              dataSource={reminderLogs[record.id] || []}
              pagination={false}
              size="small"
            />
          ),
        }}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
      />

      <Modal
        title={editing ? '编辑用药排程' : '新增用药排程'}
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
              <Form.Item name="medicationDictId" label="药品" rules={[{ required: true, message: '请选择药品' }]}>
                <Select showSearch optionFilterProp="children" onChange={handleMedDictChange}>
                  {medDictList.map((m) => (
                    <Select.Option key={m.id} value={m.id}>{m.medicineName}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="dosage" label="剂量" rules={[{ required: true, message: '请输入剂量' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="frequency" label="频次" rules={[{ required: true, message: '请输入频次' }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="timeOfDay" label="用药时间" rules={[{ required: true, message: '请输入用药时间' }]}>
            <Input placeholder="例如: 08:00, 14:00, 20:00" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startTime" label="开始日期" rules={[{ required: true, message: '请选择开始日期' }]}>
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endTime" label="结束日期">
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="instructions" label="用药说明">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="createdByStaffId" label="创建人" rules={[{ required: true, message: '请选择创建人' }]}>
                <Select>
                  {staffList.map((s) => (
                    <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" rules={[{ required: true }]}>
                <Select>
                  {Object.entries(MedicationStatusLabel).map(([k, v]) => (
                    <Select.Option key={k} value={k}>{v}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="确认用药提醒"
        open={ackModalOpen}
        onOk={handleAckSubmit}
        onCancel={() => setAckModalOpen(false)}
        destroyOnClose
      >
        <Form form={ackForm} layout="vertical">
          <Form.Item name="acknowledgedByStaffId" label="确认人" rules={[{ required: true, message: '请选择确认人' }]}>
            <Select>
              {staffList.map((s) => (
                <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MedicationSchedules;
