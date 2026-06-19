'use client';

import { useState, useEffect } from 'react';
import { Card, Tabs, Select, Table, Tag, Statistic, Row, Col, Divider, Button, Space, message } from 'antd';
import { DownloadOutlined, DollarOutlined, CheckCircleOutlined, TicketOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { recordApi, performanceApi, exportApi } from '@/services/api';

const { Option } = Select;

export default function RecordsPage() {
  const [scheduleId, setScheduleId] = useState<number | null>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [recordData, setRecordData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchSchedules = async () => {
    try {
      const res: any = await performanceApi.getList({ page: 1, pageSize: 100 });
      setSchedules(res.data.data || []);
      if (res.data.data?.length > 0) {
        setScheduleId(res.data.data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRecordData = async () => {
    if (!scheduleId) return;
    setLoading(true);
    try {
      const res: any = await recordApi.getBySchedule(scheduleId);
      setRecordData(res.data);
    } catch (e) {
      message.error('获取记录数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  useEffect(() => {
    if (scheduleId) {
      fetchRecordData();
    }
  }, [scheduleId]);

  const handleExportSponsors = async () => {
    try {
      const res: any = await exportApi.exportSponsors({
        scheduleId,
        operatorId: 1,
      });
      downloadFile(res.data, `赞助清单_${dayjs().format('YYYYMMDD')}.xlsx`);
      message.success('导出成功');
    } catch (e) {
      message.error('导出失败');
    }
  };

  const handleExportVerifications = async () => {
    try {
      const res: any = await exportApi.exportVerifications({
        scheduleId,
        operatorId: 1,
      });
      downloadFile(res.data, `核销记录_${dayjs().format('YYYYMMDD')}.xlsx`);
      message.success('导出成功');
    } catch (e) {
      message.error('导出失败');
    }
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sponsorColumns = [
    { title: '赞助商名称', dataIndex: 'name', key: 'name' },
    { title: '赞助级别', dataIndex: 'level', key: 'level', render: (level: string) => {
      const colorMap: any = { '钻石赞助商': 'gold', '黄金赞助商': 'orange', '白银赞助商': 'blue' };
      return <Tag color={colorMap[level] || 'default'}>{level}</Tag>;
    }},
    { title: '赞助金额', dataIndex: 'amount', key: 'amount', render: (amount: number) => `¥${Number(amount).toLocaleString()}` },
    { title: '联系人', dataIndex: 'contactName', key: 'contactName' },
    { title: '联系电话', dataIndex: 'contactPhone', key: 'contactPhone' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'active' ? 'green' : 'gray'}>{s}</Tag> },
  ];

  const verificationColumns = [
    { title: '核销时间', dataIndex: 'verifyTime', key: 'verifyTime', render: (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm') },
    { title: '订单号', dataIndex: ['order', 'orderNo'], key: 'orderNo' },
    { title: '票种', dataIndex: ['order', 'ticketType', 'name'], key: 'ticketType' },
    { title: '购票人', dataIndex: ['order', 'buyerName'], key: 'buyerName' },
    { title: '核销数量', dataIndex: 'quantity', key: 'quantity' },
    { title: '核销方式', dataIndex: 'verifyMethod', key: 'verifyMethod' },
    { title: '核销员', dataIndex: ['verifier', 'name'], key: 'verifier' },
  ];

  const ticketColumns = [
    { title: '票种名称', dataIndex: 'name', key: 'name' },
    { title: '价格', dataIndex: 'price', key: 'price', render: (p: number) => `¥${p}` },
    { title: '总票数', dataIndex: 'totalCount', key: 'totalCount' },
    { title: '已售', dataIndex: 'soldCount', key: 'soldCount' },
    { title: '剩余', key: 'remaining', render: (_: any, r: any) => r.totalCount - r.soldCount },
    { title: '售出率', key: 'rate', render: (_: any, r: any) => 
      <Tag color={r.soldCount / r.totalCount > 0.8 ? 'green' : 'blue'}>
        {((r.soldCount / r.totalCount) * 100).toFixed(1)}%
      </Tag>
    },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'active' ? 'green' : 'gray'}>{s}</Tag> },
  ];

  const tabItems = [
    {
      key: 'sponsors',
      label: '赞助清单',
      children: (
        <div>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="赞助商数量"
                  value={recordData?.sponsors?.stats?.totalCount || 0}
                  prefix={<DollarOutlined style={{ color: '#faad14' }} />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="赞助总金额"
                  value={recordData?.sponsors?.stats?.totalAmount || 0}
                  precision={2}
                  prefix="¥"
                />
              </Card>
            </Col>
            <Col span={12} />
          </Row>
          <Card 
            title="赞助清单" 
            extra={<Button icon={<DownloadOutlined />} onClick={handleExportSponsors}>导出</Button>}
          >
            <Table
              columns={sponsorColumns}
              dataSource={recordData?.sponsors?.list || []}
              rowKey="id"
              loading={loading}
              pagination={false}
            />
          </Card>
        </div>
      ),
    },
    {
      key: 'verifications',
      label: '核销记录',
      children: (
        <div>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="核销订单数"
                  value={recordData?.verifications?.stats?.totalCount || 0}
                  prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="核销票数"
                  value={recordData?.verifications?.stats?.totalTickets || 0}
                />
              </Card>
            </Col>
            <Col span={12} />
          </Row>
          <Card 
            title="核销记录" 
            extra={<Button icon={<DownloadOutlined />} onClick={handleExportVerifications}>导出</Button>}
          >
            <Table
              columns={verificationColumns}
              dataSource={recordData?.verifications?.list || []}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </div>
      ),
    },
    {
      key: 'tickets',
      label: '票种规则',
      children: (
        <div>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="票种数量"
                  value={recordData?.ticketTypes?.list?.length || 0}
                  prefix={<TicketOutlined style={{ color: '#1890ff' }} />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="售票收入"
                  value={recordData?.ticketTypes?.stats?.totalRevenue || 0}
                  precision={2}
                  prefix="¥"
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="整体售出率"
                  value={recordData?.ticketTypes?.stats?.sellRate || 0}
                  suffix="%"
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="剩余票数"
                  value={recordData?.ticketTypes?.stats?.remainingTickets || 0}
                />
              </Card>
            </Col>
          </Row>
          <Card title="票种规则">
            <Table
              columns={ticketColumns}
              dataSource={recordData?.ticketTypes?.list || []}
              rowKey="id"
              loading={loading}
              pagination={false}
              expandable={{
                expandedRowRender: (record: any) => (
                  <div>
                    <p><strong>描述：</strong>{record.description || '暂无'}</p>
                    <p><strong>规则：</strong>{record.rules || '暂无'}</p>
                  </div>
                ),
              }}
            />
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="记录页"
        extra={
          <Select
            style={{ width: 300 }}
            placeholder="选择演出排期"
            value={scheduleId}
            onChange={setScheduleId}
          >
            {schedules.map(s => (
              <Option key={s.id} value={s.id}>
                {s.title} - {dayjs(s.startTime).format('YYYY-MM-DD')}
              </Option>
            ))}
          </Select>
        }
      >
        {recordData?.schedule && (
          <div style={{ marginBottom: 16, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
            <h3 style={{ margin: 0 }}>{recordData.schedule.title}</h3>
            <p style={{ margin: '8px 0 0 0', color: '#666' }}>
              {dayjs(recordData.schedule.startTime).format('YYYY-MM-DD HH:mm')} ~ {dayjs(recordData.schedule.endTime).format('HH:mm')} | {recordData.schedule.venue}
            </p>
          </div>
        )}
        <Tabs defaultActiveKey="sponsors" items={tabItems} />
      </Card>
    </div>
  );
}
