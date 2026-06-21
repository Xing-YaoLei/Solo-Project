'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Calendar,
  Drawer,
  Modal,
  Button,
  Space,
  Tag,
  List,
  Descriptions,
  Badge,
  Tooltip,
  App,
  Select,
  Input,
  Avatar,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  UserOutlined,
  TeamOutlined,
  EditOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  SearchOutlined,
  ExclamationCircleFilled,
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import type { BadgeProps } from 'antd';
import HearingForm, { HearingFormValues, mockCases, mockCourts, mockCourtRooms, mockJudges, mockLawyers } from './HearingForm';
import { Hearing, HearingStatus, STATUS_COLOR_MAP, STATUS_LABEL_MAP } from '@/types';

const { Search } = Input;

function generateMockHearings(): Hearing[] {
  const today = dayjs();
  const hearings: Hearing[] = [
    {
      id: 'h-1',
      hearingNo: 'KT20240001',
      caseId: 'case-1',
      courtId: 'court-1',
      courtRoomId: 'room-1',
      presidingJudgeId: 'judge-1',
      startTime: today.hour(9).minute(0).second(0).toISOString(),
      endTime: today.hour(11).minute(0).second(0).toISOString(),
      hearingType: '一审开庭',
      status: HearingStatus.CONFIRMED,
      isImportant: true,
      priority: 9,
      creatorId: 'admin-1',
      assignments: [
        {
          id: 'a-1',
          hearingId: 'h-1',
          assigneeId: 'lawyer-1',
          role: '主办律师',
          isLead: true,
        },
      ],
      createdAt: today.subtract(2, 'day').toISOString(),
      updatedAt: today.subtract(1, 'day').toISOString(),
    },
    {
      id: 'h-2',
      hearingNo: 'KT20240002',
      caseId: 'case-2',
      courtId: 'court-1',
      courtRoomId: 'room-2',
      presidingJudgeId: 'judge-2',
      startTime: today.hour(14).minute(0).second(0).toISOString(),
      endTime: today.hour(16).minute(30).second(0).toISOString(),
      hearingType: '调解',
      status: HearingStatus.SCHEDULED,
      isImportant: false,
      priority: 5,
      creatorId: 'admin-1',
      assignments: [
        {
          id: 'a-2',
          hearingId: 'h-2',
          assigneeId: 'lawyer-2',
          role: '主办律师',
          isLead: true,
        },
        {
          id: 'a-3',
          hearingId: 'h-2',
          assigneeId: 'lawyer-3',
          role: '协办律师',
          isLead: false,
        },
      ],
      createdAt: today.subtract(1, 'day').toISOString(),
      updatedAt: today.subtract(1, 'day').toISOString(),
    },
    {
      id: 'h-3',
      hearingNo: 'KT20240003',
      caseId: 'case-3',
      courtId: 'court-2',
      courtRoomId: 'room-4',
      presidingJudgeId: 'judge-4',
      startTime: today.add(1, 'day').hour(10).minute(0).second(0).toISOString(),
      endTime: today.add(1, 'day').hour(12).minute(0).second(0).toISOString(),
      hearingType: '一审开庭',
      status: HearingStatus.SCHEDULED,
      isImportant: true,
      priority: 8,
      creatorId: 'admin-1',
      assignments: [
        {
          id: 'a-4',
          hearingId: 'h-3',
          assigneeId: 'lawyer-4',
          role: '主办律师',
          isLead: true,
        },
      ],
      createdAt: today.toISOString(),
      updatedAt: today.toISOString(),
    },
    {
      id: 'h-4',
      hearingNo: 'KT20240004',
      caseId: 'case-1',
      courtId: 'court-1',
      courtRoomId: 'room-3',
      presidingJudgeId: 'judge-3',
      startTime: today.add(2, 'day').hour(9).minute(30).second(0).toISOString(),
      endTime: today.add(2, 'day').hour(11).minute(30).second(0).toISOString(),
      hearingType: '宣判',
      status: HearingStatus.CONFIRMED,
      isImportant: false,
      priority: 6,
      creatorId: 'admin-1',
      assignments: [
        {
          id: 'a-5',
          hearingId: 'h-4',
          assigneeId: 'lawyer-1',
          role: '主办律师',
          isLead: true,
        },
      ],
      createdAt: today.toISOString(),
      updatedAt: today.toISOString(),
    },
    {
      id: 'h-5',
      hearingNo: 'KT20240005',
      caseId: 'case-2',
      courtId: 'court-2',
      courtRoomId: 'room-5',
      presidingJudgeId: 'judge-5',
      startTime: today.subtract(1, 'day').hour(13).minute(30).second(0).toISOString(),
      endTime: today.subtract(1, 'day').hour(15).minute(30).second(0).toISOString(),
      hearingType: '二审开庭',
      status: HearingStatus.COMPLETED,
      isImportant: false,
      priority: 7,
      creatorId: 'admin-1',
      assignments: [
        {
          id: 'a-6',
          hearingId: 'h-5',
          assigneeId: 'lawyer-2',
          role: '主办律师',
          isLead: true,
        },
      ],
      createdAt: today.subtract(3, 'day').toISOString(),
      updatedAt: today.subtract(1, 'day').toISOString(),
    },
  ];
  return hearings;
}

export default function DispatchDesk() {
  const [hearings, setHearings] = useState<Hearing[]>(generateMockHearings());
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedHearing, setSelectedHearing] = useState<Hearing | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHearing, setEditingHearing] = useState<Hearing | null>(null);
  const [filterText, setFilterText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [modalLoading, setModalLoading] = useState(false);

  const { message, modal } = App.useApp();

  const getCaseById = (id: string) => mockCases.find((c) => c.id === id);
  const getCourtById = (id: string) => mockCourts.find((c) => c.id === id);
  const getCourtRoomById = (id: string) => mockCourtRooms.find((r) => r.id === id);
  const getJudgeById = (id: string) => mockJudges.find((j) => j.id === id);
  const getLawyerById = (id: string) => mockLawyers.find((l) => l.id === id);

  const filteredHearings = useMemo(() => {
    return hearings.filter((h) => {
      if (filterStatus !== 'all' && h.status !== filterStatus) return false;
      if (filterText) {
        const caseInfo = getCaseById(h.caseId);
        const text = `${h.hearingNo} ${caseInfo?.title || ''} ${caseInfo?.caseNo || ''}`.toLowerCase();
        if (!text.includes(filterText.toLowerCase())) return false;
      }
      return true;
    });
  }, [hearings, filterText, filterStatus]);

  const getHearingsByDate = useCallback(
    (date: Dayjs) => {
      return filteredHearings.filter((h) => dayjs(h.startTime).isSame(date, 'day'));
    },
    [filteredHearings]
  );

  const getDateCellContent = (value: Dayjs) => {
    const list = getHearingsByDate(value);
    if (list.length === 0) return null;

    return (
      <div style={{ marginTop: 4 }}>
        {list.slice(0, 3).map((h) => {
          const caseInfo = getCaseById(h.caseId);
          const color = STATUS_COLOR_MAP[h.status] as BadgeProps['status'];
          return (
            <div
              key={h.id}
              style={{
                marginBottom: 2,
                padding: '2px 4px',
                borderRadius: 3,
                fontSize: 11,
                lineHeight: 1.4,
                background: h.isImportant ? '#fff1f0' : '#f5f5f5',
                borderLeft: `2px solid ${h.isImportant ? '#ff4d4f' : '#1677ff'}`,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedHearing(h);
                setDrawerOpen(true);
              }}
            >
              <Tooltip title={`${dayjs(h.startTime).format('HH:mm')}-${dayjs(h.endTime).format('HH:mm')} ${caseInfo?.title || ''}`}>
                <Badge status={color} text={`${dayjs(h.startTime).format('HH:mm')} ${caseInfo?.caseNo || ''}`} />
              </Tooltip>
            </div>
          );
        })}
        {list.length > 3 && (
          <div style={{ fontSize: 11, color: '#999', textAlign: 'center' }}>
            +{list.length - 3} 更多
          </div>
        )}
      </div>
    );
  };

  const handleDateSelect = (date: Dayjs) => {
    setSelectedDate(date);
  };

  const handlePanelChange = (value: Dayjs) => {
    setSelectedDate(value);
  };

  const openCreateModal = () => {
    setEditingHearing(null);
    setModalOpen(true);
  };

  const openEditModal = () => {
    if (!selectedHearing) return;
    setEditingHearing(selectedHearing);
    setDrawerOpen(false);
    setModalOpen(true);
  };

  const handleDeleteHearing = () => {
    if (!selectedHearing) return;
    modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleFilled />,
      content: `确定要删除开庭 ${selectedHearing.hearingNo} 吗？此操作不可撤销。`,
      okType: 'danger',
      onOk: () => {
        setHearings((prev) => prev.filter((h) => h.id !== selectedHearing.id));
        setSelectedHearing(null);
        setDrawerOpen(false);
        message.success('已删除开庭');
      },
    });
  };

  const handleFormSubmit = async (values: HearingFormValues) => {
    setModalLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));

      if (editingHearing) {
        setHearings((prev) =>
          prev.map((h) =>
            h.id === editingHearing.id
              ? {
                  ...h,
                  caseId: values.caseId,
                  courtId: values.courtId,
                  courtRoomId: values.courtRoomId,
                  presidingJudgeId: values.presidingJudgeId,
                  startTime: values.timeRange[0].toISOString(),
                  endTime: values.timeRange[1].toISOString(),
                  hearingType: values.hearingType,
                  judgeSummary: values.judgeSummary,
                  preparationItems: values.preparationItems,
                  materials: values.materials,
                  status: values.status,
                  isImportant: values.isImportant,
                  priority: values.priority,
                  assignments: values.lawyerIds.map((lid, idx) => ({
                    id: `${h.id}-assignment-${idx}`,
                    hearingId: h.id,
                    assigneeId: lid,
                    role: idx === 0 ? '主办律师' : '协办律师',
                    isLead: idx === 0,
                  })),
                  updatedAt: new Date().toISOString(),
                }
              : h
          )
        );
        message.success('开庭信息已更新');
      } else {
        const newId = `h-${Date.now()}`;
        const newHearing: Hearing = {
          id: newId,
          hearingNo: `KT${dayjs().format('YYYYMM')}${String(hearings.length + 1).padStart(4, '0')}`,
          caseId: values.caseId,
          courtId: values.courtId,
          courtRoomId: values.courtRoomId,
          presidingJudgeId: values.presidingJudgeId,
          startTime: values.timeRange[0].toISOString(),
          endTime: values.timeRange[1].toISOString(),
          hearingType: values.hearingType,
          judgeSummary: values.judgeSummary,
          preparationItems: values.preparationItems,
          materials: values.materials,
          status: values.status,
          isImportant: values.isImportant,
          priority: values.priority,
          creatorId: 'admin-1',
          assignments: values.lawyerIds.map((lid, idx) => ({
            id: `${newId}-assignment-${idx}`,
            hearingId: newId,
            assigneeId: lid,
            role: idx === 0 ? '主办律师' : '协办律师',
            isLead: idx === 0,
          })),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setHearings((prev) => [newHearing, ...prev]);
        message.success('开庭创建成功');
      }

      setModalOpen(false);
      setEditingHearing(null);
    } finally {
      setModalLoading(false);
    }
  };

  const dayHearings = getHearingsByDate(selectedDate);

  return (
    <div style={{ display: 'flex', gap: 16, minHeight: 600 }}>
      <div style={{ flex: 1 }}>
        <div
          style={{
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <Space wrap>
            <Search
              placeholder="搜索案号或开庭编号"
              allowClear
              style={{ width: 240 }}
              prefix={<SearchOutlined />}
              onChange={(e) => setFilterText(e.target.value)}
            />
            <Select
              style={{ width: 140 }}
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: 'all', label: '全部状态' },
                { value: HearingStatus.SCHEDULED, label: '已排期' },
                { value: HearingStatus.CONFIRMED, label: '已确认' },
                { value: HearingStatus.IN_PROGRESS, label: '进行中' },
                { value: HearingStatus.COMPLETED, label: '已完成' },
              ]}
            />
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            创建开庭
          </Button>
        </div>

        <div className="hearing-calendar">
          <Calendar
            value={selectedDate}
            onSelect={handleDateSelect}
            onPanelChange={handlePanelChange}
            cellRender={(current) => {
              if (current.type === 'date') {
                return getDateCellContent(current.origin);
              }
              return undefined;
            }}
            headerRender={({ value, onChange, type, onChangeType }) => {
              const monthStart = value.startOf('month');
              const monthEnd = value.endOf('month');
              const monthHearings = filteredHearings.filter(
                (h) =>
                  dayjs(h.startTime).isBetween(monthStart, monthEnd, 'day', '[]')
              );
              const confirmedCount = monthHearings.filter(
                (h) => h.status === HearingStatus.CONFIRMED
              ).length;
              const scheduledCount = monthHearings.filter(
                (h) => h.status === HearingStatus.SCHEDULED
              ).length;
              const completedCount = monthHearings.filter(
                (h) => h.status === HearingStatus.COMPLETED
              ).length;

              return (
                <div
                  style={{
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                    <Space>
                      <Button size="small" onClick={() => onChange(value.subtract(1, type))}>
                        上个月
                      </Button>
                      <Select
                        size="small"
                        value={type}
                        onChange={onChangeType}
                        options={[
                          { value: 'month', label: '月视图' },
                          { value: 'year', label: '年视图' },
                        ]}
                        style={{ width: 90 }}
                      />
                      <Button size="small" onClick={() => onChange(value.add(1, type))}>
                        下个月
                      </Button>
                      <Button size="small" onClick={() => onChange(dayjs())}>
                        今天
                      </Button>
                    </Space>
                    {type === 'month' && (
                      <Space size="middle" style={{ fontSize: 13, color: '#666' }}>
                        <span>
                          本月共 <b style={{ color: '#1677ff' }}>{monthHearings.length}</b> 场
                        </span>
                        <span>
                          已确认 <Tag color="cyan">{confirmedCount}</Tag>
                        </span>
                        <span>
                          已排期 <Tag color="blue">{scheduledCount}</Tag>
                        </span>
                        <span>
                          已完成 <Tag color="green">{completedCount}</Tag>
                        </span>
                      </Space>
                    )}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1f1f1f' }}>
                    {type === 'month'
                      ? `${value.year()}年${value.month() + 1}月`
                      : `${value.year()}年`}
                  </div>
                </div>
              );
            }}
          />
        </div>
      </div>

      <div
        style={{
          width: 360,
          flexShrink: 0,
          background: '#fff',
          borderRadius: 8,
          padding: 16,
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <Space>
            <CalendarOutlined style={{ color: '#1677ff' }} />
            <span style={{ fontWeight: 600, fontSize: 15 }}>
              {selectedDate.format('YYYY年MM月DD日 dddd')}
            </span>
          </Space>
          <Tag color={dayHearings.length > 0 ? 'blue' : 'default'}>
            {dayHearings.length} 场开庭
          </Tag>
        </div>

        <Divider style={{ margin: '8px 0 12px' }} />

        {dayHearings.length === 0 ? (
          <div
            style={{
              padding: '48px 0',
              textAlign: 'center',
              color: '#bfbfbf',
            }}
          >
            <InfoCircleOutlined style={{ fontSize: 32, marginBottom: 8 }} />
            <div>当日暂无开庭安排</div>
            <Button
              type="link"
              size="small"
              icon={<PlusOutlined />}
              onClick={openCreateModal}
              style={{ marginTop: 8 }}
            >
              添加开庭
            </Button>
          </div>
        ) : (
          <List
            dataSource={dayHearings}
            renderItem={(h) => {
              const caseInfo = getCaseById(h.caseId);
              const court = getCourtById(h.courtId);
              const room = getCourtRoomById(h.courtRoomId);
              return (
                <List.Item
                  style={{
                    padding: '12px 0',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    alignItems: 'flex-start',
                  }}
                  className="card-hover"
                  onClick={() => {
                    setSelectedHearing(h);
                    setDrawerOpen(true);
                  }}
                >
                  <div style={{ width: '100%' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 6,
                      }}
                    >
                      <Space>
                        <ClockCircleOutlined style={{ color: '#1677ff', fontSize: 12 }} />
                        <span style={{ fontSize: 13, fontWeight: 600 }}>
                          {dayjs(h.startTime).format('HH:mm')} -{' '}
                          {dayjs(h.endTime).format('HH:mm')}
                        </span>
                      </Space>
                      <Space size={4}>
                        {h.isImportant && (
                          <Tooltip title="重要开庭">
                            <Tag color="red" style={{ margin: 0 }}>
                              重要
                            </Tag>
                          </Tooltip>
                        )}
                        <Tag color={STATUS_COLOR_MAP[h.status]}>
                          {STATUS_LABEL_MAP[h.status]}
                        </Tag>
                      </Space>
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#262626',
                        marginBottom: 4,
                        lineHeight: 1.4,
                      }}
                    >
                      [{caseInfo?.caseNo}] {caseInfo?.title}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: '#8c8c8c',
                        marginBottom: 4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <EnvironmentOutlined />
                      {court?.name} {room?.roomName}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar.Group max={{ count: 3, style: { color: '#f56a00', backgroundColor: '#fde3cf' } }}>
                        {h.assignments?.map((a) => {
                          const lawyer = getLawyerById(a.assigneeId);
                          return (
                            <Tooltip key={a.id} title={`${lawyer?.realName} · ${a.role}`}>
                              <Avatar
                                size="small"
                                style={{
                                  backgroundColor: a.isLead ? '#1677ff' : '#52c41a',
                                  fontSize: 12,
                                }}
                              >
                                {lawyer?.realName?.slice(-2) || '?'}
                              </Avatar>
                            </Tooltip>
                          );
                        })}
                      </Avatar.Group>
                      <Tag color="geekblue" style={{ fontSize: 11 }}>
                        {h.hearingType}
                      </Tag>
                    </div>
                  </div>
                </List.Item>
              );
            }}
          />
        )}
      </div>

      <Drawer
        title={
          <Space>
            <span>开庭详情</span>
            <Tag color={selectedHearing ? STATUS_COLOR_MAP[selectedHearing.status] : 'default'}>
              {selectedHearing ? STATUS_LABEL_MAP[selectedHearing.status] : ''}
            </Tag>
            {selectedHearing?.isImportant && <Tag color="red">重要</Tag>}
          </Space>
        }
        width={520}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          <Space>
            <Button icon={<EditOutlined />} onClick={openEditModal}>
              编辑
            </Button>
            <Button danger icon={<DeleteOutlined />} onClick={handleDeleteHearing}>
              删除
            </Button>
          </Space>
        }
      >
        {selectedHearing && (
          <>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="开庭编号">
                {selectedHearing.hearingNo}
              </Descriptions.Item>
              <Descriptions.Item label="案件信息">
                <div>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>
                    [{getCaseById(selectedHearing.caseId)?.caseNo}]{' '}
                    {getCaseById(selectedHearing.caseId)?.title}
                  </div>
                  <div style={{ color: '#8c8c8c', fontSize: 12 }}>
                    案件类型: {getCaseById(selectedHearing.caseId)?.caseType}
                  </div>
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="法院">
                <Space>
                  <EnvironmentOutlined />
                  {getCourtById(selectedHearing.courtId)?.name}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="法庭">
                {(() => {
                  const r = getCourtRoomById(selectedHearing.courtRoomId);
                  return `${r?.roomNo} ${r?.roomName || ''} (${r?.floor || ''})`.trim();
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="承办法官">
                <Space>
                  <UserOutlined />
                  {(() => {
                    const j = getJudgeById(selectedHearing.presidingJudgeId || '');
                    if (!j) return '-';
                    return `${j.name} - ${j.title || ''} ${j.department || ''}`.trim();
                  })()}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="开庭类型">
                <Tag color="geekblue">{selectedHearing.hearingType}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="开庭时间">
                <Space direction="vertical" size={2}>
                  <span>
                    <ClockCircleOutlined /> {dayjs(selectedHearing.startTime).format('YYYY-MM-DD HH:mm')}
                  </span>
                  <span style={{ color: '#8c8c8c' }}>
                    至 {dayjs(selectedHearing.endTime).format('YYYY-MM-DD HH:mm')}
                  </span>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="优先级">
                <Space>
                  <div
                    style={{
                      width: Math.max(selectedHearing.priority * 8, 20),
                      height: 8,
                      background: selectedHearing.priority >= 8
                        ? '#ff4d4f'
                        : selectedHearing.priority >= 6
                        ? '#faad14'
                        : '#1677ff',
                      borderRadius: 4,
                    }}
                  />
                  <span style={{ color: '#666' }}>{selectedHearing.priority}/10</span>
                </Space>
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left" plain>
              <Space>
                <TeamOutlined /> 分派人员
              </Space>
            </Divider>
            <List
              size="small"
              dataSource={selectedHearing.assignments || []}
              renderItem={(a) => {
                const lawyer = getLawyerById(a.assigneeId);
                return (
                  <List.Item style={{ padding: '8px 0' }}>
                    <Space>
                      <Avatar
                        style={{
                          backgroundColor: a.isLead ? '#1677ff' : '#52c41a',
                        }}
                      >
                        {lawyer?.realName?.slice(-2) || '?'}
                      </Avatar>
                      <div>
                        <div style={{ fontWeight: 500 }}>
                          {lawyer?.realName}
                          {a.isLead && (
                            <Tag color="blue" style={{ marginLeft: 8 }}>
                              主办
                            </Tag>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                          {a.role} · {lawyer?.department} · 执业证号: {lawyer?.barNumber}
                        </div>
                      </div>
                    </Space>
                  </List.Item>
                );
              }}
            />

            {(selectedHearing.judgeSummary || selectedHearing.preparationItems || selectedHearing.materials) && (
              <>
                <Divider orientation="left" plain>
                  备注信息
                </Divider>
                {selectedHearing.judgeSummary && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>法官摘要</div>
                    <div style={{ fontSize: 13, color: '#262626' }}>
                      {selectedHearing.judgeSummary}
                    </div>
                  </div>
                )}
                {selectedHearing.preparationItems && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>准备事项</div>
                    <div style={{ fontSize: 13, color: '#262626' }}>
                      {selectedHearing.preparationItems}
                    </div>
                  </div>
                )}
                {selectedHearing.materials && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>材料说明</div>
                    <div style={{ fontSize: 13, color: '#262626' }}>
                      {selectedHearing.materials}
                    </div>
                  </div>
                )}
              </>
            )}

            <Divider orientation="left" plain>
              记录时间
            </Divider>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="创建时间">
                {dayjs(selectedHearing.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {dayjs(selectedHearing.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Drawer>

      <Modal
        title={editingHearing ? '编辑开庭' : '创建开庭'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditingHearing(null);
        }}
        width={720}
        destroyOnClose
        footer={null}
      >
        <HearingForm
          initialValues={editingHearing || undefined}
          loading={modalLoading}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setModalOpen(false);
            setEditingHearing(null);
          }}
        />
      </Modal>
    </div>
  );
}
