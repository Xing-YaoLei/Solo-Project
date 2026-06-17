import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Space, Select, Table, Button, Spin, message } from 'antd';
import { EditOutlined, ReloadOutlined } from '@ant-design/icons';
import { useStore, isAdmin } from '../../store';
import { analyticsAPI, paymentAPI } from '../../services/api';
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
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PaymentRecord | null>(null);

  const mockAreas = ['A区', 'B区', 'C区', 'D区', 'E区'];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const districts = new Set<string>();
        const params = dateRange
          ? {
              start_month: dateRange[0].format('YYYY-MM'),
              end_month: dateRange[1].format('YYYY-MM'),
              district: selectedArea || undefined,
            }
          : { district: selectedArea || undefined };

        const [water, complaint] = await Promise.all([
          analyticsAPI.getUtilityReadings(params).catch(() => []),
          analyticsAPI.getComplaintTagTrend(params).catch(() => []),
        ]);

        const waterList = water as WaterElectricityData[];
        waterList.forEach(item => districts.add(item.district));
        setAreas(Array.from(districts));
        setWaterData(waterList);
        setComplaintData(complaint as ComplaintTagsData[]);
      } catch (error) {
        console.error('Failed to fetch analytics data:', error);
        setAreas(mockAreas);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange, selectedArea]);

  const handleAddComment = (record: PaymentRecord) => {
    setSelectedRecord(record);
    setCommentModalOpen(true);
  };

  const handleSaveComment = async (comment: string) => {
    if (!selectedRecord) return;
    try {
      await paymentAPI.addComment(selectedRecord.id as unknown as number, comment);
      message.success('注释保存成功');
      setCommentModalOpen(false);
    } catch (error) {
      message.error('注释保存失败');
    }
  };

  const columns = [
    {
      title: '支付单号',
      dataIndex: 'id',
      key: 'id',
      width: 140,
    },
    {
      title: '付款人',
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
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (value: string) => formatDate(value),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (value: string) => <StatusBadge status={value} />,
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
      title: '逾期天数',
      dataIndex: 'overdueDays',
      key: 'overdueDays',
      width: 100,
      render: (value: number, record: PaymentRecord) => 
        record.isOverdue ? <span style={{ color: '#f5222d' }}>{value}天</span> : '-',
    },
    {
      title: '注释',
      dataIndex: 'comment',
      key: 'comment',
      width: 200,
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: PaymentRecord) => 
        record.isOverdue && (
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleAddComment(record)}
          >
            注释
          </Button>
        ),
    },
  ];

  if (loading && waterData.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <div>
      <Space style={{ marginBottom: 24 }} wrap>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
        <Select
          style={{ width: 150 }}
          placeholder="选择区域"
          allowClear
          value={selectedArea}
          onChange={setSelectedArea}
          options={areas.map(a => ({ value: a, label: a }))}
        />
        <Button
          icon={<ReloadOutlined />}
          onClick={() => {
            setDateRange(null);
            setSelectedArea(null);
          }}
        >
          重置
        </Button>
      </Space>

      {!isAdmin() && (
        <div style={{ marginBottom: 24 }}>
          <Space>
            <div style={{ color: '#888', fontSize: 12 }}>
              提示：租金逾期记录允许添加注释说明
            </div>
          </Space>
        </div>
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="水电读数分布" bordered={false}>
            <WaterElectricityChart
              data={waterData}
              chartType="bar"
              darkMode={darkMode}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="投诉标签变化" bordered={false}>
            <ComplaintTagsChart
              data={complaintData}
              chartType="line"
              darkMode={darkMode}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="支付流水（租金逾期可加注释）"
        bordered={false}
        extra={
          <span style={{ color: '#888', fontSize: 12 }}>
            共 {paymentRecords.length} 条记录
          </span>
        }
      >
        <Table
          columns={columns}
          dataSource={paymentRecords}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <CommentModal
        open={commentModalOpen}
        record={selectedRecord}
        onCancel={() => setCommentModalOpen(false)}
        onSuccess={() => setCommentModalOpen(false)}
      />
    </div>
  );
};

export default Analytics;
