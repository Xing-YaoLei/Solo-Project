import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, Card, Tag, Button, Space, DotLoading, Toast, Dialog } from 'antd-mobile';
import {
  EnvironmentOutline,
  ClockCircleOutline,
  RightOutline,
} from 'antd-mobile-icons';
import dayjs from 'dayjs';
import { useVerificationStore } from '@/store/verificationStore';
import {
  VerificationStatus,
  STATUS_LABEL_MAP,
  STATUS_COLOR_MAP,
} from '@/types';
import type { VerificationRecord } from '@/types';
import './MobileActions.css';

const ACTION_TABS = [
  { key: 'pending', title: '待确认' },
  { key: 'supplement', title: '需补充' },
  { key: 'damaged', title: '已损坏' },
];

function getActionHint(record: VerificationRecord): string {
  if (record.status === VerificationStatus.Pending || record.status === VerificationStatus.Assigned) {
    return '请尽快确认该核验记录';
  }
  if (record.status === VerificationStatus.Supplemented) {
    return '请查看补充信息并处理';
  }
  if (record.status === VerificationStatus.Damaged) {
    return '请查看损坏报告并处理';
  }
  return '';
}

function truncateAddress(address: string, maxLen = 18): string {
  if (address.length <= maxLen) return address;
  return address.slice(0, maxLen) + '...';
}

const MobileActions: React.FC = () => {
  const navigate = useNavigate();
  const { records, loading, fetchRecords, confirmRecord, closeRecord } =
    useVerificationStore();

  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    loadRecords();
  }, [activeTab]);

  const loadRecords = useCallback(() => {
    const statusMap: Record<string, VerificationStatus> = {
      pending: VerificationStatus.Pending,
      supplement: VerificationStatus.Supplemented,
      damaged: VerificationStatus.Damaged,
    };
    fetchRecords({ status: statusMap[activeTab] as VerificationStatus });
  }, [activeTab]);

  const handleQuickConfirm = async (record: VerificationRecord) => {
    const result = await Dialog.confirm({
      content: `确认核验记录 ${record.recordNo}？`,
    });
    if (result) {
      await confirmRecord(record.id, {});
      Toast.show({ icon: 'success', content: '已确认' });
      loadRecords();
    }
  };

  const handleQuickClose = async (record: VerificationRecord) => {
    const result = await Dialog.confirm({
      content: `关闭核验记录 ${record.recordNo}？`,
    });
    if (result) {
      await closeRecord(record.id, {});
      Toast.show({ icon: 'success', content: '已关闭' });
      loadRecords();
    }
  };

  const handleViewDetail = (record: VerificationRecord) => {
    navigate(`/record/${record.id}`);
  };

  const renderRecord = (record: VerificationRecord) => {
    const hint = getActionHint(record);
    const displayAddress = record.order
      ? truncateAddress(record.order.deliveryAddress)
      : '--';

    return (
      <Card key={record.id} className="action-card">
        <div className="action-card__header">
          <span className="action-card__no">{record.recordNo}</span>
          <Tag
            color={STATUS_COLOR_MAP[record.status]}
            fill="outline"
            className="action-card__status"
          >
            {STATUS_LABEL_MAP[record.status]}
          </Tag>
        </div>
        <div className="action-card__body">
          <div className="action-card__row">
            <EnvironmentOutline className="action-card__icon" />
            <span>{displayAddress}</span>
          </div>
          <div className="action-card__row">
            <ClockCircleOutline className="action-card__icon" />
            <span>{dayjs(record.createdAt).format('YYYY-MM-DD HH:mm')}</span>
          </div>
          {hint && <div className="action-card__hint">{hint}</div>}
        </div>
        <div className="action-card__actions">
          <Space>
            {activeTab === 'pending' && (
              <Button
                size="small"
                color="primary"
                onClick={() => handleQuickConfirm(record)}
              >
                快速确认
              </Button>
            )}
            {(activeTab === 'supplement' || activeTab === 'damaged') && (
              <Button
                size="small"
                fill="outline"
                color="danger"
                onClick={() => handleQuickClose(record)}
              >
                关闭
              </Button>
            )}
            <Button
              size="small"
              fill="outline"
              onClick={() => handleViewDetail(record)}
            >
              查看详情
            </Button>
          </Space>
        </div>
      </Card>
    );
  };

  return (
    <div className="mobile-actions">
      <div className="mobile-actions__header">
        <h2 className="mobile-actions__title">待办动作</h2>
      </div>

      <Tabs
        className="mobile-actions__tabs"
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key)}
      >
        {ACTION_TABS.map((tab) => (
          <Tabs.Tab key={tab.key} title={tab.title} />
        ))}
      </Tabs>

      <div className="mobile-actions__list">
        {loading ? (
          <div className="mobile-actions__loading">
            <DotLoading color="primary" />
            <span>加载中...</span>
          </div>
        ) : records.length === 0 ? (
          <div className="mobile-actions__empty">暂无待办记录</div>
        ) : (
          records.map(renderRecord)
        )}
      </div>
    </div>
  );
};

export default MobileActions;
