import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, DatePicker, Space, Statistic, Row, Col } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { FunnelStage, InspectionPassRate } from '../types';
import { reportsApi } from '../services/api';

const { RangePicker } = DatePicker;

interface CleaningFunnelChartProps {
  className?: string;
  refreshToken?: number;
}

const CleaningFunnelChart: React.FC<CleaningFunnelChartProps> = ({ className, refreshToken }) => {
  const [funnelData, setFunnelData] = useState<FunnelStage[]>([]);
  const [passRate, setPassRate] = useState<InspectionPassRate | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  useEffect(() => {
    fetchData();
  }, [dateRange, refreshToken]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = dateRange
        ? {
            start_date: dateRange[0].format('YYYY-MM-DD'),
            end_date: dateRange[1].format('YYYY-MM-DD'),
          }
        : undefined;

      const [funnelRes, passRateRes] = await Promise.all([
        reportsApi.getFunnel(params),
        reportsApi.getInspectionPassRate(params),
      ]);

      setFunnelData(funnelRes.data || []);
      setPassRate(passRateRes.data || null);
    } catch (error) {
      console.error('Failed to fetch funnel data:', error);
      setFunnelData([]);
      setPassRate(null);
    } finally {
      setLoading(false);
    }
  };

  const getOption = () => {
    const colors = ['#1890ff', '#52c41a', '#faad14', '#fa8c16', '#722ed1'];
    const data = funnelData.map((item, index) => ({
      value: item.count,
      name: item.stage,
      itemStyle: { color: colors[index % colors.length] },
    }));

    return {
      title: {
        text: '清洁复查漏斗',
        left: 'center',
        textStyle: { fontSize: 16, fontWeight: 'bold' },
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
      },
      legend: {
        bottom: 0,
        left: 'center',
        data: funnelData.map((item) => item.stage),
      },
      series: [
        {
          name: '清洁漏斗',
          type: 'funnel',
          left: '10%',
          top: 60,
          bottom: 60,
          width: '80%',
          min: 0,
          max: funnelData.length > 0 ? funnelData[0].count : 100,
          minSize: '0%',
          maxSize: '100%',
          sort: 'descending',
          gap: 2,
          label: {
            show: true,
            position: 'inside',
            formatter: '{b}\n{c}',
            color: '#fff',
            fontSize: 12,
          },
          labelLine: {
            length: 10,
            lineStyle: {
              width: 1,
              type: 'solid',
            },
          },
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 1,
          },
          emphasis: {
            label: {
              fontSize: 14,
            },
          },
          data: data,
        },
      ],
    };
  };

  const conversionRate = funnelData.length >= 2 && funnelData[0].count > 0
    ? ((funnelData[funnelData.length - 1].count / funnelData[0].count) * 100).toFixed(1)
    : '0';

  return (
    <Card
      className={className}
      title={
        <Space>
          <span>清洁复查漏斗</span>
          <RangePicker
            size="small"
            value={dateRange}
            onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
          />
        </Space>
      }
      loading={loading}
      extra={
        <Space>
          <Statistic
            title="巡检合格率"
            value={passRate?.pass_rate || 0}
            suffix="%"
            valueStyle={{ color: '#3f8600', fontSize: 16 }}
            prefix={<CheckCircleOutlined />}
          />
        </Space>
      }
    >
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Statistic
            title="总设备数"
            value={funnelData[0]?.count || 0}
            valueStyle={{ fontSize: 20 }}
            prefix={<ClockCircleOutlined />}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="已完成清洁"
            value={funnelData[3]?.count || 0}
            valueStyle={{ color: '#52c41a', fontSize: 20 }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="整体转化率"
            value={conversionRate}
            suffix="%"
            valueStyle={{ color: '#1890ff', fontSize: 20 }}
          />
        </Col>
      </Row>
      <ReactECharts option={getOption()} style={{ height: 320 }} />
    </Card>
  );
};

export default CleaningFunnelChart;
