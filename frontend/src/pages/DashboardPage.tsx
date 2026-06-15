import { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Select,
  DatePicker,
  Space,
  Tag,
  Alert,
  Button,
  message,
} from 'antd';
import {
  TeamOutlined,
  BookOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ReloadOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import MapboxChart from '../components/MapboxChart';
import {
  FunnelChart,
  GradeFeedbackChart,
  ReminderRulesChart,
  CourseChartsChart,
  TrendChart,
} from '../components/charts';
import NoteTaskPanel from '../components/NoteTaskPanel';
import {
  funnelApi,
  alertApi,
  gradeApi,
  reminderApi,
  reviewApi,
} from '../services/api';
import type {
  FunnelOverview,
  RegionFunnel,
  TrendItem,
  AlertResult,
  NoteTask,
  GradeOverview,
  HomeworkStats,
  ChapterFunnel,
  ChapterGrade,
  ReminderRule,
} from '../types';

const { RangePicker } = DatePicker;

const DashboardPage = () => {
  const [courseId, setCourseId] = useState<number | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);

  const [funnelOverview, setFunnelOverview] = useState<FunnelOverview | null>(null);
  const [regionData, setRegionData] = useState<RegionFunnel[]>([]);
  const [trendData, setTrendData] = useState<TrendItem[]>([]);
  const [alerts, setAlerts] = useState<AlertResult[]>([]);
  const [noteTasks, setNoteTasks] = useState<NoteTask[]>([]);
  const [gradeOverview, setGradeOverview] = useState<GradeOverview | null>(null);
  const [homeworkStats, setHomeworkStats] = useState<HomeworkStats | null>(null);
  const [chapterFunnel, setChapterFunnel] = useState<ChapterFunnel[]>([]);
  const [chapterGrades, setChapterGrades] = useState<ChapterGrade[]>([]);
  const [reminderRules, setReminderRules] = useState<ReminderRule[]>([]);

  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        funnelRes,
        regionRes,
        trendRes,
        alertsRes,
        tasksRes,
        gradeRes,
        homeworkRes,
        reminderRes,
      ] = await Promise.all([
        funnelApi.getOverview({ course_id: courseId }),
        funnelApi.getByRegion({ course_id: courseId }),
        funnelApi.getTrend({ course_id: courseId, days: 30 }),
        alertApi.checkAlerts({ course_id: courseId }),
        alertApi.getNoteTasks(),
        gradeApi.getOverview({ course_id: courseId }),
        gradeApi.getHomeworkStats({ course_id: courseId }),
        reminderApi.getRules(),
      ]);

      setFunnelOverview(funnelRes.data);
      setRegionData(regionRes.data);
      setTrendData(trendRes.data);
      setAlerts(alertsRes.data);
      setNoteTasks(tasksRes.data);
      setGradeOverview(gradeRes.data);
      setHomeworkStats(homeworkRes.data);
      setReminderRules(reminderRes.data);

      if (courseId) {
        const [chapFunnelRes, chapGradeRes] = await Promise.all([
          funnelApi.getChapters(courseId),
          gradeApi.getChapterGrades(courseId),
        ]);
        setChapterFunnel(chapFunnelRes.data);
        setChapterGrades(chapGradeRes.data);
      } else {
        setChapterFunnel([]);
        setChapterGrades([]);
      }
    } catch (error) {
      console.error('加载数据失败', error);
      message.warning('加载数据失败，使用模拟数据展示');
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    setFunnelOverview({
      total_enrolled: 1280,
      pending: 150,
      distributed: 930,
      received: 860,
      returned: 12,
      distribution_rate: 72.66,
      completion_rate: 67.19,
      funnel_steps: [
        { step: '报名人数', count: 1280, rate: 100 },
        { step: '待发放', count: 150, rate: 11.72 },
        { step: '已发放', count: 930, rate: 72.66 },
        { step: '已签收', count: 860, rate: 67.19 },
      ],
    });

    setRegionData([
      { region_id: 1, region_name: '北京', region_code: 'BJ', total_enrolled: 256, received: 210, completion_rate: 82.03 },
      { region_id: 2, region_name: '上海', region_code: 'SH', total_enrolled: 312, received: 245, completion_rate: 78.53 },
      { region_id: 3, region_name: '广州', region_code: 'GZ', total_enrolled: 198, received: 132, completion_rate: 66.67 },
      { region_id: 4, region_name: '深圳', region_code: 'SZ', total_enrolled: 223, received: 168, completion_rate: 75.34 },
      { region_id: 5, region_name: '杭州', region_code: 'HZ', total_enrolled: 156, received: 120, completion_rate: 76.92 },
      { region_id: 6, region_name: '成都', region_code: 'CD', total_enrolled: 135, received: 85, completion_rate: 62.96 },
    ]);

    const mockTrend: TrendItem[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const rate = 50 + Math.random() * 30;
      mockTrend.push({
        date: d.toISOString().split('T')[0],
        total_enrolled: 1200 + Math.floor(Math.random() * 100),
        received: Math.floor(1200 * (rate / 100)),
        completion_rate: Math.round(rate * 100) / 100,
      });
    }
    setTrendData(mockTrend);

    setAlerts([
      {
        threshold_id: 1,
        threshold_name: '完成率预警',
        type: 'completion_rate',
        level: 'danger',
        threshold_value: 70,
        actual_value: 67.19,
        operator: 'lt',
        course_id: null,
        region_id: null,
      },
      {
        threshold_id: 2,
        threshold_name: '延迟发放预警',
        type: 'delay_days',
        level: 'warning',
        threshold_value: 3,
        actual_value: 5,
        operator: 'gt',
        course_id: null,
        region_id: null,
      },
    ]);

    setNoteTasks([
      {
        id: 1,
        task_no: 'NT20260615A001',
        type: 'completion_alert',
        title: '【危险】完成率预警',
        content: '完成率仅67.19%，低于70%阈值，请尽快处理。',
        conclusion: null,
        status: 'pending',
        priority: 'high',
        chart_ref: 'funnel_all',
        created_at: '2026-06-15T10:00:00Z',
        resolved_at: null,
      },
      {
        id: 2,
        task_no: 'NT20260615A002',
        type: 'delay_warning',
        title: '【警告】延迟发放预警',
        content: '有5份教材延迟发放超过3天。',
        conclusion: '已联系物流，预计本周内完成补发。',
        status: 'processing',
        priority: 'medium',
        chart_ref: null,
        created_at: '2026-06-14T16:00:00Z',
        resolved_at: null,
      },
    ]);

    setGradeOverview({
      total_students: 1024,
      avg_score: 78.5,
      excellent_rate: 35.2,
      grade_distribution: {
        '优秀': 25.5,
        '良好': 35.2,
        '中等': 22.8,
        '及格': 12.5,
        '不及格': 4.0,
      },
    });

    setHomeworkStats({
      total_assignments: 15360,
      submitted_count: 13824,
      submit_rate: 90.0,
      late_count: 768,
      late_rate: 5.0,
      avg_score: 82.3,
    });

    setChapterFunnel([
      { chapter_id: 1, chapter_no: 1, chapter_title: '入门基础', total_enrolled: 1280, distributed: 1200, received: 1150, distribution_rate: 93.75, completion_rate: 89.84 },
      { chapter_id: 2, chapter_no: 2, chapter_title: '进阶知识', total_enrolled: 1280, distributed: 1100, received: 980, distribution_rate: 85.94, completion_rate: 76.56 },
      { chapter_id: 3, chapter_no: 3, chapter_title: '高级应用', total_enrolled: 1280, distributed: 950, received: 860, distribution_rate: 74.22, completion_rate: 67.19 },
      { chapter_id: 4, chapter_no: 4, chapter_title: '综合实践', total_enrolled: 1280, distributed: 930, received: 780, distribution_rate: 72.66, completion_rate: 60.94 },
    ]);

    setChapterGrades([
      { chapter_id: 1, chapter_no: 1, chapter_title: '入门基础', student_count: 1150, avg_score: 88.5 },
      { chapter_id: 2, chapter_no: 2, chapter_title: '进阶知识', student_count: 980, avg_score: 82.3 },
      { chapter_id: 3, chapter_no: 3, chapter_title: '高级应用', student_count: 860, avg_score: 75.6 },
      { chapter_id: 4, chapter_no: 4, chapter_title: '综合实践', student_count: 780, avg_score: 70.2 },
    ]);

    setReminderRules([
      { id: 1, name: '发放前1天提醒', type: 'distribute', trigger_days: 1, template: '尊敬的学员，您的教材将于明日发出，请保持手机畅通。', channel: 'sms', is_active: true },
      { id: 2, name: '签收提醒', type: 'receive', trigger_days: 3, template: '您的教材已发出3天，请及时查收并确认签收。', channel: 'sms', is_active: true },
      { id: 3, name: '作业截止提醒', type: 'homework', trigger_days: 1, template: '距离作业截止还有1天，请及时提交。', channel: 'app', is_active: true },
      { id: 4, name: '发放前3天提醒', type: 'distribute', trigger_days: 3, template: '您的教材将在3天后发出，请确认收货地址。', channel: 'sms', is_active: false },
    ]);
  };

  useEffect(() => {
    loadData();
  }, [courseId]);

  const handleResolveTask = async (taskId: number, conclusion: string) => {
    try {
      await alertApi.resolveNoteTask(taskId, conclusion);
      message.success('处理结论已保存');
      setNoteTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, conclusion, status: 'resolved', resolved_at: new Date().toISOString() }
            : t
        )
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleGenerateReview = async () => {
    try {
      const res = await reviewApi.generate({ type: 'weekly', course_id: courseId });
      message.success(`复盘材料已生成：${res.data.title}`);
    } catch (error) {
      message.warning('生成失败，可在复盘模块查看');
    }
  };

  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return '#52c41a';
    if (rate >= 60) return '#faad14';
    return '#ff4d4f';
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Select
            placeholder="选择课程"
            allowClear
            style={{ width: 200 }}
            value={courseId}
            onChange={setCourseId}
            options={[
              { value: 1, label: '青少年Python编程入门' },
              { value: 2, label: '青少年Scratch创意编程' },
              { value: 3, label: '青少年信息学奥赛基础' },
            ]}
          />
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates as [Dayjs, Dayjs])}
          />
          <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
            刷新
          </Button>
        </Space>
        <Space>
          <Button icon={<FileTextOutlined />} type="primary" onClick={handleGenerateReview}>
            生成复盘材料
          </Button>
        </Space>
      </div>

      {alerts.length > 0 && (
        <Alert
          message={`检测到 ${alerts.length} 个预警`}
          description={
            <Space wrap>
              {alerts.map((a) => (
                <Tag key={a.threshold_id} color={a.level === 'danger' ? 'red' : 'orange'}>
                  {a.threshold_name}：{a.actual_value}（阈值{a.threshold_value}）
                </Tag>
              ))}
            </Space>
          }
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic
              title="报名人数"
              value={funnelOverview?.total_enrolled || 0}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已发放"
              value={funnelOverview?.distributed || 0}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已签收"
              value={funnelOverview?.received || 0}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="完成率"
              value={funnelOverview?.completion_rate || 0}
              suffix="%"
              prefix={<WarningOutlined />}
              valueStyle={{ color: getCompletionColor(funnelOverview?.completion_rate || 0) }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={16}>
          <Card title="区域分布地图" size="small" style={{ height: 400 }}>
            <MapboxChart data={regionData} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="发放漏斗" size="small" style={{ height: 400 }}>
            <FunnelChart data={funnelOverview} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={16}>
          <Card title="完成率趋势（近30天）" size="small" style={{ height: 320 }}>
            <TrendChart data={trendData} />
          </Card>
        </Col>
        <Col span={8}>
          <Card
            title="关联备注任务"
            size="small"
            style={{ height: 320 }}
            extra={<Tag color="red">{noteTasks.filter(t => t.status !== 'resolved').length} 待处理</Tag>}
          >
            <NoteTaskPanel
              tasks={noteTasks}
              chartRef="funnel_all"
              onResolve={handleResolveTask}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, paddingLeft: 8, borderLeft: '4px solid #1890ff' }}>
            图表区 - 成绩反馈
          </div>
        </Col>
        <Col span={24}>
          <Card title="成绩与作业统计" size="small" style={{ height: 380 }}>
            <GradeFeedbackChart gradeOverview={gradeOverview} homeworkStats={homeworkStats} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, paddingLeft: 8, borderLeft: '4px solid #52c41a' }}>
            图表区 - 课程章节
          </div>
        </Col>
        <Col span={24}>
          <Card title="各章节教材发放完成率与成绩对比" size="small" style={{ height: 380 }}>
            <CourseChartsChart chapterFunnel={chapterFunnel} chapterGrades={chapterGrades} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, paddingLeft: 8, borderLeft: '4px solid #faad14' }}>
            图表区 - 提醒规则
          </div>
        </Col>
        <Col span={24}>
          <Card title="提醒规则配置（业务人员可维护）" size="small" style={{ height: 320 }}>
            <ReminderRulesChart rules={reminderRules} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
