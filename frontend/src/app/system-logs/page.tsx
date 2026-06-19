'use client';

import { useState, useEffect } from 'react';
import { Card, Table, Select, Input, Space, DatePicker, Tag, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { systemLogApi } from '@/services/api';
import { LogAction } from '@/types';

const { RangePicker } = DatePicker;
const { Option } = Select;

export default function SystemLogsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [module, setModule] = useState<string>('');
  const [action, setAction] = useState<string>('');
  const [dateRange, setDateRange] = useState<any>(null);
  const [searchText, setSearchText] = useState('');

  const moduleOptions = [
    { value: 'performance', label: '演出排期' },
    { value: 'task', label: '任务管理' },
    { value: 'order', label: '订单管理' },
    { value: 'sponsor', label: '赞助管理' },
    { value: 'ticket', label: '票种管理' },
    { value: 'verification', label: '核销管理' },
    { value: 'dispute', label: '争议处理' },
    { value: 'export', label: '导出管理' },
    { value: 'user', label: '用户管理' },
  ];

  const actionOptions = [
    { value: 'CREATE', label: '创建' },
    { value: 'UPDATE', label: '更新' },
    { value: 'DELETE', label: '删除' },
    { value: 'VERIFY', label: '核销' },
    { value: 'REFUND', label: '退款' },
    { value: 'DISPUTE_OPEN', label: '发起争议' },
    { value: 'DISPUTE_RESOLVE', label: '解决争议' },
    { value: 'DISPUTE_CLOSE', label: '关闭争议' },
    { value: 'ASSIGN', label: '分派' },
    { value: 'EXPORT', label: '导出' },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (module) params.module = module;
      if (action) params.action = action;
      if (dateRange && dateRange.length === 2) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      const res: any = await systemLogApi.getList(params);
      setData(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      message.error('获取日志失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize, module, action, dateRange]);

  const getActionColor = (action: string) => {
    const colorMap: any = {
      CREATE: 'green',
      UPDATE: 'blue',
      DELETE: 'red',
      VERIFY: 'cyan',
      REFUND: 'orange',
      DISPUTE_OPEN: 'red',
      DISPUTE_RESOLVE: 'green',
      DISPUTE_CLOSE: 'default',
      ASSIGN: 'purple',
      EXPORT: 'gold',
    };
    return colorMap[action] || 'default';
  };

  const getActionText = (action: string) => {
    const textMap: any = {
      CREATE: '创建',
      UPDATE: '更新',
      DELETE: '删除',
      VERIFY: '核销',
      REFUND: '退款',
      DISPUTE_OPEN: '发起争议',
      DISPUTE_RESOLVE: '解决争议',
      DISPUTE_CLOSE: '关闭争议',
      ASSIGN: '分派',
      EXPORT: '导出',
    };
    return textMap[action] || action;
  };

  const columns = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 100,
      render: (m: string) => {
        const opt = moduleOptions.find(o => o.value === m);
        return <Tag color="blue">{opt?.label || m}</Tag>;
      },
    },
    {
      title: '动作',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (a: string) => (
        <Tag color={getActionColor(a)}>{getActionText(a)}</Tag>
      ),
    },
    {
      title: '操作描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '操作人',
      dataIndex: 'operatorName',
      key: 'operatorName',
      width: 100,
      render: (name: string) => name || '系统',
    },
    {
      title: '关联ID',
      dataIndex: 'relatedId',
      key: 'relatedId',
      width: 80,
      render: (id: number) => id || '-',
    },
    {
      title: '关联类型',
      dataIndex: 'relatedType',
      key: 'relatedType',
      width: 120,
      render: (t: string) => t || '-',
    },
  ];

  return (
    <div>
      <Card
        title="系统日志"
        extra={
          <Space>
            <Select
              placeholder="选择模块"
              style={{ width: 150 }}
              allowClear
              value={module || undefined}
              onChange={setModule}
            >
              {moduleOptions.map(o => (
                <Option key={o.value} value={o.value}>{o.label}</Option>
              ))}
            </Select>
            <Select
              placeholder="选择动作"
              style={{ width: 150 }}
              allowClear
              value={action || undefined}
              onChange={setAction}
            >
              {actionOptions.map(o => (
                <Option key={o.value} value={o.value}>{o.label}</Option>
              ))}
            </Select>
            <RangePicker value={dateRange} onChange={setDateRange} />
            <Input
              placeholder="搜索描述"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
              onPressEnter={fetchData}
            />
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>
    </div>
  );
}
