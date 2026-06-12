import { useState } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  DatePicker,
  Card,
  Modal,
  message,
  Popconfirm,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SendOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { lossReportAPI, storeAPI } from '@/api';
import {
  LossStatusMap,
  LossStatusColorMap,
  LossCategoryMap,
  AbnormalTypeMap,
  type LossStatus,
  type LossCategory,
} from '@/types';
import { useAuthStore } from '@/store/auth';
import dayjs from 'dayjs';
import type { TableProps } from 'antd';
import type { LossReport } from '@/types';

const { RangePicker } = DatePicker;

function LossReportList() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false });
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(
    (search as any).status
  );
  const [selectedStore, setSelectedStore] = useState<number | undefined>(
    (search as any).store_id ? Number((search as any).store_id) : undefined
  );
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [showAbnormalOnly, setShowAbnormalOnly] = useState(false);
  const [showMyTodo, setShowMyTodo] = useState((search as any).my_todo === 'true');

  const { data: stores } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storeAPI.getStores().then((res) => res.data),
  });

  const { data: reports, isLoading } = useQuery({
    queryKey: [
      'lossReports',
      selectedStatus,
      selectedStore,
      selectedCategory,
      dateRange,
      showAbnormalOnly,
      showMyTodo,
    ],
    queryFn: () =>
      lossReportAPI
        .getLossReports({
          status: selectedStatus,
          store_id: selectedStore,
          category: selectedCategory,
          date_from: dateRange?.[0]?.format('YYYY-MM-DD'),
          date_to: dateRange?.[1]?.format('YYYY-MM-DD'),
          is_abnormal: showAbnormalOnly ? true : undefined,
          my_todo: showMyTodo ? true : undefined,
        })
        .then((res) => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: lossReportAPI.deleteLossReport,
    onSuccess: () => {
      message.success('删除成功');
      queryClient.invalidateQueries({ queryKey: ['lossReports'] });
    },
  });

  const submitMutation = useMutation({
    mutationFn: lossReportAPI.submitForReview,
    onSuccess: () => {
      message.success('提交成功，等待复核');
      queryClient.invalidateQueries({ queryKey: ['lossReports'] });
    },
  });

  const filteredReports = reports?.filter(
    (r) =>
      !searchText ||
      r.title.includes(searchText) ||
      r.report_no.includes(searchText) ||
      r.creator_name.includes(searchText)
  );

  const columns: TableProps<LossReport>['columns'] = [
    {
      title: '报损单号',
      dataIndex: 'report_no',
      key: 'report_no',
      width: 140,
      render: (text, record) => (
        <div className="flex items-center">
          {record.is_abnormal && (
            <Badge status="error" className="mr-2" />
          )}
          <span className="font-mono text-sm">{text}</span>
        </div>
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (cat: LossCategory) => LossCategoryMap[cat],
    },
    {
      title: '门店',
      dataIndex: 'store_name',
      key: 'store_name',
      width: 120,
    },
    {
      title: '成本金额',
      dataIndex: 'cost_amount',
      key: 'cost_amount',
      width: 110,
      render: (val) => (
        <span className="font-semibold text-red-500">¥{val.toFixed(2)}</span>
      ),
    },
    {
      title: '损耗率',
      dataIndex: 'loss_rate',
      key: 'loss_rate',
      width: 90,
      render: (rate: number, record) => (
        <span className={record.is_abnormal ? 'text-red-500 font-bold' : ''}>
          {rate.toFixed(2)}%
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: LossStatus) => (
        <Tag color={LossStatusColorMap[status]} className="status-tag">
          {LossStatusMap[status]}
        </Tag>
      ),
    },
    {
      title: '异常类型',
      dataIndex: 'abnormal_type',
      key: 'abnormal_type',
      width: 110,
      render: (type, record) =>
        record.is_abnormal ? (
          <Tag color="red" icon={<WarningOutlined />}>
            {AbnormalTypeMap[type!]}
          </Tag>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      title: '责任人',
      dataIndex: 'responsible_staff_name',
      key: 'responsible_staff_name',
      width: 100,
      render: (name) => name || '-',
    },
    {
      title: '创建人',
      dataIndex: 'creator_name',
      key: 'creator_name',
      width: 100,
    },
    {
      title: '报损日期',
      dataIndex: 'loss_date',
      key: 'loss_date',
      width: 110,
      render: (date) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() =>
              navigate({ to: '/loss-reports/$id', params: { id: record.id.toString() } })
            }
          >
            详情
          </Button>
          {record.status === 'draft' && record.created_by === user?.id && (
            <>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => {
                  Modal.info({
                    title: '提示',
                    content: '请在详情页进行编辑操作',
                  });
                }}
              >
                编辑
              </Button>
              <Popconfirm
                title="确认删除此报损单？"
                onConfirm={() => deleteMutation.mutate(record.id)}
                okText="确认"
                cancelText="取消"
              >
                <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
              <Button
                type="link"
                size="small"
                icon={<SendOutlined />}
                onClick={() => submitMutation.mutate(record.id)}
                loading={submitMutation.isPending}
              >
                提交复核
              </Button>
            </>
          )}
          {record.status === 'reviewed' && user?.role === 'manager' && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => navigate({ to: '/approvals' })}
            >
              审批
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card size="small" className="shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <Input
            placeholder="搜索单号、标题、创建人"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 240 }}
            allowClear
          />
          <Select
            placeholder="选择状态"
            value={selectedStatus}
            onChange={setSelectedStatus}
            style={{ width: 140 }}
            allowClear
            options={Object.entries(LossStatusMap).map(([key, label]) => ({
              value: key,
              label,
            }))}
          />
          <Select
            placeholder="选择门店"
            value={selectedStore}
            onChange={setSelectedStore}
            style={{ width: 140 }}
            allowClear
            options={stores?.map((s) => ({ value: s.id, label: s.name }))}
          />
          <Select
            placeholder="选择类别"
            value={selectedCategory}
            onChange={setSelectedCategory}
            style={{ width: 120 }}
            allowClear
            options={Object.entries(LossCategoryMap).map(([key, label]) => ({
              value: key,
              label,
            }))}
          />
          <RangePicker
            value={dateRange}
            onChange={(dates) =>
              setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)
            }
          />
          <Button
            type={showAbnormalOnly ? 'primary' : 'default'}
            danger={showAbnormalOnly}
            onClick={() => setShowAbnormalOnly(!showAbnormalOnly)}
            icon={<WarningOutlined />}
          >
            仅显示异常
          </Button>
          <Button
            type={showMyTodo ? 'primary' : 'default'}
            onClick={() => setShowMyTodo(!showMyTodo)}
          >
            我的待办
          </Button>
          <div className="flex-1" />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate({ to: '/loss-reports/create' })}
          >
            新建报损单
          </Button>
        </div>
      </Card>

      <Card className="shadow-sm">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredReports}
          loading={isLoading}
          scroll={{ x: 1300 }}
          rowClassName={(record) => (record.is_abnormal ? 'abnormal-row' : '')}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>
    </div>
  );
}

export default LossReportList;
