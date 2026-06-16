import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  message,
  Card,
  Row,
  Col,
  Progress,
  List,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { treatmentPlanApi } from '../services';
import type { TreatmentPlan, TreatmentStatus } from '../types';
import {
  getTreatmentStatusText,
  formatDate,
  formatCurrency,
} from '../utils/format';

const { Option } = Select;

const TreatmentPlans = () => {
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<TreatmentStatus | undefined>();
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<TreatmentPlan | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadPlans();
  }, [status]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await treatmentPlanApi.getTreatmentPlans({
        status,
        pageSize: 50,
      });
      setPlans(response.data);
    } catch (error) {
      console.error('加载治疗计划失败:', error);
      message.error('加载治疗计划失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      await treatmentPlanApi.createTreatmentPlan({
        ...values,
        startDate: values.startDate?.format('YYYY-MM-DD'),
        expectedEndDate: values.expectedEndDate?.format('YYYY-MM-DD'),
        planItems: [],
      });
      message.success('治疗计划创建成功');
      setIsModalVisible(false);
      form.resetFields();
      loadPlans();
    } catch (error) {
      message.error('创建治疗计划失败');
    }
  };

  const getProgress = (plan: TreatmentPlan) => {
    if (!plan.totalVisits) return 0;
    return Math.round((plan.completedVisits / plan.totalVisits) * 100);
  };

  const columns = [
    {
      title: '计划名称',
      dataIndex: 'planName',
      key: 'planName',
      width: 200,
    },
    {
      title: '患者',
      dataIndex: 'patientName',
      key: 'patientName',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: TreatmentStatus) => (
        <Tag
          color={
            status === 2
              ? 'green'
              : status === 1
              ? 'blue'
              : status === 3
              ? 'orange'
              : 'default'
          }
        >
          {getTreatmentStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '治疗进度',
      key: 'progress',
      width: 200,
      render: (_: any, record: TreatmentPlan) => (
        <div>
          <Progress
            percent={getProgress(record)}
            size="small"
            status={record.status === 2 ? 'success' : 'active'}
          />
          <div style={{ fontSize: 12, color: '#999' }}>
            {record.completedVisits}/{record.totalVisits || 0} 次
          </div>
        </div>
      ),
    },
    {
      title: '预估费用',
      dataIndex: 'estimatedCost',
      key: 'estimatedCost',
      width: 120,
      render: (cost: number) => formatCurrency(cost),
    },
    {
      title: '实际费用',
      dataIndex: 'actualCost',
      key: 'actualCost',
      width: 120,
      render: (cost: number) => formatCurrency(cost),
    },
    {
      title: '开始日期',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 120,
      render: (date: string) => date && formatDate(date),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: TreatmentPlan) => (
        <Button type="link" onClick={() => setSelectedPlan(record)}>
          查看详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 className="page-title" style={{ margin: 0 }}>
          治疗计划
        </h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
          新建计划
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <div style={{ marginBottom: 8, color: '#666' }}>状态</div>
            <Select
              placeholder="全部状态"
              allowClear
              style={{ width: '100%' }}
              value={status}
              onChange={setStatus}
            >
              <Option value={0}>计划中</Option>
              <Option value={1}>进行中</Option>
              <Option value={2}>已完成</Option>
              <Option value={3}>已暂停</Option>
            </Select>
          </Col>
          <Col span={12}>
            <div style={{ marginBottom: 8, color: '#666' }}>搜索</div>
            <Input
              placeholder="搜索计划名称/患者"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col span={2}>
            <div style={{ marginBottom: 8, color: '#fff' }}>-</div>
            <Button type="primary" icon={<SearchOutlined />} onClick={loadPlans}>
              查询
            </Button>
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={plans}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20 }}
      />

      <Modal
        title="新建治疗计划"
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
            name="planName"
            label="计划名称"
            rules={[{ required: true, message: '请输入计划名称' }]}
          >
            <Input placeholder="请输入计划名称" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startDate" label="开始日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expectedEndDate" label="预计结束日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="estimatedCost" label="预估费用">
            <InputNumber style={{ width: '100%' }} prefix="¥" min={0} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="doctorName" label="主治医生">
                <Input placeholder="请输入医生姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="totalVisits" label="预计就诊次数">
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="计划说明">
            <Input.TextArea rows={3} placeholder="请输入治疗计划说明" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              创建计划
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="治疗计划详情"
        open={!!selectedPlan}
        onCancel={() => setSelectedPlan(null)}
        footer={null}
        width={700}
      >
        {selectedPlan && (
          <div>
            <Card style={{ marginBottom: 16 }}>
              <h3 style={{ marginBottom: 16 }}>{selectedPlan.planName}</h3>
              <Row gutter={16}>
                <Col span={8}>
                  <div style={{ color: '#666' }}>患者</div>
                  <div style={{ fontWeight: 600 }}>{selectedPlan.patientName}</div>
                </Col>
                <Col span={8}>
                  <div style={{ color: '#666' }}>状态</div>
                  <Tag
                    color={
                      selectedPlan.status === 2
                        ? 'green'
                        : selectedPlan.status === 1
                        ? 'blue'
                        : 'default'
                    }
                  >
                    {getTreatmentStatusText(selectedPlan.status)}
                  </Tag>
                </Col>
                <Col span={8}>
                  <div style={{ color: '#666' }}>主治医生</div>
                  <div>{selectedPlan.doctorName || '-'}</div>
                </Col>
              </Row>
              <Row gutter={16} style={{ marginTop: 12 }}>
                <Col span={8}>
                  <div style={{ color: '#666' }}>预估费用</div>
                  <div style={{ fontWeight: 600 }}>
                    {formatCurrency(selectedPlan.estimatedCost)}
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ color: '#666' }}>实际费用</div>
                  <div style={{ fontWeight: 600, color: '#1890ff' }}>
                    {formatCurrency(selectedPlan.actualCost)}
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ color: '#666' }}>治疗进度</div>
                  <Progress
                    percent={getProgress(selectedPlan)}
                    size="small"
                    status={selectedPlan.status === 2 ? 'success' : 'active'}
                  />
                </Col>
              </Row>
            </Card>

            <h4 className="section-title">治疗项目</h4>
            <List
              dataSource={selectedPlan.planItems}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      item.isCompleted ? (
                        <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 24 }} />
                      ) : (
                        <ClockCircleOutlined style={{ color: '#faad14', fontSize: 24 }} />
                      )
                    }
                    title={
                      <span>
                        {item.sequence}. {item.itemName}
                      </span>
                    }
                    description={item.description}
                  />
                  <div>
                    <div>{formatCurrency(item.price)} × {item.quantity}</div>
                    <div style={{ fontWeight: 600, color: '#1890ff' }}>
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TreatmentPlans;
