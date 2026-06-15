import { useState, useEffect } from 'react';
import {
  Table,
  Tag,
  Select,
  DatePicker,
  Space,
  Button,
  Modal,
  Form,
  Input,
  message,
  Badge,
  Card,
  Statistic,
  Row,
  Col,
} from 'antd';
import {
  WarningOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import type { ProgressAlert, AlertStatus, AlertSeverity } from '../types';
import { alertApi } from '../api/alert';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

const mockAlerts: ProgressAlert[] = [
  {
    id: 1,
    learningProgressId: 1,
    userId: 3,
    userName: '李学员',
    certificateName: '一级建造师',
    courseName: '建设工程经济',
    alertType: 1,
    alertTypeText: '进度落后',
    severity: 2,
    severityText: '中',
    currentRate: 35.5,
    expectedRate: 50,
    behindRate: 14.5,
    message: '学习进度落后14.5%，当前35.5%，预期50%',
    status: 0,
    statusText: '待处理',
    reason: '',
    actionTaken: '',
    createdAt: '2025-05-20T00:00:00Z',
  },
  {
    id: 2,
    learningProgressId: 1,
    userId: 3,
    userName: '李学员',
    certificateName: '一级建造师',
    courseName: '建设工程经济',
    alertType: 2,
    alertTypeText: '即将截止',
    severity: 3,
    severityText: '高',
    currentRate: 35.5,
    expectedRate: 60,
    behindRate: 24.5,
    message: '距离考试还有3个月，当前进度落后较多',
    status: 1,
    statusText: '处理中',
    reason: '学员工作繁忙，学习时间不足',
    actionTaken: '已与学员沟通，制定新的学习计划',
    resolvedAt: undefined,
    resolvedByUserId: 2,
    resolvedByName: '张老师',
    createdAt: '2025-05-15T00:00:00Z',
  },
];

function AlertsPage() {
  const [alerts, setAlerts] = useState<ProgressAlert[]>(mockAlerts);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<AlertStatus | undefined>();
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | undefined>();
  const [handleModalVisible, setHandleModalVisible] = useState(false);
  const [currentAlert, setCurrentAlert] = useState<ProgressAlert | null>(null);
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);

  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 1: return 'blue';
      case 2: return 'orange';
      case 3: return 'red';
      case 4: return 'magenta';
      default: return 'default';
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'warning';
      case 1: return 'processing';
      case 2: return 'success';
      case 3: return 'default';
      case 4: return 'default';
      default: return 'default';
    }
  };

  const openHandleModal = (alert: ProgressAlert) => {
    setCurrentAlert(alert);
    form.setFieldsValue({
      reason: alert.reason || '',
      actionTaken: alert.actionTaken || '',
      newStatus: 2,
    });
    setHandleModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);

      setTimeout(() => {
        if (currentAlert) {
          const updatedAlerts = alerts.map(a => {
            if (a.id === currentAlert.id) {
              return {
                ...a,
                reason: values.reason,
                actionTaken: values.actionTaken,
                status: values.newStatus,
                statusText: getStatusText(values.newStatus),
                resolvedAt: (values.newStatus === 2 || values.newStatus === 3) ? new Date().toISOString() : undefined,
                resolvedByUserId: 2,
                resolvedByName: '张老师',
                closedAt: values.newStatus === 3 ? new Date().toISOString() : undefined,
              };
            }
            return a;
          });
          setAlerts(updatedAlerts);
        }
        message.success('处理成功');
        setHandleModalVisible(false);
        setSubmitLoading(false);
      }, 500);
    } catch (error) {
      setSubmitLoading(false);
    }
  };

  const getStatusText = (status: number) => {
    const texts = ['待处理', '处理中', '已解决', '已关闭', '已忽略'];
    return texts[status] || '未知';
  };

  const filteredAlerts = alerts.filter(a => {
    if (statusFilter !== undefined && a.status !== statusFilter) return false;
    if (severityFilter !== undefined && a.severity !== severityFilter) return false;
    return true;
  });

  const openCount = alerts.filter(a => a.status === 0 || a.status === 1).length;

  const columns = [
    {
      title: '告警类型',
      dataIndex: 'alertTypeText',
      key: 'alertTypeText',
      width: 120,
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (severity: number, record: ProgressAlert) => (
        <Tag color={getSeverityColor(severity)}>{record.severityText}</Tag>
      ),
    },
    {
      title: '学员',
      dataIndex: 'userName',
      key: 'userName',
      width: 100,
    },
    {
      title: '课程',
      key: 'course',
      render: (_: any, record: ProgressAlert) => (
        <div>
          <div>{record.certificateName}</div>
          <div style={{ color: '#8c8c8c', fontSize: 12 }}>{record.courseName}</div>
        </div>
      ),
    },
    {
      title: '进度详情',
      key: 'progress',
      render: (_: any, record: ProgressAlert) => (
        <div>
          <div>当前：{record.currentRate}%</div>
          <div style={{ color: '#ff4d4f' }}>落后：{record.behindRate}%</div>
          <div style={{ color: '#8c8c8c', fontSize: 12 }}>预期：{record.expectedRate}%</div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: number, record: ProgressAlert) => (
        <Badge status={getStatusColor(status)} text={record.statusText} />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: ProgressAlert) => (
        <Space>
          {record.status === 0 || record.status === 1 ? (
            <Button type="link" onClick={() => openHandleModal(record)}>
              处理
            </Button>
          ) : (
            <Button type="link" onClick={() => openHandleModal(record)}>
              查看
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>告警中心</h2>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="待处理告警"
              value={alerts.filter(a => a.status === 0).length}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="处理中"
              value={alerts.filter(a => a.status === 1).length}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已解决"
              value={alerts.filter(a => a.status === 2 || a.status === 3).length}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="严重告警"
              value={alerts.filter(a => a.severity >= 3 && (a.status === 0 || a.status === 1)).length}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Select
              placeholder="状态筛选"
              style={{ width: 150 }}
              allowClear
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Option value={0}>待处理</Option>
              <Option value={1}>处理中</Option>
              <Option value={2}>已解决</Option>
              <Option value={3}>已关闭</Option>
            </Select>
            <Select
              placeholder="严重程度"
              style={{ width: 150 }}
              allowClear
              value={severityFilter}
              onChange={setSeverityFilter}
            >
              <Option value={1}>低</Option>
              <Option value={2}>中</Option>
              <Option value={3}>高</Option>
              <Option value={4}>严重</Option>
            </Select>
            <RangePicker placeholder={['开始时间', '结束时间']} />
            <Button type="primary" onClick={() => {}}>
              查询
            </Button>
            <Button onClick={() => { setStatusFilter(undefined); setSeverityFilter(undefined); }}>
              重置
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={filteredAlerts}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>

      <Modal
        title={currentAlert?.status === 0 || currentAlert?.status === 1 ? '处理告警' : '告警详情'}
        open={handleModalVisible}
        onOk={handleSubmit}
        onCancel={() => setHandleModalVisible(false)}
        confirmLoading={submitLoading}
        okText={currentAlert?.status === 0 || currentAlert?.status === 1 ? '提交处理' : '关闭'}
        cancelText="取消"
        width={600}
      >
        {currentAlert && (
          <div>
            <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 6 }}>
              <div style={{ marginBottom: 8 }}>
                <strong>{currentAlert.courseName}</strong>
                <Tag color={getSeverityColor(currentAlert.severity)} style={{ marginLeft: 8 }}>
                  {currentAlert.severityText}
                </Tag>
              </div>
              <div style={{ color: '#666' }}>{currentAlert.message}</div>
              <div style={{ marginTop: 8, fontSize: 13, color: '#8c8c8c' }}>
                当前进度：{currentAlert.currentRate}% / 预期：{currentAlert.expectedRate}%
              </div>
            </div>

            {(currentAlert.status === 0 || currentAlert.status === 1) ? (
              <Form form={form} layout="vertical">
                <Form.Item
                  name="reason"
                  label="原因分析"
                  rules={[{ required: true, message: '请输入原因分析' }]}
                >
                  <TextArea rows={3} placeholder="请分析告警产生的原因" />
                </Form.Item>

                <Form.Item
                  name="actionTaken"
                  label="处理措施"
                  rules={[{ required: true, message: '请输入处理措施' }]}
                >
                  <TextArea rows={3} placeholder="请描述采取的处理措施" />
                </Form.Item>

                <Form.Item
                  name="newStatus"
                  label="处理结果"
                  rules={[{ required: true, message: '请选择处理结果' }]}
                >
                  <Select>
                    <Option value={1}>标记为处理中</Option>
                    <Option value={2}>已解决</Option>
                    <Option value={3}>已关闭</Option>
                    <Option value={4}>忽略</Option>
                  </Select>
                </Form.Item>
              </Form>
            ) : (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <strong>原因：</strong>{currentAlert.reason || '无'}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>处理措施：</strong>{currentAlert.actionTaken || '无'}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>处理人：</strong>{currentAlert.resolvedByName || '未知'}
                </div>
                {currentAlert.resolvedAt && (
                  <div>
                    <strong>处理时间：</strong>
                    {dayjs(currentAlert.resolvedAt).format('YYYY-MM-DD HH:mm')}
                  </div>
                )}
                {currentAlert.closedAt && (
                  <div>
                    <strong>关闭时间：</strong>
                    {dayjs(currentAlert.closedAt).format('YYYY-MM-DD HH:mm')}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default AlertsPage;
