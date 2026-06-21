'use client';

import React, { useState, useMemo } from 'react';
import {
  Card,
  Button,
  Table,
  Tag,
  Space,
  Modal,
  Form,
  Select,
  Input,
  DatePicker,
  Statistic,
  Row,
  Col,
  Divider,
  Dropdown,
  Typography,
  Empty,
  Spin,
  message,
} from 'antd';
import {
  LoginOutlined,
  CheckOutlined,
  LogoutOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  UploadOutlined,
  UserOutlined,
  CalendarOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  attendanceApi,
  hearingApi,
} from '@/lib/api';
import {
  AttendanceRecord,
  AttendanceStatus,
  STATUS_COLOR_MAP,
  STATUS_LABEL_MAP,
} from '@/types';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { Option } = Select;

interface AttendanceStats {
  total: number;
  arrived: number;
  late: number;
  absent: number;
  excused: number;
  leaveEarly: number;
}

interface BatchRegisterItem {
  hearingId: string;
  personName: string;
  attendeeType: string;
  plannedRole?: string;
  userId?: string;
  clientId?: string;
}

const defaultStats: AttendanceStats = {
  total: 0,
  arrived: 0,
  late: 0,
  absent: 0,
  excused: 0,
  leaveEarly: 0,
};

const AttendanceManager: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [selectedHearingId, setSelectedHearingId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | null>(null);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [remarkModalOpen, setRemarkModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<AttendanceRecord | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [batchForm] = Form.useForm();
  const [remarkForm] = Form.useForm();

  const { data: hearings = [], isLoading: hearingsLoading } = useQuery(
    ['hearings', selectedDate?.format('YYYY-MM-DD')],
    async () => {
      const date = selectedDate || dayjs();
      const res = await hearingApi.calendar({
        startTimeFrom: date.startOf('day').toISOString(),
        startTimeTo: date.endOf('day').toISOString(),
      });
      return res.data;
    },
    { enabled: !dateRange }
  );

  const { data: attendanceStats = defaultStats } = useQuery(
    ['attendanceStats', selectedDate?.format('YYYY-MM-DD')],
    async () => {
      const res = await attendanceApi.stats({
        date: selectedDate?.format('YYYY-MM-DD'),
      });
      return res.data as AttendanceStats;
    }
  );

  const { data: attendanceList, isLoading: attendanceLoading } = useQuery(
    ['attendance', selectedHearingId, statusFilter, dateRange?.[0]?.format('YYYY-MM-DD'), dateRange?.[1]?.format('YYYY-MM-DD')],
    async () => {
      const params: any = { page: 1, limit: 100 };
      if (selectedHearingId) params.hearingId = selectedHearingId;
      if (statusFilter) params.status = statusFilter;
      if (dateRange) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      const res = await attendanceApi.list(params);
      return res.data;
    }
  );

  const groupedByHearing = useMemo(() => {
    if (!attendanceList?.list) return [];
    const map = new Map<string, AttendanceRecord[]>();
    attendanceList.list.forEach((rec) => {
      const key = rec.hearingId;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(rec);
    });
    return Array.from(map.entries()).map(([hearingId, records]) => {
      const hearing = hearings?.find((h) => h.id === hearingId);
      return { hearingId, hearing, records };
    });
  }, [attendanceList, hearings]);

  const checkInMutation = useMutation(
    async (data: { hearingId: string; personName: string; attendeeType: string }) => {
      return attendanceApi.checkIn(data);
    },
    {
      onSuccess: () => {
        void message.success('签到成功');
        void queryClient.invalidateQueries(['attendance']);
        void queryClient.invalidateQueries(['attendanceStats']);
      },
      onError: () => {
        void message.error('签到失败');
      },
    }
  );

  const checkOutMutation = useMutation(
    async (data: { hearingId: string; personName: string }) => {
      return attendanceApi.checkOut(data);
    },
    {
      onSuccess: () => {
        void message.success('签退成功');
        void queryClient.invalidateQueries(['attendance']);
      },
      onError: () => {
        void message.error('签退失败');
      },
    }
  );

  const batchRegisterMutation = useMutation(
    async (items: BatchRegisterItem[]) => {
      return attendanceApi.batchRegister(items);
    },
    {
      onSuccess: () => {
        void message.success('批量登记成功');
        setBatchModalOpen(false);
        batchForm.resetFields();
        void queryClient.invalidateQueries(['attendance']);
        void queryClient.invalidateQueries(['attendanceStats']);
      },
      onError: () => {
        void message.error('批量登记失败');
      },
    }
  );

  const updateStatusMutation = useMutation(
    async ({ id, status, remark }: { id: string; status: AttendanceStatus; remark?: string }) => {
      return attendanceApi.updateStatus(id, { status, remark });
    },
    {
      onSuccess: () => {
        void message.success('状态更新成功');
        setRemarkModalOpen(false);
        remarkForm.resetFields();
        void queryClient.invalidateQueries(['attendance']);
        void queryClient.invalidateQueries(['attendanceStats']);
      },
      onError: () => {
        void message.error('状态更新失败');
      },
    }
  );

  const handleCheckIn = (hearingId: string, record: AttendanceRecord) => {
    checkInMutation.mutate({
      hearingId,
      personName: record.personName,
      attendeeType: record.attendeeType,
    });
  };

  const handleCheckOut = (hearingId: string, record: AttendanceRecord) => {
    checkOutMutation.mutate({
      hearingId,
      personName: record.personName,
    });
  };

  const handleBatchRegister = async () => {
    try {
      const values = await batchForm.validateFields();
      batchRegisterMutation.mutate([values] as unknown as BatchRegisterItem[]);
    } catch {
      // validation error
    }
  };

  const handleStatusChange = (record: AttendanceRecord, status: AttendanceStatus) => {
    setCurrentRecord(record);
    if (status === AttendanceStatus.LATE || status === AttendanceStatus.ABSENT) {
      remarkForm.setFieldsValue({ status, remark: '' });
      setRemarkModalOpen(true);
    } else {
      updateStatusMutation.mutate({ id: record.id, status });
    }
  };

  const handleRemarkSubmit = async () => {
    try {
      const values = await remarkForm.validateFields();
      if (currentRecord) {
        updateStatusMutation.mutate({
          id: currentRecord.id,
          status: values.status,
          remark: values.remark,
        });
      }
    } catch {
      // validation error
    }
  };

  const buildColumns = (hearingId: string): ColumnsType<AttendanceRecord> => [
    {
      title: '姓名',
      dataIndex: 'personName',
      key: 'personName',
      render: (text: string, record: AttendanceRecord) => (
        <Space>
          <UserOutlined />
          <div>
            <div>{text}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.plannedRole || record.attendeeType}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: '签到时间',
      dataIndex: 'checkInTime',
      key: 'checkInTime',
      width: 180,
      render: (time?: string) => time ? dayjs(time).format('HH:mm:ss') : <Text type="secondary" style={{ fontSize: 12 }}>--</Text>,
    },
    {
      title: '签退时间',
      dataIndex: 'checkOutTime',
      key: 'checkOutTime',
      width: 180,
      render: (time?: string) => time ? dayjs(time).format('HH:mm:ss') : <Text type="secondary" style={{ fontSize: 12 }}>--</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: AttendanceStatus) => (
        <Tag color={STATUS_COLOR_MAP[status] || 'default'}>
          {STATUS_LABEL_MAP[status] || status}
        </Tag>
      ),
    },
    {
      title: '座位',
      dataIndex: 'seatLocation',
      key: 'seatLocation',
      width: 100,
      render: (seat?: string) => seat || <Text type="secondary">--</Text>,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      ellipsis: true,
      render: (remark?: string) => remark || <Text type="secondary">--</Text>,
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      fixed: 'right',
      render: (_: unknown, record: AttendanceRecord) => {
        const canCheckIn = record.status === AttendanceStatus.NOT_ARRIVED || record.status === AttendanceStatus.ABSENT;
        const canCheckOut = record.status === AttendanceStatus.ARRIVED || record.status === AttendanceStatus.LATE;
        const statusMenu = {
          items: Object.values(AttendanceStatus).map((s) => ({
            key: s,
            label: STATUS_LABEL_MAP[s] || s,
          })),
          onClick: ({ key }: { key: string }) => handleStatusChange(record, key as AttendanceStatus),
        };
        return (
          <Space size="small">
            <Button
              type="primary"
              size="small"
              icon={<LoginOutlined />}
              disabled={!canCheckIn}
              onClick={() => handleCheckIn(hearingId, record)}
            >
              签到
            </Button>
            <Button
              size="small"
              icon={<LogoutOutlined />}
              disabled={!canCheckOut}
              onClick={() => handleCheckOut(hearingId, record)}
            >
              签退
            </Button>
            <Dropdown menu={statusMenu} placement="bottomRight">
              <Button size="small">
                <FilterOutlined />
              </Button>
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  const statsCards = [
    { title: '应到人数', value: attendanceStats.total, icon: <TeamOutlined />, color: '#1890ff' },
    { title: '已到场', value: attendanceStats.arrived, icon: <CheckOutlined />, color: '#52c41a' },
    { title: '迟到', value: attendanceStats.late, icon: <ClockCircleOutlined />, color: '#faad14' },
    { title: '缺席', value: attendanceStats.absent, icon: <UserOutlined />, color: '#ff4d4f' },
    { title: '请假', value: attendanceStats.excused, icon: <CalendarOutlined />, color: '#722ed1' },
    { title: '早退', value: attendanceStats.leaveEarly, icon: <ClockCircleOutlined />, color: '#fa8c16' },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {statsCards.map((stat, idx) => (
          <Col xs={12} sm={8} md={4} key={idx}>
            <Card bordered style={{ borderRadius: 8 }}>
              <Space>
                <div
                  style={{
                    fontSize: 28,
                    color: stat.color,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {stat.icon}
                </div>
                <Statistic title={stat.title} value={stat.value} />
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        bordered
        style={{ marginBottom: 16, borderRadius: 8 }}
        title="筛选条件"
        extra={
          <Space>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={() => setBatchModalOpen(true)}
            >
              批量登记
            </Button>
          </Space>
        }
      >
        <Space wrap>
          <DatePicker
            value={selectedDate}
            onChange={(date) => {
              setSelectedDate(date);
              setDateRange(null);
            }}
            style={{ width: 180 }}
          />
          <RangePicker
            value={dateRange}
            onChange={(range) => {
              setDateRange(range as [Dayjs, Dayjs] | null);
              if (range) setSelectedDate(null);
            }}
          />
          <Select
            placeholder="筛选开庭"
            style={{ width: 240 }}
            allowClear
            value={selectedHearingId || undefined}
            onChange={(val) => setSelectedHearingId(val || null)}
          >
            {hearings?.map((h) => (
              <Option key={h.id} value={h.id}>
                {h.hearingNo} - {dayjs(h.startTime).format('HH:mm')} {h.caseInfo?.title}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="状态筛选"
            style={{ width: 150 }}
            allowClear
            value={statusFilter || undefined}
            onChange={(val) => setStatusFilter(val || null)}
          >
            {Object.values(AttendanceStatus).map((s) => (
              <Option key={s} value={s}>
                {STATUS_LABEL_MAP[s] || s}
              </Option>
            ))}
          </Select>
        </Space>
      </Card>

      <Spin spinning={attendanceLoading || hearingsLoading}>
        {groupedByHearing.length === 0 ? (
          <Card bordered style={{ borderRadius: 8 }}>
            <Empty description="暂无签到数据" />
          </Card>
        ) : (
          groupedByHearing.map(({ hearingId, hearing, records }) => (
            <Card
              key={hearingId}
              bordered
              style={{ marginBottom: 16, borderRadius: 8 }}
              title={
                <Space>
                  <CalendarOutlined style={{ color: '#1890ff' }} />
                  <div>
                    <Title level={5} style={{ margin: 0 }}>
                      {hearing?.hearingNo || hearingId}
                    </Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {hearing ? (
                        <>
                          {dayjs(hearing.startTime).format('YYYY-MM-DD HH:mm')} -{' '}
                          {dayjs(hearing.endTime).format('HH:mm')} | {hearing.courtRoom?.roomName || '未分配法庭'} |{' '}
                          {hearing.caseInfo?.title || '未关联案件'}
                        </>
                      ) : (
                        '案件信息加载中...'
                      )}
                    </Text>
                  </div>
                </Space>
              }
              extra={
                <Space>
                  <Tag color="blue">{records.length} 人</Tag>
                  <Tag color="green">
                    {records.filter((r) => r.status === AttendanceStatus.ARRIVED).length} 已到
                  </Tag>
                </Space>
              }
            >
              <Table
                rowKey="id"
                dataSource={records}
                columns={buildColumns(hearingId)}
                pagination={false}
                size="small"
                rowSelection={{
                  selectedRowKeys: selectedRowKeys.filter((k) =>
                    records.some((r) => r.id === k)
                  ),
                  onChange: (keys) => {
                    setSelectedRowKeys(keys);
                  },
                }}
                scroll={{ x: 900 }}
              />
            </Card>
          ))
        )}
      </Spin>

      <Modal
        title="批量登记签到"
        open={batchModalOpen}
        onCancel={() => setBatchModalOpen(false)}
        onOk={handleBatchRegister}
        confirmLoading={batchRegisterMutation.isLoading}
        width={600}
      >
        <Divider orientation="left">人员信息</Divider>
        <Form
          form={batchForm}
          layout="vertical"
          initialValues={{ attendeeType: 'LAWYER' }}
        >
          <Form.Item
            label="所属开庭"
            name="hearingId"
            rules={[{ required: true, message: '请选择开庭' }]}
          >
            <Select placeholder="请选择开庭">
              {hearings?.map((h) => (
                <Option key={h.id} value={h.id}>
                  {h.hearingNo} - {h.caseInfo?.title}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="姓名"
                name="personName"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="人员类型"
                name="attendeeType"
                rules={[{ required: true, message: '请选择类型' }]}
              >
                <Select>
                  <Option value="LAWYER">律师</Option>
                  <Option value="CLIENT">当事人</Option>
                  <Option value="WITNESS">证人</Option>
                  <Option value="OTHER">其他</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="担任角色" name="plannedRole">
            <Input placeholder="如：原告律师、被告等" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="更新状态"
        open={remarkModalOpen}
        onCancel={() => setRemarkModalOpen(false)}
        onOk={handleRemarkSubmit}
        confirmLoading={updateStatusMutation.isLoading}
      >
        <Form form={remarkForm} layout="vertical">
          <Form.Item label="状态" name="status">
            <Select disabled>
              {Object.values(AttendanceStatus).map((s) => (
                <Option key={s} value={s}>
                  {STATUS_LABEL_MAP[s] || s}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="备注说明"
            name="remark"
            rules={[{ required: true, message: '请填写备注' }]}
          >
            <Input.TextArea rows={4} placeholder="请说明原因" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AttendanceManager;
