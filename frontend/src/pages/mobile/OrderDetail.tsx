import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  Tag,
  Button,
  Image,
  List,
  Divider,
  Empty,
} from 'antd-mobile';
import {
  LeftOutline,
  CameraOutline,
  UserOutline,
  ClockCircleOutline,
  ExclamationCircleOutline,
} from 'antd-mobile-icons';
import { orderAPI } from '@/services/api';
import { OrderStatus, OrderStatusText, OrderStatusColor } from '@/types';
import dayjs from 'dayjs';

export default function MobileOrderDetail() {
  const params = useParams({ from: '/_protected/m/orders/$orderId' });
  const navigate = useNavigate();

  const { data: order, isLoading } = useQuery({
    queryKey: ['mobileOrder', params.orderId],
    queryFn: () => orderAPI.get(Number(params.orderId)),
  });

  const getAvailableAction = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.ASSIGNED:
        return { label: '开始处理', to: '/m/process/$orderId', status: OrderStatus.PROCESSING };
      case OrderStatus.PROCESSING:
        return { label: '完成处理', to: '/m/process/$orderId', status: OrderStatus.COMPLETED };
      case OrderStatus.COMPLETED:
        return { label: '提交复核', to: '/m/process/$orderId', status: OrderStatus.REVIEWING };
      case OrderStatus.REVIEW_FAILED:
        return { label: '重新处理', to: '/m/process/$orderId', status: OrderStatus.PROCESSING };
      default:
        return null;
    }
  };

  if (isLoading) return <div className="p-4 text-center">加载中...</div>;
  if (!order?.data) return <Empty description="工单不存在" />;

  const orderData = order.data;
  const action = getAvailableAction(orderData.status);

  return (
    <div className="pb-24">
      <div className="sticky top-0 bg-white z-10 border-b">
        <div className="flex items-center px-4 py-3 gap-3">
          <button onClick={() => navigate({ to: '/m/orders' })} className="text-gray-600">
            <LeftOutline fontSize={20} />
          </button>
          <h1 className="flex-1 font-medium">工单详情</h1>
          <Tag color={OrderStatusColor[orderData.status]} className="!m-0">
            {OrderStatusText[orderData.status]}
          </Tag>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Card>
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">{orderData.order_no}</div>
              <div className="text-lg font-medium text-gray-800">{orderData.title}</div>
            </div>
            <Tag color={['default', 'blue', 'orange', 'red'][orderData.priority]}>
              P{orderData.priority}
            </Tag>
          </div>

          <Divider className="my-3" />

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <UserOutline fontSize={14} />
              <span>处理人: {orderData.assignee?.full_name || '未分配'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <UserOutline fontSize={14} />
              <span>创建人: {orderData.creator?.full_name}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <ClockCircleOutline fontSize={14} />
              <span>创建时间: {dayjs(orderData.created_at).format('YYYY-MM-DD HH:mm')}</span>
            </div>
            {orderData.deadline && (
              <div className="flex items-center gap-2 text-orange-500">
                <ExclamationCircleOutline fontSize={14} />
                <span>截止时间: {dayjs(orderData.deadline).format('YYYY-MM-DD HH:mm')}</span>
              </div>
            )}
            {orderData.audit_type && (
              <div className="text-gray-600">
                审计类型: <Tag className="!text-xs !m-0">{orderData.audit_type}</Tag>
              </div>
            )}
            {orderData.audit_item && (
              <div className="text-gray-600">审计项: {orderData.audit_item}</div>
            )}
            {orderData.location && (
              <div className="text-gray-600">位置: {orderData.location}</div>
            )}
            {orderData.dispatch_rule && (
              <div className="text-gray-600">
                派工规则: {orderData.dispatch_rule.name} ({orderData.dispatch_rule.handling_time_limit}小时)
              </div>
            )}
          </div>

          {orderData.description && (
            <>
              <Divider className="my-3" />
              <div className="text-sm text-gray-700">
                <div className="font-medium mb-2">问题描述</div>
                <p className="whitespace-pre-wrap">{orderData.description}</p>
              </div>
            </>
          )}

          {orderData.site_photo_url && (
            <>
              <Divider className="my-3" />
              <div className="text-sm">
                <div className="font-medium mb-2 text-gray-700">现场照片</div>
                <Image src={orderData.site_photo_url} />
              </div>
            </>
          )}
        </Card>

        {orderData.affected_objects.length > 0 && (
          <Card title="受影响对象">
            <List>
              {orderData.affected_objects.map((obj) => (
                <List.Item key={obj.id}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Tag color="red" className="!text-xs !m-0">
                        {obj.impact_level}
                      </Tag>
                      <span className="font-medium">
                        {obj.object_type}: {obj.object_name}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">{obj.description || '-'}</div>
                  </div>
                </List.Item>
              ))}
            </List>
          </Card>
        )}

        <Card title="处理记录">
          {orderData.process_records.length === 0 ? (
            <Empty description="暂无处理记录" />
          ) : (
            <div className="space-y-4">
              {orderData.process_records
                .slice()
                .reverse()
                .map((record) => (
                  <div key={record.id} className="timeline-item">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                        <UserOutline fontSize={14} />
                      </div>
                      <span className="font-medium text-sm">{record.handler?.full_name}</span>
                      <Tag color={OrderStatusColor[record.new_status]} className="!text-xs !m-0">
                        {OrderStatusText[record.new_status]}
                      </Tag>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      {record.action} · {dayjs(record.created_at).format('MM-DD HH:mm')}
                    </div>
                    {record.remark && (
                      <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded mb-2">
                        {record.remark}
                      </div>
                    )}
                    {record.attachments && record.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {record.attachments.map((att) => (
                          <a
                            key={att.id}
                            href={att.file_path}
                            target="_blank"
                            className="text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded"
                          >
                            📎 {att.file_name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </Card>
      </div>

      {action && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
          <Button
            block
            color="primary"
            size="large"
            onClick={() =>
              navigate({ to: '/m/process/$orderId', params: { orderId: params.orderId } })
            }
          >
            <span className="flex items-center justify-center gap-2">
              <CameraOutline fontSize={16} />
              {action.label}
            </span>
          </Button>
        </div>
      )}
    </div>
  );
}
