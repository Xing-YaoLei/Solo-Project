import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Space, Select, Spin, Alert } from 'antd';
import {
  HomeOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { useStore, isAdmin } from '../../store';
import { dashboardAPI } from '../../services/api';
import DateRangePicker from '../../components/common/DateRangePicker';
import WaterElectricityChart from '../../components/charts/WaterElectricityChart';
import InspectionFunnelChart from '../../components/charts/InspectionFunnelChart';
import PaymentRankingChart from '../../components/charts/PaymentRankingChart';
import ComplaintTagsChart from '../../components/charts/ComplaintTagsChart';
import {
  KPIData,
  WaterElectricityData,
  InspectionFunnelData,
  PaymentRankingData,
  ComplaintTagsData,
} from '../../types';
import { formatMoney, formatDuration } from '../../utils/format';
import type { Dayjs } from 'dayjs';

const Dashboard: React.FC = () => {
  const { user, darkMode } = useStore();
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [area, setArea] = useState<string | null>(null);
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [waterElectricityData, setWaterElectricityData] = useState<WaterElectricityData[]>([]);
  const [inspectionFunnelData, setInspectionFunnelData] = useState<InspectionFunnelData[]>([]);
  const [paymentRankingData, setPaymentRankingData] = useState<PaymentRankingData[]>([]);
  const [complaintTagsData, setComplaintTagsData] = useState<ComplaintTagsData[]>([]);

  const mockKPI: KPIData = {
    inspectionCount: 156,
    paymentTotal: 1256800,
    avgRepairDuration: 24.5,
    complaintCount: 23,
    inspectionCountTrend: 12.5,
    paymentTotalTrend: 8.2,
    avgRepairDurationTrend: -5.3,
    complaintCountTrend: -15.2,
  };

  const mockWaterElectricityData: WaterElectricityData[] = Array.from({ length: 30 }, (_, i) => ({
    date: `2024-0${Math.floor(i / 7) + 1}-${(i % 28) + 1}`,
    water: Math.floor(Math.random() * 50) + 20,
    electricity: Math.floor(Math.random() * 100) + 50,
    area: ['A区', 'B区', 'C区'][i % 3],
  }));

  const mockInspectionFunnelData: InspectionFunnelData[] = [
    { name: '待验房', value: 156 },
    { name: '预约中', value: 128 },
    { name: '验房中', value: 96 },
    { name: '验房完成', value: 85 },
    { name: '已入住', value: 72 },
  ];

  const mockPaymentRankingData: PaymentRankingData[] = [
    { name: '张三', amount: 12500, area: 'A区' },
    { name: '李四', amount: 11800, area: 'B区' },
    { name: '王五', amount: 10500, area: 'C区' },
    { name: '赵六', amount: 9800, area: 'A区' },
    { name: '钱七', amount: 9200, area: 'B区' },
    { name: '孙八', amount: 8900, area: 'C区' },
    { name: '周九', amount: 8500, area: 'A区' },
    { name: '吴十', amount: 7800, area: 'B区' },
    { name: '郑十一', amount: 7200, area: 'C区' },
    { name: '王十二', amount: 6800, area: 'A区' },
  ];

  const mockComplaintTagsData: ComplaintTagsData[] = Array.from({ length: 12 }, (_, i) => ({
    date: `2024-${String(i + 1).padStart(2, '0')}`,
    noise: Math.floor(Math.random() * 20) + 5,
    hygiene: Math.floor(Math.random() * 15) + 3,
    facilities: Math.floor(Math.random() * 25) + 8,
    safety: Math.floor(Math.random() * 10) + 2,
    other: Math.floor(Math.random() * 8) + 1,
  }));

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = dateRange
          ? {
              startDate: dateRange[0].format('YYYY-MM-DD'),
              endDate: dateRange[1].format('YYYY-MM-DD'),
              area: area || undefined,
            }
          : { area: area || undefined };

        const [kpi, water, inspection, payment, complaint] = await Promise.all([
          dashboardAPI.getKPI(params).catch(() => mockKPI),
          dashboardAPI.getWaterElectricity(params).catch(() => mockWaterElectricityData),
          dashboardAPI.getInspectionFunnel(params).catch(() => mockInspectionFunnelData),
          dashboardAPI.getPaymentRanking(params).catch(() => mockPaymentRankingData),
          dashboardAPI.getComplaintTags(params).catch(() => mockComplaintTagsData),
        ]);

        setKpiData(kpi as KPIData);
        setWaterElectricityData(water as WaterElectricityData[]);
        setInspectionFunnelData(inspection as InspectionFunnelData[]);
        setPaymentRankingData(payment as PaymentRankingData[]);
        setComplaintTagsData(complaint as ComplaintTagsData[]);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange, area]);

  const TrendIcon: React.FC<{ value?: number }> = ({ value }) => {
    if (!value) return null;
    if (value > 0) {
      return (
        <span style={{ color: '#52c41a', fontSize: 12 }}>
          <ArrowUpOutlined /> {Math.abs(value)}%
        </span>
      );
    }
    return (
      <span style={{ color: '#f5222d', fontSize: 12 }}>
        <ArrowDownOutlined /> {Math.abs(value)}%
      </span>
    );
  };

  if (loading && !kpiData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  const displayKPI = kpiData || mockKPI;

  return (
    <div>
      <Space style={{ marginBottom: 24 }} wrap>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
        {isAdmin() && (
          <Select
            style={{ width: 150 }}
            placeholder="选择区域"
            allowClear
            value={area}
            onChange={setArea}
            options={[
              { value: 'A区', label: 'A区' },
              { value: 'B区', label: 'B区' },
              { value: 'C区', label: 'C区' },
            ]}
          />
        )}
      </Space>

      {!isAdmin() && (
        <Alert
          message="数据说明"
          description="您当前以工作人员身份登录，仅显示与您相关的数据。"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={
                <Space>
                  <HomeOutlined style={{ color: '#1677ff' }} />
                  本月验房数
                </Space>
              }
              value={displayKPI.inspectionCount}
              suffix="单"
              valueStyle={{ color: '#1677ff' }}
              extra={<TrendIcon value={displayKPI.inspectionCountTrend} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={
                <Space>
                  <DollarOutlined style={{ color: '#52c41a' }} />
                  收款总额
                </Space>
              }
              value={displayKPI.paymentTotal}
              formatter={(value) => formatMoney(Number(value))}
              valueStyle={{ color: '#52c41a' }}
              extra={<TrendIcon value={displayKPI.paymentTotalTrend} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={
                <Space>
                  <ClockCircleOutlined style={{ color: '#faad14' }} />
                  平均维修时长
                </Space>
              }
              value={displayKPI.avgRepairDuration}
              formatter={(value) => formatDuration(Number(value))}
              valueStyle={{ color: '#faad14' }}
              extra={<TrendIcon value={displayKPI.avgRepairDurationTrend} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={
                <Space>
                  <ExclamationCircleOutlined style={{ color: '#f5222d' }} />
                  投诉数量
                </Space>
              }
              value={displayKPI.complaintCount}
              suffix="件"
              valueStyle={{ color: '#f5222d' }}
              extra={<TrendIcon value={displayKPI.complaintCountTrend} />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="水电读数分布" bordered={false}>
            <WaterElectricityChart
              data={waterElectricityData}
              chartType="bar"
              darkMode={darkMode}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="验房清单漏斗" bordered={false}>
            <InspectionFunnelChart
              data={inspectionFunnelData}
              darkMode={darkMode}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="收款流水排行" bordered={false}>
            <PaymentRankingChart
              data={paymentRankingData}
              topN={10}
              darkMode={darkMode}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="投诉标签变化" bordered={false}>
            <ComplaintTagsChart
              data={complaintTagsData}
              chartType="line"
              darkMode={darkMode}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
