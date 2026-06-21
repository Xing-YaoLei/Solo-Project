import { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, InputNumber, DatePicker, Switch, Tag, Space, message, Tabs } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { calendarService } from '../services/calendarService';
import type { CalendarSlot, CapacityRule } from '../types';
import { formatDate } from '../utils/helpers';

export default function CapacityPage() {
  const [slots, setSlots] = useState<CalendarSlot[]>([]);
  const [rules, setRules] = useState<CapacityRule[]>([]);
  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [slotForm] = Form.useForm();
  const [ruleForm] = Form.useForm();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const today = dayjs().format('YYYY-MM-DD');
    const monthEnd = dayjs().add(1, 'month').format('YYYY-MM-DD');
    const [s, r] = await Promise.all([
      calendarService.getSlots(today, monthEnd),
      calendarService.getActiveCapacityRules(),
    ]);
    setSlots(s); setRules(r);
  };

  const handleCreateSlot = async (values: any) => {
    try {
      await calendarService.createSlot({ ...values, date: values.date.format('YYYY-MM-DD') });
      message.success('时段已创建');
      setSlotModalOpen(false);
      slotForm.resetFields();
      loadData();
    } catch { message.error('创建失败'); }
  };

  const handleCreateRule = async (values: any) => {
    try {
      await calendarService.createCapacityRule({
        ...values,
        effectiveFrom: values.effectiveFrom.format('YYYY-MM-DD'),
        effectiveTo: values.effectiveTo?.format('YYYY-MM-DD'),
      });
      message.success('规则已创建');
      setRuleModalOpen(false);
      ruleForm.resetFields();
      loadData();
    } catch { message.error('创建失败'); }
  };

  const slotColumns = [
    { title: '日期', dataIndex: 'date', render: (d: string) => formatDate(d) },
    { title: '开始时间', dataIndex: 'startTime', render: (t: string) => t?.substring(0, 5) },
    { title: '结束时间', dataIndex: 'endTime', render: (t: string) => t?.substring(0, 5) },
    { title: '法庭', dataIndex: 'courtRoom' },
    { title: '最大容量', dataIndex: 'maxCapacity' },
    { title: '当前占用', dataIndex: 'currentCount', render: (c: number, r: CalendarSlot) => <span style={{ color: c >= r.maxCapacity ? 'red' : 'inherit' }}>{c}</span> },
  ];

  const ruleColumns = [
    { title: '法庭', dataIndex: 'courtRoom' },
    { title: '每时段最大排程', dataIndex: 'maxHearingsPerSlot' },
    { title: '每排程最大参与人', dataIndex: 'maxParticipantsPerHearing' },
    { title: '状态', dataIndex: 'isActive', render: (a: boolean) => a ? <Tag color="green">生效中</Tag> : <Tag>已停用</Tag> },
    { title: '生效日期', dataIndex: 'effectiveFrom', render: (d: string) => formatDate(d) },
    { title: '失效日期', dataIndex: 'effectiveTo', render: (d: string) => d ? formatDate(d) : '永久' },
  ];

  return (
    <div>
      <Tabs defaultActiveKey="slots" items={[
        {
          key: 'slots',
          label: '日历时段',
          children: (
            <Card title="日历时段管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setSlotModalOpen(true)}>创建时段</Button>}>
              <Table rowKey="id" dataSource={slots} columns={slotColumns} />
            </Card>
          ),
        },
        {
          key: 'rules',
          label: '容量规则',
          children: (
            <Card title="容量规则管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setRuleModalOpen(true)}>创建规则</Button>}>
              <Table rowKey="id" dataSource={rules} columns={ruleColumns} />
            </Card>
          ),
        },
      ]} />

      <Modal title="创建日历时段" open={slotModalOpen} onCancel={() => setSlotModalOpen(false)} onOk={() => slotForm.submit()}>
        <Form form={slotForm} onFinish={handleCreateSlot} labelCol={{ span: 6 }}>
          <Form.Item name="date" label="日期" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="startTime" label="开始时间" rules={[{ required: true }]}><Input placeholder="HH:mm" /></Form.Item>
          <Form.Item name="endTime" label="结束时间" rules={[{ required: true }]}><Input placeholder="HH:mm" /></Form.Item>
          <Form.Item name="courtRoom" label="法庭" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="maxCapacity" label="最大容量" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>

      <Modal title="创建容量规则" open={ruleModalOpen} onCancel={() => setRuleModalOpen(false)} onOk={() => ruleForm.submit()}>
        <Form form={ruleForm} onFinish={handleCreateRule} labelCol={{ span: 6 }}>
          <Form.Item name="courtRoom" label="法庭" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="maxHearingsPerSlot" label="每时段最大排程" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="maxParticipantsPerHearing" label="每排程最大参与人" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="effectiveFrom" label="生效日期" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="effectiveTo" label="失效日期"><DatePicker style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
