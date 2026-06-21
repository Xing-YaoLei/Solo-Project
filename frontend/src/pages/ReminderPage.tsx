import { useState, useEffect } from 'react';
import { Card, Table, Tag, Tabs, Button, Modal, Form, Select, Input, Space, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { reminderService } from '../services/reminderService';
import type { Reminder } from '../types';
import { ReminderType, ReminderStatus } from '../types';
import { formatDateTime } from '../utils/helpers';

const ReminderTypeLabel: Record<ReminderType, string> = {
  [ReminderType.OneDayBefore]: '提前一天', [ReminderType.ThreeHoursBefore]: '提前三小时',
  [ReminderType.OneHourBefore]: '提前一小时', [ReminderType.Custom]: '自定义',
};

export default function ReminderPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm();

  useEffect(() => { loadReminders(); }, []);

  const loadReminders = async () => {
    try { const data = await reminderService.getPending(); setReminders(data); } catch {}
  };

  const handleCreate = async (values: any) => {
    try {
      await reminderService.create(values);
      message.success('提醒已创建');
      setCreateModalOpen(false);
      createForm.resetFields();
      loadReminders();
    } catch { message.error('创建失败'); }
  };

  const pendingReminders = reminders.filter(r => r.status === ReminderStatus.Pending);
  const sentReminders = reminders.filter(r => r.status !== ReminderStatus.Pending);

  const columns = [
    { title: '关联排程', dataIndex: 'hearingId', render: (id: string) => <a onClick={() => {}}>{id.substring(0, 8)}...</a> },
    { title: '提醒类型', dataIndex: 'reminderType', render: (t: ReminderType) => <Tag>{ReminderTypeLabel[t]}</Tag> },
    { title: '提醒时间', dataIndex: 'remindAt', render: (d: string) => formatDateTime(d) },
    { title: '提醒内容', dataIndex: 'message', ellipsis: true },
    { title: '状态', dataIndex: 'status', render: (s: ReminderStatus) => {
      const map: Record<number, { color: string; text: string }> = { 0: { color: 'orange', text: '待发送' }, 1: { color: 'green', text: '已发送' }, 2: { color: 'red', text: '发送失败' }, 3: { color: 'blue', text: '已确认' } };
      const item = map[s] || { color: 'default', text: '未知' };
      return <Tag color={item.color}>{item.text}</Tag>;
    }},
  ];

  return (
    <Card title="提醒管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>创建提醒</Button>}>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
        { key: 'pending', label: `待发送 (${pendingReminders.length})` },
        { key: 'sent', label: `已发送 (${sentReminders.length})` },
      ]} />
      <Table rowKey="id" dataSource={activeTab === 'pending' ? pendingReminders : sentReminders} columns={columns} />
      <Modal title="创建提醒" open={createModalOpen} onCancel={() => setCreateModalOpen(false)} onOk={() => createForm.submit()}>
        <Form form={createForm} onFinish={handleCreate}>
          <Form.Item name="hearingId" label="排程ID" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="reminderType" label="提醒类型" rules={[{ required: true }]}>
            <Select options={Object.entries(ReminderTypeLabel).map(([k, v]) => ({ value: Number(k), label: v }))} />
          </Form.Item>
          <Form.Item name="remindAt" label="提醒时间" rules={[{ required: true }]}><Input type="datetime-local" /></Form.Item>
          <Form.Item name="message" label="提醒内容"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
