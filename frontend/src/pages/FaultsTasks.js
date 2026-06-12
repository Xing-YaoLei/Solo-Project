import React, { useState, useEffect } from 'react';
import {
  Layout,
  Row,
  Col,
  Card,
  Table,
  Select,
  Radio,
  DatePicker,
  Drawer,
  Timeline,
  Progress,
  Tag,
  Avatar,
  Statistic,
  Button,
  Space,
  Input,
  Form,
  Divider,
  Descriptions,
  Badge,
  Tooltip,
  Pagination,
  Empty,
  Spin,
  message,
} from 'antd';
import {
  WarningOutlined,
  AlertOutlined,
  BugOutlined,
  CalendarOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  FallOutlined,
  UserOutlined,
  AimOutlined,
  ExclamationCircleOutlined,
  FileSearchOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import axios from 'axios';
import dayjs from 'dayjs';

const { Content } = Layout;
const { RangePicker } = DatePicker;
const { Option } = Select;

// ============================================
// 故障记录与整改任务联动页面
// 左栏35%：故障记录总览
// 右栏65%：整改任务与复查结果联动
// ============================================
const FaultsTasks = () => {
  // ========== 全局状态 ==========
  const [loading, setLoading] = useState(false);

  // ========== 左栏：故障总览状态 ==========
  const [faultOverview, setFaultOverview] = useState(null);
  const [faultList, setFaultList] = useState([]);
  const [faultPagination, setFaultPagination] = useState({ current: 1, pageSize: 8, total: 0 });
  const [faultStatusFilter, setFaultStatusFilter] = useState(null);
  const [selectedFault, setSelectedFault] = useState(null);

  // ========== 右栏：任务联动状态 ==========
  const [stores, setStores] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [taskFilterForm] = Form.useForm();
  const [taskList, setTaskList] = useState([]);
  const [taskPagination, setTaskPagination] = useState({ current: 1, pageSize: 8, total: 0 });
  const [taskStats, setTaskStats] = useState(null);

  // 任务详情抽屉
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskDetail, setTaskDetail] = useState(null);
  const [taskRechecks, setTaskRechecks] = useState([]);

  // ============================================
  // 数据获取：故障总览
  // ============================================
  const fetchFaultOverview = async () => {
    try {
      const res = await axios.get('/api/faults/overview');
      if (res.data?.code === 0) {
        setFaultOverview(res.data.data);
      }
    } catch (err) {
      console.error('获取故障总览失败:', err);
    }
  };

  // ============================================
  // 数据获取：故障列表（分页+状态筛选）
  // ============================================
  const fetchFaultList = async (page = 1, pageSize = 8, status = null) => {
    try {
      setLoading(true);
      const params = { page, page_size: pageSize };
      if (status) params.status = status;
      const res = await axios.get('/api/faults/', { params });
      if (res.data?.code === 0) {
        setFaultList(res.data.data);
        setFaultPagination({
          current: res.data.page,
          pageSize: res.data.page_size,
          total: res.data.total,
        });
      }
    } catch (err) {
      message.error('获取故障列表失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // 数据获取：门店列表
  // ============================================
  const fetchStores = async () => {
    try {
      const res = await axios.get('/api/equipment/stores/');
      if (res.data?.code === 0) {
        setStores(res.data.data);
      }
    } catch (err) {
      console.error('获取门店列表失败:', err);
    }
  };

  // ============================================
  // 数据获取：设备列表（根据门店过滤）
  // ============================================
  const fetchEquipments = async (storeId = null) => {
    try {
      const params = { page_size: 200 };
      if (storeId) params.store_id = storeId;
      const res = await axios.get('/api/equipment/', { params });
      if (res.data?.code === 0) {
        setEquipments(res.data.data);
      }
    } catch (err) {
      console.error('获取设备列表失败:', err);
    }
  };

  // ============================================
  // 数据获取：筛选任务列表
  // ============================================
  const fetchTaskList = async (filters = {}, page = 1, pageSize = 8) => {
    try {
      setLoading(true);
      // 转换日期格式
      const payload = { ...filters, page, page_size: pageSize };
      if (payload.deadline_from) {
        payload.deadline_from = dayjs(payload.deadline_from).toISOString();
      }
      if (payload.deadline_to) {
        payload.deadline_to = dayjs(payload.deadline_to).toISOString();
      }
      const res = await axios.post('/api/tasks/filter', payload);
      if (res.data) {
        const items = res.data.items || [];
        // 分页：前端模拟分页
        const start = (page - 1) * pageSize;
        const paged = items.slice(start, start + pageSize);
        setTaskList(paged);
        setTaskPagination({
          current: page,
          pageSize: pageSize,
          total: res.data.total || 0,
        });
      }
    } catch (err) {
      message.error('获取任务列表失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // 数据获取：任务统计数据
  // ============================================
  const fetchTaskStats = async () => {
    try {
      const res = await axios.get('/api/tasks/stats/workflow');
      if (res.data) {
        setTaskStats(res.data);
      }
    } catch (err) {
      console.error('获取任务统计失败:', err);
    }
  };

  // ============================================
  // 数据获取：任务详情 + 复查历史
  // ============================================
  const fetchTaskDetail = async (taskId) => {
    try {
      const [detailRes, recheckRes] = await Promise.all([
        axios.get(`/api/tasks/${taskId}`),
        axios.get(`/api/tasks/${taskId}/rechecks`),
      ]);
      setTaskDetail(detailRes.data);
      setTaskRechecks(Array.isArray(recheckRes.data) ? recheckRes.data : []);
    } catch (err) {
      message.error('获取任务详情失败');
      console.error(err);
    }
  };

  // ========== 初始化 ==========
  useEffect(() => {
    fetchFaultOverview();
    fetchFaultList(1, 8, null);
    fetchStores();
    fetchEquipments(null);
    fetchTaskList({}, 1, 8);
    fetchTaskStats();
  }, []);

  // ============================================
  // 故障状态筛选
  // ============================================
  const handleFaultStatusChange = (status) => {
    setFaultStatusFilter(status);
    fetchFaultList(1, faultPagination.pageSize, status);
  };

  // ============================================
  // 故障分页变化
  // ============================================
  const handleFaultPageChange = (page, pageSize) => {
    fetchFaultList(page, pageSize, faultStatusFilter);
  };

  // ============================================
  // 点击故障行 - 联动右栏筛选
  // ==================================
  const handleFaultRowClick = (fault) => {
    setSelectedFault(fault);
    // 自动填入故障ID和门店/设备信息
    taskFilterForm.setFieldsValue({
      fault_id: fault.fault_code,
      store_id: fault.store_id,
      equipment_id: fault.equipment_id,
    });
    // 根据门店刷新设备列表
    fetchEquipments(fault.store_id);
    // 触发筛选（按故障ID联动）
    handleTaskSearch({
      store_id: fault.store_id,
      equipment_id: fault.equipment_id,
    });
  };

  // ============================================
  // 门店变化 - 联动设备下拉框
  // ============================================
  const handleStoreChange = (storeId) => {
    fetchEquipments(storeId || null);
  };

  // ============================================
  // 任务查询
  // ============================================
  const handleTaskSearch = (extraFilters = {}) => {
    const values = { ...taskFilterForm.getFieldsValue(), ...extraFilters };
    // 移除空值
    const filters = {};
    Object.keys(values).forEach((k) => {
      if (values[k] !== undefined && values[k] !== null && values[k] !== '') {
        filters[k] = values[k];
      }
    });
    // 移除非API字段（fault_code 输入框仅用于显示，后端用 fault_id 但 filter 接口没有此参数）
    if (filters.fault_id) delete filters.fault_id;
    fetchTaskList(filters, 1, taskPagination.pageSize);
  };

  // ============================================
  // 任务重置
  // ============================================
  const handleTaskReset = () => {
    taskFilterForm.resetFields();
    setSelectedFault(null);
    fetchEquipments(null);
    fetchTaskList({}, 1, taskPagination.pageSize);
  };

  // ============================================
  // 任务分页
  // ============================================
  const handleTaskPageChange = (page, pageSize) => {
    const values = taskFilterForm.getFieldsValue();
    const filters = {};
    Object.keys(values).forEach((k) => {
      if (values[k] !== undefined && values[k] !== null && values[k] !== '') {
        filters[k] = values[k];
      }
    });
    if (filters.fault_id) delete filters.fault_id;
    fetchTaskList(filters, page, pageSize);
  };

  // ============================================
  // 查看任务详情
  // ============================================
  const handleViewTask = async (task) => {
    setSelectedTask(task);
    setDrawerVisible(true);
    await fetchTaskDetail(task.id);
  };

  // ============================================
  // 渲染辅助：严重程度标签
  // ============================================
  const renderSeverityTag = (severity) => {
    const map = {
      critical: { color: 'red', text: '紧急', icon: <ExclamationCircleOutlined /> },
      high: { color: 'orange', text: '高', icon: <AlertOutlined /> },
      medium: { color: 'gold', text: '中', icon: <WarningOutlined /> },
      low: { color: 'blue', text: '低', icon: <BugOutlined /> },
    };
    const cfg = map[severity] || map.medium;
    return <Tag color={cfg.color} icon={cfg.icon}>{cfg.text}</Tag>;
  };

  // ============================================
  // 渲染辅助：故障状态标签
  // ============================================
  const renderFaultStatusTag = (status) => {
    const map = {
      pending: { color: 'red', text: '待处理' },
      processing: { color: 'processing', text: '处理中' },
      resolved: { color: 'green', text: '已解决' },
      closed: { color: 'default', text: '已关闭' },
    };
    const cfg = map[status] || map.pending;
    return <Tag color={cfg.color}>{cfg.text}</Tag>;
  };

  // ============================================
  // 渲染辅助：任务状态标签
  // ============================================
  const renderTaskStatusTag = (status) => {
    const map = {
      pending: { color: 'default', text: '待执行' },
      in_progress: { color: 'processing', text: '进行中' },
      completed: { color: 'success', text: '已完成' },
      failed: { color: 'error', text: '整改失败' },
      closed: { color: 'default', text: '已关闭' },
    };
    const cfg = map[status] || map.pending;
    return <Tag color={cfg.color}>{cfg.text}</Tag>;
  };

  // ============================================
  // 渲染辅助：优先级标签
  // ============================================
  const renderPriorityTag = (priority) => {
    const map = {
      high: { color: 'red', text: '高优先' },
      medium: { color: 'orange', text: '中优先' },
      low: { color: 'blue', text: '低优先' },
    };
    const cfg = map[priority] || map.medium;
    return <Tag color={cfg.color}>{cfg.text}</Tag>;
  };

  // ============================================
  // 渲染辅助：任务类型标签
  // ============================================
  const renderTaskTypeTag = (type) => {
    const colorMap = {
      '深度清洁': 'purple',
      '部件更换': 'cyan',
      '设备校准': 'geekblue',
      '系统维护': 'magenta',
      '紧急维修': 'volcano',
    };
    return <Tag color={colorMap[type] || 'default'}>{type}</Tag>;
  };

  // ============================================
  // 渲染辅助：复查状态标签
  // ============================================
  const renderRecheckTag = (task) => {
    if (!task.has_recheck) {
      return <Tag color="default">未复查</Tag>;
    }
    if (task.recheck_result === 'pass') {
      return <Tag color="success" icon={<CheckCircleOutlined />}>复查通过</Tag>;
    }
    return <Tag color="error" icon={<CloseCircleOutlined />}>复查未过</Tag>;
  };

  // ============================================
  // 计算本月新增故障数
  // ============================================
  const calcMonthNew = () => {
    if (!faultOverview?.trend) return 0;
    const now = dayjs();
    return faultOverview.trend
      .filter((t) => dayjs(t.date).isSame(now, 'month'))
      .reduce((sum, t) => sum + t.total_count, 0);
  };

  // ============================================
  // ECharts：故障类型分布饼图
  // ============================================
  const getTypePieOption = () => {
    const byType = faultOverview?.by_type || {};
    const data = Object.entries(byType).map(([name, value]) => ({ name, value }));
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0, type: 'scroll', textStyle: { fontSize: 11 } },
      color: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452'],
      series: [
        {
          type: 'pie',
          radius: ['35%', '65%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
          label: { show: true, formatter: '{b}\n{d}%', fontSize: 10 },
          data,
        },
      ],
    };
  };

  // ============================================
  // ECharts：近30天故障趋势折线图
  // ============================================
  const getTrendOption = () => {
    const trend = faultOverview?.trend || [];
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 20, top: 30, bottom: 40 },
      xAxis: {
        type: 'category',
        data: trend.map((t) => dayjs(t.date).format('MM/DD')),
        axisLabel: { fontSize: 10, rotate: 45 },
      },
      yAxis: { type: 'value', minInterval: 1 },
      legend: { top: 0, textStyle: { fontSize: 11 } },
      color: ['#ee6666', '#fac858', '#91cc75', '#5470c6'],
      series: [
        {
          name: '总数',
          type: 'line',
          smooth: true,
          data: trend.map((t) => t.total_count),
          areaStyle: { opacity: 0.15 },
          symbol: 'circle',
          symbolSize: 5,
        },
        {
          name: '紧急/高',
          type: 'line',
          smooth: true,
          data: trend.map((t) => (t.by_severity?.critical || 0) + (t.by_severity?.high || 0)),
          symbol: 'circle',
          symbolSize: 4,
        },
      ],
    };
  };

  // ============================================
  // 左栏：故障列表 Columns
  // ============================================
  const faultColumns = [
    {
      title: '编号',
      dataIndex: 'fault_code',
      key: 'fault_code',
      width: 110,
      ellipsis: true,
      render: (v) => <span style={{ fontSize: 11, color: '#1890ff' }}>{v}</span>,
    },
    {
      title: '类型',
      dataIndex: 'fault_type',
      key: 'fault_type',
      width: 90,
      ellipsis: true,
    },
    {
      title: '严重',
      dataIndex: 'severity',
      key: 'severity',
      width: 70,
      render: (v) => renderSeverityTag(v),
    },
    {
      title: '门店',
      dataIndex: 'store_name',
      key: 'store_name',
      width: 90,
      ellipsis: true,
    },
    {
      title: '设备',
      dataIndex: 'equipment_name',
      key: 'equipment_name',
      width: 110,
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 75,
      render: (v) => renderFaultStatusTag(v),
    },
    {
      title: '发生时间',
      dataIndex: 'fault_time',
      key: 'fault_time',
      width: 120,
      ellipsis: true,
      render: (v) => dayjs(v).format('MM-DD HH:mm'),
    },
  ];

  // ============================================
  // 右栏：任务列表 Columns
  // ============================================
  const taskColumns = [
    {
      title: '任务编号',
      dataIndex: 'task_code',
      key: 'task_code',
      width: 120,
      render: (v) => <span style={{ color: '#1890ff', fontSize: 12 }}>{v}</span>,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 180,
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'task_type',
      key: 'task_type',
      width: 90,
      render: (v) => renderTaskTypeTag(v),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (v) => renderPriorityTag(v),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (v) => renderTaskStatusTag(v),
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 120,
      render: (v, record) => (
        <Progress
          percent={v || 0}
          size="small"
          status={record.status === 'failed' ? 'exception' : record.status === 'completed' ? 'success' : 'active'}
        />
      ),
    },
    {
      title: '负责人',
      dataIndex: 'assignee',
      key: 'assignee',
      width: 80,
      render: (v) => (
        <Space size={4}>
          <Avatar size={22} icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} />
          <span>{v || '-'}</span>
        </Space>
      ),
    },
    {
      title: '截止日期',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 110,
      render: (v) => {
        const isOverdue = dayjs().isAfter(dayjs(v)) && !['completed', 'closed'].includes(selectedTask?.status);
        return (
          <span style={{ color: isOverdue ? '#ff4d4f' : undefined }}>
            {dayjs(v).format('YYYY-MM-DD')}
          </span>
        );
      },
    },
    {
      title: '复查',
      key: 'recheck',
      width: 90,
      render: (_, record) => renderRecheckTag(record),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewTask(record)}
        >
          查看
        </Button>
      ),
    },
  ];

  // ============================================
  // 严重程度 Progress 条配置
  // ============================================
  const severityProgressItems = [
    { key: 'critical', label: '紧急', color: '#ff4d4f', icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} /> },
    { key: 'high', label: '高', color: '#fa8c16', icon: <AlertOutlined style={{ color: '#fa8c16' }} /> },
    { key: 'medium', label: '中', color: '#faad14', icon: <WarningOutlined style={{ color: '#faad14' }} /> },
    { key: 'low', label: '低', color: '#1890ff', icon: <BugOutlined style={{ color: '#1890ff' }} /> },
  ];

  // ============================================
  // 计算任务统计：平均整改时长、逾期数
  // ============================================
  const calcTaskDerivedStats = () => {
    const all = taskList || [];
    // 逾期：状态非完成/关闭，且今天晚于截止日期
    const overdue = all.filter((t) => {
      if (['completed', 'closed'].includes(t.status)) return false;
      return dayjs().isAfter(dayjs(t.deadline));
    }).length;
    // 平均整改时长（小时）：取已完成任务的完成时间-创建时间
    const completed = all.filter((t) => t.complete_time && t.created_at);
    const avgHours = completed.length
      ? Math.round(
          completed.reduce((sum, t) => {
            return sum + dayjs(t.complete_time).diff(dayjs(t.created_at), 'hour', true);
          }, 0) / completed.length
        )
      : 0;
    return { overdue, avgHours };
  };

  const derivedStats = calcTaskDerivedStats();

  // ============================================
  // 渲染
  // ============================================
  return (
    <Layout style={{ padding: 0, background: '#f0f2f5', minHeight: '100vh' }}>
      <Spin spinning={loading}>
        <Content style={{ padding: 16 }}>
          <Row gutter={[16, 16]}>
            {/* ================ 左栏：35% 故障总览 ================ */}
            <Col span={9} style={{ flex: '0 0 35%', maxWidth: '35%' }}>
              {/* 顶部标题 */}
              <Card
                size="small"
                style={{ marginBottom: 12 }}
                bodyStyle={{ padding: 12 }}
                title={
                  <Space>
                    <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                    <span style={{ fontWeight: 600 }}>故障记录总览</span>
                  </Space>
                }
              />

              {/* 4个Statistic卡片 */}
              <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
                <Col span={12}>
                  <Card size="small" bodyStyle={{ padding: 12 }}>
                    <Statistic
                      title={<span style={{ fontSize: 12 }}>总故障数</span>}
                      value={faultOverview?.total_count || 0}
                      valueStyle={{ fontSize: 22, color: '#1677ff' }}
                      prefix={<WarningOutlined />}
                    />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" bodyStyle={{ padding: 12 }}>
                    <Statistic
                      title={<span style={{ fontSize: 12 }}>待处理</span>}
                      value={(faultOverview?.pending_count || 0) + (faultOverview?.processing_count || 0)}
                      valueStyle={{ fontSize: 22, color: '#ff4d4f' }}
                      prefix={<ClockCircleOutlined />}
                    />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" bodyStyle={{ padding: 12 }}>
                    <Statistic
                      title={<span style={{ fontSize: 12 }}>清洁相关</span>}
                      value={faultOverview?.cleaning_related_count || 0}
                      suffix={<span style={{ fontSize: 12, color: '#999' }}>件</span>}
                      valueStyle={{ fontSize: 22, color: '#722ed1' }}
                      prefix={<AimOutlined />}
                    />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" bodyStyle={{ padding: 12 }}>
                    <Statistic
                      title={<span style={{ fontSize: 12 }}>本月新增</span>}
                      value={calcMonthNew()}
                      valueStyle={{ fontSize: 22, color: '#52c41a' }}
                      prefix={<CalendarOutlined />}
                    />
                  </Card>
                </Col>
              </Row>

              {/* 故障类型分布饼图 */}
              <Card
                size="small"
                style={{ marginBottom: 12 }}
                title={<span style={{ fontSize: 13, fontWeight: 600 }}>故障类型分布</span>}
              >
                {faultOverview ? (
                  <ReactECharts option={getTypePieOption()} style={{ height: 220 }} />
                ) : (
                  <Empty description="暂无数据" />
                )}
              </Card>

              {/* 严重程度分布 Progress */}
              <Card
                size="small"
                style={{ marginBottom: 12 }}
                title={<span style={{ fontSize: 13, fontWeight: 600 }}>严重程度分布</span>}
                bodyStyle={{ padding: 12 }}
              >
                <Space direction="vertical" style={{ width: '100%' }} size={10}>
                  {severityProgressItems.map((item) => {
                    const count = faultOverview?.by_severity?.[item.key] || 0;
                    const total = faultOverview?.total_count || 1;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={item.key}>
                        <Space style={{ marginBottom: 4, width: '100%', justifyContent: 'space-between' }}>
                          <Space size={4}>
                            {item.icon}
                            <span style={{ fontSize: 12 }}>{item.label}</span>
                          </Space>
                          <span style={{ fontSize: 12, color: '#666' }}>
                            {count}件 ({pct}%)
                          </span>
                        </Space>
                        <Progress
                          percent={pct}
                          showInfo={false}
                          strokeColor={item.color}
                          size="small"
                        />
                      </div>
                    );
                  })}
                </Space>
              </Card>

              {/* 近30天故障趋势 */}
              <Card
                size="small"
                style={{ marginBottom: 12 }}
                title={<span style={{ fontSize: 13, fontWeight: 600 }}>近30天故障趋势</span>}
              >
                {faultOverview ? (
                  <ReactECharts option={getTrendOption()} style={{ height: 200 }} />
                ) : (
                  <Empty description="暂无数据" />
                )}
              </Card>

              {/* 故障列表 */}
              <Card
                size="small"
                title={
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space>
                      <FileSearchOutlined />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>故障记录</span>
                      <span style={{ fontSize: 11, color: '#999' }}>（点击行联动右栏任务）</span>
                    </Space>
                    <Select
                      size="small"
                      placeholder="按状态筛选"
                      allowClear
                      style={{ width: 110 }}
                      value={faultStatusFilter}
                      onChange={handleFaultStatusChange}
                    >
                      <Option value="pending">待处理</Option>
                      <Option value="processing">处理中</Option>
                      <Option value="resolved">已解决</Option>
                      <Option value="closed">已关闭</Option>
                    </Select>
                  </Space>
                }
                bodyStyle={{ padding: 0 }}
              >
                <Table
                  size="small"
                  columns={faultColumns}
                  dataSource={faultList}
                  rowKey="id"
                  pagination={false}
                  scroll={{ x: 700, y: 320 }}
                  onRow={(record) => ({
                    style: {
                      cursor: 'pointer',
                      background: selectedFault?.id === record.id ? '#e6f7ff' : undefined,
                    },
                    onClick: () => handleFaultRowClick(record),
                  })}
                />
                <div style={{ padding: '8px 12px', borderTop: '1px solid #f0f0f0' }}>
                  <Pagination
                    size="small"
                    current={faultPagination.current}
                    pageSize={faultPagination.pageSize}
                    total={faultPagination.total}
                    showSizeChanger={false}
                    onChange={handleFaultPageChange}
                    style={{ justifyContent: 'flex-end', display: 'flex' }}
                  />
                </div>
              </Card>
            </Col>

            {/* ================ 右栏：65% 任务联动 ================ */}
            <Col span={15} style={{ flex: '0 0 65%', maxWidth: '65%' }}>
              {/* 标题 */}
              <Card
                size="small"
                style={{ marginBottom: 12 }}
                bodyStyle={{ padding: 12 }}
                title={
                  <Space>
                    <AimOutlined style={{ color: '#1677ff' }} />
                    <span style={{ fontWeight: 600 }}>整改任务与复查结果联动</span>
                    {selectedFault && (
                      <Tag color="blue" closable onClose={() => { setSelectedFault(null); }}>
                        已关联故障：{selectedFault.fault_code}
                      </Tag>
                    )}
                  </Space>
                }
              />

              {/* 筛选条件 */}
              <Card size="small" style={{ marginBottom: 12 }} bodyStyle={{ padding: 16 }}>
                <Form
                  form={taskFilterForm}
                  layout="vertical"
                  size="small"
                  onFinish={() => handleTaskSearch()}
                >
                  <Row gutter={[12, 0]}>
                    {/* 门店Select */}
                    <Col span={6}>
                      <Form.Item label="门店" name="store_id" style={{ marginBottom: 12 }}>
                        <Select
                          placeholder="请选择门店"
                          allowClear
                          showSearch
                          optionFilterProp="children"
                          onChange={handleStoreChange}
                        >
                          {stores.map((s) => (
                            <Option key={s.id} value={s.id}>
                              {s.store_name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>

                    {/* 设备Select（根据门店自动过滤） */}
                    <Col span={6}>
                      <Form.Item label="设备" name="equipment_id" style={{ marginBottom: 12 }}>
                        <Select
                          placeholder="请选择设备"
                          allowClear
                          showSearch
                          optionFilterProp="children"
                        >
                          {equipments.map((e) => (
                            <Option key={e.id} value={e.id}>
                              {e.equipment_name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>

                    {/* 任务状态Select */}
                    <Col span={6}>
                      <Form.Item label="任务状态" name="status" style={{ marginBottom: 12 }}>
                        <Select placeholder="请选择" allowClear>
                          <Option value="pending">待执行</Option>
                          <Option value="in_progress">进行中</Option>
                          <Option value="completed">已完成</Option>
                          <Option value="failed">整改失败</Option>
                          <Option value="closed">已关闭</Option>
                        </Select>
                      </Form.Item>
                    </Col>

                    {/* 优先级Select */}
                    <Col span={6}>
                      <Form.Item label="优先级" name="priority" style={{ marginBottom: 12 }}>
                        <Select placeholder="请选择" allowClear>
                          <Option value="low">低</Option>
                          <Option value="medium">中</Option>
                          <Option value="high">高</Option>
                        </Select>
                      </Form.Item>
                    </Col>

                    {/* 任务类型Select */}
                    <Col span={6}>
                      <Form.Item label="任务类型" name="task_type" style={{ marginBottom: 12 }}>
                        <Select placeholder="请选择" allowClear>
                          <Option value="深度清洁">深度清洁</Option>
                          <Option value="部件更换">部件更换</Option>
                          <Option value="设备校准">设备校准</Option>
                          <Option value="系统维护">系统维护</Option>
                          <Option value="紧急维修">紧急维修</Option>
                        </Select>
                      </Form.Item>
                    </Col>

                    {/* has_recheck Radio */}
                    <Col span={6}>
                      <Form.Item label="有无复查" name="has_recheck" style={{ marginBottom: 12 }}>
                        <Radio.Group>
                          <Radio value={true}>有复查</Radio>
                          <Radio value={false}>无复查</Radio>
                        </Radio.Group>
                      </Form.Item>
                    </Col>

                    {/* recheck_result Select（联动：完成状态可筛选） */}
                    <Col span={6}>
                      <Form.Item label="复查结果" name="recheck_result" style={{ marginBottom: 12 }}>
                        <Select placeholder="完成任务可筛选" allowClear>
                          <Option value="pass">合格 (Pass)</Option>
                          <Option value="fail">不合格 (Fail)</Option>
                        </Select>
                      </Form.Item>
                    </Col>

                    {/* 故障ID输入框（联动左栏） */}
                    <Col span={6}>
                      <Form.Item label="故障编号" name="fault_id" style={{ marginBottom: 12 }}>
                        <Input
                          prefix={<BugOutlined style={{ color: '#999' }} />}
                          placeholder="点击左栏故障自动填入"
                          readOnly
                          style={{ backgroundColor: '#fafafa' }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={[12, 0]}>
                    {/* 截止日期范围 */}
                    <Col span={12}>
                      <Form.Item label="截止日期范围" name="deadline_range" style={{ marginBottom: 0 }}>
                        <RangePicker
                          style={{ width: '100%' }}
                          onChange={(dates) => {
                            if (dates && dates[0] && dates[1]) {
                              taskFilterForm.setFieldsValue({
                                deadline_from: dates[0],
                                deadline_to: dates[1],
                              });
                            } else {
                              taskFilterForm.setFieldsValue({
                                deadline_from: null,
                                deadline_to: null,
                              });
                            }
                          }}
                        />
                      </Form.Item>
                    </Col>

                    {/* 查询/重置按钮 */}
                    <Col span={12} style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                      <Space>
                        <Button
                          type="primary"
                          htmlType="submit"
                          icon={<SearchOutlined />}
                          size="middle"
                        >
                          查询
                        </Button>
                        <Button
                          icon={<ReloadOutlined />}
                          size="middle"
                          onClick={handleTaskReset}
                        >
                          重置
                        </Button>
                      </Space>
                    </Col>
                  </Row>
                </Form>
              </Card>

              {/* 任务列表Table */}
              <Card
                size="small"
                style={{ marginBottom: 12 }}
                title={
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space>
                      <AimOutlined />
                      <span style={{ fontWeight: 600, fontSize: 13 }}>整改任务列表</span>
                      <Tag color="default">共 {taskPagination.total} 条</Tag>
                    </Space>
                  </Space>
                }
                bodyStyle={{ padding: 0 }}
              >
                <Table
                  size="small"
                  columns={taskColumns}
                  dataSource={taskList}
                  rowKey="id"
                  pagination={false}
                  scroll={{ x: 1200, y: 420 }}
                />
                <div style={{ padding: '8px 12px', borderTop: '1px solid #f0f0f0' }}>
                  <Pagination
                    size="small"
                    current={taskPagination.current}
                    pageSize={taskPagination.pageSize}
                    total={taskPagination.total}
                    showSizeChanger
                    pageSizeOptions={['8', '16', '24', '50']}
                    onChange={handleTaskPageChange}
                    onShowSizeChange={handleTaskPageChange}
                    style={{ justifyContent: 'flex-end', display: 'flex' }}
                  />
                </div>
              </Card>

              {/* 底部统计卡片 */}
              <Row gutter={[12, 0]}>
                <Col span={8}>
                  <Card size="small" bodyStyle={{ padding: 14 }}>
                    <Statistic
                      title={
                        <Space>
                          <CheckCircleOutlined style={{ color: '#52c41a' }} />
                          <span style={{ fontSize: 12 }}>复查通过率</span>
                        </Space>
                      }
                      value={taskStats?.recheck_pass_rate || 0}
                      precision={2}
                      suffix="%"
                      valueStyle={{ fontSize: 24, color: '#52c41a' }}
                    />
                    <div style={{ marginTop: 6, fontSize: 11, color: '#999' }}>
                      {taskStats?.recheck_pass || 0} / {taskStats?.recheck_total || 0} 次
                    </div>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" bodyStyle={{ padding: 14 }}>
                    <Statistic
                      title={
                        <Space>
                          <ClockCircleOutlined style={{ color: '#1677ff' }} />
                          <span style={{ fontSize: 12 }}>平均整改时长</span>
                        </Space>
                      }
                      value={derivedStats.avgHours || faultOverview?.avg_resolve_hours || 0}
                      precision={1}
                      suffix="小时"
                      valueStyle={{ fontSize: 24, color: '#1677ff' }}
                    />
                    <div style={{ marginTop: 6, fontSize: 11, color: '#999' }}>
                      按已完成任务计算
                    </div>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" bodyStyle={{ padding: 14 }}>
                    <Statistic
                      title={
                        <Space>
                          <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                          <span style={{ fontSize: 12 }}>逾期任务数</span>
                        </Space>
                      }
                      value={derivedStats.overdue}
                      valueStyle={{ fontSize: 24, color: '#ff4d4f' }}
                      prefix={<FallOutlined />}
                    />
                    <div style={{ marginTop: 6, fontSize: 11, color: '#999' }}>
                      未完成且超过截止日期
                    </div>
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>
        </Content>

        {/* ================ 任务详情 Drawer ================ */}
        <Drawer
          title={
            <Space>
              <AimOutlined style={{ color: '#1677ff' }} />
              <span style={{ fontWeight: 600 }}>任务详情</span>
              {selectedTask && <Tag>{selectedTask.task_code}</Tag>}
            </Space>
          }
          width={720}
          open={drawerVisible}
          onClose={() => {
            setDrawerVisible(false);
            setSelectedTask(null);
            setTaskDetail(null);
            setTaskRechecks([]);
          }}
          extra={
            <Space>
              {selectedTask && renderTaskStatusTag(selectedTask.status)}
              {selectedTask && renderPriorityTag(selectedTask.priority)}
            </Space>
          }
        >
          {taskDetail && (
            <div>
              {/* 基本信息 */}
              <Card
                size="small"
                title={<span style={{ fontSize: 13, fontWeight: 600 }}>任务基本信息</span>}
                style={{ marginBottom: 16 }}
              >
                <Descriptions column={2} size="small" bordered>
                  <Descriptions.Item label="任务标题" span={2}>
                    <strong>{taskDetail.title}</strong>
                  </Descriptions.Item>
                  <Descriptions.Item label="任务类型">
                    {renderTaskTypeTag(taskDetail.task_type)}
                  </Descriptions.Item>
                  <Descriptions.Item label="优先级">
                    {renderPriorityTag(taskDetail.priority)}
                  </Descriptions.Item>
                  <Descriptions.Item label="负责人">
                    <Space>
                      <Avatar size={22} icon={<UserOutlined />} />
                      {taskDetail.assignee || '-'}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="当前进度">
                    <Progress
                      percent={taskDetail.progress || 0}
                      size="small"
                      status={
                        taskDetail.status === 'failed'
                          ? 'exception'
                          : taskDetail.status === 'completed'
                          ? 'success'
                          : 'active'
                      }
                    />
                  </Descriptions.Item>
                  <Descriptions.Item label="截止日期">
                    {dayjs(taskDetail.deadline).format('YYYY-MM-DD HH:mm')}
                  </Descriptions.Item>
                  <Descriptions.Item label="创建时间">
                    {taskDetail.created_at ? dayjs(taskDetail.created_at).format('YYYY-MM-DD HH:mm') : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="任务要求" span={2}>
                    <div style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                      {taskDetail.requirement || taskDetail.description || '暂无详细要求'}
                    </div>
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              {/* 关联故障信息卡片 */}
              <Card
                size="small"
                title={
                  <Space>
                    <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>关联故障信息</span>
                  </Space>
                }
                style={{ marginBottom: 16 }}
              >
                {selectedFault ? (
                  <Descriptions column={2} size="small" bordered>
                    <Descriptions.Item label="故障编号">
                      <span style={{ color: '#1677ff' }}>{selectedFault.fault_code}</span>
                    </Descriptions.Item>
                    <Descriptions.Item label="严重程度">
                      {renderSeverityTag(selectedFault.severity)}
                    </Descriptions.Item>
                    <Descriptions.Item label="故障类型" span={2}>
                      {selectedFault.fault_type}
                      {selectedFault.is_cleaning_related && <Tag color="purple">清洁相关</Tag>}
                    </Descriptions.Item>
                    <Descriptions.Item label="门店" span={1}>
                      {selectedFault.store_name}
                    </Descriptions.Item>
                    <Descriptions.Item label="设备" span={1}>
                      {selectedFault.equipment_name}
                    </Descriptions.Item>
                    <Descriptions.Item label="发生时间" span={1}>
                      {dayjs(selectedFault.fault_time).format('YYYY-MM-DD HH:mm')}
                    </Descriptions.Item>
                    <Descriptions.Item label="状态" span={1}>
                      {renderFaultStatusTag(selectedFault.status)}
                    </Descriptions.Item>
                    <Descriptions.Item label="故障描述" span={2}>
                      <div style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                        {selectedFault.description || '暂无描述'}
                      </div>
                    </Descriptions.Item>
                  </Descriptions>
                ) : (
                  <Empty description="此任务未关联故障记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
              </Card>

              {/* 复查结果时间线 */}
              <Card
                size="small"
                title={
                  <Space>
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>复查结果时间线</span>
                    <Tag color="default">{taskRechecks.length} 条复查记录</Tag>
                  </Space>
                }
              >
                {taskRechecks.length > 0 ? (
                  <Timeline
                    mode="left"
                    items={taskRechecks
                      .sort((a, b) => dayjs(b.recheck_time) - dayjs(a.recheck_time))
                      .map((r, idx) => ({
                        color: r.result === 'pass' ? 'green' : 'red',
                        dot: r.result === 'pass' ? <CheckCircleOutlined /> : <CloseCircleOutlined />,
                        label: (
                          <div style={{ fontSize: 12 }}>
                            <div style={{ fontWeight: 600 }}>
                              {dayjs(r.recheck_time).format('YYYY-MM-DD HH:mm')}
                            </div>
                            <div style={{ color: '#999' }}>
                              复查人：{r.rechecker || '系统'}
                            </div>
                          </div>
                        ),
                        children: (
                          <Card
                            size="small"
                            style={{ marginBottom: idx < taskRechecks.length - 1 ? 12 : 0 }}
                            styles={{ body: { padding: 12 } }}
                            type="inner"
                            title={
                              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                <Space>
                                  {r.result === 'pass' ? (
                                    <Tag color="success" icon={<CheckCircleOutlined />}>复查合格</Tag>
                                  ) : (
                                    <Tag color="error" icon={<CloseCircleOutlined />}>复查不合格</Tag>
                                  )}
                                  <Badge
                                    count={`得分 ${r.score ?? '-'}`}
                                    style={{
                                      backgroundColor: r.score >= 80 ? '#52c41a' : '#faad14',
                                      fontSize: 11,
                                    }}
                                    showZero
                                  />
                                  {r.next_recheck_time && (
                                    <span style={{ fontSize: 11, color: '#999' }}>
                                      <ClockCircleOutlined /> 下次复查：
                                      {dayjs(r.next_recheck_time).format('YYYY-MM-DD')}
                                    </span>
                                  )}
                                </Space>
                              </Space>
                            }
                          >
                            {/* 复查项明细 */}
                            {r.items && r.items.length > 0 && (
                              <>
                                <Divider orientation="left" style={{ margin: '0 0 8px 0', fontSize: 12 }}>
                                  复查项明细
                                </Divider>
                                <Space direction="vertical" style={{ width: '100%' }} size={6}>
                                  {r.items.map((it, i) => (
                                    <div
                                      key={i}
                                      style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        padding: '4px 8px',
                                        background: it.result === 'pass' ? '#f6ffed' : '#fff2f0',
                                        borderRadius: 4,
                                        fontSize: 12,
                                      }}
                                    >
                                      <Space>
                                        {it.result === 'pass' ? (
                                          <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                        ) : (
                                          <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                                        )}
                                        <span>{it.name}</span>
                                      </Space>
                                      <span style={{ color: '#666' }}>{it.score ?? '-'}</span>
                                    </div>
                                  ))}
                                </Space>
                              </>
                            )}

                            {/* 发现的问题 */}
                            {r.issues_found && r.issues_found.length > 0 && (
                              <>
                                <Divider orientation="left" style={{ margin: '8px 0', fontSize: 12 }}>
                                  <span style={{ color: '#ff4d4f' }}>发现的问题</span>
                                </Divider>
                                <Space direction="vertical" style={{ width: '100%' }} size={4}>
                                  {r.issues_found.map((issue, i) => (
                                    <div
                                      key={i}
                                      style={{
                                        padding: '6px 10px',
                                        background: '#fff2f0',
                                        borderLeft: '3px solid #ff4d4f',
                                        fontSize: 12,
                                        lineHeight: 1.6,
                                      }}
                                    >
                                      <strong style={{ color: '#ff4d4f' }}>
                                        [{issue.level || '问题'}]
                                      </strong>{' '}
                                      {issue.name || issue.description || issue}
                                    </div>
                                  ))}
                                </Space>
                              </>
                            )}

                            {/* 结论 */}
                            {(r.conclusion || r.description) && (
                              <>
                                <Divider orientation="left" style={{ margin: '8px 0', fontSize: 12 }}>
                                  复查结论
                                </Divider>
                                <p style={{ fontSize: 12, lineHeight: 1.8, margin: 0, color: '#333' }}>
                                  {r.conclusion || r.description}
                                </p>
                              </>
                            )}
                          </Card>
                        ),
                      }))}
                  />
                ) : (
                  <Empty
                    description="暂无复查记录，请等待任务完成后进行复查"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </Card>
            </div>
          )}
        </Drawer>
      </Spin>
    </Layout>
  );
};

export default FaultsTasks;
