import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Space, Button, Modal, Form, Input, Select, DatePicker, message, List, Row, Col, Statistic } from 'antd';
import { PlusOutlined, EditOutlined, HistoryOutlined, ToolOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { deviceApi } from '../services/api';
import type { DeviceDto, DeviceUsageRecord } from '../types';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const DevicesPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState<DeviceDto[]>([]);
  const [usageRecords, setUsageRecords] = useState<DeviceUsageRecord[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<DeviceDto | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [usageModalVisible, setUsageModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [usageForm] = Form.useForm();

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    setLoading(true);
    try {
      const data = await deviceApi.getAll();
      setDevices(data);
    } catch (error) {
      console.error('Failed to load devices:', error);
      setDevices(getMockDevices());
    } finally {
      setLoading(false);
    }
  };

  const getMockDevices = (): DeviceDto[] => [
    { id: 1, deviceCode: 'DEV001', deviceName: '电动起立床', deviceType: '康复设备', model: 'EL-2000', statusId: 1, statusName: '正常', location: '康复治疗室1' },
    { id: 2, deviceCode: 'DEV002', deviceName: '中频电疗仪', deviceType: '理疗设备', model: 'ZP-100', statusId: 1, statusName: '正常', location: '物理治疗室' },
    { id: 3, deviceCode: 'DEV003', deviceName: '持续被动运动机(CPM)', deviceType: '康复设备', model: 'CPM-300', statusId: 2, statusName: '维护中', location: '康复治疗室2' },
    { id: 4, deviceCode: 'DEV004', deviceName: '平衡训练仪', deviceType: '评估设备', model: 'BT-500', statusId: 1, statusName: '正常', location: '评估室' },
    { id: 5, deviceCode: 'DEV005', deviceName: '言语训练系统', deviceType: '康复设备', model: 'ST-200', statusId: 3, statusName: '故障', location: '言语治疗室' },
    { id: 6, deviceCode: 'DEV006', deviceName: '下肢康复机器人', deviceType: '康复设备', model: 'LR-1000', statusId: 1, statusName: '正常', location: '机器人治疗室' },
    { id: 7, deviceCode: 'DEV007', deviceName: '上肢康复训练器', deviceType: '康复设备', model: 'UR-500', statusId: 1, statusName: '正常', location: '作业治疗室' },
    { id: 8, deviceCode: 'DEV008', deviceName: '超声波治疗仪', deviceType: '理疗设备', model: 'US-300', statusId: 1, statusName: '正常', location: '物理治疗室' },
    { id: 9, deviceCode: 'DEV009', deviceName: '牵引床', deviceType: '康复设备', model: 'TC-150', statusId: 2, statusName: '维护中', location: '牵引治疗室' },
    { id: 10, deviceCode: 'DEV010', deviceName: '肌电生物反馈仪', deviceType: '评估设备', model: 'EMG-400', statusId: 1, statusName: '正常', location: '评估室' },
  ];

  const loadUsageRecords = async (deviceId: number) => {
    try {
      const data = await deviceApi.getUsageByDeviceId(deviceId);
      setUsageRecords(data);
    } catch (error) {
      console.error('Failed to load usage records:', error);
      setUsageRecords(getMockUsageRecords(deviceId));
    }
  };

  const getMockUsageRecords = (deviceId: number): DeviceUsageRecord[] => {
    const baseDate = dayjs();
    return Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      deviceId,
      deviceName: devices.find((d) => d.id === deviceId)?.deviceName || '',
      billId: i + 1,
      treatmentCalendarId: i + 1,
      useDate: baseDate.subtract(i, 'day').format('YYYY-MM-DD'),
      startTime: ['08:00', '09:30', '14:00', '15:30', '10:00'][i % 5],
      endTime: ['09:00', '10:30', '15:00', '16:30', '11:00'][i % 5],
      duration: [30, 45, 60, 20, 40][i % 5],
      remark: ['用于膝关节康复', '常规治疗', '强化训练', '评估测试', '术后恢复'][i % 5],
    }));
  };

  const handleViewUsage = (device: DeviceDto) => {
    setSelectedDevice(device);
    loadUsageRecords(device.id);
    setUsageModalVisible(true);
  };

  const handleAdd = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const getStatusColor = (statusId: number) => {
    const colors: Record<number, string> = {
      1: 'green',
      2: 'orange',
      3: 'red',
      4: 'default',
    };
    return colors[statusId] || 'default';
  };

  const columns = [
    {
      title: '设备编号',
      dataIndex: 'deviceCode',
      key: 'deviceCode',
      width: 120,
    },
    {
      title: '设备名称',
      dataIndex: 'deviceName',
      key: 'deviceName',
      width: 200,
    },
    {
      title: '设备类型',
      dataIndex: 'deviceType',
      key: 'deviceType',
      width: 120,
    },
    {
      title: '型号',
      dataIndex: 'model',
      key: 'model',
      width: 150,
    },
    {
      title: '状态',
      dataIndex: 'statusId',
      key: 'statusId',
      width: 100,
      render: (_: any, record: DeviceDto) => (
        <Tag color={getStatusColor(record.statusId)}>{record.statusName}</Tag>
      ),
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      render: (_: any, record: DeviceDto) => (
        <Space size="small">
          <Button type="link" size="small" icon={<HistoryOutlined />} onClick={() => handleViewUsage(record)}>
            使用记录
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />}>
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  const normalCount = devices.filter((d) => d.statusId === 1).length;
  const maintenanceCount = devices.filter((d) => d.statusId === 2).length;
  const faultCount = devices.filter((d) => d.statusId === 3).length;

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="设备总数"
              value={devices.length}
              prefix={<ToolOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="正常运行"
              value={normalCount}
              prefix={<InfoCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="故障/维护"
              value={maintenanceCount + faultCount}
              prefix={<InfoCircleOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="器械设备管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增设备
          </Button>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={devices}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={`${selectedDevice?.deviceName} - 使用记录`}
        open={usageModalVisible}
        onCancel={() => setUsageModalVisible(false)}
        footer={null}
        width={800}
      >
        <List
          dataSource={usageRecords}
          renderItem={(item) => (
            <List.Item key={item.id}>
              <List.Item.Meta
                avatar={<ToolOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                title={
                  <Space>
                    <strong>{item.useDate}</strong>
                    <span style={{ color: '#999' }}>
                      {item.startTime} - {item.endTime}
                    </span>
                    <Tag color="blue">{item.duration}分钟</Tag>
                  </Space>
                }
                description={item.remark}
              />
            </List.Item>
          )}
        />
      </Modal>

      <Modal
        title="新增设备"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        okText="确认"
        cancelText="取消"
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="deviceCode"
            label="设备编号"
            rules={[{ required: true, message: '请输入设备编号' }]}
          >
            <Input placeholder="请输入设备编号" />
          </Form.Item>
          <Form.Item
            name="deviceName"
            label="设备名称"
            rules={[{ required: true, message: '请输入设备名称' }]}
          >
            <Input placeholder="请输入设备名称" />
          </Form.Item>
          <Form.Item name="deviceType" label="设备类型">
            <Select placeholder="请选择设备类型">
              <Option value="康复设备">康复设备</Option>
              <Option value="理疗设备">理疗设备</Option>
              <Option value="评估设备">评估设备</Option>
              <Option value="辅助器具">辅助器具</Option>
            </Select>
          </Form.Item>
          <Form.Item name="model" label="型号">
            <Input placeholder="请输入型号" />
          </Form.Item>
          <Form.Item name="location" label="存放位置">
            <Input placeholder="请输入存放位置" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DevicesPage;
