import React, { useState, useMemo } from 'react';
import {
  Card, Row, Col, Statistic, Select, DatePicker, Button, Progress, Tag,
  Table, Space, Tabs, StatisticProps, message, Empty, Drawer, List,
  Descriptions, Typography, Alert, Dropdown,
} from 'antd';
import {
  BarChartOutlined, DownloadOutlined, RiseOutlined,
  WarningOutlined, TrophyOutlined, TeamOutlined, ClockCircleOutlined,
  FileExcelOutlined, FilterOutlined, HistoryOutlined, ReloadOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { reviewApi, userApi, courseApi } from '@/api';
import type { MonthlyReviewResponse, CourseMonthlyStats, CourseListItem, ExportLogResponse } from '@/types';
import dayjs, { Dayjs } from 'dayjs';
import {
  formatDateTime, formatProgress,
} from '@/utils';
import * as XLSX from 'xlsx';

const { Option } = Select;
const { Text } = Typography;

const ReviewPage: React.FC = () => {
  const now = dayjs();
  const [year, setYear] = useState<number>(now.year());
  const [month, setMonth] = useState<number>(now.month() + 1);
  const [trainerId, setTrainerId] = useState<number | undefined>();
  const [memberId, setMemberId] = useState<number | undefined>();
  const [courseId, setCourseId] = useState<number | undefined>();
  const [logsVisible, setLogsVisible] = useState(false);

  const { data: trainers = [] } = useQuery({
    queryKey: ['trainers'],
    queryFn: () => userApi.trainers(),
  });

  const { data: members = [] } = useQuery({
    queryKey: ['members'],
    queryFn: () => userApi.members(),
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => courseApi.list(),
  });

  const queryParams = useMemo(() => ({
    year, month, trainer_id: trainerId, member_id: memberId, course_id: courseId,
  }), [year, month, trainerId, memberId, courseId]);

  const { data: review, isLoading, refetch } = useQuery({
    queryKey: ['monthlyReview', queryParams],
    queryFn: () => reviewApi.monthly(queryParams),
  });

  const { data: exportLogs = [] } = useQuery({
    queryKey: ['exportLogs'],
    queryFn: () => reviewApi.exportLogs(),
    enabled: logsVisible,
  });

  const exportMutation = useMutation({
    mutationFn: () => reviewApi.exportMonthly(queryParams),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `月度复盘_${year}_${month}_${dayjs().format('YYYYMMDDHHmmss')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success('导出成功，文件包含筛选条件、生成时间和操作人信息');
      if (logsVisible) refetch();
    },
  });

  const years = Array.from({ length: 5 }, (_, i) => now.year() - 2 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const behindStats = review?.course_stats.filter((s) => s.is_behind).length || 0;
  const onTrackStats = review?.course_stats.length ? review.course_stats.length - behindStats - (review.completed_count || 0) : 0;

  const columns = [
    {
      title: '课程名称',
      dataIndex: 'course_name',
      width: 200,
      fixed: 'left' as const,
      render: (t: string, r: CourseMonthlyStats) => (
        <Text strong>{t}</Text>
      ),
    },
    {
      title: '教练',
      dataIndex: 'trainer_name',
      width: 100,
    },
    {
      title: '学员',
      dataIndex: 'member_name',
      width: 100,
    },
    {
      title: '完成率',
      width: 200,
      render: (_: any, r: CourseMonthlyStats) => (
        <Space direction="vertical" size={0} style={{ width: '100%' }}>
          <Progress
            percent={Math.round(r.completion_rate)}
            size="small"
            strokeColor={r.is_behind ? '#dc2626' : r.completion_rate >= 80 ? '#16a34a' : '#f59e0b'}
          />
          <div style={{ fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
            <Text type="secondary">预期 {formatProgress(r.expected_progress)}</Text>
            <Text type="secondary">实际 {formatProgress(r.actual_progress)}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: '课时',
      width: 180,
      render: (_: any, r: CourseMonthlyStats) => (
        <Space size="small">
          <Tag color="blue">消耗 {r.consumed_sessions}</Tag>
          <Tag color="purple">剩余 {r.remaining_sessions}</Tag>
          <Tag color="cyan">共 {r.total_sessions}</Tag>
        </Space>
      ),
    },
    {
      title: '差距',
      dataIndex: 'gap',
      width: 100,
      align: 'center' as const,
      render: (v: number, r: CourseMonthlyStats) => (
        r.is_behind ? (
          <Tag color="red" icon={<WarningOutlined />}>落后 {v.toFixed(2)}%</Tag>
        ) : v > 0 ? (
          <Tag color="green">超前 {v.toFixed(2)}%</Tag>
        ) : (
          <Tag color="default">一致</Tag>
        )
      ),
    },
    {
      title: '状态',
      width: 100,
      render: (_: any, r: CourseMonthlyStats) => (
        r.completion_rate >= 100 ? (
          <Tag color="green" icon={<TrophyOutlined />}>已完成</Tag>
        ) : r.is_behind ? (
          <Tag color="red" icon={<WarningOutlined />}>落后</Tag>
        ) : (
          <Tag color="blue" icon={<RiseOutlined />}>正常</Tag>
        )
      ),
    },
  ];

  const downloadCSV = () => {
    if (!review) return;
    const summaryData = [[
      `统计月份: ${year}年${month}月`,
      `课程总数: ${review.total_courses}`,
      `学员总数: ${review.total_members}`,
      `整体完成率: ${review.overall_completion_rate}%`,
      `正常进度: ${review.on_track_count}`,
      `落后: ${review.behind_count}`,
      `已完成: ${review.completed_count}`,
      `生成时间: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`,
      `筛选条件: 教练=${trainerId || '全部'}, 学员=${memberId || '全部'}, 课程=${courseId || '全部'}`,
    ]];

    const headers = ['课程名称', '教练', '学员', '总课时', '已消耗', '剩余', '预期进度(%)', '实际进度(%)', '完成率(%)', '是否落后', '差距(%)'];
    const rows = review.course_stats.map((s) => [
      s.course_name, s.trainer_name, s.member_name, s.total_sessions,
      s.consumed_sessions, s.remaining_sessions, s.expected_progress,
      s.actual_progress, s.completion_rate, s.is_behind ? '是' : '否', s.gap,
    ]);

    const ws = XLSX.utils.aoa_to_sheet([...summaryData, [], headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '月度复盘');
    XLSX.writeFile(wb, `月度复盘_${year}_${month}_本地导出.xlsx`);
    message.success('导出成功');
  };

  const FilterPanel = (
    <Space direction="vertical" size="large" style={{ padding: 8, minWidth: 200 }}>
      <Space direction="vertical" size="small">
        <Text type="secondary" style={{ fontSize: 12 }}>统计时间</Text>
        <Space>
          <Select
            value={year}
            onChange={setYear}
            style={{ width: 100 }}
          >
            {years.map((y) => (
              <Option key={y} value={y}>{y}年</Option>
            ))}
          </Select>
          <Select
            value={month}
            onChange={setMonth}
            style={{ width: 100 }}
          >
            {months.map((m) => (
              <Option key={m} value={m}>{m}月</Option>
            ))}
          </Select>
        </Space>
      </Space>
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>教练筛选</Text>
        <Select
          value={trainerId}
          onChange={setTrainerId}
          allowClear
          style={{ width: '100%' }}
          showSearch
          placeholder="全部教练"
        >
          {trainers.map((t) => (
            <Option key={t.id} value={t.id}>{t.full_name}</Option>
          ))}
        </Select>
      </Space>
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>学员筛选</Text>
        <Select
          value={memberId}
          onChange={setMemberId}
          allowClear
          style={{ width: '100%' }}
          showSearch
          placeholder="全部学员"
        >
          {members.map((m) => (
            <Option key={m.id} value={m.id}>{m.full_name}</Option>
          ))}
        </Select>
      </Space>
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>课程筛选</Text>
        <Select
          value={courseId}
          onChange={setCourseId}
          allowClear
          style={{ width: '100%' }}
          showSearch
          placeholder="全部课程"
        >
          {courses.map((c: CourseListItem) => (
            <Option key={c.id} value={c.id}>{c.name}</Option>
          ))}
        </Select>
      </Space>
      <Button
        type="primary"
        block
        onClick={() => setTrainerId(undefined) || setMemberId(undefined) || setCourseId(undefined) || refetch()}
      >
        重置并刷新
      </Button>
    </Space>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ margin: 0 }}>
          <BarChartOutlined style={{ color: '#3b82f6', marginRight: 8 }} />
          {year}年{month}月 月度复盘
        </h2>
        <Space>
          <Dropdown trigger={['click']} placement="bottomRight" dropdownRender={() => FilterPanel}>
            <Button icon={<FilterOutlined />}>
              筛选条件
              {(trainerId || memberId || courseId) && (
                <Tag color="blue" style={{ marginLeft: 6 }}>已设</Tag>
              )}
            </Button>
          </Dropdown>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            刷新
          </Button>
          <Button icon={<HistoryOutlined />} onClick={() => setLogsVisible(true)}>
            导出记录
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={downloadCSV}
          >
            本地导出
          </Button>
          <Button
            type="primary"
            icon={<FileExcelOutlined />}
            loading={exportMutation.isPending}
            onClick={() => exportMutation.mutate()}
          >
            服务端导出Excel
          </Button>
        </Space>
      </div>

      {(trainerId || memberId || courseId) && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={
            <Space size="large" wrap>
              <span>
                <Text strong>筛选条件：</Text>
              </span>
              {trainerId && <Tag color="blue">教练: {trainers.find((t) => t.id === trainerId)?.full_name}</Tag>}
              {memberId && <Tag color="purple">学员: {members.find((m) => m.id === memberId)?.full_name}</Tag>}
              {courseId && <Tag color="cyan">课程: {courses.find((c: CourseListItem) => c.id === courseId)?.name}</Tag>}
              <Text type="secondary">导出时将自动包含筛选条件、生成时间及操作人</Text>
            </Space>
          }
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="参与课程数"
              value={review?.total_courses || 0}
              prefix={<BarChartOutlined style={{ color: '#3b82f6' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="学员人数"
              value={review?.total_members || 0}
              prefix={<TeamOutlined style={{ color: '#8b5cf6' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="整体完成率"
              value={review?.overall_completion_rate || 0}
              suffix="%"
              precision={2}
              valueStyle={{ color: (review?.overall_completion_rate || 0) >= 80 ? '#16a34a' : (review?.overall_completion_rate || 0) >= 50 ? '#f59e0b' : '#dc2626' }}
              prefix={<RiseOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              <div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                  <TrophyOutlined style={{ color: '#16a34a' }} /> 已完成
                </div>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#16a34a' }}>{review?.completed_count || 0}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                  <RiseOutlined style={{ color: '#3b82f6' }} /> 正常
                </div>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#3b82f6' }}>{onTrackStats}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                  <WarningOutlined style={{ color: '#dc2626' }} /> 落后
                </div>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#dc2626' }}>{behindStats}</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={10}>
          <Card title="完成率分布">
            {!review?.course_stats?.length ? (
              <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <div style={{ padding: '16px 0' }}>
                <Progress
                  type="dashboard"
                  percent={Math.round(review.overall_completion_rate)}
                  size={200}
                  strokeColor={[
                    { color: '#dc2626', percentage: 33 },
                    { color: '#f59e0b', percentage: 66 },
                    { color: '#16a34a', percentage: 100 },
                  ]}
                />
                <div style={{ textAlign: 'center', marginTop: 8 }}>
                  <Text type="secondary">
                    {review.total_members} 个学员，整体完成率
                  </Text>
                </div>
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} md={14}>
          <Card title="进度落后 TOP">
            {!review?.course_stats?.length ? (
              <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <List
                dataSource={
                  [...review.course_stats]
                    .filter((s) => s.is_behind)
                    .sort((a, b) => b.gap - a.gap)
                    .slice(0, 5)
                }
                locale={{ emptyText: <Empty description="🎉 所有学员进度正常！" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                          <Space>
                            <Tag color="red">落后 {item.gap.toFixed(2)}%</Tag>
                            <Text strong>{item.course_name}</Text>
                            <Text type="secondary">- {item.member_name}</Text>
                          </Space>
                          <Space>
                            <Tag color="blue">预期 {item.expected_progress.toFixed(1)}%</Tag>
                            <Tag color="volcano">实际 {item.actual_progress.toFixed(1)}%</Tag>
                          </Space>
                        </Space>
                      }
                      description={
                        <Progress
                          percent={Math.round(item.completion_rate)}
                          size="small"
                          strokeColor="#dc2626"
                          showInfo={false}
                          style={{ width: '100%' }}
                        />
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <span>详细完成率统计</span>
            {review?.course_stats && (
              <Tag color="cyan">{review.course_stats.length}条</Tag>
            )}
          </Space>
        }
      >
        <Table
          rowKey={(r: CourseMonthlyStats) => `${r.course_id}-${r.member_name}`}
          columns={columns}
          dataSource={review?.course_stats || []}
          loading={isLoading}
          scroll={{ x: 1000 }}
          locale={{ emptyText: <Empty description="该月份和筛选条件下暂无数据" /> }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
          }}
        />
      </Card>

      <Drawer
        title={
          <Space>
            <HistoryOutlined />
            <span>导出记录</span>
          </Space>
        }
        width={720}
        onClose={() => setLogsVisible(false)}
        open={logsVisible}
        destroyOnClose
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="每个导出文件都包含：筛选条件、生成时间、操作人信息"
        />
        <Table
          rowKey="id"
          size="small"
          dataSource={exportLogs}
          columns={[
            {
              title: '导出时间',
              dataIndex: 'generated_at',
              width: 170,
              render: (t) => formatDateTime(t),
            },
            {
              title: '类型',
              dataIndex: 'export_type',
              width: 120,
              render: (t) => (
                <Tag color="cyan" icon={<FileExcelOutlined />}>
                  {t === 'monthly_review' ? '月度复盘' : t}
                </Tag>
              ),
            },
            {
              title: '操作人',
              dataIndex: 'operator_name',
              width: 100,
            },
            {
              title: '文件名',
              dataIndex: 'file_name',
              ellipsis: true,
              render: (v) => v || '-',
            },
            {
              title: '筛选条件',
              dataIndex: 'filter_conditions',
              render: (v) => {
                if (!v || Object.keys(v).length === 0) return '-';
                return (
                  <Space size={[4, 4]} wrap>
                    {Object.entries(v).map(([k, val]) => (
                      <Tag key={k} color="geekblue" style={{ fontSize: 11 }}>
                        {k}: {String(val).substring(0, 20)}
                      </Tag>
                    ))}
                  </Space>
                );
              },
            },
          ]}
        />
      </Drawer>
    </div>
  );
};

export default ReviewPage;
