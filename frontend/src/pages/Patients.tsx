import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Card,
  Row,
  Col,
  Avatar,
  Descriptions,
  InputNumber,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  UserOutlined,
  EyeOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { patientApi } from '../services';
import type { Patient, MemberLevel, Gender } from '../types';
import {
  getMemberLevelText,
  getGenderText,
  formatDate,
  getRiskLevelText,
  getRiskBadgeClass,
} from '../utils/format';

const { Option } = Select;

const Patients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [memberLevel, setMemberLevel] = useState<MemberLevel | undefined>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadPatients();
  }, [memberLevel]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const response = await patientApi.getPatients(searchText, 1, 50);
      setPatients(response.data as any);
    } catch (error) {
      console.error('加载患者列表失败:', error);
      message.error('加载患者列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      await patientApi.createPatient({
        ...values,
        dateOfBirth: values.dateOfBirth?.format('YYYY-MM-DD'),
      });
      message.success('患者创建成功');
      setIsModalVisible(false);
      form.resetFields();
      loadPatients();
    } catch (error) {
      message.error('创建患者失败');
    }
  };

  const viewDetail = async (id: number) => {
    try {
      const response = await patientApi.getPatient(id);
      setSelectedPatient(response.data);
      setIsDetailModalVisible(true);
    } catch (error) {
      message.error('加载患者详情失败');
    }
  };

  const columns = [
    {
      title: '患者编号',
      dataIndex: 'patientNo',
      key: 'patientNo',
      width: 120,
    },
    {
      title: '姓名',
      key: 'name',
      width: 120,
      render: (_: any, record: Patient) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar size={32} icon={<UserOutlined />} />
          <span style={{ marginLeft: 8 }}>{record.name}</span>
        </div>
      ),
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 80,
      render: (gender: Gender) => getGenderText(gender),
    },
    {
      title: '出生日期',
      dataIndex: 'dateOfBirth',
      key: 'dateOfBirth',
      width: 120,
      render: (date: string) => (date ? formatDate(date) : '-'),
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
    },
    {
      title: '会员等级',
      dataIndex: 'memberLevel',
      key: 'memberLevel',
      width: 100,
      render: (level: MemberLevel) => {
        const colors: Record<number, string> = {
          0: 'default',
          1: 'blue',
          2: 'gold',
          3: 'purple',
        };
        return <Tag color={colors[level]}>{getMemberLevelText(level)}</Tag>;
      },
    },
    {
      title: '爽约/总预约',
      key: 'appointments',
      width: 120,
      render: (_: any, record: Patient) => (
        <div>
          <span style={{ color: '#f5222d' }}>{record.noShowCount}</span>
          <span style={{ color: '#999' }}> / {record.totalAppointments}</span>
        </div>
      ),
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      width: 100,
      render: (level: any) => (
        <span className={getRiskBadgeClass(level || 0)}>
          {getRiskLevelText(level || 0)}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: Patient) => (
        <Space size="small">
          <Button type="link" icon={<EyeOutlined />} onClick={() => viewDetail(record.id)}>
            详情
          </Button>
          <Button type="link" icon={<EditOutlined />}>
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 className="page-title" style={{ margin: 0 }}>
          患者档案
        </h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
          新建患者
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <div style={{ marginBottom: 8, color: '#666' }}>会员等级</div>
            <Select
              placeholder="全部等级"
              allowClear
              style={{ width: '100%' }}
              value={memberLevel}
              onChange={setMemberLevel}
            >
              <Option value={0}>普通会员</Option>
              <Option value={1}>银卡会员</Option>
              <Option value={2}>金卡会员</Option>
              <Option value={3}>白金会员</Option>
            </Select>
          </Col>
          <Col span={12}>
            <div style={{ marginBottom: 8, color: '#666' }}>搜索</div>
            <Input
              placeholder="搜索患者姓名/电话/编号"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={loadPatients}
            />
          </Col>
          <Col span={2}>
            <div style={{ marginBottom: 8, color: '#fff' }}>-</div>
            <Button type="primary" icon={<SearchOutlined />} onClick={loadPatients}>
              查询
            </Button>
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={patients}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20 }}
      />

      <Modal
        title="新建患者"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="姓名"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="gender" label="性别" rules={[{ required: true, message: '请选择性别' }]}>
                <Select placeholder="请选择">
                  <Option value={0}>男</Option>
                  <Option value={1}>女</Option>
                  <Option value={2}>其他</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="联系电话"
                rules={[{ required: true, message: '请输入联系电话' }]}
              >
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="邮箱">
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="dateOfBirth" label="出生日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="memberLevel" label="会员等级">
                <Select placeholder="请选择">
                  <Option value={0}>普通会员</Option>
                  <Option value={1}>银卡会员</Option>
                  <Option value={2}>金卡会员</Option>
                  <Option value={3}>白金会员</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="address" label="地址">
            <Input placeholder="请输入地址" />
          </Form.Item>
          <Form.Item name="medicalHistory" label="既往病史">
            <Input.TextArea rows={2} placeholder="请输入既往病史" />
          </Form.Item>
          <Form.Item name="allergyHistory" label="过敏史">
            <Input.TextArea rows={2} placeholder="请输入过敏史" />
          </Form.Item>
          <Form.Item name="remarks" label="备注">
            <Input.TextArea rows={2} placeholder="请输入备注" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              创建患者档案
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="患者详情"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedPatient && (
          <div>
            <Card style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                <Avatar size={64} icon={<UserOutlined />} />
                <div style={{ marginLeft: 16 }}>
                  <h3 style={{ margin: 0 }}>{selectedPatient.name}</h3>
                  <div style={{ color: '#666', marginTop: 4 }}>
                    {selectedPatient.patientNo} · {getGenderText(selectedPatient.gender)}
                  </div>
                  <Tag color="purple" style={{ marginTop: 4 }}>
                    {getMemberLevelText(selectedPatient.memberLevel)}
                  </Tag>
                </div>
              </div>

              <Descriptions column={2} size="small">
                <Descriptions.Item label="联系电话">
                  {selectedPatient.phone || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="邮箱">
                  {selectedPatient.email || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="出生日期">
                  {selectedPatient.dateOfBirth ? formatDate(selectedPatient.dateOfBirth) : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="地址">
                  {selectedPatient.address || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="总预约次数">
                  {selectedPatient.totalAppointments}
                </Descriptions.Item>
                <Descriptions.Item label="爽约次数">
                  <span style={{ color: '#f5222d' }}>{selectedPatient.noShowCount}</span>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="健康档案" size="small">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="既往病史">
                  {selectedPatient.medicalHistory || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="过敏史">
                  {selectedPatient.allergyHistory || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="备注">
                  {selectedPatient.remarks || '-'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Patients;
