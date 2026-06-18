import { useState, useEffect } from 'react';
import { Card, Tabs, List, Tag, Avatar, Space, Input, Badge } from 'antd';
import { 
  CarOutlined, SearchOutlined, ClockCircleOutlined,
  UserOutlined 
} from '@ant-design/icons';
import type { Appointment, AppointmentListItem, AppointmentStatus } from '@/types';
import { STATUS_LABELS, STATUS_COLORS } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import { appointmentApi } from '@/services/appointment';

interface AppointmentListProps {
  selectedId?: number;
  onSelect?: (appointment: AppointmentListItem) => void;
  loading?: boolean;
}

const statusTabs: { key: AppointmentStatus; label: string; color: string }[] = [
  { key: 'Pending', label: STATUS_LABELS.Pending, color: STATUS_COLORS.Pending },
  { key: 'InService', label: STATUS_LABELS.InService, color: STATUS_COLORS.InService },
  { key: 'PartsShortage', label: STATUS_LABELS.PartsShortage, color: STATUS_COLORS.PartsShortage },
  { key: 'DataIncomplete', label: STATUS_LABELS.DataIncomplete, color: STATUS_COLORS.DataIncomplete },
  { key: 'ReviewRequired', label: STATUS_LABELS.ReviewRequired, color: STATUS_COLORS.ReviewRequired },
  { key: 'Completed', label: STATUS_LABELS.Completed, color: STATUS_COLORS.Completed },
  { key: 'Closed', label: STATUS_LABELS.Closed, color: STATUS_COLORS.Closed },
];

export default function AppointmentList({ selectedId, onSelect, loading }: AppointmentListProps) {
  const [activeTab, setActiveTab] = useState<AppointmentStatus>('Pending');
  const [searchText, setSearchText] = useState('');
  const [appointments, setAppointments] = useState<AppointmentListItem[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [counts, setCounts] = useState<Record<AppointmentStatus, number>>({
    Pending: 0,
    InService: 0,
    PartsShortage: 0,
    DataIncomplete: 0,
    ReviewRequired: 0,
    Completed: 0,
    Closed: 0,
  });

  useEffect(() => {
    loadAllAppointments();
  }, []);

  const loadAllAppointments = async () => {
    setListLoading(true);
    try {
      const all = await appointmentApi.getList();
      setAppointments(all);
      const newCounts: Record<AppointmentStatus, number> = {
        Pending: 0,
        InService: 0,
        PartsShortage: 0,
        DataIncomplete: 0,
        ReviewRequired: 0,
        Completed: 0,
        Closed: 0,
      };
      all.forEach(item => {
        const status = item.status as AppointmentStatus;
        if (newCounts[status] !== undefined) {
          newCounts[status]++;
        }
      });
      setCounts(newCounts);
    } catch (error) {
      console.error('Failed to load appointments:', error);
    } finally {
      setListLoading(false);
    }
  };

  const filteredAppointments = appointments
    .filter(item => item.status === activeTab)
    .filter(item => {
      if (!searchText) return true;
      const lower = searchText.toLowerCase();
      return (
        item.plateNumber.toLowerCase().includes(lower) ||
        item.appointmentNo.toLowerCase().includes(lower) ||
        item.ownerName.includes(searchText)
      );
    });

  const tabItems = statusTabs.map(tab => ({
    key: tab.key,
    label: (
      <span style={{ color: selectedId && appointments.find(a => a.id === selectedId)?.status === tab.key ? tab.color : undefined }}>
        {tab.label}
        <Badge 
          count={counts[tab.key]} 
          size="small" 
          style={{ 
            marginLeft: 6,
            backgroundColor: counts[tab.key] > 0 ? tab.color : '#d9d9d9',
          }}
        />
      </span>
    ),
  }));

  return (
    <Card 
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0 }}
      size="small"
    >
      <div style={{ padding: '12px 12px 0' }}>
        <Input
          placeholder="搜索车牌号/单号/车主"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          size="small"
        />
      </div>
      
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as AppointmentStatus)}
        size="small"
        items={tabItems}
        style={{ padding: '0 12px' }}
      />
      
      <div style={{ 
        flex: 1, 
        overflow: 'auto',
        padding: '0 8px 8px',
      }}>
        <List
          loading={listLoading || loading}
          dataSource={filteredAppointments}
          locale={{ emptyText: '暂无数据' }}
          renderItem={(item) => (
            <List.Item
              key={item.id}
              onClick={() => onSelect?.(item)}
              style={{
                cursor: 'pointer',
                padding: '10px 8px',
                marginBottom: 4,
                borderRadius: 6,
                border: selectedId === item.id 
                  ? '2px solid #1890ff' 
                  : '1px solid #f0f0f0',
                background: selectedId === item.id ? '#e6f7ff' : 'white',
                transition: 'all 0.2s',
              }}
            >
              <List.Item.Meta
                avatar={
                  <Avatar 
                    icon={<CarOutlined />} 
                    style={{ 
                      backgroundColor: STATUS_COLORS[item.status],
                    }} 
                  />
                }
                title={
                  <Space size="small">
                    <Tag color="blue" style={{ fontWeight: 'bold' }}>
                      {item.plateNumber}
                    </Tag>
                    <StatusBadge status={item.status} size="small" />
                  </Space>
                }
                description={
                  <div style={{ fontSize: 12, color: '#666' }}>
                    <div style={{ marginBottom: 2 }}>
                      <span style={{ color: '#999' }}>单号：</span>
                      {item.appointmentNo}
                    </div>
                    <div style={{ marginBottom: 2 }}>
                      <UserOutlined style={{ marginRight: 4 }} />
                      {item.ownerName}
                    </div>
                    <div>
                      <ClockCircleOutlined style={{ marginRight: 4 }} />
                      {item.appointmentTime?.slice(5, 16)}
                    </div>
                    <div style={{ 
                      marginTop: 4, 
                      color: '#999', 
                      fontSize: 11,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {item.faultDescription}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </div>
    </Card>
  );
}
