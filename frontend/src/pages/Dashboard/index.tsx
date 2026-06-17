import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Space, Select, Spin, Alert, Button, message } from 'antd';
import {
  HomeOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useStore, isAdmin } from '../../store';
import { analyticsAPI } from '../../services/api';
import DateRangePicker from '../../components/common/DateRangePicker';
import WaterElectricityChart from '../../components/charts/WaterElectricityChart';
import InspectionFunnelChart from '../../components/charts/InspectionFunnelChart';
import PaymentRankingChart from '../../components/charts/PaymentRankingChart';
import ComplaintTagsChart from '../../components/charts/ComplaintTagsChart';
import RepairDurationChart from '../../components/charts/RepairDurationChart';
import {
  KPIData,
  WaterElectricityData,
  InspectionFunnelData,
  PaymentRankingData,
  ComplaintTagsData,
  RepairDurationData,
} from '../../types';
import { formatMoney, formatDuration } from '../../utils/format';
import type { Dayjs } from 'dayjs';

const Dashboard: React.FC = () => {
  const { user, darkMode } = useStore();
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [district, setDistrict] = useState<string | null>(null);
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [waterElectricityData, setWaterElectricityData] = useState<WaterElectricityData[]>([]);
  const [inspectionFunnelData, setInspectionFunnelData] = useState<InspectionFunnelData[]>([]);
  const [paymentRankingData, setPaymentRankingData] = useState<PaymentRankingData[]>([]);
  const [complaintTagsData, setComplaintTagsData] = useState<ComplaintTagsData[]>([]);
  const [repairDurationData, setRepairDurationData] = useState<RepairDurationData[]>([]);

  const calculateKPI = (
    water: WaterElectricityData[],
    inspection: InspectionFunnelData[],
    payment: PaymentRankingData[],
    complaint: ComplaintTagsData[],
    repair: RepairDurationData[]
  ): KPIData => {
    const inspectionCount = inspection.find(i => i.stage === '验房完成')?.count || 0;
    const paymentTotal = payment.reduce((sum, item) => sum + item.total_amount, 0);
    const avgRepairDuration = repair.length > 0
      ? repair.reduce((sum, item) => sum + item.avg_duration * item.total_orders, 0) /
        repair.reduce((sum, item) => sum + item.total_orders, 0)
      : 0;
    const complaintCount = complaint.reduce((sum, item) => sum + item.count, 0);

    return {
      inspectionCount,
      paymentTotal,
      avgRepairDuration: Math.round(avgRepairDuration * 10) / 10,
      complaintCount,
      inspectionCountTrend: 0,
      paymentTotalTrend: 0,
      avgRepairDurationTrend: 0,
      complaintCountTrend: 0,
    };
  };

  const handleSyncData = async () => {
    setSyncLoading(true);
    try {
      await analyticsAPI.syncData();
      message.success('数据同步成功');
      fetchData();
    } catch (error) {
      message.error('数据同步失败');
    } finally {
      setSyncLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = dateRange
        ? {
            start_month: dateRange[0].format('YYYY-MM'),
            end_month: dateRange[1].format('YYYY-MM'),
            district: district || undefined,
          }
        : { district: district || undefined };

      const [water, inspection, payment, complaint, repair] = await Promise.all([
        analyticsAPI.getUtilityReadings(params),
        analyticsAPI.getInspectionFunnel(),
        analyticsAPI.getPaymentRanking({ ...params, limit: 10 }),
        analyticsAPI.getComplaintTagTrend(params),
        analyticsAPI.getRepairDuration(),
      ]);

      setWaterElectricityData(water as WaterElectricityData[]);
      setInspectionFunnelData(inspection as InspectionFunnelData[]);
      setPaymentRankingData(payment as PaymentRankingData[]);
      setComplaintTagsData(complaint as ComplaintTagsData[]);
      setRepairDurationData(repair as RepairDurationData[]);

      const kpi = calculateKPI(
        water as WaterElectricityData[],
        inspection as InspectionFunnelData[],
        payment as PaymentRankingData[],
        complaint as ComplaintTagsData[],
        repair as RepairDurationData[]
      );
      setKpiData(kpi);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      message.error('数据加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange, district]);

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

  const getDistricts = () => {
    const districts = new Set<string>();
    waterElectricityData.forEach(item => districts.add(item.district));
    return Array.from(districts).map(d => ({ value: d, label: d }));
  };

  if (loading && !kpiData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  const displayKPI = kpiData || {
    inspectionCount: 0,
    paymentTotal: 0,
    avgRepairDuration: 0,
    complaintCount: 0,
  };

  return (
    <div>
      <Space style={{ marginBottom: 24 }} wrap>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
        <Select
          style={{ width: 150 }}
          placeholder="选择区域"
          allowClear
          value={district}
          onChange={setDistrict}
          options={getDistricts()}
        />
        <Button
          type="primary"
          icon={<ReloadOutlined spin={syncLoading} />}
          onClick={handleSyncData}
          loading={syncLoading}
        >
          同步数据
        </Button>
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
                  验房完成数
                  <TrendIcon value={displayKPI.inspectionCountTrend} />
                </Space>
              }
              value={displayKPI.inspectionCount}
              suffix="单"
              valueStyle={{ color: '#1677ff' }}
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
                  <TrendIcon value={displayKPI.paymentTotalTrend} />
                </Space>
              }
              value={displayKPI.paymentTotal}
              formatter={(value) => formatMoney(Number(value))}
              valueStyle={{ color: '#52c41a' }}
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
                  <TrendIcon value={displayKPI.avgRepairDurationTrend} />
                </Space>
              }
              value={displayKPI.avgRepairDuration}
              formatter={(value) => formatDuration(Number(value))}
              valueStyle={{ color: '#faad14' }}
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
                  <TrendIcon value={displayKPI.complaintCountTrend} />
                </Space>
              }
              value={displayKPI.complaintCount}
              suffix="件"
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {isAdmin() && (
        <Card
          title="维修时长统计（管理层总览）"
          bordered={false}
          style={{ marginBottom: 24 }}
          extra={
            <Select
              style={{ width: 150 }}
              defaultValue="worker"
              options={[
                { value: 'worker', label: '按人员' },
                { value: 'type', label: '按类型' },
              ]}
            />
          }
        >
          <RepairDurationChart
            data={repairDurationData}
            groupBy="worker"
            darkMode={darkMode}
          />
        </Card>
      )}

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
