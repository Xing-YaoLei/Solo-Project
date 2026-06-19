'use client';

import { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Input, Select, Modal, Form, InputNumber, message, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { ticketApi, performanceApi } from '@/services/api';

const { Option } = Select;

export default function TicketsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [scheduleId, setScheduleId] = useState<string>('');
  const [schedules, setSchedules] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<any>(null);
  const [form] = Form.useForm();

  const fetchSchedules = async () => {
    try {
      const res: any = await performanceApi.getList({ page: 1, pageSize: 100 });
      setSchedules(res.data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (scheduleId) params.scheduleId = parseInt(scheduleId);
      const res: any = await ticketApi.getList(params);
      setData(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      message.error('获取票种列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  useEffect(() => {
    fetchData();
  }, [page, pageSize, scheduleId]);

  const handleAdd = () => {
    setCurrentRecord(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record: any) => {
    setCurrentRecord(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleDelete = (record: any) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除票种"${record.name}"吗？`,
      onOk: async () => {
        try {
          await ticketApi.delete(record.id, 1);
          message.success('删除成功');
          fetchData();
        } catch (e) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const submitData = { ...values, operatorId: 1 };
      
      if (currentRecord) {
        await ticketApi.update(currentRecord.id, submitData);
        message.success('更新成功');
      } else {
        await ticketApi.create(submitData);
        message.success('创建成功');
      }
      setModalOpen(false);
      fetchData();
    } catch (e) {
      message.error('操作失败');
    }
  };

  const columns = [
    { title: '票种名称', dataIndex: 'name', key: 'name' },
    { title: '价格', dataIndex: 'price', key: 'price', render: (p: number) => `¥${p}` },
    { title: '总票数', dataIndex: 'totalCount', key: 'totalCount' },
    { title: '已售', dataIndex: 'soldCount', key: 'soldCount' },
    { 
      title: '售出率', 
      key: 'rate', 
      render: (_: any, r: any) => {
        const rate = r.totalCount > 0 ? ((r.soldCount / r.totalCount) * 100).toFixed(1) : 0;
        return <Tag color={Number(rate) > 80 ? 'green' : 'blue'}>{rate}%</Tag>;
      }
    },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'active' ? 'green' : 'gray'}>{s}</Tag> },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="票种规则"
        extra={
          <Space>
            <Select
              placeholder="选择演出"
              style={{ width: 250 }}
              allowClear
              value={scheduleId || undefined}
              onChange={setScheduleId}
            >
              {schedules.map(s => (
                <Option key={s.id} value={s.id}>{s.title}</Option>
              ))}
            </Select>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增票种</Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
          expandable={{
            expandedRowRender: (record: any) => (
              <div>
                <p><strong>规则说明：</strong>{record.rules || '暂无'}</p>
              </div>
            ),
          }}
        />
      </Card>

      <Modal
        title={currentRecord ? '编辑票种' : '新增票种'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="scheduleId" label="关联演出" rules={[{ required: true }]}>
            <Select>
              {schedules.map(s => (
                <Option key={s.id} value={s.id}>{s.title}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="name" label="票种名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="price" label="价格(元)" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="totalCount" label="总票数" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </div>
          <Form.Item name="description" label="票种描述">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="rules" label="使用规则">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
