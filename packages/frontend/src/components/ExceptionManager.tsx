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
  Drawer,
  Form,
  Row,
  Col,
  Descriptions,
  Timeline,
  message,
  Tooltip,
  Divider,
  Dropdown,
  Card,
  Avatar,
  List,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  UserOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  SafetyOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  DownOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import dayjs from 'dayjs';
import {
  ExceptionRecord,
  ExceptionStatus,
  ExceptionType,
  ConflictSeverity,
  STATUS_COLOR_MAP,
  STATUS_LABEL_MAP,
} from '@/types';
import { exceptionApi } from '@/lib/api';

const { RangePicker } = DatePicker;
const { Option } = Select;

const EXCEPTION_TYPE_LABEL_MAP: Record<ExceptionType, string> = {
  [ExceptionType.CONFLICT_OF_INTEREST]: '利益冲突',
  [ExceptionType.PROCEDURAL_ERROR]: '程序错误',
  [ExceptionType.MISSED_DEADLINE]: '错过期限',
  [ExceptionType.ATTENDANCE_ISSUE]: '出庭问题',
  [ExceptionType.COMMUNICATION_ERROR]: '沟通失误',
  [ExceptionType.OTHER]: '其他异常',
};

const STATUS_FLOW_MAP: Record<ExceptionStatus, ExceptionStatus[]> = {
  [ExceptionStatus.OPEN]: [ExceptionStatus.INVESTIGATING, ExceptionStatus.ESCALATED],
  [ExceptionStatus.INVESTIGATING]: [ExceptionStatus.RESOLVED, ExceptionStatus.ESCALATED, ExceptionStatus.OPEN],
  [ExceptionStatus.RESOLVED]: [ExceptionStatus.CLOSED, ExceptionStatus.INVESTIGATING],
  [ExceptionStatus.CLOSED]: [],
  [ExceptionStatus.ESCALATED]: [ExceptionStatus.INVESTIGATING, ExceptionStatus.RESOLVED],
};

const ExceptionManager: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ExceptionRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [keyword, setKeyword] = useState('');
  const [exceptionType, setExceptionType] = useState<ExceptionType | undefined>();
  const [severity, setSeverity] = useState<ConflictSeverity | undefined>();
  const [status, setStatus] = useState<ExceptionStatus | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ExceptionRecord | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [statusForm] = Form.useForm();
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [targetStatus, setTargetStatus] = useState<ExceptionStatus | null>(null);
  const [statusChangeLoading, setStatusChangeLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: pageSize,
      };
      if (keyword) params.keyword = keyword;
      if (exceptionType) params.exceptionType = exceptionType;
      if (severity) params.severity = severity;
      if (status) params.status = status;
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startTimeFrom = dateRange[0].startOf('day').toISOString();
        params.startTimeTo = dateRange[1].endOf('day').toISOString();
      }
      const res = await exceptionApi.list(params);
      setData(res.data?.list || []);
      setTotal(res.data?.total || 0);
    } catch (error: any) {
      message.error(error.message || '获取异常单列表失败');
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
    setExceptionType(undefined);
    setSeverity(undefined);
    setStatus(undefined);
    setDateRange(null);
    setPage(1);
    fetchData();
  };

  const handleViewDetail = async (record: ExceptionRecord) => {
    setDetailDrawerVisible(true);
    setDetailLoading(true);
    try {
      const res = await exceptionApi.detail(record.id);
      setSelectedRecord(res.data || record);
    } catch (error: any) {
      setSelectedRecord(record);
      message.error(error.message || '获取详情失败');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusChange = (record: ExceptionRecord, newStatus: ExceptionStatus) => {
    setSelectedRecord(record);
    setTargetStatus(newStatus);
    statusForm.resetFields();
    setStatusModalVisible(true);
  };

  const getStatusMenuItems = (record: ExceptionRecord): MenuProps['items'] => {
    const allowedNext = STATUS_FLOW_MAP[record.status] || [];
    if (allowedNext.length === 0) {
      return [
        {
          key: 'none',
          label: <span style={{ color: '#999' }}>无可流转状态</span>,
          disabled: true,
        },
      ];
    }
    return allowedNext.map((s) => ({
      key: s,
      label: (
        <Space>
          <Tag color={STATUS_COLOR_MAP[s]} style={{ margin: 0 }}>
            {STATUS_LABEL_MAP[s]}
          </Tag>
        </Space>
      ),
    }));
  };

  const handleMenuClick: MenuProps['onClick'] = ({ key, domEvent }) => {
    domEvent.stopPropagation();
    if (!selectedRecord) return;
    handleStatusChange(selectedRecord, key as ExceptionStatus);
  };

  const submitStatusChange = async () => {
    try {
      const values = await statusForm.validateFields();
      if (!selectedRecord || !targetStatus) return;
      setStatusChangeLoading(true);
      await exceptionApi.update(selectedRecord.id, {
        status: targetStatus,
        ...values,
      });
      message.success('状态更新成功');
      setStatusModalVisible(false);
      fetchData();
      if (detailDrawerVisible) {
        handleViewDetail({ ...selectedRecord, status: targetStatus });
      }
    } catch (error: any) {
      if (error.errorFields) return;
      message.error(error.message || '状态更新失败');
    } finally {
      setStatusChangeLoading(false);
    }
  };

  const columns: ColumnsType<ExceptionRecord> = [
    {
      title: '异常单号',
      dataIndex: 'exceptionNo',
      key: 'exceptionNo',
      width: 150,
      render: (v) => <span style={{ fontFamily: 'monospace' }}>{v}</span>,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
    },
    {
      title: '异常类型',
      dataIndex: 'exceptionType',
      key: 'exceptionType',
      width: 130,
      render: (t: ExceptionType) => (
        <Tag color="purple">{EXCEPTION_TYPE_LABEL_MAP[t] || t}</Tag>
      ),
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (s: ConflictSeverity) => (
        <Tag color={STATUS_COLOR_MAP[s]}>{STATUS_LABEL_MAP[s] || s}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (s: ExceptionStatus, record) => (
        <Dropdown
          menu={{
            items: getStatusMenuItems(record),
            onClick: (info) => {
              setSelectedRecord(record);
              handleMenuClick(info);
            },
          }}
          trigger={['click']}
          disabled={(STATUS_FLOW_MAP[s] || []).length === 0}
        >
          <span style={{ cursor: (STATUS_FLOW_MAP[s] || []).length > 0 ? 'pointer' : 'default' }}>
            <Tag color={STATUS_COLOR_MAP[s]}>
              {STATUS_LABEL_MAP[s] || s}
              {(STATUS_FLOW_MAP[s] || []).length > 0 && <DownOutlined style={{ fontSize: 10, marginLeft: 4 }} />}
            </Tag>
          </span>
        </Dropdown>
      ),
    },
    {
      title: '关联案件',
      dataIndex: ['case', 'title'],
      key: 'caseTitle',
      width: 180,
      ellipsis: true,
      render: (v, record) => (
        <span>
          {record.case?.caseNo && (
            <span style={{ color: '#999', fontFamily: 'monospace', marginRight: 4 }}>
              {record.case.caseNo}
            </span>
          )}
          {v || '-'}
        </span>
      ),
    },
    {
      title: '创建人',
      dataIndex: ['creator', 'realName'],
      key: 'creator',
      width: 100,
      render: (v, record) => v || record.creatorId || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
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
          <Dropdown
            menu={{
              items: getStatusMenuItems(record),
              onClick: (info) => handleStatusChange(record, info.key as ExceptionStatus),
            }}
            disabled={(STATUS_FLOW_MAP[record.status] || []).length === 0}
          >
            <Button type="link" size="small" disabled={(STATUS_FLOW_MAP[record.status] || []).length === 0}>
              <Space size={2}>
                状态流转
                <DownOutlined style={{ fontSize: 10 }} />
              </Space>
            </Button>
          </Dropdown>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="搜索异常单号/标题"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 220 }}
            prefix={<SearchOutlined />}
            allowClear
          />
          <Select
            placeholder="异常类型"
            value={exceptionType}
            onChange={setExceptionType}
            style={{ width: 150 }}
            allowClear
          >
            {Object.values(ExceptionType).map((t) => (
              <Option key={t} value={t}>
                {EXCEPTION_TYPE_LABEL_MAP[t] || t}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="严重程度"
            value={severity}
            onChange={setSeverity}
            style={{ width: 130 }}
            allowClear
          >
            {Object.values(ConflictSeverity).map((s) => (
              <Option key={s} value={s}>
                {STATUS_LABEL_MAP[s] || s}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="处理状态"
            value={status}
            onChange={setStatus}
            style={{ width: 130 }}
            allowClear
          >
            {Object.values(ExceptionStatus).map((s) => (
              <Option key={s} value={s}>
                {STATUS_LABEL_MAP[s] || s}
              </Option>
            ))}
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

      <Drawer
        title="异常单详情"
        width={880}
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
        loading={detailLoading}
        extra={
          <Space>
            <Button onClick={() => setDetailDrawerVisible(false)}>关闭</Button>
            {selectedRecord && (STATUS_FLOW_MAP[selectedRecord.status] || []).length > 0 && (
              <Dropdown
                menu={{
                  items: getStatusMenuItems(selectedRecord),
                  onClick: (info) => handleStatusChange(selectedRecord, info.key as ExceptionStatus),
                }}
              >
                <Button type="primary">
                  <Space>
                    状态流转
                    <DownOutlined />
                  </Space>
                </Button>
              </Dropdown>
            )}
          </Space>
        }
      >
        {selectedRecord && (
          <div>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="异常单号">
                <span style={{ fontFamily: 'monospace' }}>{selectedRecord.exceptionNo}</span>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(selectedRecord.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="标题" span={2}>
                {selectedRecord.title}
              </Descriptions.Item>
              <Descriptions.Item label="异常类型">
                <Tag color="purple">
                  {EXCEPTION_TYPE_LABEL_MAP[selectedRecord.exceptionType] ||
                    selectedRecord.exceptionType}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="严重程度">
                <Tag color={STATUS_COLOR_MAP[selectedRecord.severity]}>
                  {STATUS_LABEL_MAP[selectedRecord.severity] || selectedRecord.severity}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="当前状态" span={2}>
                <Tag color={STATUS_COLOR_MAP[selectedRecord.status]}>
                  {STATUS_LABEL_MAP[selectedRecord.status] || selectedRecord.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="关联案件">
                {selectedRecord.case?.caseNo || '-'} {selectedRecord.case?.title || ''}
              </Descriptions.Item>
              <Descriptions.Item label="关联开庭">
                {selectedRecord.hearing?.hearingNo || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建人">
                {selectedRecord.creator?.realName || selectedRecord.creatorId || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="处理人">
                {selectedRecord.resolver?.realName || selectedRecord.resolverId || '-'}
              </Descriptions.Item>
              {selectedRecord.resolvedAt && (
                <Descriptions.Item label="解决时间">
                  {dayjs(selectedRecord.resolvedAt).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
              )}
              {selectedRecord.closedAt && (
                <Descriptions.Item label="关闭时间">
                  {dayjs(selectedRecord.closedAt).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
              )}
              {selectedRecord.estimatedLoss && (
                <Descriptions.Item label="预估损失">{selectedRecord.estimatedLoss}</Descriptions.Item>
              )}
              {selectedRecord.actualLoss && (
                <Descriptions.Item label="实际损失">{selectedRecord.actualLoss}</Descriptions.Item>
              )}
              <Descriptions.Item label="详细描述" span={2}>
                {selectedRecord.description}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left" plain>
              <AlertOutlined /> 影响范围
            </Divider>
            <Card size="small" style={{ marginBottom: 16 }}>
              {selectedRecord.impactScope ? (
                <Row gutter={[16, 12]}>
                  <Col span={12}>
                    <div style={{ color: '#666', marginBottom: 6 }}>
                      <FileTextOutlined /> 影响案件
                    </div>
                    {selectedRecord.impactScope.cases?.length ? (
                      <Space wrap size={[4, 4]}>
                        {selectedRecord.impactScope.cases.map((c) => (
                          <Tag key={c.id} color="blue">
                            {c.name}
                          </Tag>
                        ))}
                      </Space>
                    ) : (
                      <span style={{ color: '#999' }}>-</span>
                    )}
                  </Col>
                  <Col span={12}>
                    <div style={{ color: '#666', marginBottom: 6 }}>
                      <ClockCircleOutlined /> 影响开庭
                    </div>
                    {selectedRecord.impactScope.hearings?.length ? (
                      <Space wrap size={[4, 4]}>
                        {selectedRecord.impactScope.hearings.map((h) => (
                          <Tag key={h.id} color="cyan">
                            {h.hearingNo}
                          </Tag>
                        ))}
                      </Space>
                    ) : (
                      <span style={{ color: '#999' }}>-</span>
                    )}
                  </Col>
                  <Col span={12}>
                    <div style={{ color: '#666', marginBottom: 6 }}>
                      <UserOutlined /> 影响人员
                    </div>
                    {selectedRecord.impactScope.users?.length ? (
                      <Space wrap size={[4, 4]}>
                        {selectedRecord.impactScope.users.map((u) => (
                          <Tag key={u.id} color="geekblue">
                            {u.name}
                          </Tag>
                        ))}
                      </Space>
                    ) : (
                      <span style={{ color: '#999' }}>-</span>
                    )}
                  </Col>
                  <Col span={12}>
                    <div style={{ color: '#666', marginBottom: 6 }}>
                      <TeamOutlined /> 影响客户
                    </div>
                    {selectedRecord.impactScope.clients?.length ? (
                      <Space wrap size={[4, 4]}>
                        {selectedRecord.impactScope.clients.map((c) => (
                          <Tag key={c.id} color="purple">
                            {c.name}
                          </Tag>
                        ))}
                      </Space>
                    ) : (
                      <span style={{ color: '#999' }}>-</span>
                    )}
                  </Col>
                  {selectedRecord.impactScope.note && (
                    <Col span={24}>
                      <div style={{ color: '#666', marginBottom: 6 }}>备注说明</div>
                      <div>{selectedRecord.impactScope.note}</div>
                    </Col>
                  )}
                </Row>
              ) : (
                <div style={{ textAlign: 'center', color: '#999', padding: '8px 0' }}>
                  暂无影响范围信息
                </div>
              )}
            </Card>

            <Divider orientation="left" plain>
              <SafetyOutlined /> 责任归属
            </Divider>
            <Card size="small" style={{ marginBottom: 16 }}>
              {selectedRecord.responsibility ? (
                <Row gutter={[16, 12]}>
                  <Col span={12}>
                    <div style={{ color: '#666', marginBottom: 6 }}>主要责任人</div>
                    {selectedRecord.responsibility.primaryResponsible?.length ? (
                      <Space wrap size={[4, 4]}>
                        {selectedRecord.responsibility.primaryResponsible.map((p) => (
                          <Tag key={p.id} color="red">
                            <Avatar size={16} icon={<UserOutlined />} style={{ marginRight: 4 }} />
                            {p.name}
                          </Tag>
                        ))}
                      </Space>
                    ) : (
                      <span style={{ color: '#999' }}>-</span>
                    )}
                  </Col>
                  <Col span={12}>
                    <div style={{ color: '#666', marginBottom: 6 }}>次要责任人</div>
                    {selectedRecord.responsibility.secondaryResponsible?.length ? (
                      <Space wrap size={[4, 4]}>
                        {selectedRecord.responsibility.secondaryResponsible.map((p) => (
                          <Tag key={p.id} color="orange">
                            <Avatar size={16} icon={<UserOutlined />} style={{ marginRight: 4 }} />
                            {p.name}
                          </Tag>
                        ))}
                      </Space>
                    ) : (
                      <span style={{ color: '#999' }}>-</span>
                    )}
                  </Col>
                  <Col span={12}>
                    <div style={{ color: '#666', marginBottom: 6 }}>归属部门</div>
                    <div>{selectedRecord.responsibility.department || '-'}</div>
                  </Col>
                  {selectedRecord.responsibility.rootCause && (
                    <Col span={24}>
                      <div style={{ color: '#666', marginBottom: 6 }}>根本原因</div>
                      <div>{selectedRecord.responsibility.rootCause}</div>
                    </Col>
                  )}
                  {selectedRecord.responsibility.analysisResult && (
                    <Col span={24}>
                      <div style={{ color: '#666', marginBottom: 6 }}>分析结论</div>
                      <div>{selectedRecord.responsibility.analysisResult}</div>
                    </Col>
                  )}
                </Row>
              ) : (
                <div style={{ textAlign: 'center', color: '#999', padding: '8px 0' }}>
                  暂无责任归属信息
                </div>
              )}
            </Card>

            <Divider orientation="left" plain>
              <CheckCircleOutlined /> 处理结果
            </Divider>
            <Card size="small" style={{ marginBottom: 16 }}>
              {(selectedRecord.handlingResult ||
                selectedRecord.investigationResult ||
                selectedRecord.correctiveAction ||
                selectedRecord.preventiveMeasure) ? (
                <Row gutter={[16, 12]}>
                  {selectedRecord.investigationResult && (
                    <Col span={24}>
                      <div style={{ color: '#666', marginBottom: 6 }}>调查结果</div>
                      <div>{selectedRecord.investigationResult}</div>
                    </Col>
                  )}
                  {selectedRecord.handlingResult && (
                    <Col span={24}>
                      <div style={{ color: '#666', marginBottom: 6 }}>处理结果</div>
                      <div>{selectedRecord.handlingResult}</div>
                    </Col>
                  )}
                  {selectedRecord.correctiveAction && (
                    <Col span={24}>
                      <div style={{ color: '#666', marginBottom: 6 }}>纠正措施</div>
                      <div>{selectedRecord.correctiveAction}</div>
                    </Col>
                  )}
                  {selectedRecord.preventiveMeasure && (
                    <Col span={24}>
                      <div style={{ color: '#666', marginBottom: 6 }}>预防措施</div>
                      <div>{selectedRecord.preventiveMeasure}</div>
                    </Col>
                  )}
                  {selectedRecord.customerSatisfaction && (
                    <Col span={24}>
                      <div style={{ color: '#666', marginBottom: 6 }}>客户满意度</div>
                      <div>{selectedRecord.customerSatisfaction}</div>
                    </Col>
                  )}
                </Row>
              ) : (
                <div style={{ textAlign: 'center', color: '#999', padding: '8px 0' }}>
                  暂无处理结果信息
                </div>
              )}
            </Card>

            {selectedRecord.attachments && selectedRecord.attachments.length > 0 && (
              <>
                <Divider orientation="left" plain>
                  <FileTextOutlined /> 附件
                </Divider>
                <Card size="small" style={{ marginBottom: 16 }}>
                  <List
                    size="small"
                    dataSource={selectedRecord.attachments}
                    renderItem={(item) => (
                      <List.Item>
                        <Space>
                          <FileTextOutlined />
                          <a href={item.fileUrl} target="_blank" rel="noreferrer">
                            {item.fileName}
                          </a>
                          <span style={{ color: '#999', fontSize: 12 }}>
                            ({(item.fileSize / 1024).toFixed(1)} KB)
                          </span>
                        </Space>
                      </List.Item>
                    )}
                  />
                </Card>
              </>
            )}

            <Divider orientation="left" plain>
              <ClockCircleOutlined /> 异常时间线
            </Divider>
            <Card size="small">
              {selectedRecord.timeline && selectedRecord.timeline.length > 0 ? (
                <Timeline
                  items={selectedRecord.timeline
                    .slice()
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    )
                    .map((item) => ({
                      color: item.statusChange
                        ? STATUS_COLOR_MAP[item.statusChange] || 'blue'
                        : 'blue',
                      children: (
                        <div>
                          <div style={{ fontWeight: 500 }}>
                            {item.action}
                            {item.statusChange && (
                              <Tag
                                color={STATUS_COLOR_MAP[item.statusChange]}
                                style={{ marginLeft: 8 }}
                              >
                                → {STATUS_LABEL_MAP[item.statusChange] || item.statusChange}
                              </Tag>
                            )}
                          </div>
                          {item.description && (
                            <div style={{ marginTop: 4, color: '#555' }}>
                              {item.description}
                            </div>
                          )}
                          <div
                            style={{
                              marginTop: 4,
                              color: '#999',
                              fontSize: 12,
                              display: 'flex',
                              justifyContent: 'space-between',
                            }}
                          >
                            <span>操作人: {item.operatorName}</span>
                            <span>{dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss')}</span>
                          </div>
                        </div>
                      ),
                    }))}
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#999', padding: '12px 0' }}>
                  暂无时间线记录
                </div>
              )}
            </Card>
          </div>
        )}
      </Drawer>

      <Modal
        title={`状态流转: ${selectedRecord ? STATUS_LABEL_MAP[selectedRecord.status] : ''} → ${targetStatus ? STATUS_LABEL_MAP[targetStatus] : ''}`}
        open={statusModalVisible}
        onOk={submitStatusChange}
        onCancel={() => setStatusModalVisible(false)}
        confirmLoading={statusChangeLoading}
        okText="确认流转"
        cancelText="取消"
        width={560}
      >
        {selectedRecord && targetStatus && (
          <div style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ color: '#666', marginBottom: 4 }}>异常单号</div>
                <div style={{ fontFamily: 'monospace' }}>{selectedRecord.exceptionNo}</div>
              </Col>
              <Col span={12}>
                <div style={{ color: '#666', marginBottom: 4 }}>标题</div>
                <div>{selectedRecord.title}</div>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 12 }}>
              <Col span={12}>
                <div style={{ color: '#666', marginBottom: 4 }}>当前状态</div>
                <Tag color={STATUS_COLOR_MAP[selectedRecord.status]}>
                  {STATUS_LABEL_MAP[selectedRecord.status]}
                </Tag>
              </Col>
              <Col span={12}>
                <div style={{ color: '#666', marginBottom: 4 }}>目标状态</div>
                <Tag color={STATUS_COLOR_MAP[targetStatus]}>
                  {STATUS_LABEL_MAP[targetStatus]}
                </Tag>
              </Col>
            </Row>
          </div>
        )}
        <Form form={statusForm} layout="vertical">
          <Form.Item
            label="流转说明/备注"
            name="remark"
            rules={[{ required: true, message: '请输入流转说明' }]}
          >
            <Input.TextArea rows={4} placeholder="请输入状态流转的说明或备注信息..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ExceptionManager;
