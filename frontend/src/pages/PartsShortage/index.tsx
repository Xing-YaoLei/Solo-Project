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
import type { PartsShortageRecord, PartsInfo, AppointmentListItem } from '@/types';
import { partsApi } from '@/services/parts';
import { appointmentApi } from '@/services/appointment';
import dayjs from 'dayjs';

const { Option } = Select;

export default function PartsShortage() {
  const [form] = Form.useForm();
  const [shortageList, setShortageList] = useState<PartsShortageRecord[]>([]);
  const [inventoryList, setInventoryList] = useState<PartsInfo[]>([]);
  const [appointmentList, setAppointmentList] = useState<AppointmentListItem[]>([]);
  const [partsList, setPartsList] = useState<PartsInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [shortages, inventory, appts, parts] = await Promise.all([
        partsApi.getShortageList(),
        partsApi.getInventoryWarning(),
        appointmentApi.getList(),
        partsApi.getList(),
      ]);
      setShortageList(shortages || []);
      setInventoryList(inventory || []);
      setAppointmentList(appts || []);
      setPartsList(parts || []);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      await partsApi.createShortage({
        appointmentId: Number(values.appointmentId),
        partsId: Number(values.partsId),
        shortageQuantity: values.quantity,
        expectedArrivalTime: values.expectedArrivalDate
          ? values.expectedArrivalDate.toISOString()
          : undefined,
        handler: '当前用户',
        remarks: values.remark,
      });
      message.success('缺货登记成功');
      setModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error: any) {
      message.error(error?.response?.data || '登记失败');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (record: PartsShortageRecord) => {
    try {
      await partsApi.resolveShortage(record.id);
      message.success('缺货已解决');
      loadData();
    } catch (error: any) {
      message.error(error?.response?.data || '操作失败');
    }
  };

  const shortageColumns = [
    {
      title: '关联预约',
      dataIndex: 'appointmentNo',
      key: 'appointmentNo',
      width: 160,
      render: (text: string, record: PartsShortageRecord) => (
        <Space>
          <Tag color="blue">{text}</Tag>
          <span style={{ color: '#999', fontSize: 12 }}># {record.appointmentId}</span>
        </Space>
      ),
    },
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
      width: 150,
      render: (text: string) => (text ? dayjs(text).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '实际到货',
      dataIndex: 'actualArrivalTime',
      key: 'actualArrivalTime',
      width: 150,
      render: (text: string) => (text ? dayjs(text).format('YYYY-MM-DD HH:mm') : '-'),
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
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '处理人',
      dataIndex: 'handler',
      key: 'handler',
      width: 80,
    },
    {
      title: '操作',
      key: 'action',
      width: 110,
      render: (_: any, record: PartsShortageRecord) =>
        record.status === 'Pending' ? (
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => handleResolve(record)}
          >
            解决缺货
          </Button>
        ) : (
          <span style={{ color: '#999' }}>—</span>
        ),
    },
  ];

  const inventoryColumns = [
    {
      title: '配件名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: PartsInfo) => (
        <Space>
          <Badge status="warning" />
          <span>{text}</span>
          <span style={{ color: '#999', fontSize: 12 }}>{record.partNumber}</span>
        </Space>
      ),
    },
    {
      title: '当前库存',
      dataIndex: 'stockQuantity',
      key: 'stockQuantity',
      width: 100,
      render: (stock: number) => (
        <span style={{ color: '#f5222d', fontWeight: 'bold' }}>{stock}</span>
      ),
    },
    {
      title: '最低库存',
      dataIndex: 'safetyStock',
      key: 'safetyStock',
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

  const timelineData = shortageList.slice(0, 3).map((r, idx) => ({
    color: idx === 0 ? 'orange' : idx === 1 ? 'blue' : 'green',
    title:
      r.status === 'Resolved'
        ? '缺货解决'
        : r.status === 'Pending'
        ? '缺货登记'
        : '处理中',
    description: `${r.partName} 缺 ${r.shortageQuantity} 件，关联单号 ${r.appointmentNo}`,
    time: dayjs(r.createdAt).format('YYYY-MM-DD HH:mm'),
  }));

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Card
            title={
              <Space>
                <WarningOutlined style={{ color: '#faad14' }} />
                <span>缺货登记表</span>
                <Badge count={shortageList.filter(s => s.status === 'Pending').length} size="small" />
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
              items={timelineData.length ? timelineData.map(item => ({
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
              })) : [{
                color: 'gray',
                children: <span style={{ color: '#999' }}>暂无处理记录</span>,
              }]}
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
                    title={item.name}
                    description={
                      <span style={{ fontSize: 12 }}>
                        当前库存：<span style={{ color: '#f5222d' }}>{item.stockQuantity}</span>
                        {' / '}最低：{item.safetyStock}
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
        width={520}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ quantity: 1 }}
        >
          <Form.Item
            name="appointmentId"
            label="关联预约单"
            rules={[{ required: true, message: '请选择关联预约单' }]}
          >
            <Select placeholder="请选择关联预约单" showSearch optionFilterProp="children">
              {appointmentList.map(a => (
                <Option key={a.id} value={a.id}>
                  {a.appointmentNo} - {a.plateNumber} ({a.ownerName})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="partsId"
            label="配件"
            rules={[{ required: true, message: '请选择配件' }]}
          >
            <Select placeholder="请选择缺货配件" showSearch optionFilterProp="children">
              {partsList.map(p => (
                <Option key={p.id} value={p.id}>
                  {p.name}（{p.partNumber}）库存 {p.stockQuantity}
                </Option>
              ))}
            </Select>
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
          >
            <DatePicker showTime style={{ width: '100%' }} />
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
