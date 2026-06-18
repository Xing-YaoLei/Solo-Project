import { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Form, Input, InputNumber, DatePicker, 
  Button, Table, Tag, Timeline, List, Badge, Modal, message,
  Space, Select
} from 'antd';
import { 
  PlusOutlined, WarningOutlined, ClockCircleOutlined,
  CheckCircleOutlined, CloseCircleOutlined, FileTextOutlined
} from '@ant-design/icons';
import type { PartsShortageRecord } from '@/types';
import { partsApi } from '@/services/parts';
import dayjs from 'dayjs';

const { Option } = Select;

export default function PartsShortage() {
  const [form] = Form.useForm();
  const [shortageList, setShortageList] = useState<PartsShortageRecord[]>([]);
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [shortages, inventory] = await Promise.all([
        partsApi.getShortageList(),
        partsApi.getInventoryWarning(),
      ]);
      setShortageList(shortages);
      setInventoryList(inventory);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      await partsApi.createShortage(1, {
        partName: values.partName,
        partCode: values.partCode,
        shortageQuantity: values.quantity,
        expectedArrivalTime: values.expectedArrivalDate.format('YYYY-MM-DD'),
        handler: '当前用户',
        remarks: values.remark,
      });
      message.success('缺货登记成功');
      setModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error) {
      message.error('登记失败');
    } finally {
      setLoading(false);
    }
  };

  const shortageColumns = [
    {
      title: '配件名称',
      dataIndex: 'partName',
      key: 'partName',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: '配件编码',
      dataIndex: 'partCode',
      key: 'partCode',
      render: (text: string) => <span style={{ color: '#666' }}>{text}</span>,
    },
    {
      title: '缺货数量',
      dataIndex: 'shortageQuantity',
      key: 'shortageQuantity',
      width: 80,
    },
    {
      title: '预计到货',
      dataIndex: 'expectedArrivalTime',
      key: 'expectedArrivalTime',
      width: 120,
    },
    {
      title: '实际到货',
      dataIndex: 'actualArrivalTime',
      key: 'actualArrivalTime',
      width: 120,
      render: (text: string) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          Pending: { color: 'orange', text: '待到货' },
          Arrived: { color: 'green', text: '已到货' },
          Resolved: { color: 'blue', text: '已解决' },
          Cancelled: { color: 'red', text: '已取消' },
        };
        const s = statusMap[status] || statusMap.Pending;
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '登记时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (text: string) => text?.slice(0, 16),
    },
    {
      title: '处理人',
      dataIndex: 'handler',
      key: 'handler',
      width: 80,
    },
  ];

  const inventoryColumns = [
    {
      title: '配件名称',
      dataIndex: 'partName',
      key: 'partName',
      render: (text: string, record: any) => (
        <Space>
          <Badge status="warning" />
          <span>{text}</span>
          <span style={{ color: '#999', fontSize: 12 }}>{record.partCode}</span>
        </Space>
      ),
    },
    {
      title: '当前库存',
      dataIndex: 'stock',
      key: 'stock',
      width: 100,
      render: (stock: number) => (
        <span style={{ color: '#f5222d', fontWeight: 'bold' }}>{stock}</span>
      ),
    },
    {
      title: '最低库存',
      dataIndex: 'minStock',
      key: 'minStock',
      width: 100,
    },
    {
      title: '供应商',
      dataIndex: 'supplier',
      key: 'supplier',
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: () => (
        <Button type="link" size="small">
          补货
        </Button>
      ),
    },
  ];

  const timelineData = [
    {
      color: 'green',
      title: '配件到货',
      description: '前刹车片已到货，数量 10 套',
      time: '2024-03-12 14:30',
    },
    {
      color: 'blue',
      title: '已下单',
      description: '向博世配件采购前刹车片 10 套',
      time: '2024-03-10 10:30',
    },
    {
      color: 'orange',
      title: '缺货登记',
      description: '预约单 YY20240310003 登记缺货：前刹车片 2 套',
      time: '2024-03-10 10:00',
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Card
            title={
              <Space>
                <WarningOutlined style={{ color: '#faad14' }} />
                <span>缺货登记表</span>
              </Space>
            }
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setModalVisible(true)}
              >
                新增缺货登记
              </Button>
            }
          >
            <Table
              dataSource={shortageList}
              rowKey="id"
              columns={shortageColumns}
              loading={loading}
              size="small"
              pagination={{ pageSize: 5 }}
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card
            title={
              <Space>
                <ClockCircleOutlined style={{ color: '#1890ff' }} />
                <span>处理时间线</span>
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Timeline
              items={timelineData.map(item => ({
                color: item.color as any,
                children: (
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{item.title}</div>
                    <div style={{ color: '#666', fontSize: 13, margin: '4px 0' }}>
                      {item.description}
                    </div>
                    <div style={{ color: '#999', fontSize: 12 }}>{item.time}</div>
                  </div>
                ),
              }))}
            />
          </Card>

          <Card
            title={
              <Space>
                <FileTextOutlined style={{ color: '#722ed1' }} />
                <span>库存预警</span>
                <Badge count={inventoryList.length} size="small" />
              </Space>
            }
          >
            <List
              dataSource={inventoryList.slice(0, 5)}
              size="small"
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button type="link" size="small" key="add">
                      补货
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Badge status="warning" />}
                    title={item.partName}
                    description={
                      <span style={{ fontSize: 12 }}>
                        当前库存：<span style={{ color: '#f5222d' }}>{item.stock}</span>
                        {' / '}最低：{item.minStock}
                      </span>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <WarningOutlined style={{ color: '#f5222d' }} />
            <span>库存预警列表</span>
          </Space>
        }
        style={{ marginTop: 16 }}
      >
        <Table
          dataSource={inventoryList}
          rowKey="id"
          columns={inventoryColumns}
          loading={loading}
          size="small"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="新增缺货登记"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ quantity: 1 }}
        >
          <Form.Item
            name="partName"
            label="配件名称"
            rules={[{ required: true, message: '请输入配件名称' }]}
          >
            <Input placeholder="请输入配件名称" />
          </Form.Item>

          <Form.Item
            name="partCode"
            label="配件编码"
            rules={[{ required: true, message: '请输入配件编码' }]}
          >
            <Input placeholder="请输入配件编码" />
          </Form.Item>

          <Form.Item
            name="quantity"
            label="缺货数量"
            rules={[{ required: true, message: '请输入数量' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="expectedArrivalDate"
            label="预计到货日期"
            rules={[{ required: true, message: '请选择预计到货日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="appointmentId"
            label="关联预约单"
          >
            <Select placeholder="请选择关联的预约单（可选）" allowClear>
              <Option value="A003">YY20240310003 - 沪C11111</Option>
              <Option value="A002">YY20240310002 - 京B67890</Option>
            </Select>
          </Form.Item>

          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                确认登记
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
