import { useState, useEffect } from 'react';
import { 
  Card, Form, Input, Select, DatePicker, InputNumber, 
  Button, Space, message, Row, Col, Table, Tag, Modal,
  AutoComplete
} from 'antd';
import { 
  PlusOutlined, SearchOutlined, CarOutlined, 
  UserOutlined, SaveOutlined 
} from '@ant-design/icons';
import type { VehicleInfo } from '@/types';
import { vehicleApi } from '@/services/vehicle';
import { appointmentApi } from '@/services/appointment';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;
const { TextArea } = Input;

export default function AppointmentForm() {
  const [form] = Form.useForm();
  const [vehicleForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [vehicleModalVisible, setVehicleModalVisible] = useState(false);
  const [vehicleList, setVehicleList] = useState<VehicleInfo[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleInfo | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isNewVehicle, setIsNewVehicle] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async (keyword?: string) => {
    try {
      const list = await vehicleApi.getList({ keyword });
      setVehicleList(list);
    } catch (error) {
      console.error('Failed to load vehicles:', error);
    }
  };

  const handleSearchVehicle = (keyword: string) => {
    setSearchKeyword(keyword);
    if (keyword.length >= 1) {
      loadVehicles(keyword);
    }
  };

  const handleSelectVehicle = (vehicle: VehicleInfo) => {
    setSelectedVehicle(vehicle);
    setIsNewVehicle(false);
    form.setFieldsValue({
      plateNumber: vehicle.plateNumber,
      vin: vehicle.vinNumber,
      brand: vehicle.brand,
      model: vehicle.model,
      color: vehicle.color,
      mileage: vehicle.mileage,
      ownerName: vehicle.ownerName,
      ownerPhone: vehicle.ownerPhone,
    });
    setVehicleModalVisible(false);
  };

  const handleNewVehicle = () => {
    setIsNewVehicle(true);
    setSelectedVehicle(null);
    form.resetFields([
      'plateNumber', 'vin', 'brand', 'model', 'color', 
      'mileage', 'ownerName', 'ownerPhone'
    ]);
    setVehicleModalVisible(false);
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const vehicle = selectedVehicle || {
        id: Date.now(),
        plateNumber: values.plateNumber,
        vinNumber: values.vin,
        brand: values.brand,
        model: values.model,
        color: values.color,
        mileage: values.mileage,
        ownerName: values.ownerName,
        ownerPhone: values.ownerPhone,
        registerDate: new Date().toISOString().slice(0, 10),
        lastMaintenanceDate: new Date().toISOString().slice(0, 10),
        repairCount: 0,
      };

      await appointmentApi.create({
        vehicle,
        appointmentTime: values.appointmentTime?.toISOString(),
        faultDescription: values.faultDescription,
        source: values.source,
        personInCharge: values.handler,
        quote: {
          id: Date.now(),
          appointmentId: 0,
          appointmentNo: '',
          quoteItems: [],
          laborCost: 0,
          partsCost: 0,
          totalAmount: 0,
          status: 'Draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        photos: [],
        partsShortages: [],
        serviceRecords: [],
        historyRecords: [],
      });

      message.success('预约单创建成功');
      navigate('/');
    } catch (error) {
      message.error('创建失败');
    } finally {
      setLoading(false);
    }
  };

  const vehicleColumns = [
    {
      title: '车牌号',
      dataIndex: 'plateNumber',
      key: 'plateNumber',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '品牌型号',
      dataIndex: 'brand',
      key: 'brand',
      render: (_: any, record: VehicleInfo) => `${record.brand} ${record.model}`,
    },
    {
      title: '车架号',
      dataIndex: 'vinNumber',
      key: 'vinNumber',
      render: (text: string) => <span style={{ color: '#999', fontSize: 12 }}>{text}</span>,
    },
    {
      title: '车主',
      dataIndex: 'ownerName',
      key: 'ownerName',
    },
    {
      title: '里程',
      dataIndex: 'mileage',
      key: 'mileage',
      render: (m: number) => `${m.toLocaleString()} km`,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: VehicleInfo) => (
        <Button type="primary" size="small" onClick={() => handleSelectVehicle(record)}>
          选择
        </Button>
      ),
    },
  ];

  const sourceOptions = [
    { value: 'WalkIn', label: '到店' },
    { value: 'Phone', label: '电话' },
    { value: 'Online', label: '线上' },
  ];

  const handlerOptions = [
    { value: '张师傅', label: '张师傅' },
    { value: '李师傅', label: '李师傅' },
    { value: '王师傅', label: '王师傅' },
    { value: '赵师傅', label: '赵师傅' },
    { value: '刘师傅', label: '刘师傅' },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Card
        title={
          <Space>
            <CarOutlined />
            <span>预约单录入</span>
          </Space>
        }
        extra={
          <Button
            icon={<SearchOutlined />}
            onClick={() => setVehicleModalVisible(true)}
          >
            选择已有车辆
          </Button>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            source: 'Phone',
            handler: '张师傅',
          }}
        >
          <Card 
            type="inner" 
            title={
              <Space>
                <CarOutlined />
                车辆信息
                {isNewVehicle && <Tag color="green">新建</Tag>}
                {selectedVehicle && <Tag color="blue">已选择</Tag>}
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item
                  name="plateNumber"
                  label="车牌号"
                  rules={[{ required: true, message: '请输入车牌号' }]}
                >
                  <Input placeholder="请输入车牌号" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name="brand"
                  label="品牌"
                  rules={[{ required: true, message: '请输入品牌' }]}
                >
                  <Input placeholder="请输入品牌" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name="model"
                  label="型号"
                  rules={[{ required: true, message: '请输入型号' }]}
                >
                  <Input placeholder="请输入型号" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name="color"
                  label="颜色"
                >
                  <Input placeholder="请输入颜色" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="vin"
                  label="车架号(VIN)"
                  rules={[{ required: true, message: '请输入车架号' }]}
                >
                  <Input placeholder="请输入17位车架号" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name="mileage"
                  label="当前里程(km)"
                  rules={[{ required: true, message: '请输入里程' }]}
                >
                  <InputNumber 
                    style={{ width: '100%' }} 
                    min={0}
                    placeholder="请输入里程"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card 
            type="inner" 
            title={
              <Space>
                <UserOutlined />
                车主信息
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="ownerName"
                  label="车主姓名"
                  rules={[{ required: true, message: '请输入车主姓名' }]}
                >
                  <Input placeholder="请输入车主姓名" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="ownerPhone"
                  label="联系电话"
                  rules={[{ required: true, message: '请输入联系电话' }]}
                >
                  <Input placeholder="请输入联系电话" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card 
            type="inner" 
            title="预约信息"
            style={{ marginBottom: 16 }}
          >
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="appointmentTime"
                  label="预约时间"
                  rules={[{ required: true, message: '请选择预约时间' }]}
                >
                  <DatePicker showTime style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="source"
                  label="来源渠道"
                  rules={[{ required: true, message: '请选择来源渠道' }]}
                >
                  <Select options={sourceOptions} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="handler"
                  label="负责人"
                  rules={[{ required: true, message: '请选择负责人' }]}
                >
                  <Select options={handlerOptions} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              name="faultDescription"
              label="故障描述"
              rules={[{ required: true, message: '请描述故障情况' }]}
            >
              <TextArea 
                rows={4} 
                placeholder="请详细描述故障情况，如异响位置、发生条件、持续时间等"
              />
            </Form.Item>
          </Card>

          <Form.Item style={{ marginBottom: 0, textAlign: 'center' }}>
            <Space size="large">
              <Button size="large" onClick={() => navigate('/')}>
                取消
              </Button>
              <Button 
                type="primary" 
                size="large" 
                htmlType="submit" 
                icon={<SaveOutlined />}
                loading={loading}
              >
                提交预约
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Modal
        title="选择已有车辆档案"
        open={vehicleModalVisible}
        onCancel={() => setVehicleModalVisible(false)}
        width={800}
        footer={[
          <Button key="new" type="primary" icon={<PlusOutlined />} onClick={handleNewVehicle}>
            新建车辆档案
          </Button>,
          <Button key="close" onClick={() => setVehicleModalVisible(false)}>
            取消
          </Button>,
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <AutoComplete
            style={{ width: '100%' }}
            placeholder="搜索车牌号、车架号、车主姓名或电话"
            onSearch={handleSearchVehicle}
            allowClear
          />
        </div>
        <Table
          dataSource={vehicleList}
          columns={vehicleColumns}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 5 }}
          scroll={{ y: 300 }}
        />
      </Modal>
    </div>
  );
}
