import { useState, useEffect } from 'react';
import { Calendar, Badge, Drawer, List, Tag, Select, Space, Card, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { hearingService } from '../services/hearingService';
import type { HearingSchedule } from '../types';
import { HearingStatus, HearingStatusLabel } from '../types';
import { getStatusColor } from '../utils/helpers';

export default function CalendarPage() {
  const [hearings, setHearings] = useState<HearingSchedule[]>([]);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [courtRoom, setCourtRoom] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const currentMonth = dayjs().format('YYYY-MM');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const from = dayjs().startOf('month').format('YYYY-MM-DD');
        const to = dayjs().endOf('month').format('YYYY-MM-DD');
        const result = await hearingService.getList({ page: 1, pageSize: 1000, fromDate: from, toDate: to, courtRoom });
        setHearings(result.items);
      } finally { setLoading(false); }
    };
    fetch();
  }, [courtRoom, currentMonth]);

  const dateCellRender = (date: Dayjs) => {
    const dayHearings = hearings.filter(h => dayjs(h.hearingDate).isSame(date, 'day'));
    if (dayHearings.length === 0) return null;
    return (
      <div>
        {dayHearings.slice(0, 3).map(h => (
          <div key={h.id} style={{ marginBottom: 2 }}>
            <Badge
              status={h.isConflictFlagged ? 'error' : 'processing'}
              text={<span style={{ fontSize: 12, cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); navigate(`/hearings/${h.id}`); }}>{h.caseNumber}</span>}
            />
          </div>
        ))}
        {dayHearings.length > 3 && <div style={{ fontSize: 12, color: '#999' }}>+{dayHearings.length - 3} 更多</div>}
      </div>
    );
  };

  const onSelect = (date: Dayjs) => {
    setSelectedDate(date);
    setDrawerOpen(true);
  };

  const dayHearings = selectedDate ? hearings.filter(h => dayjs(h.hearingDate).isSame(selectedDate, 'day')) : [];

  return (
    <div>
      <Card title="开庭日历" extra={
        <Space>
          <Select allowClear placeholder="筛选法庭" style={{ width: 160 }} value={courtRoom} onChange={setCourtRoom}
            options={[{ value: '第一法庭', label: '第一法庭' }, { value: '第二法庭', label: '第二法庭' }, { value: '第三法庭', label: '第三法庭' }]}
          />
        </Space>
      }>
        <Spin spinning={loading}>
          <Calendar cellRender={(date, info) => info.type === 'date' ? dateCellRender(date) : null} onSelect={onSelect} />
        </Spin>
      </Card>
      <Drawer title={selectedDate ? `${selectedDate.format('YYYY-MM-DD')} 开庭安排` : ''} open={drawerOpen} onClose={() => setDrawerOpen(false)} width={500}>
        <List dataSource={dayHearings} renderItem={(h) => (
          <List.Item actions={[<a key="detail" onClick={() => navigate(`/hearings/${h.id}`)}>查看详情</a>]}>
            <List.Item.Meta
              title={<Space>{h.caseNumber} <Tag color={getStatusColor(h.status)}>{HearingStatusLabel[h.status]}</Tag>{h.isConflictFlagged && <Tag color="red">利益冲突</Tag>}</Space>}
              description={`${h.courtName} ${h.courtRoom} | ${h.startTime?.substring(0,5)}-${h.endTime?.substring(0,5)} | ${h.caseName}`}
            />
          </List.Item>
        )}
        />
      </Drawer>
    </div>
  );
}
