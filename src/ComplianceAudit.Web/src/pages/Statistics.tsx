import { useEffect, useState } from 'react';
import {
  Card, Row, Col, Typography, Statistic, Table, Tag, Button,
  Form, Input, DatePicker, Select, Progress, Empty, List, Avatar,
  Space, Divider, Descriptions, Modal
} from 'antd';
import {
  SearchOutlined, CalendarOutlined, TeamOutlined,
  SafetyCertificateOutlined, FileSearchOutlined,
  PieChartOutlined, BarChartOutlined, TableOutlined,
  DocumentSearchOutlined
} from '@ant-design/icons';
import { Pie, Column, Area, Rose } from '@ant-design/plots';
import dayjs from 'dayjs';
import { statisticsApi, schedulesApi, regulationsApi } from '@/services/api';
import { useRolePermissions } from '@/store/authStore';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const RiskTag = ({ level }: { level: number }) => {
  const map: Record<number, { color: string; text: string; cls: string }> = {
    1: { color: 'green', text: '低', cls: 'tag-low' },
    2: { color: 'orange', text: '中', cls: 'tag-medium' },
    3: { color: 'red', text: '高', cls: 'tag-high' },
    4: { color: '#000', text: '严重', cls: 'tag-critical' }
  };
  const cfg = map[level] ?? map[1];
  return <Tag className={cfg.cls} color={cfg.color}>{cfg.text}风险</Tag>;
};

export default function Statistics() {
  const { isManagement } = useRolePermissions();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [dateRange, setDateRange] = useState<any[]>([]);
  const [coverageModal, setCoverageModal] = useState<{ open: boolean; scheduleId?: number; data?: any }>({ open: false });
  const [complianceRates, setComplianceRates] = useState<any[]>([]);
  const [rectSummary, setRectSummary] = useState<any[]>([]);
  const [auditorPerf, setAuditorPerf] = useState<any[]>([]);
  const [evReport, setEvReport] = useState<any>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [schedStats, setSchedStats] = useState<any[]>([]);
  const [riskDist, setRiskDist] = useState<any[]>([]);

  useEffect(() => { loadAll(); }, [dateRange]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const params = dateRange?.length === 2
        ? { startDate: dateRange[0].toISOString(), endDate: dateRange[1].toISOString() }
        : undefined;
      const [cr, rs, ap, er, schedRes, statusRes, riskRes] = await Promise.all([
        statisticsApi.getComplianceRate(params),
        statisticsApi.getRectificationSummary(params),
        statisticsApi.getAuditorPerformance(params),
        statisticsApi.getEvidenceCompletion(),
        schedulesApi.list({ pageNumber: 1, pageSize: 20 }),
        (await import('@/services/api')).dashboardApi.getScheduleStatusSummary(params),
        (await import('@/services/api')).dashboardApi.getRiskDistribution()
      ]);
      setComplianceRates(cr.data ?? []);
      setRectSummary(rs.data ?? []);
      setAuditorPerf(ap.data ?? []);
      setEvReport(er.data);
      setSchedules((schedRes.data as any)?.items ?? []);
      setSchedStats(statusRes.data ?? []);
      const riskMap: Record<number, string> = { 1: '低风险', 2: '中风险', 3: '高风险', 4: '严重风险' };
      setRiskDist((riskRes.data ?? []).map((r: any) => ({ type: riskMap[r.riskLevel] ?? '未知', value: r.count })));
    } finally { setLoading(false); }
  };

  const openCoverage = async (scheduleId: number) => {
    try {
      const res = await statisticsApi.getSamplingCoverage(scheduleId);
      if (res.success) setCoverageModal({ open: true, scheduleId, data: res.data });
    } catch {}
  };

  const statusMap: Record<number, string> = {
    1: '待处理', 2: '进行中', 3: '待复核', 4: '已复核', 5: '已通过', 6: '已拒绝', 7: '已关闭'
  };

  const pieStatus = {
    data: schedStats.map((s: any) => ({ type: statusMap[s.status] ?? '未知', value: s.count })),
    angleField: 'value', colorField: 'type', radius: 0.9, innerRadius: 0.5,
    label: { text: 'value', position: 'outside' },
    legend: { position: 'bottom' }
  };

  const barCompliance = {
    data: complianceRates,
    xField: 'category', yField: 'complianceRate',
    label: { position: 'top', formatter: (d: any) => `${d.complianceRate}%` },
    color: '#1677ff', maxBarWidth: 60
  };

  const rectStatusMap: Record<number, string> = {
    1: '未开始', 2: '整改中', 3: '待复核', 4: '已验证', 5: '已关闭', 6: '已逾期'
  };
  const roseData = rectSummary.map((r: any) => ({ type: rectStatusMap[r.status] ?? '未知', value: r.count }));
  const roseConfig = {
    data: roseData, xField: 'type', yField: 'value',
    seriesField: 'type', radius: 0.9,
    legend: { position: 'bottom' }
  };

  const audCol = [
    { title: '审计员', dataIndex: 'auditorName', width: 120 },
    { title: '完成排程', dataIndex: 'completedSchedules', width: 100, sorter: (a: any, b: any) => a.completedSchedules - b.completedSchedules },
    { title: '检查记录', dataIndex: 'totalCheckRecords', width: 100 },
    { title: '发现问题', dataIndex: 'nonCompliantCount', width: 100 },
    {
      title: '问题发现率', dataIndex: 'detectionRate', width: 120,
      render: (v: number) => <Progress percent={Math.round(v)} size="small" />
    },
    {
      title: '平均完成天数', dataIndex: 'averageCompletionDays', width: 120,
      render: (v: number) => <Text>{v} 天</Text>
    }
  ];

  const schedCol = [
    {
      title: '排程', dataIndex: 'title', ellipsis: true,
      render: (t: string, r: any) => <Text strong>{t}</Text>
    },
    { title: '制度', dataIndex: 'regulationName', width: 140, ellipsis: true },
    { title: '审计员', dataIndex: 'auditorName', width: 100 },
    {
      title: '风险等级', dataIndex: 'riskLevel', width: 100,
      render: (l: number) => <RiskTag level={l} />
    },
    { title: '截止日期', dataIndex: 'dueDate', width: 120, render: (d: string) => dayjs(d).format('YYYY-MM-DD') },
    {
      title: '操作', key: 'ops', width: 140,
      render: (_: any, r: any) => (
        <Button type="link" size="small" onClick={() => openCoverage(r.id)}>
          <PieChartOutlined /> 查看抽样覆盖
        </Button>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <Title level={3} style={{ margin: 0 }}>统计分析</Title>
          <Text type="secondary">覆盖追踪、合规指标、人员绩效，从宏观到微观一键穿透</Text>
        </div>
        <Space>
          <Form form={form} layout="inline">
            <Form.Item label="统计区间">
              <RangePicker onChange={(v) => setDateRange(v as any)} />
            </Form.Item>
            <Button icon={<SearchOutlined />} type="primary" onClick={loadAll}>更新</Button>
          </Form>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} styles={{ body: { padding: 20 } }}>
            <Statistic
              title={
                <Space>
                  <SafetyCertificateOutlined style={{ color: '#1677ff' }} />
                  整体合规率
                </Space>
              }
              value={evReport?.evidenceCompletionRate ?? 0}
              suffix="%"
              valueStyle={{ color: '#1677ff' }}
            />
            <Progress percent={Math.round(evReport?.evidenceCompletionRate ?? 0)} showInfo={false} style={{ marginTop: 12 }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} styles={{ body: { padding: 20 } }}>
            <Statistic
              title={
                <Space>
                  <DocumentSearchOutlined style={{ color: '#52C41A' }} />
                  证据完整率
                </Space>
              }
              value={evReport?.evidenceCompletionRate ?? 0}
              suffix="%"
              valueStyle={{ color: '#52C41A' }}
            />
            <Row style={{ marginTop: 12 }}>
              <Col span={8}>
                <Text type="secondary" style={{ fontSize: 12 }}>完整</Text>
                <div style={{ fontWeight: 600 }}>{evReport?.completeEvidenceCount ?? 0}</div>
              </Col>
              <Col span={8}>
                <Text type="secondary" style={{ fontSize: 12 }}>缺失</Text>
                <div style={{ fontWeight: 600, color: '#ff4d4f' }}>{evReport?.missingEvidenceCount ?? 0}</div>
              </Col>
              <Col span={8}>
                <Text type="secondary" style={{ fontSize: 12 }}>待补</Text>
                <div style={{ fontWeight: 600, color: '#faad14' }}>{evReport?.supplementRequestedCount ?? 0}</div>
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} styles={{ body: { padding: 20 } }}>
            <Statistic
              title={
                <Space>
                  <CalendarOutlined style={{ color: '#722ED1' }} />
                  总检查记录
                </Space>
              }
              value={evReport?.totalCheckRecords ?? 0}
              valueStyle={{ color: '#722ED1' }}
            />
            <Progress
              type="dashboard" percent={complianceRates.length > 0
                ? Math.round(complianceRates.reduce((s, r: any) => s + r.complianceRate, 0) / complianceRates.length) : 0}
              size={80} style={{ marginTop: 4 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} styles={{ body: { padding: 20 } }}>
            <Statistic
              title={
                <Space>
                  <TeamOutlined style={{ color: '#13C2C2' }} />
                  审计人员数
                </Space>
              }
              value={auditorPerf.length}
              valueStyle={{ color: '#13C2C2' }}
            />
            <Row style={{ marginTop: 12 }}>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 12 }}>平均完成排程</Text>
                <div style={{ fontWeight: 600 }}>
                  {auditorPerf.length > 0
                    ? Math.round(auditorPerf.reduce((s: number, r: any) => s + r.completedSchedules, 0) / auditorPerf.length)
                    : 0} 个
                </div>
              </Col>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 12 }}>平均发现率</Text>
                <div style={{ fontWeight: 600 }}>
                  {auditorPerf.length > 0
                    ? Math.round(auditorPerf.reduce((s: number, r: any) => s + r.detectionRate, 0) / auditorPerf.length)
                    : 0}%
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={10}>
          <Card title={<span><PieChartOutlined /> 排程状态分布</span>} bordered={false}>
            {pieStatus.data.length > 0 ? <Pie {...pieStatus} height={280} /> : <Empty />}
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card title={<span><BarChartOutlined /> 合规率按制度分类</span>} bordered={false}>
            {complianceRates.length > 0 ? <Column {...barCompliance} height={280} /> : <Empty />}
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={10}>
          <Card title={<span><FileSearchOutlined /> 整改状态分布</span>} bordered={false}>
            {roseData.length > 0 ? <Rose {...roseConfig} height={280} /> : <Empty />}
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card title={<span><TableOutlined /> 抽样覆盖详情 - 点击排程查看覆盖</span>} bordered={false}>
            <Table
              size="small"
              rowKey="id"
              columns={schedCol}
              dataSource={schedules}
              pagination={{ pageSize: 5 }}
              scroll={{ x: 800 }}
            />
          </Card>
        </Col>
      </Row>

      {isManagement && (
        <Card title={<span><TeamOutlined /> 审计员绩效分析</span>} bordered={false}>
          <Table
            size="middle"
            rowKey="auditorId"
            columns={audCol}
            dataSource={auditorPerf}
            pagination={false}
            scroll={{ x: 700 }}
            summary={(pageData) => {
              const total = pageData.reduce((s, r: any) => s + r.completedSchedules, 0);
              const avgRate = pageData.length > 0 ? pageData.reduce((s: number, r: any) => s + r.detectionRate, 0) / pageData.length : 0;
              return (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0}><Text strong>合计/平均</Text></Table.Summary.Cell>
                    <Table.Summary.Cell index={1}><Text strong>{total}</Text></Table.Summary.Cell>
                    <Table.Summary.Cell index={2}>
                      <Text strong>{pageData.reduce((s, r: any) => s + r.totalCheckRecords, 0)}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3}>
                      <Text strong>{pageData.reduce((s, r: any) => s + r.nonCompliantCount, 0)}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4}><Text strong>{Math.round(avgRate)}%</Text></Table.Summary.Cell>
                    <Table.Summary.Cell index={5}></Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              );
            }}
          />
        </Card>
      )}

      <Modal
        title={coverageModal.data ? `抽样覆盖报告 - ${coverageModal.data.scheduleTitle}` : '抽样覆盖报告'}
        open={coverageModal.open}
        onCancel={() => setCoverageModal({ open: false })}
        width={880}
        footer={[
          <Button key="close" onClick={() => setCoverageModal({ open: false })}>关闭</Button>
        ]}
      >
        {coverageModal.data && (
          <>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Card size="small" style={{ background: '#E6F4FF' }}>
                  <Statistic title="估算单据总数" value={coverageModal.data.totalDocuments} />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ background: '#F6FFED' }}>
                  <Statistic title="抽样数量" value={coverageModal.data.sampledCount} />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ background: '#FFF7E6' }}>
                  <Statistic title="覆盖率" value={coverageModal.data.coverageRate} suffix="%" />
                  <Progress percent={coverageModal.data.coverageRate} size="small" style={{ marginTop: 8 }} showInfo={false} />
                </Card>
              </Col>
            </Row>

            <Divider style={{ margin: '8px 0 16px' }}>按单据类型明细</Divider>

            <Table
              size="small"
              rowKey="documentType"
              pagination={false}
              dataSource={coverageModal.data.details}
              columns={[
                { title: '单据类型', dataIndex: 'documentType', width: 140 },
                {
                  title: '单据总数', dataIndex: 'totalDocuments', width: 100,
                  render: (v) => <Text strong>{v}</Text>
                },
                { title: '抽样数量', dataIndex: 'sampledCount', width: 100 },
                {
                  title: '覆盖率', dataIndex: 'coverageRate', width: 160,
                  render: (v: number) => (
                    <Space>
                      <Progress percent={v} size="small" style={{ width: 100 }} showInfo={false} />
                      <Text>{v}%</Text>
                    </Space>
                  )
                },
                {
                  title: '抽样到的单据（最多100条）',
                  dataIndex: 'sampledDocumentNos',
                  render: (list: string[]) => (
                    <Space wrap size={[4, 4]}>
                      {list.map((n, i) => <Tag key={i} color="blue" style={{ margin: 2 }}>{n}</Tag>)}
                    </Space>
                  )
                }
              ]}
            />

            <Divider style={{ margin: '16px 0 12px' }}>穿透到单据</Divider>
            <Paragraph type="secondary">
              点击下方单据号可跳转至单据追溯页面，查看完整的处理历史、关联检查记录及整改情况。
            </Paragraph>
            <Button type="link" onClick={() => window.open('/document-trace', '_blank')}>
              前往单据追溯 →
            </Button>
          </>
        )}
      </Modal>
    </div>
  );
}
