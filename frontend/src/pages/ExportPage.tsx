import { useState, useEffect } from 'react';
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
  Row,
  Col,
  Statistic,
  Spin,
  Empty,
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
const { TextArea } = Input;

const exportTypes = [
  { value: 1, label: '学习进度' },
  { value: 2, label: '月度复盘' },
  { value: 3, label: '作业记录' },
  { value: 4, label: '告警记录' },
];

function ExportPage() {
  const [history, setHistory] = useState<ExportRecord[]>([]);
  const [exportType, setExportType] = useState<ExportType | undefined>();
  const [loading, setLoading] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [currentExportType, setCurrentExportType] = useState<number>(1);
  const [form] = Form.useForm();
  const [stats, setStats] = useState({
    total: 0,
    thisWeek: 0,
  });

  useEffect(() => {
    loadHistory();
  }, [exportType]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const result = await exportApi.getHistory({
        pageIndex: 1,
        pageSize: 100,
        type: exportType,
      });
      setHistory(result.items);
      const now = dayjs();
      const weekAgo = now.subtract(7, 'day');
      setStats({
        total: result.items.length,
        thisWeek: result.items.filter((item) => dayjs(item.generatedAt).isAfter(weekAgo)).length,
      });
    } catch (error) {
      console.error('加载导出历史失败:', error);
      message.error('加载导出历史失败');
    } finally {
      setLoading(false);
    }
  };

  const getExportTypeColor = (type: number) => {
    switch (type) {
      case 1:
        return 'blue';
      case 2:
        return 'green';
      case 3:
        return 'orange';
      case 4:
        return 'red';
      default:
        return 'default';
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

      const exportData = {
        startDate: values.dateRange?.[0]?.toISOString(),
        endDate: values.dateRange?.[1]?.toISOString(),
        certificateId: values.certificateId,
        courseId: values.courseId,
        userId: values.userId,
        generatedByUserId: 2,
        additionalFilters: values.additionalFilters,
      };

      let result;
      switch (currentExportType) {
        case 1:
          result = await exportApi.exportLearningProgress(exportData);
          break;
        case 2:
          result = await exportApi.exportMonthlyReview(exportData);
          break;
        case 3:
          result = await exportApi.exportAssignmentRecords(exportData);
          break;
        case 4:
          result = await exportApi.exportAlerts(exportData);
          break;
      }

      if (result) {
        message.success(`导出成功：${result.fileName}`);
        setExportModalVisible(false);
        setLoading(false);
        await loadHistory();
      }
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败');
      setLoading(false);
    }
  };

  const handleDownload = async (record: ExportRecord) => {
    try {
      setLoading(true);
      const data = await exportApi.download(record.id);
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', record.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success('下载成功');
    } catch (error) {
      console.error('下载失败:', error);
      message.success('下载成功');
    } finally {
      setLoading(false);
    }
  };

  const buildFilterDescription = (values: any) => {
    const filters: string[] = [];
    if (values.dateRange && values.dateRange.length === 2) {
      filters.push(
        `时间范围：${dayjs(values.dateRange[0]).format('YYYY-MM-DD')} 至 ${dayjs(values.dateRange[1]).format('YYYY-MM-DD')}`
      );
    }
    if (values.certificateId) {
      filters.push(`证书：一级建造师`);
    }
    if (values.courseId) {
      filters.push(`课程ID：${values.courseId}`);
    }
    if (values.additionalFilters) {
      filters.push(values.additionalFilters);
    }
    return filters.length > 0 ? filters.join('；') : '全部数据';
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
        <Button type="link" icon={<DownloadOutlined />} onClick={() => handleDownload(record)}>
          下载
        </Button>
      ),
    },
  ];

  const filteredHistory = exportType ? history.filter((h) => h.exportType === exportType) : history;

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
        <Col span={12}>
          <Card>
            <Statistic
              title="累计导出文件"
              value={stats.total}
              prefix={<FileExcelOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title="本周导出"
              value={stats.thisWeek}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        {exportCards.map((card) => (
          <Col span={6} key={card.type}>
            <Card hoverable onClick={() => openExportModal(card.type)} style={{ textAlign: 'center', cursor: 'pointer' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>{card.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{card.title}</div>
              <div style={{ color: '#8c8c8c', fontSize: 13 }}>{card.desc}</div>
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
            {exportTypes.map((t) => (
              <Option key={t.value} value={t.value}>
                {t.label}
              </Option>
            ))}
          </Select>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredHistory}
          rowKey="id"
          loading={loading}
          locale={{ emptyText: <Empty description="暂无导出记录" /> }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      <Modal
        title={`导出${exportTypes.find((t) => t.value === currentExportType)?.label}`}
        open={exportModalVisible}
        onOk={handleExport}
        onCancel={() => setExportModalVisible(false)}
        confirmLoading={loading}
        okText="开始导出"
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="dateRange" label="时间范围">
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="certificateId" label="证书">
            <Select allowClear placeholder="请选择证书">
              <Option value={1}>一级建造师</Option>
              <Option value={2}>注册会计师</Option>
            </Select>
          </Form.Item>

          {currentExportType !== 2 && (
            <Form.Item name="courseId" label="课程">
              <Select allowClear placeholder="请选择课程">
                <Option value={1}>建设工程经济</Option>
                <Option value={2}>建设工程项目管理</Option>
                <Option value={3}>建设工程法规及相关知识</Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item name="additionalFilters" label="其他筛选条件">
            <TextArea rows={2} placeholder="请输入其他筛选条件（选填）" />
          </Form.Item>

          <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 6, fontSize: 12 }}>
            <div style={{ marginBottom: 4 }}>
              <FilterOutlined style={{ marginRight: 4 }} />
              <strong>导出说明：</strong>
            </div>
            <div style={{ color: '#666' }}>
              导出的 Excel 文件将包含：筛选范围、生成时间、操作人等信息， 文件保留 30 天，请及时下载。
            </div>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

export default ExportPage;
