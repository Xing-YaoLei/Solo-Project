import { useState, useEffect } from 'react';
import {
  Card, Form, Input, Select, DatePicker, InputNumber,
  Button, Space, message, Row, Col, Table, Tag, Modal,
  AutoComplete, Divider
} from 'antd';
import {
  PlusOutlined, SearchOutlined, CarOutlined,
  UserOutlined, SaveOutlined, ReloadOutlined
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import type { VehicleInfo, AppointmentSource } from '@/types';
import { vehicleApi, appointmentApi, type CreateVehiclePayload, type CreateAppointmentPayload } from '@/services/appointment';
import { useNavigate } from 'react-router-dom';

const { TextArea } = Input;

export default function AppointmentForm() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [vehicleModalVisible, setVehicleModalVisible] = useState(false);
  const [vehicleList, setVehicleList] = useState<VehicleInfo[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleInfo | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isNewVehicle, setIsNewVehicle] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async (keyword?: string) => {
    try {
      setLoading(true);
      const list = await vehicleApi.getList({ keyword: keyword?.trim() || undefined });
      setVehicleList(list);
    } catch (error) {
      console.error('加载车辆失败:', error);
      message.error('加载车辆列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchVehicle = (keyword: string) => {
    setSearchKeyword(keyword);
    loadVehicles(keyword);
  };

  const handleSelectVehicle = (vehicle: VehicleInfo) => {
    setSelectedVehicle(vehicle);
    setIsNewVehicle(false);
    form.setFieldsValue({
      plateNumber: vehicle.plateNumber,
      vin: vehicle.vinNumber,
      brand: vehicle.brand,
      model: vehicle.model,
      mileage: vehicle.mileage,
      ownerName: vehicle.ownerName,
      ownerPhone: vehicle.ownerPhone,
    });
    setVehicleModalVisible(false);
    message.success(`已选择车辆：${vehicle.plateNumber}`);
  };

  const handleNewVehicle = () => {
    setIsNewVehicle(true);
    setSelectedVehicle(null);
    form.resetFields([
      'plateNumber', 'vin', 'brand', 'model', 'color',
      'mileage', 'ownerName', 'ownerPhone'
    ]);
    setVehicleModalVisible(false);
    message.info('已切换到新建车辆模式，请直接填写车辆信息');
  };

  const handleUseExisting = () => {
    setVehicleModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      let vehicleId: number;

      if (isNewVehicle) {
        if (!values.plateNumber || !values.vin || !values.brand || !values.model
          || !values.ownerName || !values.ownerPhone || values.mileage === undefined) {
          message.warning('请完整填写车辆信息');
          setSubmitting(false);
          return;
        }

        const vehiclePayload: CreateVehiclePayload = {
          plateNumber: values.plateNumber.trim().toUpperCase(),
          vinNumber: values.vin.trim(),
          brand: values.brand.trim(),
          model: values.model.trim(),
          ownerName: values.ownerName.trim(),
          ownerPhone: values.ownerPhone.trim(),
          mileage: Number(values.mileage),
        };

        const createdVehicle = await vehicleApi.create(vehiclePayload);
        vehicleId = createdVehicle.id;
        message.success(`车辆档案已创建：${createdVehicle.plateNumber}`);
      } else if (selectedVehicle) {
        vehicleId = selectedVehicle.id;
      } else {
        message.warning('请选择已有车辆或切换到新建车辆模式');
        setSubmitting(false);
        return;
      }

      const appointmentTime: Dayjs | undefined = values.appointmentTime;
      if (!appointmentTime) {
        message.warning('请选择预约时间');
        setSubmitting(false);
        return;
      }

      const appointmentPayload: CreateAppointmentPayload = {
        vehicleId,
        appointmentTime: appointmentTime.toISOString(),
        source: values.source as AppointmentSource,
        personInCharge: values.handler?.trim() || undefined,
        faultDescription: values.faultDescription?.trim() || undefined,
        remarks: values.remarks?.trim() || undefined,
      };

      const created = await appointmentApi.create(appointmentPayload);

      message.success(`预约单创建成功：${created.appointmentNo}`);
      setTimeout(() => {
        navigate('/');
      }, 600);
    } catch (error: any) {
      console.error('创建失败:', error);
      const msg = error?.response?.data?.message || error?.message || '创建预约单失败';
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const vehicleColumns = [
    {
      title: '车牌号',
      dataIndex: 'plateNumber',
      key: 'plateNumber',
      width: 110,
      render: (text: string) => <Tag color="blue" style={{ fontSize: 13 }}>{text}</Tag>,
    },
    {
      title: '品牌型号',
      key: 'brandModel',
      render: (_: any, record: VehicleInfo) => (
        <span>
          <span style={{ fontWeight: 500 }}>{record.brand}</span>
          <span style={{ color: '#888', marginLeft: 6 }}>{record.model}</span>
        </span>
      ),
    },
    {
      title: '车架号',
      dataIndex: 'vinNumber',
      key: 'vinNumber',
      width: 180,
      render: (text: string) => (
        <span style={{ color: '#999', fontSize: 12, fontFamily: 'monospace' }}>{text}</span>
      ),
    },
    {
      title: '车主',
      dataIndex: 'ownerName',
      key: 'ownerName',
      width: 100,
    },
    {
      title: '联系电话',
      dataIndex: 'ownerPhone',
      key: 'ownerPhone',
      width: 130,
    },
    {
      title: '里程',
      dataIndex: 'mileage',
      key: 'mileage',
      width: 100,
      render: (m: number) => <span style={{ color: '#555' }}>{m.toLocaleString()} km</span>,
    },
    {
      title: '操作',
      key: 'action',
      width: 90,
      fixed: 'right' as const,
      render: (_: any, record: VehicleInfo) => (
        <Button type="primary" size="small" onClick={() => handleSelectVehicle(record)}>
          选择
        </Button>
      ),
    },
  ];

  const sourceOptions = [
    { value: 'WalkIn', label: '到店 (WalkIn)' },
    { value: 'Phone', label: '电话 (Phone)' },
    { value: 'Online', label: '线上 (Online)' },
  ];

  const handlerOptions = [
    { value: '张师傅', label: '张师傅' },
    { value: '李师傅', label: '李师傅' },
    { value: '王师傅', label: '王师傅' },
    { value: '赵师傅', label: '赵师傅' },
    { value: '刘师傅', label: '刘师傅' },
  ];

  return (
    <div style={{ maxWidth: 1280, margin: '24px auto', padding: '0 24px' }}>
      <Card
        title={
          <Space size={10}>
            <CarOutlined style={{ fontSize: 20, color: '#1677ff' }} />
            <span style={{ fontSize: 18 }}>预约单录入</span>
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<SearchOutlined />}
              onClick={handleUseExisting}
              type={selectedVehicle ? 'primary' : 'default'}
            >
              选择已有车辆
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setIsNewVehicle(true);
                setSelectedVehicle(null);
                message.info('已切换到新建车辆模式');
              }}
              type={isNewVehicle ? 'primary' : 'default'}
            >
              新建车辆
            </Button>
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            source: 'Phone',
            handler: '张师傅',
            appointmentTime: dayjs().add(1, 'hour').minute(0).second(0),
          }}
          requiredMark
        >
          <Card
            type="inner"
            title={
              <Space>
                <CarOutlined style={{ color: '#1677ff' }} />
                <span>车辆信息</span>
                {selectedVehicle && <Tag color="blue" icon={<SearchOutlined />}>已选择：{selectedVehicle.plateNumber}</Tag>}
                {isNewVehicle && <Tag color="green" icon={<PlusOutlined />}>新建车辆档案</Tag>}
                {!selectedVehicle && !isNewVehicle && <Tag color="orange">请选择车辆或切换到新建模式</Tag>}
              </Space>
            }
            style={{ marginBottom: 20 }}
          >
            <Row gutter={20}>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item
                  name="plateNumber"
                  label="车牌号"
                  rules={[{ required: true, message: '请输入车牌号' }]}
                >
                  <Input
                    placeholder="如：粤B12345"
                    style={{ textTransform: 'uppercase', letterSpacing: 1 }}
                    disabled={!!selectedVehicle && !isNewVehicle}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item
                  name="brand"
                  label="品牌"
                  rules={[{ required: true, message: '请输入品牌' }]}
                >
                  <Input placeholder="如：丰田、宝马" disabled={!!selectedVehicle && !isNewVehicle} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item
                  name="model"
                  label="型号"
                  rules={[{ required: true, message: '请输入型号' }]}
                >
                  <Input placeholder="如：凯美瑞 2.5G" disabled={!!selectedVehicle && !isNewVehicle} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item name="color" label="颜色">
                  <Input placeholder="车身颜色（选填）" disabled={!!selectedVehicle && !isNewVehicle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={20}>
              <Col xs={24} sm={24} md={12} lg={12}>
                <Form.Item
                  name="vin"
                  label="车架号 (VIN)"
                  rules={[
                    { required: true, message: '请输入车架号' },
                    { len: 17, message: '车架号应为17位' }
                  ]}
                  extra="通常在车辆前挡风玻璃左下角可找到"
                >
                  <Input
                    placeholder="请输入17位车架号"
                    style={{ fontFamily: 'monospace', letterSpacing: 1 }}
                    disabled={!!selectedVehicle && !isNewVehicle}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6} lg={6}>
                <Form.Item
                  name="mileage"
                  label="当前里程 (km)"
                  rules={[{ required: true, message: '请输入里程数' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    max={9999999}
                    step={1000}
                    formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(v: string | undefined) => (v ? Number(v.replace(/[^0-9]/g, '')) : 0) as 0}
                    placeholder="里程公里数"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card
            type="inner"
            title={
              <Space>
                <UserOutlined style={{ color: '#52c41a' }} />
                <span>车主信息</span>
              </Space>
            }
            style={{ marginBottom: 20 }}
          >
            <Row gutter={20}>
              <Col xs={24} sm={12} md={8} lg={8}>
                <Form.Item
                  name="ownerName"
                  label="车主姓名"
                  rules={[{ required: true, message: '请输入车主姓名' }]}
                >
                  <Input placeholder="请输入车主姓名" prefix={<UserOutlined />} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8} lg={8}>
                <Form.Item
                  name="ownerPhone"
                  label="联系电话"
                  rules={[
                    { required: true, message: '请输入联系电话' },
                    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
                  ]}
                >
                  <Input placeholder="11位手机号" maxLength={11} />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card
            type="inner"
            title="预约信息"
            style={{ marginBottom: 24 }}
          >
            <Row gutter={20}>
              <Col xs={24} sm={12} md={8} lg={8}>
                <Form.Item
                  name="appointmentTime"
                  label="预约进厂时间"
                  rules={[{ required: true, message: '请选择预约时间' }]}
                  extra="建议选择营业时间内"
                >
                  <DatePicker
                    showTime={{ format: 'HH:mm', minuteStep: 30 }}
                    format="YYYY-MM-DD HH:mm"
                    style={{ width: '100%' }}
                    disabledDate={d => d && d.isBefore(dayjs().startOf('day'))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8} lg={8}>
                <Form.Item
                  name="source"
                  label="来源渠道"
                  rules={[{ required: true, message: '请选择来源渠道' }]}
                >
                  <Select options={sourceOptions} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8} lg={8}>
                <Form.Item
                  name="handler"
                  label="服务顾问 / 负责人"
                  rules={[{ required: true, message: '请选择负责人' }]}
                >
                  <Select
                    options={handlerOptions}
                    showSearch
                    optionFilterProp="label"
                    allowClear
                    placeholder="选择或输入"
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={20}>
              <Col xs={24} sm={24} md={24} lg={24}>
                <Form.Item
                  name="faultDescription"
                  label="故障描述 / 服务需求"
                  rules={[{ required: true, message: '请描述故障或服务内容' }]}
                  extra="请尽量详细描述，如异响位置、发生条件、持续时间、保养需求等"
                >
                  <TextArea
                    rows={4}
                    placeholder="例如：1) 低速过减速带时右前轮有金属异响；2) 需做常规保养（机油+机滤）；3) 左侧后视镜电动调节失灵……"
                    showCount
                    maxLength={1000}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={20}>
              <Col xs={24} sm={24} md={24} lg={24}>
                <Form.Item
                  name="remarks"
                  label="备注"
                >
                  <TextArea
                    rows={2}
                    placeholder="补充说明信息（选填），如特殊配件、客户要求等"
                    maxLength={500}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Divider />

          <Form.Item style={{ marginBottom: 0, textAlign: 'center' }}>
            <Space size="large" wrap>
              <Button size="large" onClick={() => navigate('/')} style={{ minWidth: 140 }}>
                取消
              </Button>
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={submitting}
                style={{ minWidth: 180, height: 44, fontSize: 15 }}
              >
                {submitting ? '正在提交...' : '提交预约单'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Modal
        title={
          <Space>
            <SearchOutlined />
            <span>选择已有车辆档案</span>
          </Space>
        }
        open={vehicleModalVisible}
        onCancel={() => setVehicleModalVisible(false)}
        width={1000}
        style={{ top: 60 }}
        footer={[
          <Button key="new" type="primary" icon={<PlusOutlined />} onClick={handleNewVehicle}>
            找不到？新建车辆档案
          </Button>,
          <Button key="close" onClick={() => setVehicleModalVisible(false)}>
            关闭
          </Button>,
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <AutoComplete
            style={{ width: '100%' }}
            placeholder="输入关键字搜索：车牌号 / 车架号 / 车主姓名 / 电话 / 品牌"
            onSearch={handleSearchVehicle}
            allowClear
            size="large"
          />
        </div>
        <Table<VehicleInfo>
          loading={loading}
          dataSource={vehicleList}
          columns={vehicleColumns}
          rowKey="id"
          size="middle"
          pagination={{ pageSize: 5, showSizeChanger: false, showTotal: t => `共 ${t} 条记录` }}
          scroll={{ y: 360, x: 900 }}
          locale={{ emptyText: searchKeyword ? '未找到匹配车辆，可点击下方「新建车辆档案」' : '暂无车辆档案' }}
        />
      </Modal>
    </div>
  );
}
