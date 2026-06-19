'use client';

import { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Input, Select, Modal, Form, InputNumber, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ExportOutlined } from '@ant-design/icons';
import { sponsorApi, performanceApi, exportApi } from '@/services/api';

const { Option } = Select;

export default function SponsorsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [scheduleId, setScheduleId] = useState<string>('');
  const [level, setLevel] = useState<string>('');
  const [searchText, setSearchText] = useState('');
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
      if (level) params.level = level;
      if (searchText) params.search = searchText;
      const res: any = await sponsorApi.getList(params);
      setData(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      message.error('获取赞助列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  useEffect(() => {
    fetchData();
  }, [page, pageSize, scheduleId, level, searchText]);

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
      content: `确定要删除赞助商"${record.name}"吗？`,
      onOk: async () => {
        try {
          await sponsorApi.delete(record.id, 1);
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
        await sponsorApi.update(currentRecord.id, submitData);
        message.success('更新成功');
      } else {
        await sponsorApi.create(submitData);
        message.success('创建成功');
      }
      setModalOpen(false);
      fetchData();
    } catch (e) {
      message.error('操作失败');
    }
  };

  const handleExport = async () => {
    try {
      const res: any = await exportApi.exportSponsors({
        scheduleId: scheduleId ? parseInt(scheduleId) : undefined,
        level: level || undefined,
        operatorId: 1,
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', '赞助清单.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success('导出成功');
    } catch (e) {
      message.error('导出失败');
    }
  };

  const columns = [
    { title: '赞助商名称', dataIndex: 'name', key: 'name' },
    { title: '赞助级别', dataIndex: 'level', key: 'level', render: (l: string) => {
      const colorMap: any = { '钻石赞助商': 'gold', '黄金赞助商': 'orange', '白银赞助商': 'blue' };
      return <span style={{ color: colorMap[l] }}>{l}</span>;
    }},
    { title: '赞助金额', dataIndex: 'amount', key: 'amount', render: (a: number) => `¥${Number(a).toLocaleString()}` },
    { title: '联系人', dataIndex: 'contactName', key: 'contactName' },
    { title: '联系电话', dataIndex: 'contactPhone', key: 'contactPhone' },
    { title: '状态', dataIndex: 'status', key: 'status' },
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
        title="赞助管理"
        extra={
          <Space>
            <Select
              placeholder="选择演出"
              style={{ width: 200 }}
              allowClear
              value={scheduleId || undefined}
              onChange={setScheduleId}
            >
              {schedules.map(s => (
                <Option key={s.id} value={s.id}>{s.title}</Option>
              ))}
            </Select>
            <Select
              placeholder="赞助级别"
              style={{ width: 150 }}
              allowClear
              value={level || undefined}
              onChange={setLevel}
            >
              <Option value="钻石赞助商">钻石赞助商</Option>
              <Option value="黄金赞助商">黄金赞助商</Option>
              <Option value="白银赞助商">白银赞助商</Option>
            </Select>
            <Input
              placeholder="搜索名称"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 180 }}
              onPressEnter={fetchData}
            />
            <Button icon={<ExportOutlined />} onClick={handleExport}>导出</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增</Button>
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
        />
      </Card>

      <Modal
        title={currentRecord ? '编辑赞助商' : '新增赞助商'}
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
          <Form.Item name="name" label="赞助商名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="level" label="赞助级别" rules={[{ required: true }]} initialValue="白银赞助商">
            <Select>
              <Option value="钻石赞助商">钻石赞助商</Option>
              <Option value="黄金赞助商">黄金赞助商</Option>
              <Option value="白银赞助商">白银赞助商</Option>
            </Select>
          </Form.Item>
          <Form.Item name="amount" label="赞助金额(元)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="contactName" label="联系人" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item name="contactPhone" label="联系电话" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
          </div>
          <Form.Item name="benefits" label="赞助权益">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
