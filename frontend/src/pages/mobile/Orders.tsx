import { useState } from 'react';
import {
  List,
  Tag,
  Input,
  Select,
  Button,
  Empty,
  PullToRefresh,
  Card,
  Badge,
  WhiteSpace,
} from 'antd-mobile';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { SearchOutline, AddOutline } from 'antd-mobile-icons';
import { orderAPI } from '@/services/api';
import { OrderStatus, OrderStatusText, OrderStatusColor, type Order } from '@/types';
import { useAuthStore } from '@/hooks/useStore';
import dayjs from 'dayjs';

export default function MobileOrders() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [status, setStatus] = useState<OrderStatus | undefined>(undefined);
  const [keyword, setKeyword] = useState('');

  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ['mobileOrders', status, keyword],
    queryFn: () =>
      orderAPI.list({
        status,
        assignee_id: user?.id,
        keyword: keyword || undefined,
        page_size: 50,
      }),
  });

  const statusTabs = [
    { label: '全部', value: undefined },
    { label: '待处理', value: OrderStatus.ASSIGNED },
    { label: '处理中', value: OrderStatus.PROCESSING },
    { label: '复核中', value: OrderStatus.REVIEWING },
    { label: '待复核', value: OrderStatus.COMPLETED },
  ];

  const renderStatusColor = (s: OrderStatus) => {
    const colorMap: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: '#8c8c8c',
      [OrderStatus.ASSIGNED]: '#1890ff',
      [OrderStatus.PROCESSING]: '#1890ff',
      [OrderStatus.COMPLETED]: '#52c41a',
      [OrderStatus.REVIEWING]: '#faad14',
      [OrderStatus.REVIEW_FAILED]: '#f5222d',
      [OrderStatus.CLOSED]: '#52c41a',
    };
    return colorMap[s] || '#8c8c8c';
  };

  return (
    <div className="mobile-container">
      <div className="mb-4">
        <div className="relative mb-3">
          <SearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="搜索工单号或标题"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {statusTabs.map((tab) => (
            <button
              key={tab.value || 'all'}
              onClick={() => setStatus(tab.value)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                status === tab.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <PullToRefresh onRefresh={async () => await refetch()}>
        {isLoading ? (
          <div className="py-10 text-center text-gray-400">加载中...</div>
        ) : orders?.data?.items?.length === 0 ? (
          <Empty description="暂无工单" />
        ) : (
          <div className="space-y-3">
            {orders?.data?.items?.map((order: Order) => (
              <Card
                key={order.id}
                onClick={() =>
                  navigate({ to: '/m/orders/$orderId', params: { orderId: order.id } })
                }
                className="cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Badge color={renderStatusColor(order.status)} />
                    <span className="text-xs text-gray-500">{order.order_no}</span>
                  </div>
                  <Tag
                    color={OrderStatusColor[order.status]}
                    className="!text-xs !m-0"
                  >
                    {OrderStatusText[order.status]}
                  </Tag>
                </div>
                <div className="font-medium text-gray-800 mb-2 line-clamp-1">
                  {order.title}
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>
                    P{order.priority} · {order.audit_type || '未分类'}
                  </span>
                  <span>{dayjs(order.created_at).format('MM-DD HH:mm')}</span>
                </div>
                {order.deadline && (
                  <div className="mt-2 text-xs text-orange-500">
                    截止: {dayjs(order.deadline).format('MM-DD HH:mm')}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </PullToRefresh>

      <div className="fixed bottom-6 right-6">
        <button
          onClick={() => navigate({ to: '/orders' })}
          className="w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center"
        >
          <AddOutline fontSize={24} />
        </button>
      </div>
    </div>
  );
}
