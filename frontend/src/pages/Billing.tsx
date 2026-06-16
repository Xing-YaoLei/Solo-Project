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
  Select,
  DatePicker,
  message,
  Card,
  Row,
  Col,
  List,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  DollarOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { billingApi } from '../services';
import type { BillingRecord, BillingStatus } from '../types';
import {
  getBillingStatusText,
  formatDate,
  formatCurrency,
  formatDateTime,
} from '../utils/format';

const { RangePicker } = DatePicker;
const { Option } = Select;

const Billing = () => {
  const [records, setRecords] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<BillingStatus | undefined>();
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<BillingRecord | null>(null);
  const [form] = Form.useForm();
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    loadRecords();
    loadTotalRevenue();
  }, [status, dateRange]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const response = await billingApi.getBillingRecords({
        status,
        startDate: dateRange?.[0]?.format('YYYY-MM-DD'),
        endDate: dateRange?.[1]?.format('YYYY-MM-DD'),
        pageSize: 50,
      });
      setRecords(response.data);
    } catch (error) {
      console.error('加载收费记录失败:', error);
      message.error('加载收费记录失败');
    } finally {
      setLoading(false);
    }
  };

  const loadTotalRevenue = async () => {
    try {
      const response = await billingApi.getTotalRevenue(
        dateRange?.[0]?.format('YYYY-MM-DD'),
        dateRange?.[1]?.format('YYYY-MM-DD')
      );
      setTotalRevenue(response.data);
    } catch (error) {
      console.error('加载营收数据失败:', error);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      const items = [
        {
          itemName: values.itemName,
          description: values.description,
          unitPrice: values.unitPrice,
          quantity: values.quantity,
        },
      ];

      await billingApi.createBillingRecord({
        patientId: values.patientId,
        discountAmount: values.discountAmount || 0,
        paidAmount: values.paidAmount || 0,
        paymentMethod: values.paymentMethod,
        cashier: values.cashier,
        remarks: values.remarks,
        billingItems: items,
      });
      message.success('收费记录创建成功');
      setIsModalVisible(false);
      form.resetFields();
      loadRecords();
      loadTotalRevenue();
    } catch (error) {
      message.error('创建收费记录失败');
    }
  };

  const columns = [
    {
      title: '发票号',
      dataIndex: 'invoiceNo',
      key: 'invoiceNo',
      width: 150,
    },
    {
      title: '患者',
      dataIndex: 'patientName',
      key: 'patientName',
      width: 100,
    },
    {
      title: '收费日期',
      dataIndex: 'billingDate',
      key: 'billingDate',
      width: 160,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '总金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      render: (amount: number) => formatCurrency(amount),
    },
    {
      title: '优惠金额',
      dataIndex: 'discountAmount',
      key: 'discountAmount',
      width: 100,
      render: (amount: number) => formatCurrency(amount),
    },
    {
      title: '已付金额',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      width: 120,
      render: (amount: number) => (
        <span style={{ color: '#52c41a', fontWeight: 600 }}>
          {formatCurrency(amount)}
        </span>
      ),
    },
    {
      title: '待收金额',
      dataIndex: 'remainingAmount',
      key: 'remainingAmount',
      width: 120,
      render: (amount: number) => (
        <span style={{ color: amount > 0 ? '#f5222d' : '#52c41a', fontWeight: 600 }}>
          {formatCurrency(amount)}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: BillingStatus) => (
        <Tag
          color={
            status === 2
              ? 'green'
              : status === 1
              ? 'orange'
              : status === 3
              ? 'default'
              : 'red'
          }
        >
          {getBillingStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '收银员',
      dataIndex: 'cashier',
      key: 'cashier',
      width: 100,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: BillingRecord) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => setSelectedRecord(record)}>
          详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 className="page-title" style={{ margin: 0 }}>
          收费明细
        </h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
          新建收费
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="总营收"
              value={totalRevenue}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="待收金额"
              value={records.reduce((sum, r) => sum + r.remainingAmount, 0)}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="收费记录数"
              value={records.length}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <div style={{ marginBottom: 8, color: '#666' }}>日期范围</div>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
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
              <Option value={0}>未缴费</Option>
              <Option value={1}>部分缴费</Option>
              <Option value={2}>已缴费</Option>
              <Option value={3}>已退款</Option>
            </Select>
          </Col>
          <Col span={8}>
            <div style={{ marginBottom: 8, color: '#666' }}>搜索</div>
            <Input
              placeholder="搜索发票号/患者"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col span={2}>
            <div style={{ marginBottom: 8, color: '#fff' }}>-</div>
            <Button type="primary" icon={<SearchOutlined />} onClick={loadRecords}>
              查询
            </Button>
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={records}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20 }}
      />

      <Modal
        title="新建收费记录"
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
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="itemName" label="项目名称" rules={[{ required: true, message: '请输入项目名称' }]}>
                <Input placeholder="请输入项目名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="description" label="项目描述">
                <Input placeholder="请输入描述" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="unitPrice" label="单价" rules={[{ required: true, message: '请输入单价' }]}>
                <InputNumber style={{ width: '100%' }} prefix="¥" min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="quantity" label="数量" rules={[{ required: true, message: '请输入数量' }]}>
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="discountAmount" label="优惠金额">
                <InputNumber style={{ width: '100%' }} prefix="¥" min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="paidAmount" label="已付金额">
                <InputNumber style={{ width: '100%' }} prefix="¥" min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="paymentMethod" label="支付方式">
                <Select placeholder="请选择">
                  <Option value="现金">现金</Option>
                  <Option value="微信">微信</Option>
                  <Option value="支付宝">支付宝</Option>
                  <Option value="银行卡">银行卡</Option>
                  <Option value="医保">医保</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="cashier" label="收银员">
            <Input placeholder="请输入收银员姓名" />
          </Form.Item>
          <Form.Item name="remarks" label="备注">
            <Input.TextArea rows={2} placeholder="请输入备注" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              创建收费记录
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="收费详情"
        open={!!selectedRecord}
        onCancel={() => setSelectedRecord(null)}
        footer={null}
        width={700}
      >
        {selectedRecord && (
          <div>
            <Card style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <div style={{ color: '#666' }}>发票号</div>
                  <div style={{ fontWeight: 600 }}>{selectedRecord.invoiceNo}</div>
                </Col>
                <Col span={8}>
                  <div style={{ color: '#666' }}>患者</div>
                  <div style={{ fontWeight: 600 }}>{selectedRecord.patientName}</div>
                </Col>
                <Col span={8}>
                  <div style={{ color: '#666' }}>收费日期</div>
                  <div>{formatDateTime(selectedRecord.billingDate)}</div>
                </Col>
              </Row>
              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={8}>
                  <div style={{ color: '#666' }}>总金额</div>
                  <div style={{ fontWeight: 600, fontSize: 18 }}>
                    {formatCurrency(selectedRecord.totalAmount)}
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ color: '#666' }}>已付</div>
                  <div style={{ fontWeight: 600, fontSize: 18, color: '#52c41a' }}>
                    {formatCurrency(selectedRecord.paidAmount)}
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ color: '#666' }}>待收</div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 18,
                      color: selectedRecord.remainingAmount > 0 ? '#f5222d' : '#52c41a',
                    }}
                  >
                    {formatCurrency(selectedRecord.remainingAmount)}
                  </div>
                </Col>
              </Row>
            </Card>

            <h4 className="section-title">收费项目</h4>
            <List
              dataSource={selectedRecord.billingItems}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.itemName}
                    description={item.description}
                  />
                  <div style={{ textAlign: 'right' }}>
                    <div>
                      {formatCurrency(item.unitPrice)} × {item.quantity}
                    </div>
                    <div style={{ fontWeight: 600, color: '#1890ff' }}>
                      {formatCurrency(item.subtotal)}
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

export default Billing;
