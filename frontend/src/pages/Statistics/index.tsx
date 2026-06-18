import { useState, useEffect } from 'react';
import { 
  Card, Row, Col, DatePicker, Statistic, Table, Tag, 
  Space, message 
} from 'antd';
import { 
  ArrowUpOutlined, ArrowDownOutlined, 
  UserOutlined, CarOutlined 
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import type { StatisticsOverview } from '@/types';
import { statisticsApi } from '@/services/statistics';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

export default function Statistics() {
  const [data, setData] = useState<StatisticsOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await statisticsApi.getOverview(
        dateRange[0]?.format('YYYY-MM-DD'),
        dateRange[1]?.format('YYYY-MM-DD')
      );
      setData(result);
    } catch (error) {
      message.error('加载统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (dates: any) => {
    setDateRange(dates);
    if (dates && dates[0] && dates[1]) {
      loadData();
    }
  };

  const sourcePieOption = data ? {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: '来源分布',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: data.sourceDistribution.map((item, index) => ({
          value: item.count,
          name: item.sourceName,
          itemStyle: {
            color: ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#13c2c2'][index % 5],
          },
        })),
      },
    ],
  } : {};

  const handlerBarOption = data ? {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.handlerRanking.map(item => item.name),
      axisLabel: {
        interval: 0,
        rotate: 0,
      },
    },
    yAxis: {
      type: 'value',
      name: '单数',
    },
    series: [
      {
        name: '维修单数',
        type: 'bar',
        data: data.handlerRanking.map(item => item.count),
        itemStyle: {
          color: '#1890ff',
          borderRadius: [4, 4, 0, 0],
        },
        label: {
          show: true,
          position: 'top',
        },
      },
    ],
  } : {};

  const conclusionRingOption = data ? {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      bottom: '0',
      left: 'center',
    },
    series: [
      {
        name: '处理结论',
        type: 'pie',
        radius: ['35%', '65%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{b}\n{d}%',
        },
        data: data.conclusionDistribution.map((item, index) => ({
          value: item.value,
          name: item.name,
          itemStyle: {
            color: ['#52c41a', '#1890ff', '#faad14', '#722ed1', '#8c8c8c'][index % 5],
          },
        })),
      },
    ],
  } : {};

  const reworkColumns = [
    {
      title: '单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      render: (text: string) => <span style={{ color: '#1890ff' }}>{text}</span>,
    },
    {
      title: '车牌号',
      dataIndex: 'plateNumber',
      key: 'plateNumber',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '返修原因',
      dataIndex: 'reworkReason',
      key: 'reworkReason',
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <span>时间范围：</span>
          <RangePicker
            value={dateRange as any}
            onChange={handleDateChange}
          />
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总维修单"
              value={data?.repairRate.total || 0}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="返修数"
              value={data?.repairRate.rework || 0}
              prefix={<ArrowUpOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="返修率"
              value={data?.repairRate.rate || 0}
              precision={2}
              suffix="%"
              valueStyle={{ 
                color: (data?.repairRate.rate || 0) > 5 ? '#f5222d' : '#52c41a' 
              }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="技师人数"
              value={data?.handlerRanking.length || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card 
            title="返修率统计"
            extra={<Tag color="red">高风险</Tag>}
          >
            <ReactECharts
              option={{
                tooltip: {
                  trigger: 'axis',
                },
                grid: {
                  left: '3%',
                  right: '4%',
                  bottom: '3%',
                  containLabel: true,
                },
                xAxis: {
                  type: 'category',
                  boundaryGap: false,
                  data: ['3/1', '3/2', '3/3', '3/4', '3/5', '3/6', '3/7', '3/8', '3/9', '3/10'],
                },
                yAxis: {
                  type: 'value',
                  name: '返修率 (%)',
                },
                series: [
                  {
                    name: '返修率',
                    type: 'line',
                    smooth: true,
                    data: [2.5, 3.2, 2.8, 3.5, 4.0, 3.8, 3.2, 3.0, 3.5, 3.5],
                    areaStyle: {
                      color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                          { offset: 0, color: 'rgba(245, 34, 45, 0.3)' },
                          { offset: 1, color: 'rgba(245, 34, 45, 0.05)' },
                        ],
                      },
                    },
                    lineStyle: {
                      color: '#f5222d',
                      width: 2,
                    },
                    itemStyle: {
                      color: '#f5222d',
                    },
                    markLine: {
                      silent: true,
                      data: [
                        {
                          yAxis: 5,
                          label: {
                            formatter: '警戒线 5%',
                          },
                          lineStyle: {
                            color: '#faad14',
                            type: 'dashed',
                          },
                        },
                      ],
                    },
                  },
                ],
              }}
              style={{ height: 300 }}
              opts={{ renderer: 'canvas' }}
            />
          </Card>
        </Col>

        <Col span={12}>
          <Card title="返修记录">
            <Table
              dataSource={data?.repairRate.list || []}
              columns={reworkColumns}
              rowKey="id"
              size="small"
              pagination={false}
              scroll={{ y: 260 }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={8}>
          <Card title="来源分布">
            <ReactECharts
              option={sourcePieOption}
              style={{ height: 280 }}
              opts={{ renderer: 'canvas' }}
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card title="负责人业绩排行">
            <ReactECharts
              option={handlerBarOption}
              style={{ height: 280 }}
              opts={{ renderer: 'canvas' }}
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card title="处理结论分布">
            <ReactECharts
              option={conclusionRingOption}
              style={{ height: 280 }}
              opts={{ renderer: 'canvas' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
