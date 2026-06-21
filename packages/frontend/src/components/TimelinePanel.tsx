'use client';

import React, { useState, useMemo } from 'react';
import {
  Drawer,
  Timeline,
  Tag,
  Space,
  Select,
  DatePicker,
  Input,
  Button,
  Typography,
  Spin,
  Empty,
  Card,
  Divider,
  Tooltip,
  Collapse,
  theme,
} from 'antd';
import {
  ClockCircleOutlined,
  FilterOutlined,
  ClearOutlined,
  UserOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  SwapOutlined,
  CloseCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
} from '@ant-design/icons';
import type { TimelineItemProps } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useQuery } from 'react-query';
import { timelineApi, hearingApi } from '@/lib/api';
import {
  StatusTimeline,
  STATUS_LABEL_MAP,
  STATUS_COLOR_MAP,
  Hearing,
} from '@/types';

const { RangePicker } = DatePicker;
const { Search } = Input;
const { Option } = Select;
const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface TimelinePanelProps {
  open?: boolean;
  onClose?: () => void;
  hearingId?: string;
  placement?: 'left' | 'right';
  width?: number | string;
  title?: string;
  showFilters?: boolean;
  showHeader?: boolean;
}

const CHANGE_TYPE_ICONS: Record<string, React.ReactNode> = {
  STATUS_CHANGE: <SwapOutlined />,
  CREATED: <FileTextOutlined />,
  CONFLICT_DETECTED: <ExclamationCircleOutlined />,
  CONFLICT_RESOLVED: <CheckCircleOutlined />,
  RESCHEDULED: <SwapOutlined />,
  CANCELLED: <CloseCircleOutlined />,
  STARTED: <PlayCircleOutlined />,
  COMPLETED: <CheckCircleOutlined />,
  POSTPONED: <PauseCircleOutlined />,
  ATTENDANCE_UPDATED: <UserOutlined />,
  REMINDER_SENT: <ClockCircleOutlined />,
  NOTE_ADDED: <FileTextOutlined />,
};

const CHANGE_TYPE_COLORS: Record<string, TimelineItemProps['color']> = {
  STATUS_CHANGE: 'blue',
  CREATED: 'green',
  CONFLICT_DETECTED: 'red',
  CONFLICT_RESOLVED: 'green',
  RESCHEDULED: 'orange',
  CANCELLED: 'gray',
  STARTED: 'blue',
  COMPLETED: 'green',
  POSTPONED: 'orange',
  ATTENDANCE_UPDATED: 'cyan',
  REMINDER_SENT: 'purple',
  NOTE_ADDED: 'gray',
};

const TimelinePanel: React.FC<TimelinePanelProps> = ({
  open = false,
  onClose,
  hearingId: propHearingId,
  placement = 'right',
  width = 520,
  title = '状态变更时间线',
  showFilters = true,
  showHeader = true,
}) => {
  const { token } = theme.useToken();
  const [selectedHearingId, setSelectedHearingId] = useState<string | undefined>(propHearingId);
  const [changeTypeFilter, setChangeTypeFilter] = useState<string | null>(null);
  const [operatorFilter, setOperatorFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  const { data: hearings = [] } = useQuery(['timelineHearings'], async () => {
    const res = await hearingApi.list({ page: 1, limit: 50 });
    return res.data.list as Hearing[];
  });

  const { data: changeTypes = [] } = useQuery(['changeTypes'], async () => {
    const res = await timelineApi.changeTypes();
    return res.data as any[];
  });

  const { data, isLoading } = useQuery(
    ['timeline', selectedHearingId, changeTypeFilter, operatorFilter, dateRange, keyword, page],
    async () => {
      const params: any = { page, limit: 100 };
      if (selectedHearingId) params.hearingId = selectedHearingId;
      if (changeTypeFilter) params.changeType = changeTypeFilter;
      if (operatorFilter) params.operatorName = operatorFilter;
      if (dateRange) {
        params.startTime = dateRange[0].format('YYYY-MM-DD');
        params.endTime = dateRange[1].format('YYYY-MM-DD');
      }
      if (keyword) params.keyword = keyword;
      const res = await timelineApi.list(params);
      return res.data;
    },
    { enabled: open || !onClose }
  );

  const filteredTimelines = useMemo(() => {
    if (!data?.list) return [];
    const list = [...data.list];
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [data]);

  const groupedByDate = useMemo(() => {
    const groups = new Map<string, StatusTimeline[]>();
    filteredTimelines.forEach((item) => {
      const date = dayjs(item.createdAt).format('YYYY-MM-DD');
      if (!groups.has(date)) groups.set(date, []);
      groups.get(date)!.push(item);
    });
    return Array.from(groups.entries());
  }, [filteredTimelines]);

  const getTimelineIcon = (changeType: string) => {
    return CHANGE_TYPE_ICONS[changeType] || <ClockCircleOutlined />;
  };

  const getTimelineColor = (changeType: string): TimelineItemProps['color'] => {
    return CHANGE_TYPE_COLORS[changeType] || 'blue';
  };

  const renderStatusBadge = (status?: string) => {
    if (!status) return null;
    const color = STATUS_COLOR_MAP[status] || 'default';
    const label = STATUS_LABEL_MAP[status] || status;
    return (
      <Tag color={color} style={{ marginRight: 4, marginLeft: 4 }}>
        {label}
      </Tag>
    );
  };

  const handleClearFilters = () => {
    setChangeTypeFilter(null);
    setOperatorFilter(null);
    setDateRange(null);
    setKeyword('');
    setSelectedHearingId(propHearingId);
  };

  const hasActiveFilters =
    changeTypeFilter || operatorFilter || dateRange || keyword || selectedHearingId !== propHearingId;

  const renderTimelineItem = (item: StatusTimeline): TimelineItemProps => {
    const hearing = hearings?.find((h) => h.id === item.hearingId);
    return {
      color: getTimelineColor(item.changeType),
      dot: (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
          }}
        >
          {getTimelineIcon(item.changeType)}
        </div>
      ),
      children: (
        <Card
          size="small"
          bordered={false}
          style={{
            backgroundColor: token.colorBgContainer,
            boxShadow: token.boxShadowTertiary,
            marginBottom: 16,
            borderRadius: 8,
          }}
        >
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Space size={[8, 4]} wrap>
              <Tag color={getTimelineColor(item.changeType)}>
                {changeTypes.find((t: any) => t.value === item.changeType)?.label || item.changeType}
              </Tag>
              {hearing && (
                <Tooltip title={hearing.caseInfo?.title || '查看开庭详情'}>
                  <Tag color="blue" style={{ cursor: 'pointer' }}>
                    {hearing.hearingNo}
                  </Tag>
                </Tooltip>
              )}
              <Text type="secondary" style={{ fontSize: 12 }}>
                <ClockCircleOutlined /> {dayjs(item.createdAt).format('HH:mm:ss')}
              </Text>
            </Space>

            <div>
              {item.previousStatus && (
                <>
                  {renderStatusBadge(item.previousStatus)}
                  <SwapOutlined style={{ color: token.colorTextSecondary, margin: '0 4px' }} />
                </>
              )}
              {renderStatusBadge(item.newStatus)}
            </div>

            {item.description && (
              <Paragraph
                ellipsis={{ rows: 2, expandable: true, symbol: '展开' }}
                style={{ marginBottom: 0, marginTop: 4 }}
              >
                {item.description}
              </Paragraph>
            )}

            {item.changeReason && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                变更原因：{item.changeReason}
              </Text>
            )}

            <Space style={{ marginTop: 4 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <UserOutlined /> 操作人：{item.operatorName}
              </Text>
              {item.metadata && Object.keys(item.metadata).length > 0 && (
                <Tooltip title={JSON.stringify(item.metadata, null, 2)}>
                  <Button type="link" size="small" style={{ padding: 0 }}>
                    查看详情
                  </Button>
                </Tooltip>
              )}
            </Space>
          </Space>
        </Card>
      ),
    };
  };

  const renderFilters = () => (
    <Card
      size="small"
      bordered={false}
      style={{
        marginBottom: 16,
        backgroundColor: token.colorFillAlter,
        borderRadius: 8,
      }}
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Space size={[8, 8]} wrap>
          <Search
            placeholder="搜索关键字"
            allowClear
            style={{ width: 200 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={setKeyword}
          />
          <Select
            placeholder="筛选开庭"
            style={{ width: 200 }}
            allowClear
            showSearch
            optionFilterProp="label"
            value={selectedHearingId}
            onChange={(val) => setSelectedHearingId(val)}
          >
            {hearings?.map((h) => (
              <Option
                key={h.id}
                value={h.id}
                label={`${h.hearingNo} ${h.caseInfo?.title || ''}`}
              >
                <Space>
                  <Text>{h.hearingNo}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {dayjs(h.startTime).format('MM-DD HH:mm')}
                  </Text>
                  <Text
                    style={{
                      maxWidth: 150,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h.caseInfo?.title}
                  </Text>
                </Space>
              </Option>
            ))}
          </Select>
          <Select
            placeholder="变更类型"
            style={{ width: 160 }}
            allowClear
            value={changeTypeFilter || undefined}
            onChange={(val) => setChangeTypeFilter(val || null)}
          >
            {changeTypes.map((t: any) => (
              <Option key={t.value} value={t.value}>
                {t.label}
              </Option>
            ))}
          </Select>
          <Input
            placeholder="操作人"
            allowClear
            style={{ width: 140 }}
            prefix={<UserOutlined />}
            value={operatorFilter || ''}
            onChange={(e) => setOperatorFilter(e.target.value || null)}
          />
        </Space>
        <Space size={[8, 8]} wrap>
          <RangePicker
            value={dateRange}
            onChange={(range) => setDateRange(range as [Dayjs, Dayjs] | null)}
            allowClear
          />
          {hasActiveFilters && (
            <Button
              icon={<ClearOutlined />}
              onClick={handleClearFilters}
            >
              清除筛选
            </Button>
          )}
        </Space>
      </Space>
    </Card>
  );

  const renderContent = () => (
    <Spin spinning={isLoading}>
      {showFilters && renderFilters()}

      {filteredTimelines.length === 0 ? (
        <Empty
          description={
            hasActiveFilters ? '没有匹配的时间线记录，请调整筛选条件' : '暂无时间线记录'
          }
          style={{ marginTop: 60 }}
        />
      ) : (
        groupedByDate.map(([date, items]) => (
          <div key={date} style={{ marginBottom: 24 }}>
            <Divider orientation="left" style={{ margin: '0 0 16px 0' }}>
              <Tag color="geekblue" style={{ fontSize: 13 }}>
                <ClockCircleOutlined /> {date}
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  共 {items.length} 条记录
                </Text>
              </Tag>
            </Divider>
            <Timeline
              mode="left"
              items={items.map(renderTimelineItem)}
            />
          </div>
        ))
      )}

      {data && data.totalPages > 1 && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Space>
            <Button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              上一页
            </Button>
            <Text>
              第 {page} / {data.totalPages} 页
            </Text>
            <Button
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            >
              下一页
            </Button>
          </Space>
        </div>
      )}
    </Spin>
  );

  if (!onClose) {
    return (
      <div style={{ padding: 16 }}>
        {showHeader && (
          <Title level={4} style={{ marginBottom: 16 }}>
            <FilterOutlined /> {title}
          </Title>
        )}
        {renderContent()}
      </div>
    );
  }

  return (
    <Drawer
      title={
        <Space>
          <ClockCircleOutlined style={{ color: token.colorPrimary }} />
          <span>{title}</span>
          {data && (
            <Tag color="blue">
              共 {data.total} 条
            </Tag>
          )}
        </Space>
      }
      placement={placement}
      width={width}
      onClose={onClose}
      open={open}
      extra={
        <Space>
          {hasActiveFilters && (
            <Button size="small" icon={<ClearOutlined />} onClick={handleClearFilters}>
              清除
            </Button>
          )}
        </Space>
      }
    >
      {renderContent()}
    </Drawer>
  );
};

export default TimelinePanel;
