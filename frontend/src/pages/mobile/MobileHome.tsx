import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchBar, Tabs, Card, Tag, PullToRefresh, DotLoading } from 'antd-mobile';
import { Badge } from 'antd';
import {
  EnvironmentOutline,
  ClockCircleOutline,
  UserOutline,
} from 'antd-mobile-icons';
import dayjs from 'dayjs';
import { useVerificationStore } from '@/store/verificationStore';
import {
  VerificationStatus,
  STATUS_LABEL_MAP,
  STATUS_COLOR_MAP,
} from '@/types';
import type { VerificationRecord } from '@/types';
import './MobileHome.css';

const STATUS_TABS = [
  { key: 'all', title: '全部' },
  { key: VerificationStatus.Pending, title: '待确认' },
  { key: VerificationStatus.Assigned, title: '待确认' },
  { key: VerificationStatus.Supplemented, title: '需补充' },
  { key: VerificationStatus.Closed, title: '已关闭' },
  { key: VerificationStatus.Damaged, title: '损坏' },
];

const FILTER_TABS = [
  { key: 'all', title: '全部' },
  { key: 'pending', title: '待确认' },
  { key: 'supplement', title: '需补充' },
  { key: 'closed', title: '已关闭' },
  { key: 'damaged', title: '损坏' },
];

function truncateAddress(address: string, maxLen = 20): string {
  if (address.length <= maxLen) return address;
  return address.slice(0, maxLen) + '...';
}

const MobileHome: React.FC = () => {
  const navigate = useNavigate();
  const {
    records,
    loading,
    fetchRecords,
  } = useVerificationStore();

  const [keyword, setKeyword] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadRecords();
  }, [activeTab]);

  const loadRecords = useCallback(async () => {
    const params: Record<string, unknown> = { keyword: keyword || undefined };
    if (activeTab === 'pending') {
      params.status = VerificationStatus.Pending;
    } else if (activeTab === 'supplement') {
      params.status = VerificationStatus.Supplemented;
    } else if (activeTab === 'closed') {
      params.status = VerificationStatus.Closed;
    } else if (activeTab === 'damaged') {
      params.status = VerificationStatus.Damaged;
    }
    fetchRecords(params as Parameters<typeof fetchRecords>[0]);
  }, [activeTab, keyword]);

  const handleSearch = (val: string) => {
    setKeyword(val);
  };

  const handleSearchSubmit = () => {
    loadRecords();
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  const handleCardClick = (record: VerificationRecord) => {
    navigate(`/record/${record.id}`);
  };

  const renderCard = (record: VerificationRecord) => {
    const isDamaged = record.status === VerificationStatus.Damaged;
    const displayAddress = record.order
      ? truncateAddress(record.order.deliveryAddress)
      : '--';

    return (
      <Card
        key={record.id}
        className={`record-card ${isDamaged ? 'record-card--damaged' : ''}`}
        onClick={() => handleCardClick(record)}
      >
        <div className="record-card__header">
          <span className="record-card__no">{record.recordNo}</span>
          <Tag
            color={STATUS_COLOR_MAP[record.status]}
            fill="outline"
            className="record-card__status"
          >
            {STATUS_LABEL_MAP[record.status]}
          </Tag>
        </div>
        <div className="record-card__body">
          <div className="record-card__row">
            <UserOutline className="record-card__icon" />
            <span>{record.rider?.name ?? '--'}</span>
          </div>
          <div className="record-card__row">
            <EnvironmentOutline className="record-card__icon" />
            <span>{displayAddress}</span>
          </div>
          <div className="record-card__row">
            <ClockCircleOutline className="record-card__icon" />
            <span>{dayjs(record.createdAt).format('YYYY-MM-DD HH:mm')}</span>
          </div>
        </div>
        {isDamaged && (
          <div className="record-card__damage-badge">
            <Badge status="error" />
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="mobile-home">
      <div className="mobile-home__search">
        <SearchBar
          placeholder="搜索核验编号/骑手名/订单号"
          value={keyword}
          onChange={handleSearch}
          onSearch={handleSearchSubmit}
          onClear={() => { setKeyword(''); }}
        />
      </div>

      <Tabs
        className="mobile-home__tabs"
        activeKey={activeTab}
        onChange={handleTabChange}
      >
        {FILTER_TABS.map((tab) => (
          <Tabs.Tab key={tab.key} title={tab.title} />
        ))}
      </Tabs>

      <div className="mobile-home__list">
        <PullToRefresh onRefresh={loadRecords}>
          {loading ? (
            <div className="mobile-home__loading">
              <DotLoading color="primary" />
              <span>加载中...</span>
            </div>
          ) : records.length === 0 ? (
            <div className="mobile-home__empty">暂无核验记录</div>
          ) : (
            records.map(renderCard)
          )}
        </PullToRefresh>
      </div>
    </div>
  );
};

export default MobileHome;
