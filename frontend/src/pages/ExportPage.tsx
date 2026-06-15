import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Select,
  DatePicker,
  Tag,
  Modal,
  Form,
  Input,
  message,
  Tabs,
  Typography,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  DownloadOutlined,
  FileExcelOutlined,
  HistoryOutlined,
  FilterOutlined,
  UserOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import type { ExportRecord, ExportType } from '../types';
import { exportApi } from '../api/export';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;

const mockExportHistory: ExportRecord[] = [
  {
    id: 1,
    fileName: '学习进度导出_20250615_103025.xlsx',
    exportType: 1,
    exportTypeText: '学习进度',
    filterCriteria: '时间范围：2025-01-01 至 2025-06-01；证书ID：1',
    startDate: '2025-01-01T00:00:00Z',
    endDate: '2025-06-01T00:00:00Z',
    totalRecords: 15,
    generatedByUserId: 2,
    generatedByName: '张老师',
    generatedAt: '2025-06-15T02:30:25Z',
    expiresAt: '2025-07-15T02:30:25Z',
  },
  {
    id: 2,
    fileName: '月度复盘_2025年5月_20250601_091500.xlsx',
    exportType: 2,
    exportTypeText: '月度复盘',
    filterCriteria: '月份：2025年5月',
    startDate: '2025-05-01T00:00:00Z',
    endDate: '2025-05-31T00:00:00Z',
    totalRecords: 3,
    generatedByUserId: 1,
    generatedByName: '系统管理员',
    generatedAt: '2025-06-01T01:15:00Z',
    expiresAt: '2025-07-01T01:15:00Z',
  },
  {
    id: 3,
    fileName: '作业记录导出_20250610_142030.xlsx',
    exportType: 3,
    exportTypeText: '作业记录',
    filterCriteria: '时间范围：2025-03-01 至 2025-06-01',
    startDate: '2025-03-01T00:00:00Z',
    endDate: '2025-06-01T00:00:00Z',
    totalRecords: 42,
    generatedByUserId: 2,
    generatedByName: '张老师',
    generatedAt: '2025-06-10T06:20:30Z',
    expiresAt: '2025-07-10T06:20:30Z',
  },
];

const exportTypes = [
  { value: 1, label: '学习进度' },
  { value: 2, label: '月度复盘' },
  { value: 3, label: '作业记录' },
  { value: 4, label: '告警记录' },
];

function ExportPage() {
  const [history, setHistory] = useState<ExportRecord[]>(mockExportHistory);
  const [exportType, setExportType] = useState<ExportType | undefined>();
  const [loading, setLoading] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [currentExportType, setCurrentExportType] = useState<number>(1);
  const [form] = Form.useForm();

  const getExportTypeColor = (type: number) => {
    switch (type) {
      case 1: return 'blue';
      case 2: return 'green';
      case 3: return 'orange';
      case 4: return 'red';
      default: return 'default';
    }
  };

  const openExportModal = (type: number) => {
    setCurrentExportType(type);
    form.resetFields();
    setExportModalVisible(true);
  };

  const handleExport = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      setTimeout(() => {
        const typeNames: Record<number, string> = {
          1: '学习进度',
          2: '月度复盘',
          3: '作业记录',
          4: '告警记录',
        };

        const newRecord: ExportRecord = {
          id: Date.now(),
          fileName: `${typeNames[currentExportType]}导出_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`,
          exportType: currentExportType,
          exportTypeText: typeNames[currentExportType],
          filterCriteria: buildFilterDescription(values),
          startDate: values.dateRange?.[0]?.toISOString(),
          endDate: values.dateRange?.[1]?.toISOString(),
          totalRecords: Math.floor(Math.random() * 50) + 10,
          generatedByUserId: 2,
          generatedByName: '张老师',
          generatedAt: new Date().toISOString(),
          expiresAt: dayjs().add(30, 'day').toISOString(),
        };

        setHistory([newRecord, ...history]);
        message.success(`导出成功：${newRecord.fileName}`);
        setExportModalVisible(false);
        setLoading(false);
      }, 800);
    } catch (error) {
      setLoading(false);
    }
  };

  const buildFilterDescription = (values: any) => {
    const filters: string[] = [];
    if (values.dateRange && values.dateRange.length === 2) {
      filters.push(`时间范围：${dayjs(values.dateRange[0]).format('YYYY-MM-DD')} 至 ${dayjs(values.dateRange[1]).format('YYYY-MM-DD')}`);
    }
    if (values.certificateId) {
      filters.push(`证书：一级建造师`);
    }
    if (values.userId) {
      filters.push(`学员ID：${values.userId}`);
    }
    if (values.additionalFilters) {
      filters.push(values.additionalFilters);
    }
    return filters.length > 0 ? filters.join('；') : '全部数据';
  };

  const handleDownload = (record: ExportRecord) => {
    message.info(`正在下载：${record.fileName}`);
  };

  const columns = [
    {
      title: '文件名',
      dataIndex: 'fileName',
      key: 'fileName',
      render: (text: string) => (
        <span>
          <FileExcelOutlined style={{ color: '#52c41a', marginRight: 8 }} />
          {text}
        </span>
      ),
    },
    {
      title: '类型',
      dataIndex: 'exportType',
      key: 'exportType',
      width: 100,
      render: (type: number, record: ExportRecord) => (
        <Tag color={getExportTypeColor(type)}>{record.exportTypeText}</Tag>
      ),
    },
    {
      title: '筛选条件',
      dataIndex: 'filterCriteria',
      key: 'filterCriteria',
      ellipsis: true,
    },
    {
      title: '记录数',
      dataIndex: 'totalRecords',
      key: 'totalRecords',
      width: 80,
    },
    {
      title: '操作人',
      dataIndex: 'generatedByName',
      key: 'generatedByName',
      width: 100,
      render: (name: string) => (
        <span>
          <UserOutlined style={{ marginRight: 4 }} />
          {name}
        </span>
      ),
    },
    {
      title: '生成时间',
      dataIndex: 'generatedAt',
      key: 'generatedAt',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '有效期至',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      width: 120,
      render: (date: string) => dayjs(date).format('MM-DD'),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: ExportRecord) => (
        <Button
          type="link"
          icon={<DownloadOutlined />}
          onClick={() => handleDownload(record)}
        >
          下载
        </Button>
      ),
    },
  ];

  const filteredHistory = exportType
    ? history.filter(h => h.exportType === exportType)
    : history;

  const exportCards = [
    { type: 1, title: '学习进度导出', desc: '导出学员学习进度数据', icon: '📊', color: '#1677ff' },
    { type: 2, title: '月度复盘导出', desc: '导出月度复盘报告', icon: '📈', color: '#52c41a' },
    { type: 3, title: '作业记录导出', desc: '导出作业完成记录', icon: '📝', color: '#faad14' },
    { type: 4, title: '告警记录导出', desc: '导出进度告警记录', icon: '🔔', color: '#ff4d4f' },
  ];

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>导出中心</h2>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        {exportCards.map(card => (
          <Col span={6} key={card.type}>
            <Card
              hoverable
              onClick={() => openExportModal(card.type)}
              style={{ textAlign: 'center', cursor: 'pointer' }}
            >
              <div style={{ fontSize: 40, marginBottom: 8 }}>{card.icon}</div>
              <Title level={5} style={{ margin: 0 }}>{card.title}</Title>
              <Text type="secondary">{card.desc}</Text>
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        title={
          <span>
            <HistoryOutlined style={{ marginRight: 8 }} />
            导出历史
          </span>
        }
        extra={
          <Select
            placeholder="筛选类型"
            style={{ width: 150 }}
            allowClear
            value={exportType}
            onChange={setExportType}
          >
            {exportTypes.map(t => (
              <Option key={t.value} value={t.value}>{t.label}</Option>
            ))}
          </Select>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredHistory}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      <Modal
        title={`导出${exportTypes.find(t => t.value === currentExportType)?.label}`}
        open={exportModalVisible}
        onOk={handleExport}
        onCancel={() => setExportModalVisible(false)}
        confirmLoading={loading}
        okText="开始导出"
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="dateRange"
            label="时间范围"
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="certificateId"
            label="证书"
          >
            <Select allowClear placeholder="请选择证书">
              <Option value={1}>一级建造师</Option>
              <Option value={2}>注册会计师</Option>
            </Select>
          </Form.Item>

          {currentExportType !== 2 && (
            <Form.Item
              name="courseId"
              label="课程"
            >
              <Select allowClear placeholder="请选择课程">
                <Option value={1}>建设工程经济</Option>
                <Option value={2}>建设工程项目管理</Option>
                <Option value={3}>建设工程法规及相关知识</Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item
            name="additionalFilters"
            label="其他筛选条件"
          >
            <Input.TextArea rows={2} placeholder="请输入其他筛选条件（选填）" />
          </Form.Item>

          <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 6, fontSize: 12 }}>
            <div style={{ marginBottom: 4 }}>
              <FilterOutlined style={{ marginRight: 4 }} />
              <strong>导出说明：</strong>
            </div>
            <div style={{ color: '#666' }}>
              导出的 Excel 文件将包含：筛选范围、生成时间、操作人等信息，
              文件保留 30 天，请及时下载。
            </div>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

export default ExportPage;
