import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Select, DatePicker, Space, Typography } from 'antd';
import { FileTextOutlined, CheckCircleOutlined, CloseCircleOutlined, WarningOutlined, SmileOutlined, CalendarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { statisticsService } from '../services/statisticsService';
import type { StatisticsOverview, ClientSatisfactionReport, HearingStatistics } from '../types';
import { formatDateTime } from '../utils/helpers';

const { RangePicker } = DatePicker;
const { Title } = Typography;

export default function StatisticsPage() {
  const [overview, setOverview] = useState<StatisticsOverview | null>(null);
  const [clientReports, setClientReports] = useState<ClientSatisfactionReport[]>([]);
  const [hearingStats, setHearingStats] = useState<HearingStatistics[]>([]);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>();
  const navigate = useNavigate();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const from = dateRange?.[0]?.format('YYYY-MM-DD');
    const to = dateRange?.[1]?.format('YYYY-MM-DD');
    const [o, c, h] = await Promise.all([
      statisticsService.getOverview(from, to),
      statisticsService.getClientSatisfaction(from, to),
      statisticsService.getHearingStats(from || dayjs().subtract(30, 'day').format('YYYY-MM-DD'), to || dayjs().format('YYYY-MM-DD')),
    ]);
    setOverview(o); setClientReports(c); setHearingStats(h);
  };

  const handleDateChange = (dates: any) => {
    setDateRange(dates);
    setTimeout(loadData, 0);
  };

  const clientColumns = [
    { title: '客户', dataIndex: 'clientName' },
    { title: '平均满意度', dataIndex: 'avgScore', render: (s: number) => <Statistic value={s} precision={1} suffix="/ 5" valueStyle={{ fontSize: 14 }} /> },
    { title: '开庭数', dataIndex: 'hearingCount' },
  ];

  return (
    <div>
      <Card extra={<RangePicker onChange={handleDateChange} />}>
        <Row gutter={16}>
          <Col span={4}><Card><Statistic title="总排程" value={overview?.totalHearings || 0} prefix={<FileTextOutlined />} /></Card></Col>
          <Col span={4}><Card><Statistic title="已完成" value={overview?.completedHearings || 0} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#3f8600' }} /></Card></Col>
          <Col span={4}><Card><Statistic title="已取消" value={overview?.cancelledHearings || 0} prefix={<CloseCircleOutlined />} valueStyle={{ color: '#cf1322' }} /></Card></Col>
          <Col span={4}><Card><Statistic title="利益冲突" value={overview?.conflictsDetected || 0} prefix={<WarningOutlined />} valueStyle={{ color: '#faad14' }} /></Card></Col>
          <Col span={4}><Card><Statistic title="平均满意度" value={overview?.avgSatisfactionScore || 0} precision={1} prefix={<SmileOutlined />} suffix="/ 5" /></Card></Col>
          <Col span={4}><Card><Statistic title="本月排程" value={overview?.hearingsThisMonth || 0} prefix={<CalendarOutlined />} /></Card></Col>
        </Row>
      </Card>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={14}>
          <Card title="开庭统计">
            <Table rowKey="date" dataSource={hearingStats} pagination={false} size="small"
              columns={[
                { title: '日期', dataIndex: 'date' },
                { title: '总数', dataIndex: 'total' },
                { title: '完成', dataIndex: 'completed' },
                { title: '取消', dataIndex: 'cancelled' },
                { title: '冲突', dataIndex: 'conflictCount' },
              ]}
            />
          </Card>
        </Col>
        <Col span={10}>
          <Card title="客户满意度">
            <Table rowKey="clientId" dataSource={clientReports} columns={clientColumns} size="small" expandable={{
              expandedRowRender: (r: ClientSatisfactionReport) => (
                <Table dataSource={r.feedbacks} pagination={false} size="small" rowKey="hearingId"
                  columns={[
                    { title: '案号', dataIndex: 'caseNumber', render: (id: string, record: any) => <a onClick={() => navigate(`/hearings/${record.hearingId}`)}>{id}</a> },
                    { title: '满意度', dataIndex: 'satisfactionScore', render: (s: number) => `${s} / 5` },
                    { title: '评价', dataIndex: 'comments', ellipsis: true },
                    { title: '提交时间', dataIndex: 'submittedAt', render: (d: string) => formatDateTime(d) },
                  ]}
                />
              ),
            }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
