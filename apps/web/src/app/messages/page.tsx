// @ts-nocheck
'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Check, CheckCheck, Clock, AlertTriangle, User, Filter, Search, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { apiEndpoints } from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';
import { ReminderChannel } from '@solo/shared';
import { useRouter } from 'next/navigation';

function inferTypeFromMessage(message: string): string {
  if (!message) return 'NOTIFICATION';
  if (message.includes('预警') || message.includes('即将')) return 'TIMEOUT_WARNING';
  if (message.includes('超时') || message.includes('已超')) return 'TIMEOUT';
  if (message.includes('分派') || message.includes('分配')) return 'ASSIGNED';
  if (message.includes('重试')) return 'RETRY';
  if (message.includes('补录')) return 'SUPPLEMENT';
  return 'NOTIFICATION';
}

function getTitleFromMessage(message: string, type: string): string {
  const typeTitles: Record<string, string> = {
    TIMEOUT: '处理超时提醒',
    TIMEOUT_WARNING: '超时预警通知',
    ASSIGNED: '新任务分派通知',
    RETRY: '重试处理通知',
    SUPPLEMENT: '补录信息通知',
  };
  if (typeTitles[type]) return typeTitles[type];
  return message?.slice(0, 30) || '系统通知';
}

export default function MessagesPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [operators, setOperators] = useState<any[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [filters, setFilters] = useState({
    isRead: '',
    channel: '',
    type: '',
    keyword: '',
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchOperators = async () => {
      const res: any = await apiEndpoints.users.operators();
      const data = res as any;
      setOperators(data || []);
      if (data && data.length > 0) {
        setSelectedRecipient(data[0].id);
      }
    };
    fetchOperators();
  }, []);

  useEffect(() => {
    if (selectedRecipient) {
      fetchMessages();
    }
  }, [filters, page, selectedRecipient]);

  const fetchMessages = async () => {
    if (!selectedRecipient) return;
    setLoading(true);
    try {
      const params = {
        recipientId: selectedRecipient,
        read: filters.isRead || undefined,
        channel: filters.channel || undefined,
        page,
        pageSize: 20,
      };
      const res: any = await apiEndpoints.reminders.list(params);
      const data = res as any;
      const rawItems = data.items || data || [];
      let mappedItems = rawItems.map((item: any) => {
        const type = inferTypeFromMessage(item.message);
        return {
          ...item,
          isRead: item.readAt != null,
          type,
          title: getTitleFromMessage(item.message, type),
          orderNo: item.refundOrder?.orderNo,
          refundOrderId: item.refundOrder?.id,
          orderStatus: item.refundOrder?.status,
        };
      });
      if (filters.type) {
        mappedItems = mappedItems.filter((m: any) => m.type === filters.type);
      }
      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase();
        mappedItems = mappedItems.filter((m: any) =>
          (m.message?.toLowerCase() || '').includes(kw) ||
          (m.title?.toLowerCase() || '').includes(kw) ||
          (m.orderNo?.toLowerCase() || '').includes(kw),
        );
      }
      setMessages(mappedItems);
      setTotal(mappedItems.length);
      const countRes: any = await apiEndpoints.reminders.unreadCount(selectedRecipient);
      setUnreadCount(countRes?.count || 0);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    if (!selectedRecipient) return;
    try {
      await apiEndpoints.reminders.markAsRead(id, { recipientId: selectedRecipient });
      fetchMessages();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!selectedRecipient) return;
    try {
      await apiEndpoints.reminders.markAllAsRead(selectedRecipient);
      fetchMessages();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const openOrder = (orderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (orderId) router.push(`/orders/${orderId}`);
  };

  const getChannelIcon = (channel: string) => {
    const icons: Record<string, any> = {
      [ReminderChannel.IN_APP]: <Bell className="h-4 w-4" />,
      [ReminderChannel.EMAIL]: <User className="h-4 w-4" />,
      [ReminderChannel.SMS]: <Bell className="h-4 w-4" />,
      [ReminderChannel.WECHAT]: <Bell className="h-4 w-4" />,
    };
    return icons[channel] || <Bell className="h-4 w-4" />;
  };

  const getChannelLabel = (channel: string) => {
    const labels: Record<string, string> = {
      [ReminderChannel.IN_APP]: '站内信',
      [ReminderChannel.EMAIL]: '邮件',
      [ReminderChannel.SMS]: '短信',
      [ReminderChannel.WECHAT]: '微信',
    };
    return labels[channel] || channel;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      TIMEOUT: '超时',
      TIMEOUT_WARNING: '预警',
      ASSIGNED: '分派',
      RETRY: '重试',
      SUPPLEMENT: '补录',
      NOTIFICATION: '通知',
    };
    return labels[type] || type;
  };

  const getTypeBadgeVariant = (type: string) => {
    const variants: Record<string, string> = {
      TIMEOUT: 'danger',
      TIMEOUT_WARNING: 'warning',
      ASSIGNED: 'primary',
      RETRY: 'secondary',
      SUPPLEMENT: 'secondary',
      NOTIFICATION: 'outline',
    };
    return variants[type] || 'outline';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">消息中心</h1>
          <p className="text-sm text-gray-500 mt-1">
            共 {total} 条消息，{unreadCount} 条未读
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Button variant="secondary" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="mr-1 h-4 w-4" />
              全部已读
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={selectedRecipient}
              onChange={(e) => {
                setSelectedRecipient(e.target.value);
                setPage(1);
              }}
              options={[
                { value: '', label: '选择接收人' },
                ...operators.map((o) => ({ value: o.id, label: o.name })),
              ]}
              className="w-36"
            />
            <div className="flex-1 min-w-[200px] max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="搜索消息内容..."
                  value={filters.keyword}
                  onChange={(e) => {
                    setFilters({ ...filters, keyword: e.target.value });
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={filters.isRead}
              onChange={(e) => {
                setFilters({ ...filters, isRead: e.target.value });
                setPage(1);
              }}
              options={[
                { value: '', label: '全部状态' },
                { value: 'false', label: '未读' },
                { value: 'true', label: '已读' },
              ]}
              className="w-32"
            />
            <Select
              value={filters.channel}
              onChange={(e) => {
                setFilters({ ...filters, channel: e.target.value });
                setPage(1);
              }}
              options={[
                { value: '', label: '全部渠道' },
                ...Object.values(ReminderChannel).map((c) => ({
                  value: c,
                  label: getChannelLabel(c),
                })),
              ]}
              className="w-32"
            />
            <Select
              value={filters.type}
              onChange={(e) => {
                setFilters({ ...filters, type: e.target.value });
                setPage(1);
              }}
              options={[
                { value: '', label: '全部类型' },
                { value: 'TIMEOUT', label: '超时提醒' },
                { value: 'TIMEOUT_WARNING', label: '预警提醒' },
                { value: 'ASSIGNED', label: '分派通知' },
                { value: 'RETRY', label: '重试通知' },
                { value: 'SUPPLEMENT', label: '补录通知' },
                { value: 'NOTIFICATION', label: '系统通知' },
              ]}
              className="w-32"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无消息</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'p-4 hover:bg-gray-50 transition-colors cursor-pointer',
                    !msg.isRead && 'bg-blue-50/50',
                  )}
                  onClick={() => !msg.isRead && markAsRead(msg.id)}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        'p-2 rounded-full flex-shrink-0',
                        msg.type === 'TIMEOUT'
                          ? 'bg-red-100 text-red-600'
                          : msg.type === 'TIMEOUT_WARNING'
                          ? 'bg-yellow-100 text-yellow-600'
                          : 'bg-blue-100 text-blue-600',
                      )}
                    >
                      {msg.type === 'TIMEOUT' || msg.type === 'TIMEOUT_WARNING' ? (
                        <AlertTriangle className="h-5 w-5" />
                      ) : (
                        <Bell className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {!msg.isRead && (
                            <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                          )}
                          <h4 className="font-medium text-gray-900 truncate">{msg.title}</h4>
                          {msg.type && (
                            <Badge variant={getTypeBadgeVariant(msg.type)} size="sm">
                              {getTypeLabel(msg.type)}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant="outline" size="sm" className="flex items-center gap-1">
                            {getChannelIcon(msg.channel)}
                            {getChannelLabel(msg.channel)}
                          </Badge>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(msg.sentAt, 'MM-DD HH:mm')}
                          </span>
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">{msg.message}</p>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        {msg.orderNo && (
                          <button
                            onClick={(e) => openOrder(msg.refundOrderId, e)}
                            className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-200 transition-colors"
                          >
                            相关售后单：#{msg.orderNo}
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        )}
                        {msg.recipient?.name && (
                          <span className="text-xs text-gray-500">
                            接收人：{msg.recipient.name}
                          </span>
                        )}
                      </div>
                    </div>
                    {!msg.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-shrink-0 text-gray-400 hover:text-primary-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(msg.id);
                        }}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {total > 20 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
              <div className="text-sm text-gray-500">
                第 {page} / {Math.ceil(total / 20)} 页
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= Math.ceil(total / 20)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
