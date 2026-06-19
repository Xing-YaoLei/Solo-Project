'use client';

import { useState, useEffect } from 'react';
import { Card, Select, Row, Col, Statistic, Table, Button, Space, message } from 'antd';
import { DownloadOutlined, BarChartOutlined, TrendingUpOutlined, CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { reviewApi, exportApi } from '@/services/api';
import ReactECharts from 'echarts-for-react';

const { Option } = Select;

export default function ReviewPage() {
  const [year, setYear] = useState(dayjs().year());
  const [month, setMonth] = useState(dayjs().month() + 1);
  const [reviewData, setReviewData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res: any = await reviewApi.getMonthly(year, month);
      setReviewData(res.data);
    } catch (e) {
      message.error('获取复盘数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [year, month]);

  const handleExport = async () => {
    try {
      const res: any = await exportApi.exportReview({
        year,
        month,
        operatorId: 1,
      });
      downloadFile(res.data, `${year}年${month}月核销复盘_${dayjs().format('YYYYMMDD')}.xlsx`);
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

  const years = Array.from({ length: 5 }, (_, i) => dayjs().year() - 2 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const columns = [
    { title: '演出名称', dataIndex: 'title', key: 'title' },
    { 
      title: '演出时间', 
      dataIndex: 'startTime', 
      key: 'startTime',
      render: (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm')
    },
    { title: '地点', dataIndex: 'venue', key: 'venue' },
    { title: '总票数', dataIndex: 'totalTickets', key: 'totalTickets' },
    { title: '已售', dataIndex: 'soldTickets', key: 'soldTickets' },
    { title: '已核销', dataIndex: 'verifiedTickets', key: 'verifiedTickets' },
    { 
      title: '售票率', 
      key: 'sellRate', 
      render: (_: any, r: any) => `${r.sellRate}%`
    },
    { 
      title: '核销率', 
      key: 'verifyRate',
      render: (_: any, r: any) => `${r.verifyRate}%`
    },
    { 
      title: '核销收入', 
      dataIndex: 'revenue', 
      key: 'revenue',
      render: (v: number) => `¥${v.toLocaleString()}`
    },
  ];

  const dailyChartOption = {
    title: { text: '每日核销趋势', left: 'center' },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: reviewData?.dailyData?.map((d: any) => d.date) || [],
    },
    yAxis: [
      { type: 'value', name: '核销数' },
      { type: 'value', name: '收入(元)' },
    ],
    series: [
      {
        name: '核销票数',
        type: 'bar',
        data: reviewData?.dailyData?.map((d: any) => d.tickets) || [],
        itemStyle: { color: '#1890ff' },
      },
      {
        name: '核销收入',
        type: 'line',
        yAxisIndex: 1,
        data: reviewData?.dailyData?.map((d: any) => d.revenue) || [],
        itemStyle: { color: '#52c41a' },
        smooth: true,
      },
    ],
  };

  const verifierChartOption = {
    title: { text: '核销员效率排行', left: 'center' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'value' },
    yAxis: {
      type: 'category',
      data: reviewData?.verifierStats?.map((v: any) => v.name).reverse() || [],
    },
    series: [
      {
        name: '核销票数',
        type: 'bar',
        data: reviewData?.verifierStats?.map((v: any) => v.tickets).reverse() || [],
        itemStyle: { color: '#faad14' },
        label: { show: true, position: 'right' },
      },
    ],
  };

  return (
    <div>
      <Card
        title="月底核销效率复盘"
        extra={
          <Space>
            <Select value={year} onChange={setYear} style={{ width: 120 }}>
              {years.map(y => (
                <Option key={y} value={y}>{y}年</Option>
              ))}
            </Select>
            <Select value={month} onChange={setMonth} style={{ width: 100 }}>
              {months.map(m => (
                <Option key={m} value={m}>{m}月</Option>
              ))}
            </Select>
            <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
              导出报表
            </Button>
          </Space>
        }
      >
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="演出场次"
                value={reviewData?.summary?.scheduleCount || 0}
                prefix={<BarChartOutlined style={{ color: '#1890ff' }} />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="总售票数"
                value={reviewData?.summary?.totalSold || 0}
                prefix={<TrendingUpOutlined style={{ color: '#52c41a' }} />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="总核销数"
                value={reviewData?.summary?.totalVerified || 0}
                prefix={<CheckCircleOutlined style={{ color: '#faad14' }} />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="核销收入"
                value={reviewData?.summary?.totalRevenue || 0}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="整体售票率"
                value={reviewData?.summary?.sellRate || 0}
                suffix="%"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="整体核销率"
                value={reviewData?.summary?.verifyRate || 0}
                suffix="%"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="赞助总金额"
                value={reviewData?.summary?.totalSponsorAmount || 0}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="核销订单数"
                value={reviewData?.summary?.verificationCount || 0}
              />
            </Card>
          </Col>
        </Row>

        <Card title="演出核销效率详情" style={{ marginBottom: 24 }} loading={loading}>
          <Table
            columns={columns}
            dataSource={reviewData?.scheduleReviews || []}
            rowKey="id"
            pagination={false}
            expandable={{
              expandedRowRender: (record: any) => (
                <div>
                  <h4>各票种核销情况</h4>
                  {record.ticketTypes?.map((t: any) => (
                    <div key={t.id} style={{ padding: '4px 0' }}>
                      {t.name}: {t.verifiedCount}/{t.soldCount} 张
                      ({t.soldCount > 0 ? ((t.verifiedCount / t.soldCount) * 100).toFixed(1) : 0}% 核销率)
                    </div>
                  ))}
                </div>
              ),
            }}
          />
        </Card>

        <Row gutter={16}>
          <Col span={14}>
            <Card title="每日核销趋势">
              <ReactECharts option={dailyChartOption} style={{ height: 300 }} />
            </Card>
          </Col>
          <Col span={10}>
            <Card title="核销员效率排行">
              <ReactECharts option={verifierChartOption} style={{ height: 300 }} />
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
