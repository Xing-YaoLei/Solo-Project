'use client';

import { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Input, DatePicker, Tag, Modal, Form, InputNumber, Select, message } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { performanceApi, taskApi } from '@/services/api';

const { RangePicker } = DatePicker;
const { Option } = Select;

export default function PerformancesPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<any>(null);
  const [detailData, setDetailData] = useState<any>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (searchText) params.search = searchText;
      if (dateRange && dateRange.length === 2) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      const res: any = await performanceApi.getList(params);
      setData(res.data.data);
      setTotal(res.data.total);
    } catch (e) {
      message.error('获取演出列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize]);

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const handleAdd = () => {
    setCurrentRecord(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record: any) => {
    setCurrentRecord(record);
    form.setFieldsValue({
      ...record,
      startTime: dayjs(record.startTime),
      endTime: dayjs(record.endTime),
    });
    setModalOpen(true);
  };

  const handleDelete = async (record: any) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除演出"${record.title}"吗？`,
      onOk: async () => {
        try {
          await performanceApi.delete(record.id, 1);
          message.success('删除成功');
          fetchData();
        } catch (e) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleViewDetail = async (record: any) => {
    try {
      const res: any = await performanceApi.findById(record.id);
      setDetailData(res.data);
      setDetailOpen(true);
    } catch (e) {
      message.error('获取详情失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const submitData = {
        ...values,
        startTime: values.startTime.toISOString(),
        endTime: values.endTime.toISOString(),
        operatorId: 1,
      };

      if (currentRecord) {
        await performanceApi.update(currentRecord.id, submitData);
        message.success('更新成功');
      } else {
        await performanceApi.create(submitData);
        message.success('创建成功');
      }
      setModalOpen(false);
      fetchData();
    } catch (e) {
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: '演出名称',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '演出时间',
      key: 'time',
      render: (_: any, record: any) => (
        <div>
          <div>{dayjs(record.startTime).format('YYYY-MM-DD HH:mm')}</div>
          <div style={{ color: '#999', fontSize: 12 }}>
            至 {dayjs(record.endTime).format('MM-DD HH:mm')}
          </div>
        </div>
      ),
    },
    {
      title: '演出地点',
      dataIndex: 'venue',
      key: 'venue',
    },
    {
      title: '容量',
      dataIndex: 'capacity',
      key: 'capacity',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: any = {
          scheduled: 'blue',
          ongoing: 'green',
          completed: 'gray',
          cancelled: 'red',
        };
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: '票种',
      key: 'ticketTypes',
      render: (_: any, record: any) => record.ticketTypes?.length || 0,
    },
    {
      title: '订单数',
      key: 'orders',
      render: (_: any, record: any) => record._count?.orders || 0,
    },
    {
      title: '任务数',
      key: 'tasks',
      render: (_: any, record: any) => record._count?.tasks || 0,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card 
        title="演出排期管理"
        extra={
          <Space>
            <Input
              placeholder="搜索演出名称"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
              onPressEnter={handleSearch}
            />
            <RangePicker value={dateRange} onChange={setDateRange} />
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>搜索</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增演出</Button>
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
        title={currentRecord ? '编辑演出' : '新增演出'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="演出名称" rules={[{ required: true, message: '请输入演出名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="演出描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="startTime" label="开始时间" rules={[{ required: true }]} style={{ flex: 1 }}>
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="endTime" label="结束时间" rules={[{ required: true }]} style={{ flex: 1 }}>
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="venue" label="演出地点" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item name="capacity" label="容量" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item name="status" label="状态" initialValue="scheduled">
            <Select>
              <Option value="scheduled">已排期</Option>
              <Option value="ongoing">进行中</Option>
              <Option value="completed">已完成</Option>
              <Option value="cancelled">已取消</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="演出详情"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={800}
      >
        {detailData && (
          <div>
            <h3>{detailData.title}</h3>
            <p>{detailData.description}</p>
            <p><strong>时间：</strong>{dayjs(detailData.startTime).format('YYYY-MM-DD HH:mm')} ~ {dayjs(detailData.endTime).format('HH:mm')}</p>
            <p><strong>地点：</strong>{detailData.venue}</p>
            <p><strong>容量：</strong>{detailData.capacity}人</p>
            
            <h4 style={{ marginTop: 20 }}>票种列表</h4>
            {detailData.ticketTypes?.map((t: any) => (
              <Tag key={t.id} color="blue">{t.name} - ¥{t.price}</Tag>
            ))}

            <h4 style={{ marginTop: 20 }}>赞助商</h4>
            {detailData.sponsors?.map((s: any) => (
              <Tag key={s.id} color="gold">{s.name} ({s.level})</Tag>
            ))}

            <h4 style={{ marginTop: 20 }}>任务列表</h4>
            {detailData.tasks?.map((t: any) => (
              <div key={t.id} style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                <div>{t.title}</div>
                <div style={{ color: '#999', fontSize: 12 }}>
                  负责人: {t.assignee?.name || '未分配'} | 状态: {t.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
