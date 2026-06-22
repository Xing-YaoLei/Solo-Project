import { useEffect, useState } from 'react';
import {
  Table, Tag, Button, Form, Input, Select, DatePicker, Modal, Drawer,
  Card, Row, Col, InputNumber, Space, message, Popconfirm, Tooltip,
  Checkbox, Dropdown, Typography, Empty, Badge
} from 'antd';
import {
  PlusOutlined, SearchOutlined, FilterOutlined, ReloadOutlined,
  FileTextOutlined, PlayCircleOutlined, SendOutlined, CheckSquareOutlined,
  CloseCircleOutlined, ExportOutlined, SettingOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { schedulesApi, regulationsApi, authApi } from '@/services/api';
import { useRolePermissions } from '@/store/authStore';
import type { ScheduleListDto, ScheduleFrequency, RiskLevel, CheckStatus } from '@/types';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
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
    1: { color: 'default', text: '待处理' },
    2: { color: 'processing', text: '进行中' },
    3: { color: 'warning', text: '待复核' },
    4: { color: 'processing', text: '已复核' },
    5: { color: 'success', text: '已通过' },
    6: { color: 'error', text: '已拒绝' },
    7: { color: 'default', text: '已关闭' }
  };
  const cfg = map[status] ?? map[1];
  return <Tag color={cfg.color}>{cfg.text}</Tag>;
};

const FrequencyText = ({ f }: { f: number }) => {
  const map: Record<number, string> = {
    1: '每日', 2: '每周', 3: '每月', 4: '每季', 5: '半年', 6: '每年', 7: '专项'
  };
  return <Text>{map[f] ?? '专项'}</Text>;
};

export default function Schedules() {
  const navigate = useNavigate();
  const { isAuditor, isComplianceOfficer, isManagement } = useRolePermissions();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ScheduleListDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<number | null>(null);
  const [regulations, setRegulations] = useState<any[]>([]);
  const [auditors, setAuditors] = useState<any[]>([]);
  const [owners, setOwners] = useState<any[]>([]);
  const [createForm] = Form.useForm();
  const [reviewForm] = Form.useForm();
  const [filterForm] = Form.useForm();

  useEffect(() => {
    loadData();
    loadSelectOptions();
  }, [page, pageSize]);

  const loadData = async () => {
    setLoading(true);
    try {
      const values = filterForm.getFieldsValue();
      const res = await schedulesApi.list({
        pageNumber: page,
        pageSize,
        auditorId: values.auditorId,
        businessOwnerId: values.businessOwnerId,
        status: values.status,
        riskLevel: values.riskLevel,
        startDateFrom: values.dateRange?.[0]?.toISOString(),
        startDateTo: values.dateRange?.[1]?.toISOString(),
        keyword: values.keyword
      });
      if (res.success && res.data) {
        setData(res.data.items);
        setTotal(res.data.totalCount);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadSelectOptions = async () => {
    try {
      const [regRes, audRes, ownRes] = await Promise.all([
        regulationsApi.list({ pageNumber: 1, pageSize: 100 }),
        authApi.getUsersByRole(1),
        authApi.getUsersByRole(2)
      ]);
      if (regRes.success) setRegulations((regRes.data as any)?.items ?? []);
      if (audRes.success) setAuditors(audRes.data ?? []);
      if (ownRes.success) setOwners(ownRes.data ?? []);
    } catch {}
  };

  const handleCreate = async (values: any) => {
    try {
      const res = await schedulesApi.create({
        ...values,
        startDate: values.dateRange[0].toISOString(),
        endDate: values.dateRange[1].toISOString(),
        dueDate: values.dueDate.toISOString()
      });
      if (res.success) {
        message.success('排程创建成功');
        setCreateModalOpen(false);
        createForm.resetFields();
        loadData();
      } else {
        message.error(res.message ?? '创建失败');
      }
    } catch {
      message.error('创建失败');
    }
  };

  const handleStart = async (id: number) => {
    try {
      const res = await schedulesApi.start(id);
      if (res.success) { message.success('已开始'); loadData(); }
    } catch { message.error('操作失败'); }
  };

  const handleSubmit = async (id: number) => {
    try {
      const res = await schedulesApi.submit(id);
      if (res.success) { message.success('已提交复核'); loadData(); }
    } catch { message.error('操作失败'); }
  };

  const openReview = (id: number) => {
    setReviewTarget(id);
    setReviewModalOpen(true);
  };

  const handleReview = async (values: any) => {
    if (!reviewTarget) return;
    try {
      const res = await schedulesApi.review({ id: reviewTarget, ...values });
      if (res.success) {
        message.success(values.approved ? '复核通过' : '已拒绝');
        setReviewModalOpen(false);
        reviewForm.resetFields();
        loadData();
      }
    } catch { message.error('操作失败'); }
  };

  const handleClose = async (id: number) => {
    try {
      const res = await schedulesApi.close(id);
      if (res.success) { message.success('已关闭'); loadData(); }
    } catch { message.error('操作失败'); }
  };

  const bulkActions = [
    { key: 'submit', label: '批量提交复核', disabled: !isAuditor, onClick: () => handleBulkAction('submit') },
    { key: 'review', label: '批量复核通过', disabled: !isComplianceOfficer, onClick: () => handleBulkAction('review') },
    { key: 'close', label: '批量关闭', disabled: !isManagement, onClick: () => handleBulkAction('close') }
  ];

  const handleBulkAction = async (action: string) => {
    message.info(`批量${action}功能：已选择 ${selectedRowKeys.length} 项`);
    setSelectedRowKeys([]);
  };

  const columns = [
    {
      title: '排程编号',
      dataIndex: 'scheduleNo',
      width: 180,
      render: (t: string, r: any) => (
        <a onClick={() => navigate(`/schedules/${r.id}`)}>
          <FileTextOutlined /> {t}
        </a>
      )
    },
    {
      title: '排程标题',
      dataIndex: 'title',
      ellipsis: true,
      render: (t: string) => <Text strong>{t}</Text>
    },
    { title: '制度', dataIndex: 'regulationName', width: 140, ellipsis: true },
    { title: '审计员', dataIndex: 'auditorName', width: 100 },
    { title: '业务负责人', dataIndex: 'businessOwnerName', width: 100 },
    { title: '频率', dataIndex: 'frequency', width: 80, render: (f: number) => <FrequencyText f={f} /> },
    { title: '风险等级', dataIndex: 'riskLevel', width: 100, render: (l: number) => <RiskTag level={l} /> },
    { title: '状态', dataIndex: 'status', width: 100, render: (s: number) => <StatusTag status={s} /> },
    {
      title: '截止日期',
      dataIndex: 'dueDate',
      width: 120,
      render: (d: string) => {
        const isOverdue = dayjs(d).isBefore(dayjs()) && !dayjs(d).isSame(dayjs(), 'day');
        return <Text type={isOverdue ? 'danger' : undefined}>{dayjs(d).format('YYYY-MM-DD')}</Text>;
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, r: any) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => navigate(`/schedules/${r.id}`)}>详情</Button>
          {isAuditor && r.status === 1 && (
            <Tooltip title="开始检查"><Button type="link" size="small" icon={<PlayCircleOutlined />} onClick={() => handleStart(r.id)}>开始</Button></Tooltip>
          )}
          {isAuditor && r.status === 2 && (
            <Tooltip title="提交复核"><Button type="link" size="small" icon={<SendOutlined />} onClick={() => handleSubmit(r.id)}>提交</Button></Tooltip>
          )}
          {(isComplianceOfficer || isManagement) && r.status === 3 && (
            <Tooltip title="复核"><Button type="link" size="small" icon={<CheckSquareOutlined />} onClick={() => openReview(r.id)}>复核</Button></Tooltip>
          )}
          {isManagement && (r.status === 5 || r.status === 6) && (
            <Popconfirm title="确认关闭该排程？" onConfirm={() => handleClose(r.id)}>
              <Button type="link" size="small" danger icon={<CloseCircleOutlined />}>关闭</Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <Title level={3} style={{ margin: 0 }}>检查排程</Title>
          <Text type="secondary">管理所有制度检查排程及处理进度</Text>
        </div>
        <Space>
          {isAuditor && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>新建排程</Button>
          )}
          <Dropdown menu={{ items: bulkActions.filter(i => !i.disabled).map(i => ({ key: i.key, label: i.label, onClick: i.onClick })) }} disabled={selectedRowKeys.length === 0}>
            <Button disabled={selectedRowKeys.length === 0}>
              <SettingOutlined /> 批量操作 {selectedRowKeys.length > 0 && `(${selectedRowKeys.length})`}
            </Button>
          </Dropdown>
          <Button icon={<ExportOutlined />}>导出</Button>
        </Space>
      </div>

      <Card className="filter-bar" bordered={false} styles={{ body: { padding: 16 } }}>
        <Form form={filterForm} layout="inline" onFinish={loadData}>
          <Form.Item name="keyword"><Input allowClear prefix={<SearchOutlined />} placeholder="搜索标题/编号" style={{ width: 200 }} /></Form.Item>
          <Form.Item name="auditorId"><Select allowClear placeholder="审计员" style={{ width: 140 }}>
            {auditors.map(u => <Option key={u.id} value={u.id}>{u.fullName}</Option>)}
          </Select></Form.Item>
          <Form.Item name="businessOwnerId"><Select allowClear placeholder="业务负责人" style={{ width: 140 }}>
            {owners.map(u => <Option key={u.id} value={u.id}>{u.fullName}</Option>)}
          </Select></Form.Item>
          <Form.Item name="status"><Select allowClear placeholder="状态" style={{ width: 120 }}>
            <Option value={1}>待处理</Option><Option value={2}>进行中</Option>
            <Option value={3}>待复核</Option><Option value={5}>已通过</Option>
            <Option value={6}>已拒绝</Option><Option value={7}>已关闭</Option>
          </Select></Form.Item>
          <Form.Item name="riskLevel"><Select allowClear placeholder="风险等级" style={{ width: 120 }}>
            <Option value={1}>低风险</Option><Option value={2}>中风险</Option>
            <Option value={3}>高风险</Option><Option value={4}>严重风险</Option>
          </Select></Form.Item>
          <Form.Item name="dateRange"><RangePicker /></Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<FilterOutlined />}>筛选</Button>
              <Button onClick={() => { filterForm.resetFields(); setPage(1); loadData(); }} icon={<ReloadOutlined />}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {selectedRowKeys.length > 0 && (
        <div className="bulk-action-bar">
          <Text>已选择 <Badge count={selectedRowKeys.length} style={{ backgroundColor: '#1677ff' }} /> 项 · 可以批量提交复核、批量复核通过、批量关闭</Text>
          <Space>
            <Checkbox
              checked={selectedRowKeys.length === data.length && data.length > 0}
              onChange={(e) => setSelectedRowKeys(e.target.checked ? data.map(d => d.id as any) : [])}
            >全选本页</Checkbox>
            <Button size="small" onClick={() => setSelectedRowKeys([])}>取消选择</Button>
          </Space>
        </div>
      )}

      <Card bordered={false} styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data}
          columns={columns}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          pagination={{
            current: page, pageSize, total,
            showSizeChanger: true, showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); }
          }}
          scroll={{ x: 1400 }}
        />
      </Card>

      <Modal
        title="新建检查排程"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        width={720}
        footer={null}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="title" label="排程标题" rules={[{ required: true, message: '请输入标题' }]}>
                <Input placeholder="如：Q3财务合规制度检查" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="regulationId" label="关联制度" rules={[{ required: true, message: '请选择制度' }]}>
                <Select placeholder="请选择制度" showSearch optionFilterProp="children">
                  {regulations.map(r => <Option key={r.id} value={r.id}>{r.title}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="frequency" label="检查频率" rules={[{ required: true }]} initialValue={3}>
                <Select>
                  <Option value={1}>每日</Option><Option value={2}>每周</Option>
                  <Option value={3}>每月</Option><Option value={4}>每季</Option>
                  <Option value={5}>半年</Option><Option value={6}>每年</Option>
                  <Option value={7}>专项</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="auditorId" label="审计员" rules={[{ required: true }]}>
                <Select placeholder="请选择审计员" showSearch optionFilterProp="children">
                  {auditors.map(u => <Option key={u.id} value={u.id}>{u.fullName}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="businessOwnerId" label="业务负责人">
                <Select placeholder="请选择业务负责人" allowClear showSearch optionFilterProp="children">
                  {owners.map(u => <Option key={u.id} value={u.id}>{u.fullName}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dateRange" label="检查周期" rules={[{ required: true }]}>
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dueDate" label="截止日期" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="riskLevel" label="风险等级" rules={[{ required: true }]} initialValue={2}>
                <Select>
                  <Option value={1}>低风险</Option><Option value={2}>中风险</Option>
                  <Option value={3}>高风险</Option><Option value={4}>严重风险</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}></Col>
            <Col span={24}>
              <Form.Item name="description" label="排程描述">
                <Input.TextArea rows={3} placeholder="简要描述本次检查的范围和重点" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="scope" label="检查范围">
                <Input.TextArea rows={2} placeholder="涉及的部门、系统、业务模块等" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setCreateModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建排程</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="复核排程"
        open={reviewModalOpen}
        onCancel={() => setReviewModalOpen(false)}
        footer={null}
      >
        <Form form={reviewForm} layout="vertical" onFinish={handleReview}>
          <Form.Item name="approved" label="复核结果" rules={[{ required: true }]} initialValue={true}>
            <Radio.Group optionType="button" buttonStyle="solid" style={{ width: '100%' }}>
              <Radio.Button value={true} style={{ width: '50%', textAlign: 'center' }}>复核通过</Radio.Button>
              <Radio.Button value={false} style={{ width: '50%', textAlign: 'center' }}>复核拒绝</Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="comments" label="复核意见" rules={[{ required: true, message: '请填写复核意见' }]}>
            <Input.TextArea rows={4} placeholder="请填写详细的复核意见..." />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setReviewModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认复核</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
