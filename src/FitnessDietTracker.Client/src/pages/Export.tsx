import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Select,
  DatePicker,
  Button,
  Radio,
  Table,
  Space,
  Tabs,
  message,
  Descriptions,
  Modal
} from 'antd';
import { DownloadOutlined, FileTextOutlined, HistoryOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { exportApi, authApi } from '../services/api';
import { useAuthStore } from '../hooks/useAuthStore';
import type { User, ExportRecord } from '../types';
import { ExportFormat } from '../types';

const { RangePicker } = DatePicker;

const Export = () => {
  const { user, isCoach } = useAuthStore();
  const [clients, setClients] = useState<User[]>([]);
  const [history, setHistory] = useState<ExportRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (user && isCoach()) {
      authApi.getClients(user.id).then(setClients);
    }
    loadHistory();
  }, [user]);

  const loadHistory = async () => {
    try {
      const data = await exportApi.history(user?.id);
      setHistory(data);
    } catch {
      // ignore
    }
  };

  const handleExport = async (values: any) => {
    if (!user) return;
    setLoading(true);
    try {
      const blob = await exportApi.export(
        {
          format: values.format,
          userId: values.userId,
          coachId: isCoach() ? user.id : undefined,
          startDate: values.dateRange?.[0]?.format('YYYY-MM-DD'),
          endDate: values.dateRange?.[1]?.format('YYYY-MM-DD'),
          exportType: values.exportType
        },
        user.id
      );

      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      const ext = values.format === ExportFormat.Excel ? 'xlsx' : 'csv';
      link.download = `${values.exportType}_${dayjs().format('YYYYMMDD_HHmmss')}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success('导出成功！文件已包含筛选口径、生成时间和操作者信息');
      loadHistory();
    } catch {
      message.error('导出失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: '文件名', dataIndex: 'fileName', key: 'fileName', render: (v) => <code>{v}</code> },
    {
      title: '格式',
      dataIndex: 'format',
      key: 'format',
      render: (v) => (v === ExportFormat.Excel ? 'Excel' : 'CSV')
    },
    {
      title: '筛选口径',
      dataIndex: 'filterCriteria',
      key: 'filterCriteria',
      ellipsis: true,
      render: (v, record) => (
        <a
          onClick={() =>
            Modal.info({
              title: '筛选口径详情',
              width: 500,
              content: (
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="筛选条件">{record.filterCriteria}</Descriptions.Item>
                  <Descriptions.Item label="生成时间">
                    {dayjs(record.generatedAt).format('YYYY-MM-DD HH:mm:ss')}
                  </Descriptions.Item>
                  <Descriptions.Item label="操作者">{record.operatorName}</Descriptions.Item>
                  <Descriptions.Item label="文件大小">
                    {(record.fileSize / 1024).toFixed(2)} KB
                  </Descriptions.Item>
                </Descriptions>
              )
            })
          }
        >
          {v}
        </a>
      )
    },
    {
      title: '生成时间',
      dataIndex: 'generatedAt',
      key: 'generatedAt',
      render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm')
    },
    { title: '操作者', dataIndex: 'operatorName', key: 'operatorName' }
  ];

  const historyData = history.map((h) => ({ key: h.id, ...h }));

  return (
    <div>
      <Tabs
        items={[
          {
            key: 'export',
            label: (
              <span>
                <DownloadOutlined /> 数据导出
              </span>
            ),
            children: (
              <Card title="导出设置" className="export-filter-card">
                <Form form={form} layout="vertical" onFinish={handleExport}>
                  <Form.Item
                    name="exportType"
                    label="导出类型"
                    rules={[{ required: true }]}
                    initialValue="DietRecords"
                  >
                    <Radio.Group>
                      <Radio.Button value="DietRecords">
                        <FileTextOutlined /> 饮食记录
                      </Radio.Button>
                      <Radio.Button value="BodyMeasurements">体测指标</Radio.Button>
                    </Radio.Group>
                  </Form.Item>

                  <Form.Item
                    name="format"
                    label="文件格式"
                    rules={[{ required: true }]}
                    initialValue={ExportFormat.Excel}
                  >
                    <Radio.Group>
                      <Radio.Button value={ExportFormat.Excel}>Excel (.xlsx)</Radio.Button>
                      <Radio.Button value={ExportFormat.Csv}>CSV (.csv)</Radio.Button>
                    </Radio.Group>
                  </Form.Item>

                  {isCoach() && (
                    <Form.Item name="userId" label="学员（可选，留空则导出所有学员）">
                      <Select
                        allowClear
                        placeholder="选择学员"
                        options={clients.map((c) => ({ label: c.userName, value: c.id }))}
                      />
                    </Form.Item>
                  )}

                  <Form.Item name="dateRange" label="日期范围（可选）">
                    <RangePicker style={{ width: '100%' }} />
                  </Form.Item>

                  <Form.Item>
                    <Space>
                      <Button type="primary" htmlType="submit" icon={<DownloadOutlined />} loading={loading}>
                        导出文件
                      </Button>
                      <Button onClick={() => form.resetFields()}>重置</Button>
                    </Space>
                  </Form.Item>
                </Form>

                <div
                  style={{
                    padding: 12,
                    background: '#e6f4ff',
                    borderRadius: 4,
                    border: '1px solid #91caff'
                  }}
                >
                  <strong style={{ color: '#1677ff' }}>ℹ️ 导出说明</strong>
                  <ul style={{ margin: '8px 0 0', paddingLeft: 20, color: '#555' }}>
                    <li>导出文件将包含完整的筛选口径说明</li>
                    <li>自动记录生成时间戳</li>
                    <li>自动记录导出操作者信息</li>
                    <li>Excel 格式在表格顶部显示元信息，CSV 格式以注释行开头</li>
                  </ul>
                </div>
              </Card>
            )
          },
          {
            key: 'history',
            label: (
              <span>
                <HistoryOutlined /> 导出历史
              </span>
            ),
            children: (
              <Card title="历史导出记录">
                <Table
                  columns={columns}
                  dataSource={historyData}
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            )
          }
        ]}
      />
    </div>
  );
};

export default Export;
