'use client';

import { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Select, DatePicker, Statistic, Row, Col, message, Tag } from 'antd';
import { SearchOutlined, ExportOutlined, CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { verificationApi, performanceApi, exportApi } from '@/services/api';

const { RangePicker } = DatePicker;
const { Option } = Select;

export default function VerificationsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [scheduleId, setScheduleId] = useState<string>('');
  const [dateRange, setDateRange] = useState<any>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});

  const fetchSchedules = async () => {
    try {
      const res: any = await performanceApi.getList({ page: 1, pageSize: 100 });
      setSchedules(res.data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (scheduleId) params.scheduleId = parseInt(scheduleId);
      if (dateRange && dateRange.length === 2) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      const res: any = await verificationApi.getList(params);
      setData(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      message.error('获取核销记录失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params: any = {};
      if (scheduleId) params.scheduleId = parseInt(scheduleId);
      if (dateRange && dateRange.length === 2) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      const res: any = await verificationApi.getStats(params);
      setStats(res.data || {});
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  useEffect(() => {
    fetchData();
    fetchStats();
  }, [page, pageSize, scheduleId, dateRange]);

  const handleExport = async () => {
    try {
      const params: any = { operatorId: 1 };
      if (scheduleId) params.scheduleId = parseInt(scheduleId);
      if (dateRange && dateRange.length === 2) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      const res: any = await exportApi.exportVerifications(params);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', '核销记录.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success('导出成功');
    } catch (e) {
      message.error('导出失败');
    }
  };

  const columns = [
    {
      title: '核销时间',
      dataIndex: 'verifyTime',
      key: 'verifyTime',
      render: (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm:ss'),
    },
    { title: '订单号', dataIndex: ['order', 'orderNo'], key: 'orderNo' },
    { title: '演出', dataIndex: ['order', 'schedule', 'title'], key: 'schedule' },
    { title: '票种', dataIndex: ['order', 'ticketType', 'name'], key: 'ticketType' },
    { title: '购票人', dataIndex: ['order', 'buyerName'], key: 'buyerName' },
    { title: '联系电话', dataIndex: ['order', 'buyerPhone'], key: 'buyerPhone' },
    { title: '核销数量', dataIndex: 'quantity', key: 'quantity' },
    {
      title: '核销方式',
      dataIndex: 'verifyMethod',
      key: 'verifyMethod',
      render: (m: string) => {
        const methodMap: any = {
          QR_CODE: '二维码',
          MANUAL: '人工核销',
          ID_CARD: '身份证',
        };
        return <Tag color="blue">{methodMap[m] || m}</Tag>;
      },
    },
    { title: '核销员', dataIndex: ['verifier', 'name'], key: 'verifier' },
    { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="核销订单数"
              value={stats.totalCount || 0}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="核销总票数"
              value={stats.totalTickets || 0}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="核销收入"
              value={stats.totalAmount || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="核销记录"
        extra={
          <Space>
            <Select
              placeholder="选择演出"
              style={{ width: 200 }}
              allowClear
              value={scheduleId || undefined}
              onChange={setScheduleId}
            >
              {schedules.map(s => (
                <Option key={s.id} value={s.id}>{s.title}</Option>
              ))}
            </Select>
            <RangePicker value={dateRange} onChange={setDateRange} />
            <Button icon={<SearchOutlined />} onClick={() => { setPage(1); fetchData(); }}>查询</Button>
            <Button icon={<ExportOutlined />} onClick={handleExport}>导出</Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>
    </div>
  );
}
