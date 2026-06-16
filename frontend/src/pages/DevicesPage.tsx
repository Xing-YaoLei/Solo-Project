import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Space, Button, Modal, Form, Input, Select, List, Row, Col, Statistic } from 'antd';
import { PlusOutlined, EditOutlined, HistoryOutlined, ToolOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { deviceApi } from '../services/api';
import type { DeviceDto, DeviceUsageRecord } from '../types';

const { Option } = Select;

const DevicesPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState<DeviceDto[]>([]);
  const [usageRecords, setUsageRecords] = useState<DeviceUsageRecord[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<DeviceDto | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [usageModalVisible, setUsageModalVisible] = useState(false);
  const [form] = Form.useForm();

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
    } finally {
      setLoading(false);
    }
  };

  const loadUsageRecords = async (deviceId: number) => {
    try {
      const data = await deviceApi.getUsageByDeviceId(deviceId);
      setUsageRecords(data);
    } catch (error) {
      console.error('Failed to load usage records:', error);
    }
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
