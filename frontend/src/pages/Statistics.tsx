import { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Select,
  DatePicker,
  Table,
  Tag,
  Alert,
  Statistic,
} from 'antd';
import {
  WarningOutlined,
  RiseOutlined,
  BarChartOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { statisticsAPI, storeAPI } from '@/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { LossCategoryMap, AbnormalTypeMap } from '@/types';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

const COLORS = ['#977669', '#f5222d', '#fa8c16', '#a0d911', '#1890ff', '#722ed1'];

function Statistics() {
  const [period, setPeriod] = useState<string>('month');
  const [selectedStore, setSelectedStore] = useState<number | undefined>();

  const { data: dashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => statisticsAPI.getDashboard().then((res) => res.data),
  });

  const { data: lossTrend } = useQuery({
    queryKey: ['lossTrend', period, selectedStore],
    queryFn: () =>
      statisticsAPI
        .getLossTrend({ period, store_id: selectedStore })
        .then((res) => res.data),
  });

  const { data: storeRanking } = useQuery({
    queryKey: ['storeRanking', period],
    queryFn: () =>
      statisticsAPI.getStoreRanking({ period }).then((res) => res.data),
  });

  const { data: stores } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storeAPI.getStores().then((res) => res.data),
  });

  const { data: threshold } = useQuery({
    queryKey: ['threshold'],
    queryFn: () =>
      statisticsAPI.getThreshold().then((res) => res.data),
  });

  const categoryData = [
    { name: '原材料', value: 45, amount: 15000 },
    { name: '成品', value: 30, amount: 10000 },
    { name: '包装材料', value: 15, amount: 5000 },
    { name: '设备', value: 7, amount: 2300 },
    { name: '其他', value: 3, amount: 1000 },
  ];

  const abnormalTypeData = [
    { name: '高损耗率', value: 45 },
    { name: '大额报损', value: 30 },
    { name: '高频报损', value: 20 },
    { name: '可疑模式', value: 5 },
  ];

  const rankingColumns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      render: (rank: number) => (
        <span
          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-sm font-bold ${
            rank === 1
              ? 'bg-red-500'
              : rank === 2
              ? 'bg-orange-500'
              : rank === 3
              ? 'bg-yellow-500'
              : 'bg-gray-400'
          }`}
        >
          {rank}
        </span>
      ),
    },
    {
      title: '门店',
      dataIndex: 'store_name',
      key: 'store_name',
    },
    {
      title: '损耗金额',
      dataIndex: 'loss_amount',
      key: 'loss_amount',
      render: (val: number) => (
        <span className="font-semibold text-red-500">¥{val.toFixed(2)}</span>
      ),
    },
    {
      title: '损耗率',
      dataIndex: 'loss_rate',
      key: 'loss_rate',
      render: (rate: number) => (
        <span
          className={`font-semibold ${
            rate > (threshold?.threshold || 5) ? 'text-red-500' : ''
          }`}
        >
          {rate.toFixed(2)}%
          {rate > (threshold?.threshold || 5) && (
            <WarningOutlined className="ml-1 text-red-500" />
          )}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card size="small" className="shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-gray-600">统计周期：</span>
          <Select value={period} onChange={setPeriod} style={{ width: 140 }}>
            <Option value="week">近7天</Option>
            <Option value="month">近30天</Option>
            <Option value="quarter">近90天</Option>
          </Select>
          <span className="text-gray-600">门店筛选：</span>
          <Select
            value={selectedStore}
            onChange={setSelectedStore}
            style={{ width: 180 }}
            allowClear
            placeholder="全部门店"
          >
            {stores?.map((store) => (
              <Option key={store.id} value={store.id}>
                {store.name}
              </Option>
            ))}
          </Select>
          <div className="flex-1" />
          <Alert
            message={`损耗率阈值：${threshold?.threshold || 5}%`}
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
          />
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm">
            <Statistic
              title={
                <span className="text-gray-600">
                  <RiseOutlined className="mr-1" />
                  本月损耗率
                </span>
              }
              value={dashboard?.month_loss_rate || 0}
              precision={2}
              suffix="%"
              valueStyle={{
                color:
                  (dashboard?.month_loss_rate || 0) > (threshold?.threshold || 5)
                    ? '#cf1322'
                    : '#3f8600',
                fontSize: '28px',
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm">
            <Statistic
              title={
                <span className="text-gray-600">
                  <BarChartOutlined className="mr-1" />
                  本月损耗金额
                </span>
              }
              value={dashboard?.month_loss_amount || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#cf1322', fontSize: '28px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm">
            <Statistic
              title={
                <span className="text-gray-600">
                  <WarningOutlined className="mr-1" />
                  异常报损数
                </span>
              }
              value={dashboard?.abnormal_count || 0}
              valueStyle={{ color: '#cf1322', fontSize: '28px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm">
            <Statistic
              title={
                <span className="text-gray-600">
                  今日新增报损
                </span>
              }
              value={dashboard?.today_report_count || 0}
              suffix="单"
              valueStyle={{ color: '#1890ff', fontSize: '28px' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="损耗率趋势分析" className="shadow-sm">
            <div style={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lossTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) =>
                      dayjs(value).format('MM-DD')
                    }
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 12 }}
                    label={{
                      value: '损耗金额(元)',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fontSize: 12 },
                    }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12 }}
                    label={{
                      value: '损耗率(%)',
                      angle: 90,
                      position: 'insideRight',
                      style: { fontSize: 12 },
                    }}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === 'loss_amount'
                        ? `¥${value.toFixed(2)}`
                        : `${value.toFixed(2)}%`,
                      name === 'loss_amount' ? '损耗金额' : '损耗率',
                    ]}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="loss_amount"
                    stroke="#977669"
                    strokeWidth={2}
                    name="损耗金额"
                    dot={{ fill: '#977669', r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="loss_rate"
                    stroke="#f5222d"
                    strokeWidth={2}
                    name="损耗率"
                    dot={{ fill: '#f5222d', r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="报损类别占比" className="shadow-sm">
            <div style={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value}%`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="门店损耗率排名" className="shadow-sm">
            <Table
              rowKey="store_id"
              columns={rankingColumns}
              dataSource={storeRanking}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title="异常类型分布" className="shadow-sm">
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={abnormalTypeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={80}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip />
                  <Bar dataKey="value" fill="#f5222d" radius={[0, 4, 4, 0]}>
                    {abnormalTypeData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={['#f5222d', '#fa8c16', '#faad14', '#a0d911'][
                          index % 4
                        ]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
              <p className="font-medium text-gray-700 mb-2">异常判定规则：</p>
              <ul className="text-gray-600 space-y-1">
                <li>• 高损耗率：门店月损耗率超过 {threshold?.threshold || 5}%</li>
                <li>• 大额报损：单笔报损金额超过 5,000 元</li>
                <li>• 高频报损：单店一周内报损超过 3 单</li>
                <li>• 可疑模式：系统检测到异常报损模式</li>
              </ul>
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="各门店月度损耗对比" className="shadow-sm">
        <div style={{ height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={
                storeRanking?.map((item) => ({
                  name: item.store_name,
                  损耗金额: item.loss_amount,
                  损耗率: item.loss_rate,
                })) || []
              }
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 12 }}
                label={{
                  value: '损耗金额(元)',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 12 },
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12 }}
                label={{
                  value: '损耗率(%)',
                  angle: 90,
                  position: 'insideRight',
                  style: { fontSize: 12 },
                }}
              />
              <Tooltip />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="损耗金额"
                fill="#977669"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                yAxisId="right"
                dataKey="损耗率"
                fill="#f5222d"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

export default Statistics;
