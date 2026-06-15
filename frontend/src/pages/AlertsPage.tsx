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
  Spin,
  Empty,
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

function AlertsPage() {
  const [alerts, setAlerts] = useState<ProgressAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<AlertStatus | undefined>();
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | undefined>();
  const [dateRange, setDateRange] = useState<[any, any] | null>(null);
  const [handleModalVisible, setHandleModalVisible] = useState(false);
  const [currentAlert, setCurrentAlert] = useState<ProgressAlert | null>(null);
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [stats, setStats] = useState({
    open: 0,
    inProgress: 0,
    resolved: 0,
    critical: 0,
  });

  useEffect(() => {
    loadAlerts();
  }, [statusFilter, severityFilter, dateRange]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const result = await alertApi.getList({
        status: statusFilter,
        severity: severityFilter,
        startDate: dateRange?.[0]?.toISOString(),
        endDate: dateRange?.[1]?.toISOString(),
        pageIndex: 1,
        pageSize: 100,
      });
      setAlerts(result.items);
      updateStats(result.items);
    } catch (error) {
      console.error('加载告警列表失败:', error);
      message.error('加载告警列表失败');
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (data: ProgressAlert[]) => {
    setStats({
      open: data.filter((a) => a.status === 0).length,
      inProgress: data.filter((a) => a.status === 1).length,
      resolved: data.filter((a) => a.status === 2 || a.status === 3).length,
      critical: data.filter((a) => a.severity >= 3 && (a.status === 0 || a.status === 1)).length,
    });
  };

  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 1:
        return 'blue';
      case 2:
        return 'orange';
      case 3:
        return 'red';
      case 4:
        return 'magenta';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0:
        return 'warning';
      case 1:
        return 'processing';
      case 2:
        return 'success';
      case 3:
        return 'default';
      case 4:
        return 'default';
      default:
        return 'default';
    }
  };

  const openHandleModal = async (alert: ProgressAlert) => {
    setCurrentAlert(alert);
    const fullAlert = await alertApi.getById(alert.id);
    if (fullAlert) {
      form.setFieldsValue({
        reason: fullAlert.reason || '',
        actionTaken: fullAlert.actionTaken || '',
        newStatus: 2,
      });
    }
    setHandleModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!currentAlert) return;
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);

      await alertApi.handleAlert(currentAlert.id, {
        reason: values.reason,
        actionTaken: values.actionTaken,
        handlerUserId: 2,
        newStatus: values.newStatus,
      });

      message.success('处理成功，已保存原因、处理措施和处理时间');
      setHandleModalVisible(false);
      setSubmitLoading(false);
      await loadAlerts();
    } catch (error) {
      console.error('处理告警失败:', error);
      message.error('处理告警失败');
      setSubmitLoading(false);
    }
  };

  const handleTriggerCheck = async () => {
    try {
      setLoading(true);
      const count = await alertApi.triggerCheck();
      message.success(`检测完成，新生成 ${count} 条告警`);
      await loadAlerts();
    } catch (error) {
      console.error('触发检测失败:', error);
      message.error('触发检测失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: number) => {
    const texts = ['待处理', '处理中', '已解决', '已关闭', '已忽略'];
    return texts[status] || '未知';
  };

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
          <Button type="link" onClick={() => openHandleModal(record)}>
            {record.status === 0 || record.status === 1 ? '处理' : '查看'}
          </Button>
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
              value={stats.open}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="处理中"
              value={stats.inProgress}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已解决"
              value={stats.resolved}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="严重告警"
              value={stats.critical}
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
            <RangePicker
              placeholder={['开始时间', '结束时间']}
              value={dateRange}
              onChange={setDateRange}
            />
            <Button type="primary" onClick={loadAlerts}>
              查询
            </Button>
            <Button
              onClick={() => {
                setStatusFilter(undefined);
                setSeverityFilter(undefined);
                setDateRange(null);
              }}
            >
              重置
            </Button>
            <Button onClick={handleTriggerCheck} loading={loading}>
              立即检测进度
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={alerts}
          rowKey="id"
          loading={loading}
          locale={{ emptyText: <Empty description="暂无告警数据" /> }}
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

            {currentAlert.status === 0 || currentAlert.status === 1 ? (
              <Form form={form} layout="vertical">
                <Form.Item
                  name="reason"
                  label="原因分析"
                  rules={[{ required: true, message: '请输入原因分析' }]}
                >
                  <TextArea rows={3} placeholder="请分析告警产生的原因（将保存到处理记录）" />
                </Form.Item>

                <Form.Item
                  name="actionTaken"
                  label="处理措施"
                  rules={[{ required: true, message: '请输入处理措施' }]}
                >
                  <TextArea rows={3} placeholder="请描述采取的处理措施（将保存到处理记录）" />
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
                  <div style={{ marginBottom: 12 }}>
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
