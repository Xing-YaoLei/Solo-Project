import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Form,
  Select,
  DatePicker,
  Button,
  Tag,
  Space,
  Input,
  Popconfirm,
  message,
} from 'antd';
import { SearchOutlined, ReloadOutlined, CloseOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { VerificationStatus, VerificationStage } from '@/types';
import type { VerificationRecord } from '@/types';
import { useAppStore } from '@/store';

const { RangePicker } = DatePicker;

const statusColorMap: Record<string, string> = {
  Pending: 'orange',
  Assigned: 'blue',
  InProgress: 'cyan',
  Confirmed: 'green',
  Supplemented: 'geekblue',
  Closed: 'default',
  Cancelled: 'red',
  Damaged: 'red',
  Overdue: 'magenta',
};

const stageColorMap: Record<string, string> = {
  Entry: 'blue',
  Action: 'orange',
  Review: 'purple',
};

const statusOptions = Object.values(VerificationStatus).map((s) => ({
  label: s,
  value: s,
}));

const stageOptions = Object.values(VerificationStage).map((s) => ({
  label: s,
  value: s,
}));

const truncate = (str: string | undefined, len: number) => {
  if (!str) return '-';
  return str.length > len ? str.slice(0, len) + '...' : str;
};

export default function Records() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  const { verificationRecords, totalCount, loadingRecords, fetchRecords, riders, fetchRiders } =
    useAppStore();

  useEffect(() => {
    fetchRecords({ page: pagination.current, pageSize: pagination.pageSize });
    fetchRiders();
  }, [fetchRecords, fetchRiders, pagination.current, pagination.pageSize]);

  const handleSearch = useCallback(() => {
    const values = form.getFieldsValue();
    const params: Record<string, unknown> = {
      page: 1,
      pageSize: pagination.pageSize,
    };
    if (values.keyword) params.keyword = values.keyword;
    if (values.status) params.status = values.status;
    if (values.stage) params.stage = values.stage;
    if (values.riderId) params.riderId = values.riderId;
    if (values.dateRange) {
      params.startDate = values.dateRange[0].format('YYYY-MM-DD');
      params.endDate = values.dateRange[1].format('YYYY-MM-DD');
    }
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchRecords(params);
  }, [form, pagination.pageSize, fetchRecords]);

  const handleReset = useCallback(() => {
    form.resetFields();
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchRecords({ page: 1, pageSize: pagination.pageSize });
  }, [form, pagination.pageSize, fetchRecords]);

  const handleBatchClose = useCallback(() => {
    message.success(`已关闭 ${selectedRowKeys.length} 条记录`);
    setSelectedRowKeys([]);
  }, [selectedRowKeys]);

  const riderOptions = riders.map((r) => ({ label: r.name, value: r.id }));

  const columns: ColumnsType<VerificationRecord> = [
    {
      title: '核验编号',
      dataIndex: 'recordNo',
      key: 'recordNo',
      width: 150,
    },
    {
      title: '订单号',
      key: 'orderNumber',
      width: 150,
      render: (_, record) => record.order?.orderNumber || '-',
    },
    {
      title: '骑手',
      key: 'riderName',
      width: 100,
      render: (_, record) => record.rider?.name || '-',
    },
    {
      title: '取件地址',
      key: 'pickupAddress',
      width: 180,
      render: (_, record) => truncate(record.order?.pickupAddress, 20),
    },
    {
      title: '送达地址',
      key: 'deliveryAddress',
      width: 180,
      render: (_, record) => truncate(record.order?.deliveryAddress, 20),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={statusColorMap[status] || 'default'}>{status}</Tag>
      ),
    },
    {
      title: '阶段',
      dataIndex: 'stage',
      key: 'stage',
      width: 90,
      render: (stage: string) => <Tag color={stageColorMap[stage] || 'default'}>{stage}</Tag>,
    },
    {
      title: '评价标签',
      dataIndex: 'ratingTags',
      key: 'ratingTags',
      width: 200,
      render: (tags: string[]) =>
        tags.length > 0 ? (
          <Space size={[4, 4]} wrap>
            {tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </Space>
        ) : (
          '-'
        ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (val: string) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => navigate(`/records/${record.id}`)}>
            查看详情
          </Button>
          {record.status === VerificationStatus.Damaged && (
            <Button type="link" size="small" danger onClick={() => navigate(`/records/${record.id}`)}>
              损坏报告
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline" style={{ flexWrap: 'wrap', gap: '8px 0' }}>
          <Form.Item name="keyword">
            <Input placeholder="关键词搜索" allowClear style={{ width: 180 }} />
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="状态" allowClear style={{ width: 140 }} options={statusOptions} />
          </Form.Item>
          <Form.Item name="stage">
            <Select placeholder="阶段" allowClear style={{ width: 120 }} options={stageOptions} />
          </Form.Item>
          <Form.Item name="riderId">
            <Select
              placeholder="骑手"
              allowClear
              showSearch
              optionFilterProp="label"
              style={{ width: 140 }}
              options={riderOptions}
            />
          </Form.Item>
          <Form.Item name="dateRange">
            <RangePicker style={{ width: 260 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                搜索
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {selectedRowKeys.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Popconfirm
            title={`确定关闭选中的 ${selectedRowKeys.length} 条记录？`}
            onConfirm={handleBatchClose}
          >
            <Button danger icon={<CloseOutlined />}>
              批量关闭 ({selectedRowKeys.length})
            </Button>
          </Popconfirm>
        </div>
      )}

      <Table
        rowKey="id"
        columns={columns}
        dataSource={verificationRecords}
        loading={loadingRecords}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        onRow={(record) => ({
          onClick: () => navigate(`/records/${record.id}`),
          style: { cursor: 'pointer' },
        })}
        rowClassName={(record) =>
          record.status === VerificationStatus.Damaged ? 'ant-table-row-damaged' : ''
        }
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: totalCount,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
        }}
        scroll={{ x: 1500 }}
      />

      <style>{`
        .ant-table-row-damaged td {
          background-color: #fff1f0 !important;
        }
        .ant-table-row-damaged:hover td {
          background-color: #ffccc7 !important;
        }
      `}</style>
    </div>
  );
}
