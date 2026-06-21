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
  Modal,
  Form,
  Row,
  Col,
  Descriptions,
  message,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  ConflictCheck,
  ConflictType,
  ConflictSeverity,
  STATUS_COLOR_MAP,
  STATUS_LABEL_MAP,
} from '@/types';
import { conflictApi } from '@/lib/api';

const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Option } = Select;

const ConflictManager: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ConflictCheck[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [keyword, setKeyword] = useState('');
  const [conflictType, setConflictType] = useState<ConflictType | undefined>();
  const [severity, setSeverity] = useState<ConflictSeverity | undefined>();
  const [isResolved, setIsResolved] = useState<boolean | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ConflictCheck | null>(null);

  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [resolveForm] = Form.useForm();
  const [resolveLoading, setResolveLoading] = useState(false);

  const [autoDetectLoading, setAutoDetectLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: pageSize,
      };
      if (keyword) params.keyword = keyword;
      if (conflictType) params.conflictType = conflictType;
      if (severity) params.severity = severity;
      if (isResolved !== undefined) params.isResolved = isResolved;
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startTimeFrom = dateRange[0].startOf('day').toISOString();
        params.startTimeTo = dateRange[1].endOf('day').toISOString();
      }
      const res = await conflictApi.list(params);
      setData(res.data?.list || []);
      setTotal(res.data?.total || 0);
    } catch (error: any) {
      message.error(error.message || '获取冲突列表失败');
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
    setConflictType(undefined);
    setSeverity(undefined);
    setIsResolved(undefined);
    setDateRange(null);
    setPage(1);
    fetchData();
  };

  const handleViewDetail = (record: ConflictCheck) => {
    setSelectedRecord(record);
    setDetailDrawerVisible(true);
  };

  const handleOpenResolve = (record: ConflictCheck) => {
    setSelectedRecord(record);
    resolveForm.resetFields();
    setResolveModalVisible(true);
  };

  const handleResolve = async () => {
    try {
      const values = await resolveForm.validateFields();
      if (!selectedRecord) return;
      setResolveLoading(true);
      await conflictApi.resolve(selectedRecord.id, {
        resolution: values.resolution,
      });
      message.success('冲突已解决');
      setResolveModalVisible(false);
      fetchData();
    } catch (error: any) {
      if (error.errorFields) return;
      message.error(error.message || '解决冲突失败');
    } finally {
      setResolveLoading(false);
    }
  };

  const handleAutoDetect = async () => {
    setAutoDetectLoading(true);
    try {
      const res = await conflictApi.detect({});
      message.success(`检测完成，发现 ${res.data?.conflicts?.length || 0} 个冲突`);
      fetchData();
    } catch (error: any) {
      message.error(error.message || '自动检测失败');
    } finally {
      setAutoDetectLoading(false);
    }
  };

  const columns: ColumnsType<ConflictCheck> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '冲突类型',
      dataIndex: 'conflictType',
      key: 'conflictType',
      width: 140,
      render: (type: ConflictType) => (
        <Tag color={STATUS_COLOR_MAP[ConflictSeverity.MEDIUM]}>
          {STATUS_LABEL_MAP[type] || type}
        </Tag>
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
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '涉及方A',
      dataIndex: 'partyAName',
      key: 'partyAName',
      width: 120,
      render: (name, record) => (
        <span>
          {name || record.involvedPartyA || '-'}
          {record.partyAType && (
            <Tag color="blue" style={{ marginLeft: 4 }}>
              {record.partyAType}
            </Tag>
          )}
        </span>
      ),
    },
    {
      title: '涉及方B',
      dataIndex: 'partyBName',
      key: 'partyBName',
      width: 120,
      render: (name, record) => (
        <span>
          {name || record.involvedPartyB || '-'}
          {record.partyBType && (
            <Tag color="purple" style={{ marginLeft: 4 }}>
              {record.partyBType}
            </Tag>
          )}
        </span>
      ),
    },
    {
      title: '解决状态',
      dataIndex: 'isResolved',
      key: 'isResolved',
      width: 100,
      render: (resolved: boolean) =>
        resolved ? (
          <Tag icon={<CheckCircleOutlined />} color="success">
            已解决
          </Tag>
        ) : (
          <Tag icon={<ExclamationCircleOutlined />} color="warning">
            待解决
          </Tag>
        ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
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
          {!record.isResolved && (
            <Tooltip title="解决冲突">
              <Button
                type="link"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleOpenResolve(record)}
              >
                解决
              </Button>
            </Tooltip>
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
            placeholder="搜索描述/涉及方"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 220 }}
            prefix={<SearchOutlined />}
            allowClear
          />
          <Select
            placeholder="冲突类型"
            value={conflictType}
            onChange={setConflictType}
            style={{ width: 150 }}
            allowClear
          >
            {Object.values(ConflictType).map((t) => (
              <Option key={t} value={t}>
                {STATUS_LABEL_MAP[t] || t}
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
            placeholder="解决状态"
            value={isResolved !== undefined ? String(isResolved) : undefined}
            onChange={(v) => setIsResolved(v === undefined ? undefined : v === 'true')}
            style={{ width: 130 }}
            allowClear
          >
            <Option value="true">已解决</Option>
            <Option value="false">待解决</Option>
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
          <Button
            type="primary"
            danger
            icon={<ThunderboltOutlined />}
            loading={autoDetectLoading}
            onClick={handleAutoDetect}
          >
            自动检测
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={data}
        scroll={{ x: 1300 }}
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
        title="冲突详情"
        width={720}
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
        extra={
          <Space>
            <Button onClick={() => setDetailDrawerVisible(false)}>关闭</Button>
            {selectedRecord && !selectedRecord.isResolved && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => {
                  setDetailDrawerVisible(false);
                  handleOpenResolve(selectedRecord);
                }}
              >
                解决冲突
              </Button>
            )}
          </Space>
        }
      >
        {selectedRecord && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="ID">{selectedRecord.id}</Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {dayjs(selectedRecord.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="冲突类型">
              <Tag color={STATUS_COLOR_MAP[ConflictSeverity.MEDIUM]}>
                {STATUS_LABEL_MAP[selectedRecord.conflictType] || selectedRecord.conflictType}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="严重程度">
              <Tag color={STATUS_COLOR_MAP[selectedRecord.severity]}>
                {STATUS_LABEL_MAP[selectedRecord.severity] || selectedRecord.severity}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="解决状态" span={2}>
              {selectedRecord.isResolved ? (
                <Tag icon={<CheckCircleOutlined />} color="success">
                  已解决
                </Tag>
              ) : (
                <Tag icon={<ExclamationCircleOutlined />} color="warning">
                  待解决
                </Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="涉及方A">
              {selectedRecord.partyAName || selectedRecord.involvedPartyA || '-'}
              {selectedRecord.partyAType && (
                <Tag color="blue" style={{ marginLeft: 8 }}>
                  {selectedRecord.partyAType}
                </Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="涉及方B">
              {selectedRecord.partyBName || selectedRecord.involvedPartyB || '-'}
              {selectedRecord.partyBType && (
                <Tag color="purple" style={{ marginLeft: 8 }}>
                  {selectedRecord.partyBType}
                </Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="描述" span={2}>
              {selectedRecord.description}
            </Descriptions.Item>
            <Descriptions.Item label="关联案件" span={2}>
              {selectedRecord.case?.caseNo} {selectedRecord.case?.title}
            </Descriptions.Item>
            {selectedRecord.isResolved && (
              <>
                <Descriptions.Item label="解决人">
                  {selectedRecord.resolvedBy || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="解决时间">
                  {selectedRecord.resolvedAt
                    ? dayjs(selectedRecord.resolvedAt).format('YYYY-MM-DD HH:mm:ss')
                    : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="解决方案" span={2}>
                  {selectedRecord.resolution}
                </Descriptions.Item>
              </>
            )}
          </Descriptions>
        )}
      </Drawer>

      <Modal
        title="解决冲突"
        open={resolveModalVisible}
        onOk={handleResolve}
        onCancel={() => setResolveModalVisible(false)}
        confirmLoading={resolveLoading}
        okText="确认解决"
        cancelText="取消"
        width={600}
      >
        {selectedRecord && (
          <div style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ color: '#666', marginBottom: 4 }}>冲突类型</div>
                <Tag color={STATUS_COLOR_MAP[ConflictSeverity.MEDIUM]}>
                  {STATUS_LABEL_MAP[selectedRecord.conflictType] || selectedRecord.conflictType}
                </Tag>
              </Col>
              <Col span={12}>
                <div style={{ color: '#666', marginBottom: 4 }}>严重程度</div>
                <Tag color={STATUS_COLOR_MAP[selectedRecord.severity]}>
                  {STATUS_LABEL_MAP[selectedRecord.severity] || selectedRecord.severity}
                </Tag>
              </Col>
            </Row>
            <div style={{ marginTop: 12, color: '#666', marginBottom: 4 }}>冲突描述</div>
            <div>{selectedRecord.description}</div>
          </div>
        )}
        <Form form={resolveForm} layout="vertical">
          <Form.Item
            label="解决方案"
            name="resolution"
            rules={[{ required: true, message: '请输入解决方案' }]}
          >
            <TextArea rows={4} placeholder="请输入具体的解决方案..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ConflictManager;
