import React, { useState } from 'react';
import {
  Table, Card, Space, Select, DatePicker, Progress, Tag, Tabs, Button,
  Timeline, Statistic, Row, Col, Empty, Input, Typography,
} from 'antd';
import {
  RiseOutlined, FallOutlined, MinusOutlined, HistoryOutlined,
  TeamOutlined, BookOutlined, SearchOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { courseApi, progressApi, userApi } from '@/api';
import type { ProgressRecord, CourseListItem } from '@/types';
import { useNavigate } from '@tanstack/react-router';
import {
  formatDateTime, formatDate, formatProgress,
  getProgressStatusClass, getProgressStatusText,
} from '@/utils';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text } = Typography;

const RecordsPage: React.FC = () => {
  const navigate = useNavigate();
  const [courseId, setCourseId] = useState<number | undefined>();
  const [memberId, setMemberId] = useState<number | undefined>();
  const [searchText, setSearchText] = useState('');

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => courseApi.list(),
  });

  const { data: members = [] } = useQuery({
    queryKey: ['members'],
    queryFn: () => userApi.members(),
  });

  const { data: progressList = [], isLoading } = useQuery({
    queryKey: ['progress', courseId, memberId],
    queryFn: () => progressApi.list({ course_id: courseId, member_id: memberId }),
  });

  const filtered = progressList.filter((r) => {
    if (!searchText) return true;
    const s = searchText.toLowerCase();
    return (
      r.course.name.toLowerCase().includes(s) ||
      r.member.full_name.toLowerCase().includes(s) ||
      r.operator.full_name.toLowerCase().includes(s) ||
      (r.change_reason && r.change_reason.toLowerCase().includes(s))
    );
  });

  const totalRecords = progressList.length;
  const totalIncreases = progressList.filter((r) => r.new_progress > r.old_progress).length;
  const totalDecreases = progressList.filter((r) => r.new_progress < r.old_progress).length;
  const behindCount = progressList.filter((r) => r.progress_status === 'behind').length;

  const columns = [
    {
      title: '时间',
      dataIndex: 'created_at',
      width: 160,
      fixed: 'left' as const,
      render: (t: string) => formatDateTime(t),
      sorter: (a: ProgressRecord, b: ProgressRecord) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      defaultSortOrder: 'descend' as const,
    },
    {
      title: '课程',
      dataIndex: ['course', 'name'],
      width: 180,
      render: (text: string, r: ProgressRecord) => (
        <a onClick={() => navigate({ to: `/courses/${r.course_id}` })} style={{ fontWeight: 500 }}>
          {text}
        </a>
      ),
    },
    {
      title: '学员',
      dataIndex: ['member', 'full_name'],
      width: 100,
    },
    {
      title: '操作人',
      dataIndex: ['operator', 'full_name'],
      width: 100,
    },
    {
      title: '变更前',
      dataIndex: 'old_progress',
      width: 110,
      align: 'right' as const,
      render: (v: number) => (
        <span style={{ textDecoration: 'line-through', color: '#94a3b8' }}>
          {formatProgress(v)}
        </span>
      ),
    },
    {
      title: '变更后',
      dataIndex: 'new_progress',
      width: 110,
      align: 'right' as const,
      render: (v: number, r: ProgressRecord) => {
        const color = v > r.old_progress ? '#16a34a' : v < r.old_progress ? '#dc2626' : '#64748b';
        return (
          <Space>
            <span style={{ fontWeight: 600, color }}>{formatProgress(v)}</span>
            {v > r.old_progress && <RiseOutlined style={{ color: '#16a34a' }} />}
            {v < r.old_progress && <FallOutlined style={{ color: '#dc2626' }} />}
          </Space>
        );
      },
    },
    {
      title: '进度条',
      width: 200,
      render: (_: any, r: ProgressRecord) => (
        <Progress
          percent={Math.round(r.new_progress)}
          size="small"
          showInfo={false}
          strokeColor={r.progress_status === 'behind' ? '#dc2626' : r.progress_status === 'ahead' ? '#3b82f6' : '#16a34a'}
        />
      ),
    },
    {
      title: '状态',
      dataIndex: 'progress_status',
      width: 100,
      render: (s: string, r: ProgressRecord) => (
        <span className={`progress-badge ${getProgressStatusClass(r.new_progress, r.old_progress + 5)}`}>
          {getProgressStatusText(r.new_progress, r.old_progress + 5)}
        </span>
      ),
    },
    {
      title: '课时消耗',
      width: 160,
      render: (_: any, r: ProgressRecord) => (
        <Space size="small">
          <Tag color="blue">+{r.consumed_sessions}节</Tag>
          <Tag color="purple">剩{r.remaining_sessions}</Tag>
        </Space>
      ),
    },
    {
      title: '变更原因',
      dataIndex: 'change_reason',
      ellipsis: true,
      render: (v: string) => v || '-',
    },
  ];

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 16 }}>
        <HistoryOutlined style={{ color: '#6366f1', marginRight: 8 }} />
        学习进度记录
      </h2>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="总记录数"
              value={totalRecords}
              prefix={<HistoryOutlined style={{ color: '#6366f1' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="进度提升次数"
              value={totalIncreases}
              valueStyle={{ color: '#16a34a' }}
              prefix={<RiseOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="进度回退次数"
              value={totalDecreases}
              valueStyle={{ color: '#dc2626' }}
              prefix={<FallOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="进度落后记录"
              value={behindCount}
              valueStyle={{ color: behindCount > 0 ? '#dc2626' : '#16a34a' }}
              prefix={<MinusOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap size={[12, 12]}>
          <Select
            placeholder="筛选课程"
            value={courseId}
            onChange={setCourseId}
            style={{ width: 240 }}
            allowClear
            showSearch
            optionFilterProp="label"
          >
            {courses.map((c: CourseListItem) => (
              <Option key={c.id} value={c.id} label={c.name}>
                <Space>
                  <BookOutlined />
                  {c.name}
                  <Text type="secondary" style={{ fontSize: 12 }}>({c.trainer_name})</Text>
                </Space>
              </Option>
            ))}
          </Select>
          <Select
            placeholder="筛选学员"
            value={memberId}
            onChange={setMemberId}
            style={{ width: 200 }}
            allowClear
            showSearch
            optionFilterProp="label"
          >
            {members.map((m) => (
              <Option key={m.id} value={m.id} label={m.full_name}>
                <Space>
                  <TeamOutlined />
                  {m.full_name}
                </Space>
              </Option>
            ))}
          </Select>
          <Input
            placeholder="搜索内容"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 240 }}
            allowClear
          />
          {(courseId || memberId || searchText) && (
            <Button
              onClick={() => { setCourseId(undefined); setMemberId(undefined); setSearchText(''); }}
            >
              重置筛选
            </Button>
          )}
        </Space>
      </Card>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          loading={isLoading}
          scroll={{ x: 1200 }}
          locale={{ emptyText: <Empty description="暂无进度记录，去课程页面记录吧" /> }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条记录`,
          }}
        />
      </Card>
    </div>
  );
};

export default RecordsPage;
