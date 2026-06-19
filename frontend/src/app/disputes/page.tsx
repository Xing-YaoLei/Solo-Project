'use client';

import { useState, useEffect } from 'react';
import { 
  Card, Table, Button, Space, Tag, Modal, Form, Input, Select, 
  message, Timeline, Descriptions, Row, Col, Statistic 
} from 'antd';
import { 
  AlertOutlined, CheckCircleOutlined, ClockCircleOutlined, 
  CloseCircleOutlined, PlusOutlined, EyeOutlined, MessageOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { disputeApi, userApi } from '@/services/api';
import { DisputeStatus, LogAction } from '@/types';

const { Option } = Select;
const { TextArea } = Input;

export default function DisputesPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [stats, setStats] = useState<any>({});
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<any>(null);
  const [detailData, setDetailData] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [logForm] = Form.useForm();
  const [createForm] = Form.useForm();
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<string>('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res: any = await disputeApi.getList({ page, pageSize });
      setData(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      message.error('获取争议列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res: any = await disputeApi.getStats({});
      setStats(res.data || {});
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsers = async () => {
    try {
      const res: any = await userApi.getList({ page: 1, pageSize: 100 });
      setUsers(res.data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
    fetchStats();
    fetchUsers();
  }, [page, pageSize]);

  const handleViewDetail = async (record: any) => {
    try {
      const res: any = await disputeApi.findById(record.id);
      setDetailData(res.data);
      setDetailOpen(true);
    } catch (e) {
      message.error('获取详情失败');
    }
  };

  const handleCreate = () => {
    createForm.resetFields();
    setCreateOpen(true);
  };

  const handleCreateSubmit = async () => {
    try {
      const values = await createForm.validateFields();
      await disputeApi.create({
        ...values,
        initiatorId: 1,
      });
      message.success('创建成功');
      setCreateOpen(false);
      fetchData();
      fetchStats();
    } catch (e) {
      message.error('创建失败');
    }
  };

  const handleAssign = (record: any) => {
    setCurrentRecord(record);
    setActionType('assign');
    setActionModalOpen(true);
  };

  const handleResolve = (record: any) => {
    setCurrentRecord(record);
    setActionType('resolve');
    logForm.resetFields();
    setActionModalOpen(true);
  };

  const handleClose = (record: any) => {
    setCurrentRecord(record);
    setActionType('close');
    logForm.resetFields();
    setActionModalOpen(true);
  };

  const handleActionSubmit = async () => {
    try {
      const values = await logForm.validateFields();
      
      if (actionType === 'assign') {
        await disputeApi.assignHandler(currentRecord.id, {
          handlerId: values.handlerId,
          operatorId: 1,
        });
        message.success('分派成功');
      } else if (actionType === 'resolve') {
        await disputeApi.resolve(currentRecord.id, {
          resolution: values.resolution,
          operatorId: 1,
          approveRefund: values.approveRefund,
        });
        message.success('处理完成');
      } else if (actionType === 'close') {
        await disputeApi.close(currentRecord.id, {
          resolution: values.resolution,
          operatorId: 1,
        });
        message.success('已关闭');
      }
      
      setActionModalOpen(false);
      fetchData();
      fetchStats();
      if (detailOpen && detailData) {
        handleViewDetail(currentRecord);
      }
    } catch (e) {
      message.error('操作失败');
    }
  };

  const handleAddLog = async () => {
    try {
      const values = await logForm.validateFields();
      await disputeApi.addLog(detailData.id, {
        action: 'UPDATE',
        description: values.description,
        operatorId: 1,
      });
      message.success('添加成功');
      logForm.resetFields();
      handleViewDetail({ id: detailData.id });
    } catch (e) {
      message.error('添加失败');
    }
  };

  const getStatusColor = (status: string) => {
    const colorMap: any = {
      OPEN: 'red',
      PROCESSING: 'orange',
      RESOLVED: 'green',
      CLOSED: 'default',
    };
    return colorMap[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const textMap: any = {
      OPEN: '待处理',
      PROCESSING: '处理中',
      RESOLVED: '已解决',
      CLOSED: '已关闭',
    };
    return textMap[status] || status;
  };

  const columns = [
    {
      title: '争议标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '订单号',
      dataIndex: ['order', 'orderNo'],
      key: 'orderNo',
    },
    {
      title: '演出',
      dataIndex: ['order', 'schedule', 'title'],
      key: 'schedule',
    },
    {
      title: '票种',
      dataIndex: ['order', 'ticketType', 'name'],
      key: 'ticketType',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: '处理人',
      dataIndex: ['handler', 'name'],
      key: 'handler',
      render: (name: string) => name || '未分配',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
          {record.status === 'OPEN' && (
            <Button type="link" size="small" onClick={() => handleAssign(record)}>分派</Button>
          )}
          {record.status === 'PROCESSING' && (
            <Button type="link" size="small" onClick={() => handleResolve(record)}>处理</Button>
          )}
          {(record.status === 'OPEN' || record.status === 'PROCESSING') && (
            <Button type="link" size="small" danger onClick={() => handleClose(record)}>关闭</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="待处理争议"
              value={stats.open || 0}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<AlertOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="处理中"
              value={stats.processing || 0}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已解决"
              value={stats.resolved || 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已关闭"
              value={stats.closed || 0}
              valueStyle={{ color: '#999' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="退票争议管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            发起争议
          </Button>
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
        title="争议详情"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={800}
      >
        {detailData && (
          <div>
            <Descriptions title="基本信息" column={2} bordered>
              <Descriptions.Item label="争议标题">{detailData.title}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getStatusColor(detailData.status)}>{getStatusText(detailData.status)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="订单号">{detailData.order?.orderNo}</Descriptions.Item>
              <Descriptions.Item label="演出名称">{detailData.order?.schedule?.title}</Descriptions.Item>
              <Descriptions.Item label="票种">{detailData.order?.ticketType?.name}</Descriptions.Item>
              <Descriptions.Item label="数量">{detailData.order?.quantity}张</Descriptions.Item>
              <Descriptions.Item label="购票人">{detailData.order?.buyerName}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{detailData.order?.buyerPhone}</Descriptions.Item>
              <Descriptions.Item label="处理人">{detailData.handler?.name || '未分配'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(detailData.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              {detailData.closeTime && (
                <Descriptions.Item label="关闭时间" span={2}>
                  {dayjs(detailData.closeTime).format('YYYY-MM-DD HH:mm')}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="争议原因" span={2}>
                {detailData.reason}
              </Descriptions.Item>
              {detailData.resolution && (
                <Descriptions.Item label="解决方案" span={2}>
                  {detailData.resolution}
                </Descriptions.Item>
              )}
            </Descriptions>

            <h3 style={{ marginTop: 24 }}>
              <MessageOutlined /> 处理日志
            </h3>
            <Timeline
              items={detailData.logs?.map((log: any) => ({
                color: log.action === 'DISPUTE_OPEN' ? 'red' : 
                       log.action === 'DISPUTE_RESOLVE' ? 'green' : 
                       log.action === 'DISPUTE_CLOSE' ? 'gray' : 'blue',
                children: (
                  <div>
                    <div style={{ fontWeight: 500 }}>{log.description}</div>
                    <div style={{ color: '#999', fontSize: 12 }}>
                      {log.operatorId ? `操作人: ${log.operatorId}` : '系统'} · {dayjs(log.createdAt).format('YYYY-MM-DD HH:mm')}
                    </div>
                  </div>
                ),
              }))}
            />

            {(detailData.status === 'OPEN' || detailData.status === 'PROCESSING') && (
              <div style={{ marginTop: 16 }}>
                <Form form={logForm} layout="vertical">
                  <Form.Item name="description" label="添加处理记录" rules={[{ required: true }]}>
                    <TextArea rows={3} placeholder="请输入处理记录..." />
                  </Form.Item>
                  <Button type="primary" onClick={handleAddLog}>添加记录</Button>
                </Form>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="发起退票争议"
        open={createOpen}
        onOk={handleCreateSubmit}
        onCancel={() => setCreateOpen(false)}
        width={500}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item name="orderId" label="关联订单" rules={[{ required: true }]}>
            <Input placeholder="请输入订单ID" />
          </Form.Item>
          <Form.Item name="title" label="争议标题" rules={[{ required: true }]}>
            <Input placeholder="请输入争议标题" />
          </Form.Item>
          <Form.Item name="reason" label="争议原因" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="请详细描述争议原因..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          actionType === 'assign' ? '分派处理人' :
          actionType === 'resolve' ? '处理争议' : '关闭争议'
        }
        open={actionModalOpen}
        onOk={handleActionSubmit}
        onCancel={() => setActionModalOpen(false)}
        width={500}
      >
        <Form form={logForm} layout="vertical">
          {actionType === 'assign' && (
            <Form.Item name="handlerId" label="选择处理人" rules={[{ required: true }]}>
              <Select placeholder="请选择处理人">
                {users.map(u => (
                  <Option key={u.id} value={u.id}>{u.name} - {u.role}</Option>
                ))}
              </Select>
            </Form.Item>
          )}
          {(actionType === 'resolve' || actionType === 'close') && (
            <>
              <Form.Item name="resolution" label="处理说明" rules={[{ required: true }]}>
                <TextArea rows={4} placeholder="请输入处理说明..." />
              </Form.Item>
              {actionType === 'resolve' && (
                <Form.Item name="approveRefund" label="是否同意退款" valuePropName="checked">
                  <Select>
                    <Option value={true}>同意退款</Option>
                    <Option value={false}>不同意退款</Option>
                  </Select>
                </Form.Item>
              )}
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
}
