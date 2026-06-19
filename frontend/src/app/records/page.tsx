'use client';

import { useState, useEffect } from 'react';
import { Card, Select, Table, Tag, Statistic, Row, Col, Button, Space, message } from 'antd';
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
    { title: '核销时间', dataIndex: 'verifyTime', key: 'verifyTime', render: (t: string) => dayjs(t).format('MM-DD HH:mm'), width: 120 },
    { title: '订单号', dataIndex: ['order', 'orderNo'], key: 'orderNo', width: 120 },
    { title: '票种', dataIndex: ['order', 'ticketType', 'name'], key: 'ticketType', width: 100 },
    { title: '购票人', dataIndex: ['order', 'buyerName'], key: 'buyerName', width: 100 },
    { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 60 },
    { title: '核销员', dataIndex: ['verifier', 'name'], key: 'verifier', width: 80 },
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
  ];

  return (
    <div>
      <Card
        title="记录页 - 同屏展示"
        extra={
          <Select
            style={{ width: 320 }}
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
              {dayjs(recordData.schedule.startTime).format('YYYY-MM-DD HH:mm')} ~ {dayjs(recordData.schedule.endTime).format('HH:mm')} | {recordData.schedule.venue} | 容量 {recordData.schedule.capacity}人
            </p>
          </div>
        )}

        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={3}>
            <Card size="small">
              <Statistic
                title="赞助商数"
                value={recordData?.sponsors?.stats?.totalCount || 0}
                prefix={<DollarOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ fontSize: 18 }}
              />
            </Card>
          </Col>
          <Col span={3}>
            <Card size="small">
              <Statistic
                title="赞助金额"
                value={recordData?.sponsors?.stats?.totalAmount || 0}
                precision={0}
                prefix="¥"
                valueStyle={{ fontSize: 18 }}
              />
            </Card>
          </Col>
          <Col span={3}>
            <Card size="small">
              <Statistic
                title="核销订单"
                value={recordData?.verifications?.stats?.totalCount || 0}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ fontSize: 18 }}
              />
            </Card>
          </Col>
          <Col span={3}>
            <Card size="small">
              <Statistic
                title="核销票数"
                value={recordData?.verifications?.stats?.totalTickets || 0}
                valueStyle={{ fontSize: 18 }}
              />
            </Card>
          </Col>
          <Col span={3}>
            <Card size="small">
              <Statistic
                title="票种数量"
                value={recordData?.ticketTypes?.list?.length || 0}
                prefix={<TicketOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ fontSize: 18 }}
              />
            </Card>
          </Col>
          <Col span={3}>
            <Card size="small">
              <Statistic
                title="售票收入"
                value={recordData?.ticketTypes?.stats?.totalRevenue || 0}
                precision={0}
                prefix="¥"
                valueStyle={{ fontSize: 18 }}
              />
            </Card>
          </Col>
          <Col span={3}>
            <Card size="small">
              <Statistic
                title="整体售出率"
                value={recordData?.ticketTypes?.stats?.sellRate || 0}
                suffix="%"
                valueStyle={{ fontSize: 18 }}
              />
            </Card>
          </Col>
          <Col span={3}>
            <Card size="small">
              <Statistic
                title="剩余票数"
                value={recordData?.ticketTypes?.stats?.remainingTickets || 0}
                valueStyle={{ fontSize: 18 }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Card
              size="small"
              title={
                <Space>
                  <DollarOutlined style={{ color: '#faad14' }} />
                  <span>赞助清单</span>
                </Space>
              }
              extra={<Button type="link" size="small" icon={<DownloadOutlined />} onClick={handleExportSponsors}>导出</Button>}
              style={{ height: '100%' }}
            >
              <Table
                size="small"
                columns={sponsorColumns}
                dataSource={recordData?.sponsors?.list || []}
                rowKey="id"
                loading={loading}
                pagination={false}
                scroll={{ x: 'max-content', y: 320 }}
              />
            </Card>
          </Col>

          <Col span={8}>
            <Card
              size="small"
              title={
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <span>核销记录</span>
                </Space>
              }
              extra={<Button type="link" size="small" icon={<DownloadOutlined />} onClick={handleExportVerifications}>导出</Button>}
              style={{ height: '100%' }}
            >
              <Table
                size="small"
                columns={verificationColumns}
                dataSource={recordData?.verifications?.list || []}
                rowKey="id"
                loading={loading}
                pagination={false}
                scroll={{ x: 'max-content', y: 320 }}
              />
            </Card>
          </Col>

          <Col span={8}>
            <Card
              size="small"
              title={
                <Space>
                  <TicketOutlined style={{ color: '#1890ff' }} />
                  <span>票种规则</span>
                </Space>
              }
              style={{ height: '100%' }}
            >
              <Table
                size="small"
                columns={ticketColumns}
                dataSource={recordData?.ticketTypes?.list || []}
                rowKey="id"
                loading={loading}
                pagination={false}
                scroll={{ x: 'max-content', y: 320 }}
                expandable={{
                  expandedRowRender: (record: any) => (
                    <div>
                      <p style={{ margin: 0 }}><strong>描述：</strong>{record.description || '暂无'}</p>
                      <p style={{ margin: 0 }}><strong>规则：</strong>{record.rules || '暂无'}</p>
                    </div>
                  ),
                }}
              />
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
