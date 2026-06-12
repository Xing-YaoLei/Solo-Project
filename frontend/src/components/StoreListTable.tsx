import React, { useEffect, useState } from 'react';
import { Card, Table, Input, Select, Tag, Space, Button, Modal, Progress, Statistic, Row, Col } from 'antd';
import { SearchOutlined, BarChartOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { StoreWithStats, EquipmentRemark } from '../types';
import { reportsApi, remarksApi } from '../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

interface StoreListTableProps {
  className?: string;
}

const StoreListTable: React.FC<StoreListTableProps> = ({ className }) => {
  const [data, setData] = useState<StoreWithStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreWithStats | null>(null);
  const [storeRemarks, setStoreRemarks] = useState<EquipmentRemark[]>([]);

  useEffect(() => {
    fetchData();
  }, [page, pageSize, keyword, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await reportsApi.getStores({
        page,
        page_size: pageSize,
        keyword: keyword || undefined,
        status_filter: statusFilter,
      });
      setData(res.data?.items || []);
      setTotal(res.data?.total || 0);
    } catch (error) {
      console.error('Failed to fetch store list:', error);
      const mockData: StoreWithStats[] = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        store_code: `S${1001 + i}`,
        store_name: `${['北京', '上海', '广州', '深圳'][i % 4]}第${i + 1}店`,
        city: ['北京', '上海', '广州', '深圳'][i % 4],
        district: ['朝阳区', '浦东新区', '天河区', '南山区'][i % 4],
        status: i % 5 === 0 ? 'inactive' : 'active',
        equipment_count: 5 + (i % 4),
        normal_count: 4 + (i % 3),
        offline_count: i % 3 === 0 ? 1 : 0,
        maintenance_count: i % 4 === 0 ? 1 : 0,
        cleaning_count: 20 + i * 3,
        pass_rate: 85 + (i % 15),
      }));
      setData(mockData.slice((page - 1) * pageSize, page * pageSize));
      setTotal(mockData.length);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (store: StoreWithStats) => {
    setSelectedStore(store);
    setDetailModalVisible(true);
    try {
      const res = await remarksApi.listByStore(store.id);
      setStoreRemarks(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error('Failed to fetch store remarks:', error);
      setStoreRemarks([]);
    }
  };

  const columns: ColumnsType<StoreWithStats> = [
    {
      title: '门店编码',
      dataIndex: 'store_code',
      key: 'store_code',
      width: 100,
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '门店名称',
      dataIndex: 'store_name',
      key: 'store_name',
      width: 160,
    },
    {
      title: '城市',
      dataIndex: 'city',
      key: 'city',
      width: 80,
    },
    {
      title: '设备总数',
      dataIndex: 'equipment_count',
      key: 'equipment_count',
      width: 90,
      sorter: (a, b) => a.equipment_count - b.equipment_count,
    },
    {
      title: '设备状态分布',
      key: 'status_dist',
      width: 200,
      render: (_, record) => (
        <Space size={8}>
          <Tag color="green">正常 {record.normal_count}</Tag>
          {record.offline_count > 0 && <Tag color="red">离线 {record.offline_count}</Tag>}
          {record.maintenance_count > 0 && <Tag color="orange">维修 {record.maintenance_count}</Tag>}
        </Space>
      ),
    },
    {
      title: '清洁次数',
      dataIndex: 'cleaning_count',
      key: 'cleaning_count',
      width: 90,
      sorter: (a, b) => a.cleaning_count - b.cleaning_count,
    },
    {
      title: '巡检合格率',
      dataIndex: 'pass_rate',
      key: 'pass_rate',
      width: 140,
      sorter: (a, b) => a.pass_rate - b.pass_rate,
      render: (rate) => (
        <Progress
          percent={rate}
          size="small"
          status={rate < 90 ? 'exception' : 'success'}
          strokeColor={rate < 90 ? undefined : rate < 95 ? '#faad14' : undefined}
        />
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'default'}>
          {status === 'active' ? '营业中' : '已关闭'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button type="link" size="small" icon={<BarChartOutlined />} onClick={() => handleViewDetail(record)}>
          详情
        </Button>
      ),
    },
  ];

  return (
    <Card
      className={className}
      title="点位清单"
      loading={loading}
      extra={
        <Space>
          <Input
            placeholder="搜索门店名称/编码"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            placeholder="状态筛选"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 120 }}
            allowClear
          >
            <Option value="active">营业中</Option>
            <Option value="inactive">已关闭</Option>
          </Select>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 个点位`,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
        scroll={{ x: 1000 }}
      />

      <Modal
        title={
          <Space>
            <span>点位详情</span>
            <Tag color="blue">{selectedStore?.store_name}</Tag>
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedStore && (
          <>
            <Row gutter={16} style={{ marginBottom: 20 }}>
              <Col span={6}>
                <Statistic title="设备总数" value={selectedStore.equipment_count} />
              </Col>
              <Col span={6}>
                <Statistic
                  title="正常设备"
                  value={selectedStore.normal_count}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="离线设备"
                  value={selectedStore.offline_count}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="巡检合格率"
                  value={selectedStore.pass_rate}
                  suffix="%"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
            </Row>

            <div style={{ marginTop: 20 }}>
              <h4>
                <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />
                异常备注记录
              </h4>
              {storeRemarks.length > 0 ? (
                <ul style={{ paddingLeft: 20 }}>
                  {storeRemarks.map((remark) => (
                    <li key={remark.id} style={{ marginBottom: 8 }}>
                      <Tag color="blue" style={{ marginRight: 8 }}>
                        {remark.remark_type}
                      </Tag>
                      <span>{remark.content}</span>
                      <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                        {remark.operator} · {dayjs(remark.created_at).format('YYYY-MM-DD HH:mm')}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: '#999' }}>暂无备注记录</p>
              )}
            </div>
          </>
        )}
      </Modal>
    </Card>
  );
};

export default StoreListTable;
