import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Space, Select, Table, Button, Spin, message } from 'antd';
import { EditOutlined, ReloadOutlined } from '@ant-design/icons';
import { useStore, isAdmin } from '../../store';
import { analyticsAPI } from '../../services/api';
import DateRangePicker from '../../components/common/DateRangePicker';
import StatusBadge from '../../components/common/StatusBadge';
import CommentModal from '../../components/common/CommentModal';
import WaterElectricityChart from '../../components/charts/WaterElectricityChart';
import ComplaintTagsChart from '../../components/charts/ComplaintTagsChart';
import { PaymentRecord, WaterElectricityData, ComplaintTagsData } from '../../types';
import { formatMoney, formatDate } from '../../utils/format';
import type { Dayjs } from 'dayjs';

const Analytics: React.FC = () => {
  const { darkMode } = useStore();
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [areas, setAreas] = useState<string[]>([]);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [waterData, setWaterData] = useState<WaterElectricityData[]>([]);
  const [complaintData, setComplaintData] = useState<ComplaintTagsData[]>([]);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PaymentRecord | null>(null);

  const mockAreas = ['A区', 'B区', 'C区', 'D区', 'E区'];
  
  const mockWaterData: WaterElectricityData[] = Array.from({ length: 30 }, (_, i) => ({
    date: `2024-0${Math.floor(i / 7) + 1}-${(i % 28) + 1}`,
    water: Math.floor(Math.random() * 50) + 20,
    electricity: Math.floor(Math.random() * 100) + 50,
    area: mockAreas[i % 5],
  }));

  const mockComplaintData: ComplaintTagsData[] = Array.from({ length: 12 }, (_, i) => ({
    date: `2024-${String(i + 1).padStart(2, '0')}`,
    noise: Math.floor(Math.random() * 20) + 5,
    hygiene: Math.floor(Math.random() * 15) + 3,
    facilities: Math.floor(Math.random() * 25) + 8,
    safety: Math.floor(Math.random() * 10) + 2,
    other: Math.floor(Math.random() * 8) + 1,
  }));

  const mockPaymentRecords: PaymentRecord[] = Array.from({ length: 50 }, (_, i) => ({
    id: `PAY${String(i + 1).padStart(6, '0')}`,
    payer: ['张三', '李四', '王五', '赵六', '钱七'][i % 5],
    amount: Math.floor(Math.random() * 15000) + 1000,
    date: `2024-0${Math.floor(i / 10) + 1}-${(i % 28) + 1}`,
    status: (['paid', 'overdue', 'pending'] as const)[i % 3],
    type: ['物业费', '水电费', '停车费', '维修费'][i % 4],
    area: mockAreas[i % 5],
    isOverdue: i % 3 === 1,
    overdueDays: i % 3 === 1 ? Math.floor(Math.random() * 30) + 1 : 0,
    comment: i % 5 === 0 ? '已电话联系，承诺下周支付' : undefined,
  }));

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const areaList = await analyticsAPI.getAreas().catch(() => mockAreas);
        setAreas(areaList as string[]);

        const params = {
          startDate: dateRange?.[0].format('YYYY-MM-DD'),
          endDate: dateRange?.[1].format('YYYY-MM-DD'),
          area: selectedArea || undefined,
          page,
          pageSize,
        };

        const [water, complaint, payments] = await Promise.all([
          Promise.resolve(mockWaterData),
          Promise.resolve(mockComplaintData),
          Promise.resolve({ list: mockPaymentRecords.slice((page - 1) * pageSize, page * pageSize), total: mockPaymentRecords.length }),
        ]);

        setWaterData(water as WaterElectricityData[]);
        setComplaintData(complaint as ComplaintTagsData[]);
        setPaymentRecords(payments.list);
        setTotal(payments.total);
      } catch (error) {
        console.error('Failed to fetch analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange, selectedArea, page, pageSize]);

  const handleAddComment = (record: PaymentRecord) => {
    if (!record.isOverdue) {
      message.info('该记录未逾期，无需添加注释');
      return;
    }
    setSelectedRecord(record);
    setCommentModalOpen(true);
  };

  const handleCommentSuccess = () => {
    message.success('备注已保存');
  };

  const columns = [
    {
      title: '支付单号',
      dataIndex: 'id',
      key: 'id',
      width: 140,
    },
    {
      title: '支付人',
      dataIndex: 'payer',
      key: 'payer',
      width: 100,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (value: number) => formatMoney(value),
      sorter: (a: PaymentRecord, b: PaymentRecord) => a.amount - b.amount,
    },
    {
      title: '支付日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (value: string) => formatDate(value),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
    },
    {
      title: '区域',
      dataIndex: 'area',
      key: 'area',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (value: string, record: PaymentRecord) => (
        <StatusBadge status={value} text={record.isOverdue ? '已逾期' : undefined} />
      ),
    },
    {
      title: '逾期天数',
      dataIndex: 'overdueDays',
      key: 'overdueDays',
      width: 100,
      render: (value: number, record: PaymentRecord) =>
        record.isOverdue ? <span style={{ color: '#ff4d4f' }}>{value} 天</span> : '-',
    },
    {
      title: '备注',
      dataIndex: 'comment',
      key: 'comment',
      ellipsis: true,
      render: (value: string) => value || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (_: unknown, record: PaymentRecord) => (
        <Button
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleAddComment(record)}
          disabled={!record.isOverdue}
        >
          注释
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 24 }} wrap>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
        {isAdmin() && (
          <Select
            style={{ width: 150 }}
            placeholder="选择区域"
            allowClear
            value={selectedArea}
            onChange={setSelectedArea}
            options={areas.map((area) => ({ value: area, label: area }))}
          />
        )}
        <Button icon={<ReloadOutlined />} onClick={() => setDateRange(null)}>
          重置
        </Button>
      </Space>

      {loading && !waterData.length ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <Spin size="large" tip="加载中..." />
        </div>
      ) : (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={12}>
              <Card title="水电读数分布分析" bordered={false} extra={<Select
                defaultValue="bar"
                style={{ width: 100 }}
                options={[
                  { value: 'bar', label: '柱状图' },
                  { value: 'boxplot', label: '箱线图' },
                ]}
              />}>
                <WaterElectricityChart data={waterData} chartType="bar" darkMode={darkMode} />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="投诉标签趋势分析" bordered={false} extra={<Select
                defaultValue="line"
                style={{ width: 100 }}
                options={[
                  { value: 'line', label: '折线图' },
                  { value: 'stacked', label: '堆叠图' },
                ]}
              />}>
                <ComplaintTagsChart data={complaintData} chartType="line" darkMode={darkMode} />
              </Card>
            </Col>
          </Row>

          <Card title="支付流水列表" bordered={false}>
            <Table
              columns={columns}
              dataSource={paymentRecords}
              rowKey="id"
              loading={loading}
              pagination={{
                current: page,
                pageSize,
                total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`,
                onChange: (page, pageSize) => {
                  setPage(page);
                  setPageSize(pageSize);
                },
              }}
              scroll={{ x: 1200 }}
            />
          </Card>
        </>
      )}

      <CommentModal
        open={commentModalOpen}
        record={selectedRecord}
        onCancel={() => setCommentModalOpen(false)}
        onSuccess={handleCommentSuccess}
      />
    </div>
  );
};

export default Analytics;
