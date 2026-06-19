'use client';

import { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Input, Select, Modal, Form, InputNumber, Tag, message, Descriptions, Timeline } from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined, EditOutlined, HistoryOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { orderApi, performanceApi, ticketApi } from '@/services/api';
import { OrderStatus } from '@/types';

const { Option } = Select;

export default function OrdersPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [scheduleId, setScheduleId] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [searchText, setSearchText] = useState('');
  const [schedules, setSchedules] = useState<any[]>([]);
  const [ticketTypes, setTicketTypes] = useState<any[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
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

  const fetchTicketTypes = async () => {
    if (!scheduleId) {
      setTicketTypes([]);
      return;
    }
    try {
      const res: any = await ticketApi.getList({ scheduleId: parseInt(scheduleId), page: 1, pageSize: 100 });
      setTicketTypes(res.data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (scheduleId) params.scheduleId = parseInt(scheduleId);
      if (status) params.status = status;
      if (searchText) {
        if (/^1\d{10}$/.test(searchText)) {
          params.buyerPhone = searchText;
        } else {
          params.buyerName = searchText;
        }
      }
      const res: any = await orderApi.getList(params);
      setData(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      message.error('获取订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  useEffect(() => {
    fetchTicketTypes();
  }, [scheduleId]);

  useEffect(() => {
    fetchData();
  }, [page, pageSize, scheduleId, status, searchText]);

  const handleViewDetail = async (record: any) => {
    try {
      const res: any = await orderApi.getDetail(record.id);
      setDetailData(res.data);
      setDetailOpen(true);
    } catch (e) {
      message.error('获取详情失败');
    }
  };

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

  const handleStatusChange = async (record: any, newStatus: string, remark?: string) => {
    try {
      await orderApi.updateStatus(record.id, { status: newStatus, operatorId: 1, remark });
      message.success('状态更新成功');
      fetchData();
      if (detailOpen) {
        handleViewDetail(record);
      }
    } catch (e) {
      message.error('状态更新失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const ticket = ticketTypes.find(t => t.id === values.ticketTypeId);
      const totalAmount = ticket ? Number(ticket.price) * values.quantity : 0;
      
      const submitData = {
        ...values,
        totalAmount,
        creatorId: 1,
      };
      
      if (currentRecord) {
        await orderApi.update(currentRecord.id, { ...submitData, operatorId: 1 });
        message.success('更新成功');
      } else {
        await orderApi.create(submitData);
        message.success('创建成功');
      }
      setModalOpen(false);
      fetchData();
    } catch (e) {
      message.error('操作失败');
    }
  };

  const getStatusColor = (status: string) => {
    const colorMap: any = {
      PENDING: 'default',
      PAID: 'blue',
      VERIFIED: 'green',
      REFUND_REQUESTED: 'orange',
      REFUND_APPROVED: 'cyan',
      REFUND_REJECTED: 'red',
      REFUNDED: 'purple',
      CANCELLED: 'gray',
    };
    return colorMap[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const textMap: any = {
      PENDING: '待支付',
      PAID: '已支付',
      VERIFIED: '已核销',
      REFUND_REQUESTED: '退票申请',
      REFUND_APPROVED: '退票通过',
      REFUND_REJECTED: '退票驳回',
      REFUNDED: '已退款',
      CANCELLED: '已取消',
    };
    return textMap[status] || status;
  };

  const getFieldText = (field: string) => {
    const textMap: any = {
      buyerName: '购票人',
      buyerPhone: '联系电话',
      quantity: '数量',
      totalAmount: '总金额',
      status: '状态',
      remark: '备注',
      ticketTypeId: '票种',
    };
    return textMap[field] || field;
  };

  const columns = [
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo' },
    { title: '演出', dataIndex: ['schedule', 'title'], key: 'schedule' },
    { title: '票种', dataIndex: ['ticketType', 'name'], key: 'ticketType' },
    { title: '购票人', dataIndex: 'buyerName', key: 'buyerName' },
    { title: '联系电话', dataIndex: 'buyerPhone', key: 'buyerPhone' },
    { title: '数量', dataIndex: 'quantity', key: 'quantity' },
    { title: '金额', dataIndex: 'totalAmount', key: 'totalAmount', render: (a: number) => `¥${a}` },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <Tag color={getStatusColor(s)}>{getStatusText(s)}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
          {record.status === 'PENDING' && (
            <Button type="link" size="small" onClick={() => handleStatusChange(record, 'PAID', '确认收款')}>确认支付</Button>
          )}
          {record.status === 'PAID' && (
            <Button type="link" size="small" onClick={() => handleStatusChange(record, 'REFUND_REQUESTED', '申请退票')}>申请退票</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="订单管理"
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
              placeholder="订单状态"
              style={{ width: 150 }}
              allowClear
              value={status || undefined}
              onChange={setStatus}
            >
              <Option value="PENDING">待支付</Option>
              <Option value="PAID">已支付</Option>
              <Option value="VERIFIED">已核销</Option>
              <Option value="REFUND_REQUESTED">退票申请</Option>
              <Option value="REFUNDED">已退款</Option>
              <Option value="CANCELLED">已取消</Option>
            </Select>
            <Input
              placeholder="搜索购票人/电话"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
              onPressEnter={fetchData}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新建订单</Button>
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
        title="订单详情"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={700}
      >
        {detailData && (
          <div>
            <Descriptions title="订单信息" column={2} bordered size="small">
              <Descriptions.Item label="订单号">{detailData.orderNo}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getStatusColor(detailData.status)}>{getStatusText(detailData.status)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="演出名称">{detailData.schedule?.title}</Descriptions.Item>
              <Descriptions.Item label="演出时间">
                {dayjs(detailData.schedule?.startTime).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="票种">{detailData.ticketType?.name}</Descriptions.Item>
              <Descriptions.Item label="单价">¥{detailData.ticketType?.price}</Descriptions.Item>
              <Descriptions.Item label="购票人">{detailData.buyerName}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{detailData.buyerPhone}</Descriptions.Item>
              <Descriptions.Item label="购买数量">{detailData.quantity}张</Descriptions.Item>
              <Descriptions.Item label="总金额">¥{detailData.totalAmount}</Descriptions.Item>
              <Descriptions.Item label="创建时间" span={2}>
                {dayjs(detailData.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              {detailData.remark && (
                <Descriptions.Item label="备注" span={2}>{detailData.remark}</Descriptions.Item>
              )}
            </Descriptions>

            <h4 style={{ marginTop: 20 }}>
              <HistoryOutlined /> 变更记录
            </h4>
            <Timeline
              style={{ marginTop: 16 }}
              items={detailData.changeLogs?.map((log: any) => ({
                color: 'blue',
                children: (
                  <div>
                    <div>
                      <strong>{getFieldText(log.fieldName)}</strong>
                    </div>
                    <div style={{ color: '#666' }}>
                      {log.oldValue !== null && (
                        <span style={{ textDecoration: 'line-through', color: '#999' }}>
                          {log.oldValue}
                        </span>
                      )}
                      {log.oldValue !== null && log.newValue !== null && ' → '}
                      {log.newValue !== null && (
                        <span style={{ color: '#52c41a' }}>{log.newValue}</span>
                      )}
                    </div>
                    {log.remark && (
                      <div style={{ color: '#999', fontSize: 12 }}>备注: {log.remark}</div>
                    )}
                    <div style={{ color: '#999', fontSize: 12 }}>
                      {dayjs(log.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                    </div>
                  </div>
                ),
              }))}
            />
            {(!detailData.changeLogs || detailData.changeLogs.length === 0) && (
              <div style={{ color: '#999', textAlign: 'center', padding: 20 }}>
                暂无变更记录
              </div>
            )}

            {detailData.verifications?.length > 0 && (
              <>
                <h4 style={{ marginTop: 20 }}>核销记录</h4>
                {detailData.verifications.map((v: any) => (
                  <div key={v.id} style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                    <div>
                      {dayjs(v.verifyTime).format('YYYY-MM-DD HH:mm')} - {v.quantity}张
                    </div>
                    <div style={{ color: '#999', fontSize: 12 }}>
                      核销员: {v.verifier?.name} | 方式: {v.verifyMethod}
                    </div>
                  </div>
                ))}
              </>
            )}

            {detailData.disputes?.length > 0 && (
              <>
                <h4 style={{ marginTop: 20 }}>退票争议</h4>
                {detailData.disputes.map((d: any) => (
                  <div key={d.id} style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                    <div>
                      <Tag color={getStatusColor(d.status)}>{getStatusText(d.status)}</Tag>
                      {d.title}
                    </div>
                    <div style={{ color: '#999', fontSize: 12 }}>
                      处理人: {d.handler?.name || '未分配'}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title={currentRecord ? '编辑订单' : '新建订单'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="scheduleId" label="选择演出" rules={[{ required: true }]}>
            <Select onChange={(val) => { form.setFieldValue('ticketTypeId', null); }}>
              {schedules.map(s => (
                <Option key={s.id} value={s.id}>{s.title}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="ticketTypeId" label="选择票种" rules={[{ required: true }]}>
            <Select disabled={!scheduleId && !currentRecord}>
              {ticketTypes.map(t => (
                <Option key={t.id} value={t.id}>{t.name} - ¥{t.price}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="buyerName" label="购票人姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="buyerPhone" label="联系电话" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="quantity" label="购买数量" rules={[{ required: true }]} initialValue={1}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
