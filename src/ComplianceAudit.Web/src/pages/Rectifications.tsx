import { useEffect, useState } from 'react';
import {
  Table, Tag, Button, Form, Input, Select, DatePicker, Modal,
  Card, Row, Col, Space, message, Popconfirm, Drawer,
  Descriptions, Typography, Empty, Badge
} from 'antd';
import {
  SearchOutlined, ReloadOutlined, PlusOutlined,
  FileSearchOutlined, PaperClipOutlined, SafetyOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { rectificationsApi, evidencesApi } from '@/services/api';
import { useRolePermissions } from '@/store/authStore';
import type { RectificationListDto, RectificationStatus, RiskLevel } from '@/types';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const RiskTag = ({ level }: { level: number }) => {
  const map: Record<number, { color: string; text: string; cls: string }> = {
    1: { color: 'green', text: '低', cls: 'tag-low' },
    2: { color: 'orange', text: '中', cls: 'tag-medium' },
    3: { color: 'red', text: '高', cls: 'tag-high' },
    4: { color: '#000', text: '严重', cls: 'tag-critical' }
  };
  const cfg = map[level] ?? map[1];
  return <Tag className={cfg.cls} color={cfg.color}>{cfg.text}风险</Tag>;
};

const StatusTag = ({ status }: { status: number }) => {
  const map: Record<number, { color: string; text: string }> = {
    1: { color: 'default', text: '未开始' },
    2: { color: 'processing', text: '整改中' },
    3: { color: 'warning', text: '待复核' },
    4: { color: 'success', text: '已验证' },
    5: { color: 'default', text: '已关闭' },
    6: { color: 'error', text: '已逾期' }
  };
  const cfg = map[status] ?? map[1];
  return <Tag color={cfg.color}>{cfg.text}</Tag>;
};

export default function Rectifications() {
  const { isBusinessOwner, isComplianceOfficer, isManagement } = useRolePermissions();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RectificationListDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [queryForm] = Form.useForm();
  const [createModal, setCreateModal] = useState(false);
  const [detailDrawer, setDetailDrawer] = useState<{ open: boolean; id?: number; data?: any }>({ open: false });
  const [evidences, setEvidences] = useState<any[]>([]);
  const [createForm] = Form.useForm();

  useEffect(() => { loadData(); }, [page, pageSize]);

  const loadData = async () => {
    setLoading(true);
    try {
      const v = queryForm.getFieldsValue();
      const res = await rectificationsApi.list({
        pageNumber: page, pageSize,
        scheduleId: v.scheduleId, ownerId: v.ownerId,
        status: v.status, riskLevel: v.riskLevel,
        myAssigned: v.myAssigned ?? false
      });
      if (res.success && res.data) {
        setData(res.data.items);
        setTotal(res.data.totalCount);
      }
    } finally { setLoading(false); }
  };

  const handleSubmit = async (id: number) => {
    try {
      const res = await rectificationsApi.submit(id);
      if (res.success) { message.success('已提交复核'); loadData(); }
    } catch { message.error('操作失败'); }
  };

  const handleClose = async (id: number) => {
    try {
      const res = await rectificationsApi.close(id);
      if (res.success) { message.success('已关闭'); loadData(); }
    } catch { message.error('操作失败'); }
  };

  const handleCreate = async (values: any) => {
    try {
      const res = await rectificationsApi.create({
        ...values,
        scheduleId: values.scheduleId ?? 0,
        deadline: values.deadline.toISOString()
      });
      if (res.success) {
        message.success('整改计划创建成功');
        setCreateModal(false);
        createForm.resetFields();
        loadData();
      }
    } catch { message.error('创建失败'); }
  };

  const openDetail = async (id: number, item: any) => {
    setDetailDrawer({ open: true, id, data: item });
    const res = await evidencesApi.getByRectificationId(id);
    if (res.success) setEvidences(res.data ?? []);
  };

  const columns = [
    {
      title: '整改编号', dataIndex: 'rectificationNo', width: 200,
      render: (t: string, r: any) => (
        <a onClick={() => openDetail(r.id, r)}><FileSearchOutlined /> {t}</a>
      )
    },
    { title: '整改内容', dataIndex: 'title', ellipsis: true, render: (t: string) => <Text strong>{t}</Text> },
    { title: '关联排程', dataIndex: 'scheduleTitle', width: 160, ellipsis: true },
    { title: '负责人', dataIndex: 'ownerName', width: 100 },
    {
      title: '截止日期', dataIndex: 'deadline', width: 120,
      render: (d: string, r: any) => {
        const overdue = r.status === 6 || dayjs(d).isBefore(dayjs());
        return <Text type={overdue ? 'danger' : undefined}>{dayjs(d).format('YYYY-MM-DD')}</Text>;
      }
    },
    { title: '风险等级', dataIndex: 'riskLevel', width: 100, render: (l: number) => <RiskTag level={l} /> },
    { title: '状态', dataIndex: 'status', width: 100, render: (s: number) => <StatusTag status={s} /> },
    {
      title: '创建时间', dataIndex: 'createdAt', width: 160,
      render: (d: string) => dayjs(d).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作', key: 'ops', width: 220, fixed: 'right' as const,
      render: (_: any, r: any) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => openDetail(r.id, r)}>详情</Button>
          {isBusinessOwner && (r.status === 1 || r.status === 2) && (
            <Popconfirm title="确认提交复核？" onConfirm={() => handleSubmit(r.id)}>
              <Button type="link" size="small">提交</Button>
            </Popconfirm>
          )}
          {isComplianceOfficer && r.status === 3 && (
            <Button type="link" size="small">验证</Button>
          )}
          {isManagement && (r.status === 4 || r.status === 5) && (
            <Popconfirm title="确认关闭？" onConfirm={() => handleClose(r.id)}>
              <Button type="link" size="small">关闭</Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  const stats = [
    { label: '全部', value: total, color: '#1677ff' },
    { label: '整改中', value: data.filter(d => d.status === 2).length, color: '#13C2C2' },
    { label: '待复核', value: data.filter(d => d.status === 3).length, color: '#FA8C16' },
    { label: '已逾期', value: data.filter(d => d.status === 6).length, color: '#F5222D' },
    { label: '已完成', value: data.filter(d => d.status === 4 || d.status === 5).length, color: '#52C41A' }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <Title level={3} style={{ margin: 0 }}>整改计划管理</Title>
          <Text type="secondary">跟踪所有不合规项的整改措施和验证结果</Text>
        </div>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)}>新建整改</Button>
        </Space>
      </div>

      <Row gutter={12} style={{ marginBottom: 16 }}>
        {stats.map((s, i) => (
          <Col key={i} xs={12} sm={8} md={4}>
            <Card size="small" styles={{ body: { padding: 16 } }} bordered={false}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{s.label}</Text>
                  <div style={{ fontSize: 24, fontWeight: 600, color: s.color }}>{s.value}</div>
                </div>
                <SafetyOutlined style={{ fontSize: 24, color: s.color, opacity: 0.5 }} />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="filter-bar" bordered={false} styles={{ body: { padding: 16 } }}>
        <Form form={queryForm} layout="inline" onFinish={() => { setPage(1); loadData(); }}>
          <Form.Item name="status"><Select allowClear placeholder="状态" style={{ width: 140 }}>
            <Option value={1}>未开始</Option><Option value={2}>整改中</Option>
            <Option value={3}>待复核</Option><Option value={4}>已验证</Option>
            <Option value={6}>已逾期</Option>
          </Select></Form.Item>
          <Form.Item name="riskLevel"><Select allowClear placeholder="风险等级" style={{ width: 120 }}>
            <Option value={1}>低</Option><Option value={2}>中</Option>
            <Option value={3}>高</Option><Option value={4}>严重</Option>
          </Select></Form.Item>
          <Form.Item name="myAssigned" valuePropName="checked">
            <Space><Checkbox /> 只看分配给我的</Space>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>查询</Button>
              <Button onClick={() => { queryForm.resetFields(); loadData(); }} icon={<ReloadOutlined />}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card bordered={false} styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data}
          columns={columns}
          pagination={{
            current: page, pageSize, total,
            showSizeChanger: true, showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); }
          }}
          scroll={{ x: 1300 }}
        />
      </Card>

      <Drawer
        title={`整改详情 - ${detailDrawer.data?.rectificationNo ?? ''}`}
        open={detailDrawer.open}
        onClose={() => setDetailDrawer({ open: false })}
        width={640}
      >
        {detailDrawer.data && (
          <>
            <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="编号">{detailDrawer.data.rectificationNo}</Descriptions.Item>
              <Descriptions.Item label="状态"><StatusTag status={detailDrawer.data.status} /></Descriptions.Item>
              <Descriptions.Item label="标题" span={2}>{detailDrawer.data.title}</Descriptions.Item>
              <Descriptions.Item label="负责人">{detailDrawer.data.ownerName}</Descriptions.Item>
              <Descriptions.Item label="截止日期">{dayjs(detailDrawer.data.deadline).format('YYYY-MM-DD')}</Descriptions.Item>
              <Descriptions.Item label="风险等级" span={2}><RiskTag level={detailDrawer.data.riskLevel} /></Descriptions.Item>
              <Descriptions.Item label="关联排程" span={2}>{detailDrawer.data.scheduleTitle}</Descriptions.Item>
            </Descriptions>
            <Card size="small" title="整改附件" style={{ marginBottom: 12 }} extra={
              <Button size="small" icon={<PaperClipOutlined />}>添加附件</Button>
            }>
              {evidences.length > 0 ? (
                evidences.map((e: any) => (
                  <Tag key={e.id} style={{ marginBottom: 4 }} icon={<PaperClipOutlined />}>{e.fileName}</Tag>
                ))
              ) : <Empty description="暂无附件" imageStyle={{ height: 50 }} />}
            </Card>
          </>
        )}
      </Drawer>

      <Modal
        title="新建整改计划"
        open={createModal}
        onCancel={() => setCreateModal(false)}
        width={640}
        footer={null}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="title" label="整改标题" rules={[{ required: true }]}>
                <Input placeholder="简要描述整改内容" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="deadline" label="整改截止日期" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="ownerId" label="整改负责人" rules={[{ required: true }]}>
                <Select placeholder="请选择" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="riskLevel" label="风险等级" initialValue={2}>
                <Select>
                  <Option value={1}>低</Option><Option value={2}>中</Option>
                  <Option value={3}>高</Option><Option value={4}>严重</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="description" label="问题描述" rules={[{ required: true }]}>
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="rootCause" label="根本原因" rules={[{ required: true }]}>
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="actionPlan" label="整改措施" rules={[{ required: true }]}>
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setCreateModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
