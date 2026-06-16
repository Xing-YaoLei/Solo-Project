import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Card,
  Row,
  Col,
  Select,
  Statistic,
  Modal,
  Form,
  Input,
  message,
  List,
  Avatar,
} from 'antd';
import {
  WarningOutlined,
  PhoneOutlined,
  EditOutlined,
  CheckOutlined,
  UserOutlined,
  ExclamationCircleFilled,
} from '@ant-design/icons';
import { appointmentApi, followUpApi } from '../services';
import type { NoShowAppointment, RiskLevel } from '../types';
import {
  getRiskLevelText,
  getRiskBadgeClass,
  formatDate,
  formatTime,
  getMemberLevelText,
  getFollowUpTypeText,
  getFollowUpStatusText,
} from '../utils/format';
import { FollowUpType, FollowUpStatus } from '../types';

const { Option } = Select;
const { confirm } = Modal;

const NoShowManagement = () => {
  const [noShows, setNoShows] = useState<NoShowAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [minRiskLevel, setMinRiskLevel] = useState<RiskLevel | undefined>();
  const [isFollowUpModalVisible, setIsFollowUpModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<NoShowAppointment | null>(null);
  const [followUpForm] = Form.useForm();

  useEffect(() => {
    loadNoShowAppointments();
  }, [minRiskLevel]);

  const loadNoShowAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentApi.getNoShowAppointments(minRiskLevel);
      setNoShows(response.data);
    } catch (error) {
      console.error('加载爽约列表失败:', error);
      message.error('加载爽约列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFollowUp = async (values: any) => {
    if (!selectedAppointment) return;
    try {
      await followUpApi.createFollowUpTask({
        patientId: selectedAppointment.patientId,
        appointmentId: selectedAppointment.id,
        type: values.type,
        title: values.title,
        content: values.content,
        scheduledDate: values.scheduledDate,
        assignedTo: values.assignedTo,
      });
      message.success('随访任务创建成功');
      setIsFollowUpModalVisible(false);
      followUpForm.resetFields();
      loadNoShowAppointments();
    } catch (error) {
      message.error('创建随访任务失败');
    }
  };

  const handleUpdateCommunication = (record: NoShowAppointment) => {
    confirm({
      title: '沟通备注',
      content: (
        <Form>
          <Form.Item name="notes">
            <Input.TextArea
              rows={4}
              defaultValue={record.communicationNotes}
              placeholder="请输入沟通备注"
              id="comm-notes-input"
            />
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        const input = document.getElementById('comm-notes-input') as HTMLTextAreaElement;
        if (input) {
          try {
            await appointmentApi.updateCommunicationNotes(record.id, input.value);
            message.success('沟通备注已更新');
            loadNoShowAppointments();
          } catch (error) {
            message.error('更新失败');
          }
        }
      },
    });
  };

  const handleUpdateReview = (record: NoShowAppointment) => {
    confirm({
      title: '复核意见',
      content: (
        <Form>
          <Form.Item name="comments">
            <Input.TextArea
              rows={4}
              defaultValue={record.reviewComments}
              placeholder="请输入复核意见"
              id="review-comments-input"
            />
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        const input = document.getElementById('review-comments-input') as HTMLTextAreaElement;
        if (input) {
          try {
            await appointmentApi.updateReviewComments(record.id, input.value);
            message.success('复核意见已更新');
            loadNoShowAppointments();
          } catch (error) {
            message.error('更新失败');
          }
        }
      },
    });
  };

  const getRiskCount = (level: RiskLevel) => {
    return noShows.filter((n) => n.riskLevel === level).length;
  };

  const columns = [
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      width: 120,
      fixed: 'left' as const,
      render: (level: RiskLevel) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <ExclamationCircleFilled
            style={{
              color:
                level === 3
                  ? '#f5222d'
                  : level === 2
                  ? '#fa8c16'
                  : level === 1
                  ? '#faad14'
                  : '#52c41a',
              fontSize: 20,
              marginRight: 8,
            }}
          />
          <span className={getRiskBadgeClass(level)}>{getRiskLevelText(level)}</span>
        </div>
      ),
      sorter: (a: NoShowAppointment, b: NoShowAppointment) => a.riskLevel - b.riskLevel,
    },
    {
      title: '患者信息',
      key: 'patient',
      width: 200,
      render: (_: any, record: NoShowAppointment) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record.patientName}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.patientPhone}</div>
          <Tag color="purple" style={{ marginTop: 4 }}>
            {getMemberLevelText(record.memberLevel)}
          </Tag>
        </div>
      ),
    },
    {
      title: '爽约时间',
      key: 'time',
      width: 180,
      render: (_: any, record: NoShowAppointment) => (
        <div>
          <div style={{ fontWeight: 600 }}>{formatDate(record.appointmentDate)}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{formatTime(record.startTime)}</div>
        </div>
      ),
    },
    {
      title: '爽约次数',
      dataIndex: 'patientNoShowCount',
      key: 'patientNoShowCount',
      width: 100,
      render: (count: number) => (
        <span style={{ color: count >= 3 ? '#f5222d' : '#faad14', fontWeight: 600 }}>
          {count} 次
        </span>
      ),
      sorter: (a: NoShowAppointment, b: NoShowAppointment) =>
        a.patientNoShowCount - b.patientNoShowCount,
    },
    {
      title: '沟通备注',
      dataIndex: 'communicationNotes',
      key: 'communicationNotes',
      ellipsis: true,
      width: 200,
      render: (text: string) => (
        <div
          style={{
            padding: '4px 8px',
            background: '#e6f7ff',
            borderRadius: 4,
            fontSize: 12,
            color: '#1890ff',
          }}
        >
          {text || '暂无沟通记录'}
        </div>
      ),
    },
    {
      title: '复核意见',
      dataIndex: 'reviewComments',
      key: 'reviewComments',
      ellipsis: true,
      width: 200,
      render: (text: string) => (
        <div
          style={{
            padding: '4px 8px',
            background: '#fff7e6',
            borderRadius: 4,
            fontSize: 12,
            color: '#fa8c16',
          }}
        >
          {text || '待复核'}
        </div>
      ),
    },
    {
      title: '随访状态',
      key: 'followUp',
      width: 100,
      render: (_: any, record: NoShowAppointment) => (
        record.hasFollowUp ? (
          <Tag color="green">已跟进</Tag>
        ) : (
          <Tag color="red">待跟进</Tag>
        )
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      fixed: 'right' as const,
      render: (_: any, record: NoShowAppointment) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<PhoneOutlined />}
            onClick={() => {
              setSelectedAppointment(record);
              setIsFollowUpModalVisible(true);
            }}
          >
            创建随访
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleUpdateCommunication(record)}
          >
            沟通备注
          </Button>
          <Button
            size="small"
            icon={<CheckOutlined />}
            onClick={() => handleUpdateReview(record)}
          >
            复核
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2 className="page-title">爽约管理</h2>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="爽约总数"
              value={noShows.length}
              valueStyle={{ color: '#f5222d' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="极高风险"
              value={getRiskCount(3)}
              valueStyle={{ color: '#f5222d' }}
              prefix={<ExclamationCircleFilled />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="高风险"
              value={getRiskCount(2)}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ marginBottom: 8, color: '#666' }}>风险筛选</div>
            <Select
              placeholder="全部风险"
              allowClear
              style={{ width: '100%' }}
              value={minRiskLevel}
              onChange={setMinRiskLevel}
            >
              <Option value={0}>低风险及以上</Option>
              <Option value={1}>中风险及以上</Option>
              <Option value={2}>高风险及以上</Option>
              <Option value={3}>极高风险</Option>
            </Select>
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={noShows}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
          scroll={{ x: 1200 }}
          rowClassName={(record) => {
            if (record.riskLevel === 3) return 'table-row-critical';
            if (record.riskLevel === 2) return 'table-row-high';
            return '';
          }}
        />
      </Card>

      <Modal
        title="创建随访任务"
        open={isFollowUpModalVisible}
        onCancel={() => setIsFollowUpModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={followUpForm} layout="vertical" onFinish={handleCreateFollowUp}>
          <Form.Item
            name="title"
            label="任务标题"
            initialValue="爽约跟进"
            rules={[{ required: true, message: '请输入任务标题' }]}
          >
            <Input placeholder="请输入任务标题" />
          </Form.Item>
          <Form.Item
            name="type"
            label="随访类型"
            initialValue={FollowUpType.Phone}
            rules={[{ required: true, message: '请选择随访类型' }]}
          >
            <Select placeholder="请选择">
              <Option value={FollowUpType.Phone}>电话</Option>
              <Option value={FollowUpType.SMS}>短信</Option>
              <Option value={FollowUpType.WeChat}>微信</Option>
              <Option value={FollowUpType.InPerson}>面诊</Option>
            </Select>
          </Form.Item>
          <Form.Item name="content" label="随访内容">
            <Input.TextArea
              rows={4}
              placeholder="请输入随访内容"
              defaultValue={`患者${selectedAppointment?.patientName}爽约，需要联系确认原因并重新预约。`}
            />
          </Form.Item>
          <Form.Item name="assignedTo" label="负责人">
            <Input placeholder="请输入负责人" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              创建随访任务
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <style>{`
        .table-row-critical > td {
          background-color: #fff1f0 !important;
        }
        .table-row-high > td {
          background-color: #fff7e6 !important;
        }
      `}</style>
    </div>
  );
};

export default NoShowManagement;
