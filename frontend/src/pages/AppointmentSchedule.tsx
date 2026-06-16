import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  DatePicker,
  Select,
  Tag,
  Modal,
  Form,
  Input,
  TimePicker,
  message,
  Card,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  FileTextOutlined,
  PictureOutlined,
  DollarOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { appointmentApi } from '../services';
import { AppointmentStatus, RiskLevel, MemberLevel } from '../types';
import type { AppointmentList, AppointmentStatus as ApptStatus, RiskLevel as RiskLevelType } from '../types';
import {
  getAppointmentStatusText,
  getAppointmentStatusColor,
  getRiskLevelText,
  getRiskBadgeClass,
  formatDate,
  formatTime,
  getMemberLevelText,
} from '../utils/format';
import { useNavigate } from 'react-router-dom';

const { RangePicker } = DatePicker;
const { Option } = Select;

const AppointmentSchedule = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<AppointmentList[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('week'),
    dayjs().endOf('week'),
  ]);
  const [status, setStatus] = useState<ApptStatus | undefined>();
  const [riskLevel, setRiskLevel] = useState<RiskLevel | undefined>();
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadAppointments();
  }, [dateRange, status, riskLevel]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentApi.getAppointments({
        startDate: dateRange?.[0]?.format('YYYY-MM-DD'),
        endDate: dateRange?.[1]?.format('YYYY-MM-DD'),
        status,
        riskLevel,
        pageSize: 50,
      });
      setAppointments(response.data);
    } catch (error) {
      console.error('加载预约失败:', error);
      message.error('加载预约数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      await appointmentApi.createAppointment({
        ...values,
        appointmentDate: values.appointmentDate.format('YYYY-MM-DD'),
        startTime: values.timeRange[0].format('HH:mm:ss'),
        endTime: values.timeRange[1].format('HH:mm:ss'),
      });
      message.success('预约创建成功');
      setIsModalVisible(false);
      form.resetFields();
      loadAppointments();
    } catch (error) {
      message.error('创建预约失败');
    }
  };

  const columns = [
    {
      title: '时间',
      dataIndex: 'startTime',
      key: 'time',
      width: 100,
      render: (time: string, record: AppointmentList) => (
        <div>
          <div style={{ fontWeight: 600 }}>{formatTime(time)}</div>
          <div style={{ fontSize: 12, color: '#999' }}>
            {formatDate(record.appointmentDate)}
          </div>
        </div>
      ),
      sorter: (a: AppointmentList, b: AppointmentList) =>
        new Date(a.appointmentDate + ' ' + a.startTime).getTime() -
        new Date(b.appointmentDate + ' ' + b.startTime).getTime(),
    },
    {
      title: '患者信息',
      key: 'patient',
      render: (_: any, record: AppointmentList) => (
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
      title: '预约事项',
      dataIndex: 'subject',
      key: 'subject',
      ellipsis: true,
    },
    {
      title: '医生/椅位',
      key: 'doctor',
      render: (_: any, record: AppointmentList) => (
        <div>
          <div>{record.doctorName || '-'}</div>
          <div style={{ fontSize: 12, color: '#999' }}>
            {record.chairNumber ? `${record.chairNumber}号椅位` : '-'}
          </div>
        </div>
      ),
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      width: 100,
      render: (level: RiskLevel) => (
        <span className={getRiskBadgeClass(level)}>{getRiskLevelText(level)}</span>
      ),
      sorter: (a: AppointmentList, b: AppointmentList) => a.riskLevel - b.riskLevel,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ApptStatus) => (
        <Tag color={getAppointmentStatusColor(status)}>
          {getAppointmentStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '相关资料',
      key: 'related',
      width: 180,
      render: (_: any, record: AppointmentList) => (
        <Space size="small">
          <Tag icon={<FileTextOutlined />} color={record.hasTreatmentPlan ? 'blue' : 'default'}>
            治疗计划
          </Tag>
          <Tag icon={<PhoneOutlined />} color={record.hasFollowUpTasks ? 'orange' : 'default'}>
            随访
          </Tag>
          <Tag icon={<PictureOutlined />} color={record.hasImages ? 'green' : 'default'}>
            影像
          </Tag>
          <Tag icon={<DollarOutlined />} color={record.hasBilling ? 'cyan' : 'default'}>
            收费
          </Tag>
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: AppointmentList) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/appointments/${record.id}`)}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 className="page-title" style={{ margin: 0 }}>
          复诊排程
        </h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
          新建预约
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <div style={{ marginBottom: 8, color: '#666' }}>日期范围</div>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={4}>
            <div style={{ marginBottom: 8, color: '#666' }}>状态</div>
            <Select
              placeholder="全部状态"
              allowClear
              style={{ width: '100%' }}
              value={status}
              onChange={setStatus}
            >
              <Option value={AppointmentStatus.Scheduled}>已预约</Option>
              <Option value={AppointmentStatus.Confirmed}>已确认</Option>
              <Option value={AppointmentStatus.InProgress}>进行中</Option>
              <Option value={AppointmentStatus.Completed}>已完成</Option>
              <Option value={AppointmentStatus.Cancelled}>已取消</Option>
              <Option value={AppointmentStatus.NoShow}>爽约</Option>
            </Select>
          </Col>
          <Col span={4}>
            <div style={{ marginBottom: 8, color: '#666' }}>风险等级</div>
            <Select
              placeholder="全部风险"
              allowClear
              style={{ width: '100%' }}
              value={riskLevel}
              onChange={setRiskLevel}
            >
              <Option value={RiskLevel.Low}>低风险</Option>
              <Option value={RiskLevel.Medium}>中风险</Option>
              <Option value={RiskLevel.High}>高风险</Option>
              <Option value={RiskLevel.Critical}>极高风险</Option>
            </Select>
          </Col>
          <Col span={6}>
            <div style={{ marginBottom: 8, color: '#666' }}>搜索</div>
            <Input
              placeholder="搜索患者姓名/电话"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={loadAppointments}
            />
          </Col>
          <Col span={2}>
            <div style={{ marginBottom: 8, color: '#fff' }}>-</div>
            <Button type="primary" icon={<SearchOutlined />} onClick={loadAppointments}>
              查询
            </Button>
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={appointments}
        rowKey="id"
        loading={loading}
        pagination={false}
        scroll={{ y: 500 }}
      />

      <Modal
        title="新建预约"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="patientId"
            label="患者ID"
            rules={[{ required: true, message: '请输入患者ID' }]}
          >
            <Input placeholder="请输入患者ID" />
          </Form.Item>
          <Form.Item
            name="subject"
            label="预约事项"
            rules={[{ required: true, message: '请输入预约事项' }]}
          >
            <Input placeholder="请输入预约事项" />
          </Form.Item>
          <Form.Item
            name="appointmentDate"
            label="预约日期"
            rules={[{ required: true, message: '请选择预约日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="timeRange"
            label="预约时间"
            rules={[{ required: true, message: '请选择预约时间' }]}
          >
            <TimePicker.RangePicker style={{ width: '100%' }} format="HH:mm" />
          </Form.Item>
          <Form.Item name="doctorName" label="医生">
            <Input placeholder="请输入医生姓名" />
          </Form.Item>
          <Form.Item name="chairNumber" label="椅位">
            <Input placeholder="请输入椅位号" />
          </Form.Item>
          <Form.Item name="description" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              创建预约
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AppointmentSchedule;
