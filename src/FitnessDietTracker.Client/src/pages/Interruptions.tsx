import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Timeline,
  Space,
  Descriptions,
  message,
  Row,
  Col,
  Statistic,
  Badge,
  Empty
} from 'antd';
import {
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
  EyeOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { interruptionApi, authApi } from '../services/api';
import { useAuthStore } from '../hooks/useAuthStore';
import type { User, CheckInInterruption } from '../types';
import { InterruptionStatus } from '../types';

const statusMap: Record<InterruptionStatus, { label: string; color: string; icon: any }> = {
  [InterruptionStatus.Pending]: { label: '待处理', color: 'red', icon: <WarningOutlined /> },
  [InterruptionStatus.Processing]: { label: '处理中', color: 'orange', icon: <SyncOutlined spin /> },
  [InterruptionStatus.Resolved]: { label: '已恢复', color: 'green', icon: <CheckCircleOutlined /> },
  [InterruptionStatus.Closed]: { label: '已关闭', color: 'default', icon: <ClockCircleOutlined /> }
};

const Interruptions = () => {
  const { user, isCoach, isAdmin } = useAuthStore();
  const [list, setList] = useState<CheckInInterruption[]>([]);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<CheckInInterruption | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [handleVisible, setHandleVisible] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [clients, setClients] = useState<User[]>([]);

  useEffect(() => {
    if (user && isCoach()) {
      authApi.getClients(user.id).then(setClients);
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await interruptionApi.list(
        isCoach() ? user.id : undefined,
        !isCoach() && !isAdmin() ? user.id : undefined
      );
      setList(data);
    } catch {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (id: number) => {
    try {
      const data = await interruptionApi.get(id);
      setDetail(data);
      setDetailVisible(true);
    } catch {
      message.error('加载详情失败');
    }
  };

  const openHandle = (id: number) => {
    setCurrentId(id);
    form.resetFields();
    setHandleVisible(true);
  };

  const handleSubmit = async (values: any) => {
    if (!currentId || !user) return;
    try {
      await interruptionApi.handle(currentId, {
        operatorId: user.id,
        reason: values.reason,
        actionTaken: values.actionTaken,
        newStatus: values.newStatus,
        remarks: values.remarks
      });
      message.success('处理已记录');
      setHandleVisible(false);
      loadData();
    } catch {
      message.error('处理失败');
    }
  };

  const stats = {
    pending: list.filter((i) => i.status === InterruptionStatus.Pending).length,
    processing: list.filter((i) => i.status === InterruptionStatus.Processing).length,
    resolved: list.filter((i) => i.status === InterruptionStatus.Resolved).length,
    closed: list.filter((i) => i.status === InterruptionStatus.Closed).length
  };

  const columns = [
    {
      title: '学员',
      dataIndex: 'userName',
      key: 'userName',
      render: (v, r) => (
        <Space>
          <span>{v}</span>
          {r.coachName && <Tag color="blue">教练: {r.coachName}</Tag>}
        </Space>
      )
    },
    {
      title: '中断开始',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (v) => dayjs(v).format('YYYY-MM-DD')
    },
    {
      title: '中断天数',
      dataIndex: 'missedDays',
      key: 'missedDays',
      render: (v) => <Badge count={`${v}天`} style={{ backgroundColor: '#ff4d4f' }} />
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: InterruptionStatus) => (
        <Tag color={statusMap[s].color} icon={statusMap[s].icon}>
          {statusMap[s].label}
        </Tag>
      )
    },
    { title: '原因', dataIndex: 'reason', key: 'reason', render: (v) => v || '-' },
    { title: '处理动作', dataIndex: 'actionTaken', key: 'actionTaken', render: (v) => v || '-' },
    {
      title: '操作',
      key: 'actions',
      render: (_v, r: CheckInInterruption) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => openDetail(r.id)}>
            详情
          </Button>
          {(r.status === InterruptionStatus.Pending || r.status === InterruptionStatus.Processing) &&
            (isCoach() || isAdmin()) && (
              <Button size="small" type="primary" onClick={() => openHandle(r.id)}>
                处理
              </Button>
            )}
        </Space>
      )
    }
  ];

  const tableData = list.map((i) => ({ key: i.id, ...i }));

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="待处理"
              value={stats.pending}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="处理中"
              value={stats.processing}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<SyncOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="已恢复"
              value={stats.resolved}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="已关闭"
              value={stats.closed}
              valueStyle={{ color: '#8c8c8c' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="打卡中断记录"
        extra={
          <Button type="primary" size="small" icon={<SyncOutlined />} onClick={loadData}>
            刷新
          </Button>
        }
      >
        {list.length === 0 ? (
          <Empty description="暂无中断记录，学员打卡状态良好！" />
        ) : (
          <Table columns={columns} dataSource={tableData} loading={loading} />
        )}
      </Card>

      <Modal
        title="中断详情与处理日志"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[<Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>]}
        width={700}
      >
        {detail && (
          <div>
            <Descriptions bordered column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="学员">{detail.userName}</Descriptions.Item>
              <Descriptions.Item label="所属教练">{detail.coachName || '-'}</Descriptions.Item>
              <Descriptions.Item label="中断开始">{dayjs(detail.startDate).format('YYYY-MM-DD')}</Descriptions.Item>
              <Descriptions.Item label="中断结束">
                {detail.endDate ? dayjs(detail.endDate).format('YYYY-MM-DD') : '进行中'}
              </Descriptions.Item>
              <Descriptions.Item label="累计中断天数">{detail.missedDays} 天</Descriptions.Item>
              <Descriptions.Item label="当前状态">
                <Tag color={statusMap[detail.status].color} icon={statusMap[detail.status].icon}>
                  {statusMap[detail.status].label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="记录原因">{detail.reason || '-'}</Descriptions.Item>
              <Descriptions.Item label="处理动作">{detail.actionTaken || '-'}</Descriptions.Item>
            </Descriptions>

            <h4 style={{ marginBottom: 12 }}>
              <ExclamationCircleOutlined style={{ color: '#1677ff' }} /> 处理日志（原因、动作、关闭时间全记录）
            </h4>
            {detail.logs.length === 0 ? (
              <Empty description="暂无处理日志" />
            ) : (
              <Timeline
                className="interruption-timeline"
                items={detail.logs.map((log) => ({
                  color: log.closedAt ? 'green' : 'blue',
                  children: (
                    <div style={{ padding: 8, background: '#fafafa', borderRadius: 4 }}>
                      <div style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>
                        {dayjs(log.createdAt).format('YYYY-MM-DD HH:mm')} · {log.operatorName || '系统'}
                      </div>
                      <div>
                        <strong>{log.actionType}</strong>
                      </div>
                      {log.reason && (
                        <div>
                          <span style={{ color: '#888' }}>原因：</span>
                          {log.reason}
                        </div>
                      )}
                      {log.actionTaken && (
                        <div>
                          <span style={{ color: '#888' }}>处理动作：</span>
                          {log.actionTaken}
                        </div>
                      )}
                      {log.closedAt && (
                        <div>
                          <span style={{ color: '#52c41a' }}>关闭时间：</span>
                          {dayjs(log.closedAt).format('YYYY-MM-DD HH:mm')}
                        </div>
                      )}
                      {log.remarks && (
                        <div style={{ color: '#999', marginTop: 4 }}>备注：{log.remarks}</div>
                      )}
                    </div>
                  )
                }))}
              />
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="处理打卡中断"
        open={handleVisible}
        onCancel={() => setHandleVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="newStatus" label="更新状态" initialValue={InterruptionStatus.Processing}>
            <Select
              options={[
                { label: '处理中', value: InterruptionStatus.Processing },
                { label: '已恢复', value: InterruptionStatus.Resolved },
                { label: '已关闭', value: InterruptionStatus.Closed }
              ]}
            />
          </Form.Item>
          <Form.Item
            name="reason"
            label="中断原因"
            rules={[{ required: true, message: '请记录中断原因' }]}
          >
            <Input.TextArea rows={3} placeholder="例如：学员出差未携带设备 / 身体不适暂停训练等" />
          </Form.Item>
          <Form.Item
            name="actionTaken"
            label="处理动作"
            rules={[{ required: true, message: '请记录处理动作' }]}
          >
            <Input.TextArea rows={3} placeholder="例如：电话沟通了解情况 / 发送提醒消息 / 调整计划等" />
          </Form.Item>
          <Form.Item name="remarks" label="备注（选填）">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              提交处理（原因、动作、关闭时间将记入日志）
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Interruptions;
