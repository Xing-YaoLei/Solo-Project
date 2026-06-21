'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  Tag,
  Button,
  Space,
  Select,
  DatePicker,
  Input,
  Modal,
  Form,
  Row,
  Col,
  Descriptions,
  Timeline,
  message,
  Tooltip,
  Divider,
  List,
  Card,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  UserOutlined,
  TeamOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  RescheduleRecord,
  RescheduleReason,
  STATUS_LABEL_MAP,
} from '@/types';
import { rescheduleApi } from '@/lib/api';

const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Option } = Select;

const REASON_LABEL_MAP: Record<RescheduleReason, string> = {
  [RescheduleReason.PARTY_REQUEST]: '当事人申请',
  [RescheduleReason.COURT_CHANGE]: '法院变更',
  [RescheduleReason.LAWYER_CONFLICT]: '律师冲突',
  [RescheduleReason.EMERGENCY]: '紧急情况',
  [RescheduleReason.JUDGE_UNAVAILABLE]: '法官无法到场',
  [RescheduleReason.OTHER]: '其他原因',
};

const RescheduleManager: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RescheduleRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [keyword, setKeyword] = useState('');
  const [reason, setReason] = useState<RescheduleReason | undefined>();
  const [approvalStatus, setApprovalStatus] = useState<boolean | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  const [selectedRecord, setSelectedRecord] = useState<RescheduleRecord | null>(null);

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [affectedParties, setAffectedParties] = useState<any[]>([]);
  const [rescheduleHistory, setRescheduleHistory] = useState<RescheduleRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [affectedLoading, setAffectedLoading] = useState(false);

  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [approveAction, setApproveAction] = useState<'approve' | 'reject'>('approve');
  const [approveForm] = Form.useForm();
  const [approveLoading, setApproveLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: pageSize,
      };
      if (keyword) params.keyword = keyword;
      if (reason) params.reason = reason;
      if (approvalStatus !== undefined) params.isApproved = approvalStatus;
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startTimeFrom = dateRange[0].startOf('day').toISOString();
        params.startTimeTo = dateRange[1].endOf('day').toISOString();
      }
      const res = await rescheduleApi.list(params);
      setData(res.data?.list || []);
      setTotal(res.data?.total || 0);
    } catch (error: any) {
      message.error(error.message || '获取改约列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize]);

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const handleReset = () => {
    setKeyword('');
    setReason(undefined);
    setApprovalStatus(undefined);
    setDateRange(null);
    setPage(1);
    fetchData();
  };

  const fetchAffectedParties = async (hearingId: string) => {
    setAffectedLoading(true);
    try {
      const res = await rescheduleApi.getAffectedParties(hearingId);
      setAffectedParties(res.data || []);
    } catch (error: any) {
      message.error(error.message || '获取受影响名单失败');
    } finally {
      setAffectedLoading(false);
    }
  };

  const fetchRescheduleHistory = async (hearingId: string) => {
    setHistoryLoading(true);
    try {
      const res = await rescheduleApi.getHistory(hearingId);
      setRescheduleHistory(res.data || []);
    } catch (error: any) {
      message.error(error.message || '获取改约历史失败');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleViewDetail = async (record: RescheduleRecord) => {
    setSelectedRecord(record);
    setDetailModalVisible(true);
    if (record.originalHearingId) {
      await Promise.all([
        fetchAffectedParties(record.originalHearingId),
        fetchRescheduleHistory(record.originalHearingId),
      ]);
    }
  };

  const handleOpenApprove = (record: RescheduleRecord, action: 'approve' | 'reject') => {
    setSelectedRecord(record);
    setApproveAction(action);
    approveForm.resetFields();
    setApproveModalVisible(true);
  };

  const handleApprove = async () => {
    try {
      const values = await approveForm.validateFields();
      if (!selectedRecord) return;
      setApproveLoading(true);
      await rescheduleApi.approve(selectedRecord.id, {
        isApproved: approveAction === 'approve',
      });
      message.success(approveAction === 'approve' ? '已批准改约' : '已驳回改约');
      setApproveModalVisible(false);
      fetchData();
    } catch (error: any) {
      if (error.errorFields) return;
      message.error(error.message || '操作失败');
    } finally {
      setApproveLoading(false);
    }
  };

  const columns: ColumnsType<RescheduleRecord> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '开庭编号',
      dataIndex: ['originalHearing', 'hearingNo'],
      key: 'hearingNo',
      width: 130,
    },
    {
      title: '案件',
      dataIndex: ['originalHearing', 'caseInfo', 'title'],
      key: 'caseTitle',
      width: 200,
      ellipsis: true,
    },
    {
      title: '改约原因',
      dataIndex: 'reason',
      key: 'reason',
      width: 130,
      render: (r: RescheduleReason) => (
        <Tag color="blue">{REASON_LABEL_MAP[r] || r}</Tag>
      ),
    },
    {
      title: '原时间',
      key: 'oldTime',
      width: 170,
      render: (_, record) => (
        <span>
          <CalendarOutlined style={{ marginRight: 4, color: '#999' }} />
          {dayjs(record.oldStartTime).format('MM-DD HH:mm')}
        </span>
      ),
    },
    {
      title: '新时间',
      key: 'newTime',
      width: 170,
      render: (_, record) =>
        record.newStartTime ? (
          <span style={{ color: '#1890ff' }}>
            <CalendarOutlined style={{ marginRight: 4 }} />
            {dayjs(record.newStartTime).format('MM-DD HH:mm')}
          </span>
        ) : (
          <Tag color="default">待安排</Tag>
        ),
    },
    {
      title: '审批状态',
      dataIndex: 'isApproved',
      key: 'isApproved',
      width: 100,
      render: (approved: boolean, record) => {
        if (record.approvedAt !== undefined && approved === undefined) {
          return <Tag color="processing">审批中</Tag>;
        }
        if (approved) {
          return (
            <Tag icon={<CheckOutlined />} color="success">
              已批准
            </Tag>
          );
        }
        return (
          <Tag icon={<CloseOutlined />} color="error">
            待审批
          </Tag>
        );
      },
    },
    {
      title: '申请人',
      dataIndex: 'initiatedBy',
      key: 'initiatedBy',
      width: 100,
      render: (v) => v || '-',
    },
    {
      title: '申请时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            >
              详情
            </Button>
          </Tooltip>
          {!record.isApproved && (
            <>
              <Tooltip title="批准">
                <Button
                  type="link"
                  size="small"
                  icon={<CheckOutlined />}
                  style={{ color: '#52c41a' }}
                  onClick={() => handleOpenApprove(record, 'approve')}
                >
                  批准
                </Button>
              </Tooltip>
              <Tooltip title="驳回">
                <Button
                  type="link"
                  size="small"
                  icon={<CloseOutlined />}
                  danger
                  onClick={() => handleOpenApprove(record, 'reject')}
                >
                  驳回
                </Button>
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="搜索开庭编号/案件"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 220 }}
            prefix={<SearchOutlined />}
            allowClear
          />
          <Select
            placeholder="改约原因"
            value={reason}
            onChange={setReason}
            style={{ width: 150 }}
            allowClear
          >
            {Object.values(RescheduleReason).map((r) => (
              <Option key={r} value={r}>
                {REASON_LABEL_MAP[r] || r}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="审批状态"
            value={approvalStatus !== undefined ? String(approvalStatus) : undefined}
            onChange={(v) =>
              setApprovalStatus(v === undefined ? undefined : v === 'true')
            }
            style={{ width: 130 }}
            allowClear
          >
            <Option value="true">已批准</Option>
            <Option value="false">待审批</Option>
          </Select>
          <RangePicker
            value={dateRange as any}
            onChange={(v) => setDateRange(v as any)}
            showTime
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            查询
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            重置
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={data}
        scroll={{ x: 1400 }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />

      <Modal
        title="改约详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={
          <Button onClick={() => setDetailModalVisible(false)}>关闭</Button>
        }
        width={960}
      >
        {selectedRecord && (
          <div>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="ID">{selectedRecord.id}</Descriptions.Item>
              <Descriptions.Item label="申请时间">
                {dayjs(selectedRecord.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="开庭编号">
                {selectedRecord.originalHearing?.hearingNo || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="案件">
                {selectedRecord.originalHearing?.caseInfo?.title || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="改约原因" span={2}>
                <Tag color="blue">
                  {REASON_LABEL_MAP[selectedRecord.reason] || selectedRecord.reason}
                </Tag>
                {selectedRecord.reasonDetail && (
                  <span style={{ marginLeft: 8 }}>{selectedRecord.reasonDetail}</span>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="原开庭时间" span={2}>
                <span style={{ color: '#ff4d4f' }}>
                  {dayjs(selectedRecord.oldStartTime).format('YYYY-MM-DD HH:mm')} ~{' '}
                  {dayjs(selectedRecord.oldEndTime).format('HH:mm')}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="新开庭时间" span={2}>
                {selectedRecord.newStartTime ? (
                  <span style={{ color: '#52c41a' }}>
                    {dayjs(selectedRecord.newStartTime).format('YYYY-MM-DD HH:mm')} ~{' '}
                    {selectedRecord.newEndTime
                      ? dayjs(selectedRecord.newEndTime).format('HH:mm')
                      : ''}
                  </span>
                ) : (
                  <Tag color="default">待安排</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="申请人">
                {selectedRecord.initiatedBy || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="审批状态">
                {selectedRecord.isApproved ? (
                  <Tag icon={<CheckOutlined />} color="success">
                    已批准
                  </Tag>
                ) : (
                  <Tag icon={<CloseOutlined />} color="error">
                    待审批
                  </Tag>
                )}
              </Descriptions.Item>
              {selectedRecord.isApproved && (
                <>
                  <Descriptions.Item label="审批人">
                    {selectedRecord.approverId || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="审批时间">
                    {selectedRecord.approvedAt
                      ? dayjs(selectedRecord.approvedAt).format('YYYY-MM-DD HH:mm:ss')
                      : '-'}
                  </Descriptions.Item>
                </>
              )}
              {selectedRecord.notes && (
                <Descriptions.Item label="备注" span={2}>
                  {selectedRecord.notes}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider orientation="left" plain>
              <TeamOutlined /> 受影响名单
            </Divider>
            <Card
              size="small"
              style={{ marginBottom: 16 }}
              loading={affectedLoading}
            >
              {affectedParties.length > 0 ? (
                <List
                  size="small"
                  dataSource={affectedParties}
                  renderItem={(item: any) => (
                    <List.Item>
                      <Space>
                        <UserOutlined />
                        <span style={{ fontWeight: 500 }}>{item.name || item.personName}</span>
                        {item.role && <Tag color="blue">{item.role}</Tag>}
                        {item.type && <Tag>{item.type}</Tag>}
                        {item.phone && <span style={{ color: '#999' }}>{item.phone}</span>}
                      </Space>
                    </List.Item>
                  )}
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#999', padding: '12px 0' }}>
                  暂无受影响人员
                </div>
              )}
            </Card>

            <Divider orientation="left" plain>
              <ClockCircleOutlined /> 改约历史时间线
            </Divider>
            <Card size="small" loading={historyLoading}>
              {rescheduleHistory.length > 0 ? (
                <Timeline
                  items={rescheduleHistory
                    .slice()
                    .reverse()
                    .map((item, idx) => ({
                      color:
                        idx === 0
                          ? 'blue'
                          : item.isApproved
                          ? 'green'
                          : 'gray',
                      children: (
                        <div>
                          <div style={{ fontWeight: 500 }}>
                            <Tag color="blue">
                              {REASON_LABEL_MAP[item.reason] || item.reason}
                            </Tag>
                            {item.isApproved ? (
                              <Tag icon={<CheckOutlined />} color="success">
                                已批准
                              </Tag>
                            ) : (
                              <Tag icon={<CloseOutlined />} color="error">
                                待审批
                              </Tag>
                            )}
                          </div>
                          <div style={{ marginTop: 4, color: '#555' }}>
                            原时间:{' '}
                            <span style={{ color: '#ff4d4f' }}>
                              {dayjs(item.oldStartTime).format('YYYY-MM-DD HH:mm')}
                            </span>
                            {item.newStartTime && (
                              <>
                                {' '}→{' '}
                                <span style={{ color: '#52c41a' }}>
                                  {dayjs(item.newStartTime).format('YYYY-MM-DD HH:mm')}
                                </span>
                              </>
                            )}
                          </div>
                          {item.reasonDetail && (
                            <div style={{ marginTop: 2, color: '#888', fontSize: 12 }}>
                              说明: {item.reasonDetail}
                            </div>
                          )}
                          <div style={{ marginTop: 4, color: '#999', fontSize: 12 }}>
                            申请人: {item.initiatedBy || '-'} |{' '}
                            {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                          </div>
                        </div>
                      ),
                    }))}
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#999', padding: '12px 0' }}>
                  暂无改约历史
                </div>
              )}
            </Card>
          </div>
        )}
      </Modal>

      <Modal
        title={approveAction === 'approve' ? '批准改约' : '驳回改约'}
        open={approveModalVisible}
        onOk={handleApprove}
        onCancel={() => setApproveModalVisible(false)}
        confirmLoading={approveLoading}
        okText={approveAction === 'approve' ? '确认批准' : '确认驳回'}
        okButtonProps={{
          danger: approveAction === 'reject',
        }}
        cancelText="取消"
        width={600}
      >
        {selectedRecord && (
          <div style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ color: '#666', marginBottom: 4 }}>开庭编号</div>
                <div style={{ fontWeight: 500 }}>
                  {selectedRecord.originalHearing?.hearingNo || '-'}
                </div>
              </Col>
              <Col span={12}>
                <div style={{ color: '#666', marginBottom: 4 }}>改约原因</div>
                <Tag color="blue">
                  {REASON_LABEL_MAP[selectedRecord.reason] || selectedRecord.reason}
                </Tag>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 12 }}>
              <Col span={12}>
                <div style={{ color: '#666', marginBottom: 4 }}>原时间</div>
                <div style={{ color: '#ff4d4f' }}>
                  {dayjs(selectedRecord.oldStartTime).format('YYYY-MM-DD HH:mm')}
                </div>
              </Col>
              <Col span={12}>
                <div style={{ color: '#666', marginBottom: 4 }}>新时间</div>
                <div style={{ color: '#52c41a' }}>
                  {selectedRecord.newStartTime
                    ? dayjs(selectedRecord.newStartTime).format('YYYY-MM-DD HH:mm')
                    : '待安排'}
                </div>
              </Col>
            </Row>
          </div>
        )}
        <Form form={approveForm} layout="vertical">
          <Form.Item
            label={approveAction === 'approve' ? '审批意见（选填）' : '驳回原因（必填）'}
            name="comment"
            rules={
              approveAction === 'reject'
                ? [{ required: true, message: '请输入驳回原因' }]
                : []
            }
          >
            <TextArea
              rows={4}
              placeholder={
                approveAction === 'approve'
                  ? '请输入审批意见...'
                  : '请输入驳回原因...'
              }
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RescheduleManager;
