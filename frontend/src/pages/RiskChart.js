// -*- coding: utf-8 -*-
/**
 * 设备清洁风险监测图 RiskChart
 * 功能：
 * - 顶部筛选栏：门店、设备（多选）、日期范围、查询/重置
 * - 主图表：双Y轴组合图（平均风险分折线、高风险数柱状、离线时长area、阈值markLine、异常散点、延迟标注）
 * - 下方Tab：异常点明细、延迟同步标注、设备状态解释
 * - 异常点点击弹窗：离线缺口回溯详情
 */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Row,
  Col,
  Card,
  Form,
  Select,
  DatePicker,
  Button,
  Space,
  Table,
  Tag,
  Modal,
  Tabs,
  Spin,
  message,
  Typography,
  Descriptions,
  Tooltip,
  Badge,
  Divider,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  LinkOutlined,
  LeftOutlined,
  DashboardOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  ApiOutlined,
  DatabaseOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  getStores,
  getEquipments,
  getCleanRiskTimeseries,
  getOfflineGapSamples,
} from '../services/api';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const RiskChart = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const chartRef = useRef(null);
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [gapModalVisible, setGapModalVisible] = useState(false);
  const [gapLoading, setGapLoading] = useState(false);
  const [gapDetail, setGapDetail] = useState(null);
  const [currentAnomaly, setCurrentAnomaly] = useState(null);

  // 筛选选项数据
  const [stores, setStores] = useState([]);
  const [equipments, setEquipments] = useState([]);

  // 图表数据
  const [timeseries, setTimeseries] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [syncDelays, setSyncDelays] = useState([]);

  // 当前选中的Tab
  const [activeTab, setActiveTab] = useState('anomalies');

  // 初始化：加载门店列表 + 默认日期范围
  useEffect(() => {
    const init = async () => {
      try {
        const storeRes = await getStores();
        if (storeRes.code === 0) {
          setStores(storeRes.data || []);
        }

        // 默认日期范围：近30天
        const end = dayjs('2026-06-14');
        const start = end.subtract(29, 'day');
        form.setFieldsValue({
          date_range: [start, end],
        });

        // 如果从Dashboard跳转过来带了设备参数
        const state = location.state;
        if (state?.equipment_ids && state.equipment_ids.length > 0) {
          form.setFieldsValue({ equipment_ids: state.equipment_ids });
        }

        // 初始加载一次
        await loadEquipmentsAndSearch(null, start, end, state?.equipment_ids || []);
      } catch (err) {
        message.error('初始化失败');
      }
    };
    init();
  }, []);

  // 门店变化时加载设备列表
  const onStoreChange = async (storeId) => {
    const eqRes = await getEquipments(storeId || null);
    if (eqRes.code === 0) {
      setEquipments(eqRes.data || []);
    }
  };

  // 加载设备并查询
  const loadEquipmentsAndSearch = async (storeId, start, end, eqIds) => {
    const eqRes = await getEquipments(storeId || null);
    if (eqRes.code === 0) {
      setEquipments(eqRes.data || []);
    }
    await doSearch(storeId, start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD'), eqIds);
  };

  // 执行查询
  const doSearch = async (storeId, startDate, endDate, equipmentIds) => {
    setLoading(true);
    try {
      const res = await getCleanRiskTimeseries({
        start_date: startDate,
        end_date: endDate,
        store_id: storeId,
        equipment_ids: equipmentIds,
      });
      if (res.code === 0) {
        const d = res.data || {};
        setTimeseries(d.timeseries || []);
        setAnomalies(d.anomalies || []);
        setSyncDelays(d.sync_delays || []);
      } else {
        message.error(res.message || '查询失败');
      }
    } catch (err) {
      message.error('查询失败：' + (err.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 表单提交查询
  const handleSearch = () => {
    form.validateFields().then(async (values) => {
      const [start, end] = values.date_range || [];
      await doSearch(
        values.store_id,
        start?.format('YYYY-MM-DD'),
        end?.format('YYYY-MM-DD'),
        values.equipment_ids || []
      );
    });
  };

  // 重置筛选
  const handleReset = () => {
    const end = dayjs('2026-06-14');
    const start = end.subtract(29, 'day');
    form.resetFields();
    form.setFieldsValue({
      date_range: [start, end],
    });
    setEquipments([]);
    handleSearch();
  };

  // 构建图表配置
  const chartOption = useMemo(() => {
    const xData = timeseries.map((t) => t.record_date);

    // 异常点散点数据（按日期位置，Y值取风险分）
    const dateIdxMap = {};
    xData.forEach((d, i) => {
      dateIdxMap[d] = i;
    });

    const anomalyScatterData = anomalies
      .filter((a) => dateIdxMap[a.record_date] !== undefined)
      .map((a) => ({
        name: a.equipment_code,
        value: [dateIdxMap[a.record_date], a.risk_score],
        raw: a,
        itemStyle: {
          color: a.anomaly_type === 'offline_gap' ? '#722ed1' : '#ff4d4f',
          borderColor: '#fff',
          borderWidth: 2,
        },
      }));

    // 延迟同步markArea
    const markAreaData = [];
    syncDelays.forEach((sd) => {
      if (dateIdxMap[sd.affect_date] !== undefined) {
        const idx = dateIdxMap[sd.affect_date];
        markAreaData.push([
          {
            xAxis: idx - 0.4,
            itemStyle: { color: 'rgba(250, 173, 20, 0.15)' },
          },
          {
            xAxis: idx + 0.4,
          },
        ]);
      }
    });

    // 延迟同步markPoint
    const markPointData = syncDelays
      .filter((sd) => dateIdxMap[sd.affect_date] !== undefined)
      .map((sd) => ({
        name: `${sd.data_type}延迟`,
        coord: [dateIdxMap[sd.affect_date], 98],
        value: `${sd.delay_minutes}min`,
        symbol: 'triangle',
        symbolSize: 16,
        itemStyle: { color: '#fa8c16' },
        label: {
          show: true,
          position: 'top',
          formatter: `${sd.delay_minutes}分`,
          fontSize: 10,
          color: '#d46b08',
        },
        tooltip: {
          formatter: () => `
            <div style="font-weight:600;color:#d46b08;margin-bottom:4px">
              <ApiOutlined /> 数据延迟同步
            </div>
            <div>数据类型：<b>${sd.data_type}</b></div>
            <div>来源：${sd.source}</div>
            <div>延迟：<b style="color:#ff4d4f">${sd.delay_minutes} 分钟</b></div>
            <div>影响日期：${sd.affect_date}</div>
            <div style="color:#666;margin-top:4px">${sd.description}</div>
          `,
        },
      }));

    return {
      title: {
        text: '设备清洁风险监测',
        subtext: '包含平均风险分趋势、高风险设备数、离线时长，异常点以散点标注',
        left: 'left',
        top: 10,
        textStyle: { fontSize: 16, fontWeight: 600 },
        subtextStyle: { fontSize: 12, color: '#999' },
      },
      legend: {
        top: 10,
        right: 10,
        data: ['平均风险分', '高风险设备数', '离线时长(分钟)', '异常点'],
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        formatter: (params) => {
          if (!params || params.length === 0) return '';
          const axisVal = params[0].axisValue;
          const row = timeseries.find((t) => t.record_date === axisVal);
          const dateAnomalies = anomalies.filter((a) => a.record_date === axisVal);
          const dateSyncDelays = syncDelays.filter((sd) => sd.affect_date === axisVal);

          let html = `<div style="font-weight:600;margin-bottom:8px;font-size:13px">${axisVal}</div>`;

          params.forEach((p) => {
            if (p.seriesType === 'scatter') return;
            let color = p.color;
            let val = p.value;
            if (Array.isArray(val)) val = val[1];
            html += `<div style="margin:3px 0">
              <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:6px"></span>
              ${p.seriesName}：<b>${val != null ? val : '-'}</b>${p.seriesName.includes('风险分') ? ' 分' : p.seriesName.includes('分钟') ? ' 分钟' : ' 台'}
            </div>`;
          });

          if (row) {
            html += `<div style="border-top:1px dashed #eee;margin-top:6px;padding-top:6px;font-size:12px;color:#666">
              <div>设备总数：${row.total_equipment} 台</div>
              <div>中风险设备：${row.medium_risk_count} 台 &nbsp; 低风险：${row.low_risk_count} 台</div>
              <div>当日故障：${row.fault_count} 单</div>
            </div>`;
          }

          if (dateAnomalies.length > 0) {
            html += `<div style="border-top:1px dashed #eee;margin-top:6px;padding-top:6px">
              <div style="color:#ff4d4f;font-weight:600;margin-bottom:3px">
                <ExclamationCircleOutlined /> 异常点（${dateAnomalies.length}个）
              </div>`;
            dateAnomalies.slice(0, 3).forEach((a) => {
              html += `<div style="font-size:11px;margin:2px 0">
                <code style="color:#1677ff">${a.equipment_code}</code>
                <span style="color:#999">[${a.anomaly_type_label}]</span>
                风险分<b style="color:#ff4d4f">${a.risk_score}</b>
                <div style="color:#888;margin-left:2px">${a.anomaly_reason || ''}</div>
              </div>`;
            });
            if (dateAnomalies.length > 3) {
              html += `<div style="color:#999;font-size:11px">...还有 ${dateAnomalies.length - 3} 个</div>`;
            }
            html += `</div>`;
          }

          if (dateSyncDelays.length > 0) {
            html += `<div style="border-top:1px dashed #eee;margin-top:6px;padding-top:6px">
              <div style="color:#d46b08;font-weight:600;margin-bottom:3px">
                <DatabaseOutlined /> 延迟同步标注
              </div>`;
            dateSyncDelays.forEach((sd) => {
              html += `<div style="font-size:11px;margin:2px 0">
                ${sd.data_type} - ${sd.source}：<b style="color:#fa8c16">${sd.delay_minutes}分钟</b>
              </div>`;
            });
            html += `</div>`;
          }

          return html;
        },
      },
      grid: {
        left: 60,
        right: 70,
        top: 80,
        bottom: 80,
      },
      dataZoom: [
        { type: 'inside', start: 0, end: 100 },
        { type: 'slider', start: 0, end: 100, height: 20, bottom: 10 },
      ],
      xAxis: [
        {
          type: 'category',
          boundaryGap: true,
          data: xData,
          axisLine: { lineStyle: { color: '#ddd' } },
          axisLabel: {
            color: '#666',
            rotate: 30,
            fontSize: 11,
          },
        },
      ],
      yAxis: [
        {
          type: 'value',
          name: '清洁风险分数',
          min: 0,
          max: 100,
          interval: 20,
          nameTextStyle: { color: '#1677ff', fontSize: 12 },
          axisLabel: { formatter: '{value}', color: '#666' },
          splitLine: { lineStyle: { color: '#f0f0f0' } },
        },
        {
          type: 'value',
          name: '离线时长(分钟)',
          min: 0,
          nameTextStyle: { color: '#13c2c2', fontSize: 12 },
          axisLabel: { formatter: '{value}', color: '#666' },
          splitLine: { show: false },
        },
      ],
      series: [
        // 系列1：平均风险分折线
        {
          name: '平均风险分',
          type: 'line',
          yAxisIndex: 0,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 3, color: '#1677ff' },
          itemStyle: { color: '#1677ff', borderWidth: 2, borderColor: '#fff' },
          markLine: {
            silent: false,
            symbol: 'none',
            label: {
              formatter: '{b}',
              position: 'end',
              fontSize: 11,
            },
            lineStyle: { type: 'dashed', width: 2 },
            data: [
              {
                yAxis: 70,
                name: '高风险阈值 70',
                label: { color: '#ff4d4f' },
                lineStyle: { color: '#ff4d4f' },
              },
              {
                yAxis: 50,
                name: '中风险阈值 50',
                label: { color: '#fa8c16' },
                lineStyle: { color: '#fa8c16' },
              },
            ],
          },
          markArea: {
            silent: true,
            data: markAreaData,
          },
          markPoint: {
            symbol: 'pin',
            data: markPointData,
          },
          data: timeseries.map((t) => t.avg_risk_score),
        },
        // 系列2：高风险设备数柱状图
        {
          name: '高风险设备数',
          type: 'bar',
          yAxisIndex: 0,
          barWidth: 12,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#ff7875' },
              { offset: 1, color: '#ffa39e' },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
          data: timeseries.map((t) => t.high_risk_count),
        },
        // 系列3：离线时长area折线
        {
          name: '离线时长(分钟)',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 2, color: '#13c2c2' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(19, 194, 194, 0.35)' },
                { offset: 1, color: 'rgba(19, 194, 194, 0.02)' },
              ],
            },
          },
          data: timeseries.map((t) => t.offline_minutes),
        },
        // 系列4：异常点散点
        {
          name: '异常点',
          type: 'scatter',
          yAxisIndex: 0,
          symbolSize: 14,
          zlevel: 10,
          data: anomalyScatterData,
          tooltip: {
            trigger: 'item',
            formatter: (p) => {
              const a = p.data?.raw;
              if (!a) return '';
              return `
                <div style="min-width:240px">
                  <div style="font-weight:600;margin-bottom:6px;font-size:13px">
                    <ExclamationCircleOutlined style="color:#ff4d4f" /> 异常点详情
                  </div>
                  <div>设备：<code style="color:#1677ff">${a.equipment_code}</code> (${a.equipment_type})</div>
                  <div>门店：${a.store_name}</div>
                  <div>日期：${a.record_date}</div>
                  <div>风险分：<b style="color:#ff4d4f;font-size:14px">${a.risk_score}</b></div>
                  <div>异常类型：<Tag color="red">${a.anomaly_type_label}</Tag></div>
                  <div>设备状态：${a.status === 'online' ? '🟢 在线' : a.status === 'warning' ? '🟡 告警' : '🔴 离线'}</div>
                  <div>离线时长：${a.offline_minutes} 分钟</div>
                  <div>巡检分：${a.inspection_score}</div>
                  <div style="color:#666;margin-top:4px;border-top:1px dashed #eee;padding-top:4px">
                    ${a.anomaly_reason || ''}
                  </div>
                  <div style="color:#999;font-size:11px;margin-top:3px">
                    <LinkOutlined /> 样本Ref：${a.sample_ref}
                  </div>
                  <div style="color:#1677ff;font-size:11px;margin-top:4px;text-align:center">
                    💡 点击查看离线缺口回溯详情
                  </div>
                </div>
              `;
            },
          },
        },
      ],
    };
  }, [timeseries, anomalies, syncDelays]);

  // 图表点击事件：异常点点击
  const onChartEvents = useMemo(() => ({
    click: (params) => {
      if (params.seriesName === '异常点' && params.data?.raw) {
        const a = params.data.raw;
        setCurrentAnomaly(a);
        openGapDetailModal(a);
      }
    },
  }), []);

  // 打开离线缺口详情弹窗
  const openGapDetailModal = async (anomaly) => {
    setGapModalVisible(true);
    setGapLoading(true);
    try {
      const start = `${anomaly.record_date} 00:00:00`;
      const end = `${anomaly.record_date} 23:59:59`;
      const res = await getOfflineGapSamples(anomaly.equipment_id, start, end);
      if (res.code === 0) {
        setGapDetail(res.data);
      } else {
        message.error(res.message || '获取详情失败');
      }
    } catch (err) {
      message.error('获取详情失败');
    } finally {
      setGapLoading(false);
    }
  };

  // 异常类型渲染
  const renderAnomalyType = (type, label) => {
    const colorMap = {
      high_risk: 'red',
      offline_gap: 'purple',
      inspection_fail: 'orange',
      fault_trigger: 'volcano',
    };
    return <Tag color={colorMap[type] || 'default'}>{label || type}</Tag>;
  };

  // 异常点明细表格列
  const anomalyColumns = [
    {
      title: '设备编码',
      dataIndex: 'equipment_code',
      key: 'equipment_code',
      width: 130,
      fixed: 'left',
      render: (t) => <code style={{ color: '#1677ff' }}>{t}</code>,
    },
    {
      title: '门店',
      dataIndex: 'store_name',
      key: 'store_name',
      width: 130,
      ellipsis: true,
    },
    {
      title: '日期',
      dataIndex: 'record_date',
      key: 'record_date',
      width: 110,
      sorter: (a, b) => a.record_date.localeCompare(b.record_date),
    },
    {
      title: '风险分',
      dataIndex: 'risk_score',
      key: 'risk_score',
      width: 90,
      sorter: (a, b) => a.risk_score - b.risk_score,
      render: (v) => (
        <span style={{ color: v >= 70 ? '#ff4d4f' : v >= 50 ? '#fa8c16' : '#52c41a', fontWeight: 600 }}>
          {v}
        </span>
      ),
    },
    {
      title: '异常类型',
      dataIndex: 'anomaly_type',
      key: 'anomaly_type',
      width: 100,
      render: (v, r) => renderAnomalyType(v, r.anomaly_type_label),
    },
    {
      title: '异常原因',
      dataIndex: 'anomaly_reason',
      key: 'anomaly_reason',
      width: 220,
      ellipsis: true,
      render: (t) => <Tooltip title={t}>{t}</Tooltip>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (s) => (
        <Badge
          status={s === 'online' ? 'success' : s === 'warning' ? 'warning' : 'error'}
          text={s === 'online' ? '在线' : s === 'warning' ? '告警' : '离线'}
        />
      ),
    },
    {
      title: '离线(分钟)',
      dataIndex: 'offline_minutes',
      key: 'offline_minutes',
      width: 100,
      sorter: (a, b) => a.offline_minutes - b.offline_minutes,
      render: (v) => v > 0 ? <span style={{ color: '#722ed1' }}>{v}</span> : '-',
    },
    {
      title: '巡检分',
      dataIndex: 'inspection_score',
      key: 'inspection_score',
      width: 90,
      render: (v) => (
        <span style={{ color: v < 70 ? '#ff4d4f' : undefined }}>{v}</span>
      ),
    },
    {
      title: '关联样本Ref',
      dataIndex: 'sample_ref',
      key: 'sample_ref',
      width: 180,
      render: (t, r) => (
        <Button
          type="link"
          size="small"
          icon={<LinkOutlined />}
          onClick={() => {
            setCurrentAnomaly(r);
            openGapDetailModal(r);
          }}
        >
          {t?.slice(0, 25)}...
        </Button>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, r) => (
        <Button
          type="primary"
          size="small"
          ghost
          icon={<EyeOutlined />}
          onClick={() => {
            setCurrentAnomaly(r);
            openGapDetailModal(r);
          }}
        >
          回溯
        </Button>
      ),
    },
  ];

  // 延迟同步表格列
  const syncDelayColumns = [
    { title: '数据类型', dataIndex: 'data_type', key: 'data_type', width: 110 },
    { title: '来源', dataIndex: 'source', key: 'source', width: 120 },
    {
      title: '延迟(分钟)',
      dataIndex: 'delay_minutes',
      key: 'delay_minutes',
      width: 110,
      sorter: (a, b) => a.delay_minutes - b.delay_minutes,
      render: (v) => (
        <Tag color={v > 120 ? 'red' : v > 60 ? 'orange' : 'blue'} icon={<ClockCircleOutlined />}>
          {v} 分钟
        </Tag>
      ),
    },
    { title: '影响日期', dataIndex: 'affect_date', key: 'affect_date', width: 120 },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (t) => <Tooltip title={t}>{t}</Tooltip>,
    },
  ];

  // 设备状态上下文（Tab3）
  const deviceContextColumns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 170,
    },
    {
      title: '阶段',
      dataIndex: 'phase',
      key: 'phase',
      width: 90,
      render: (p) => {
        const color = p === '缺口前' ? 'blue' : p === '缺口期间' ? 'red' : 'green';
        return <Tag color={color}>{p}</Tag>;
      },
    },
    {
      title: '设备状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s) => (
        <Badge
          status={s === 'online' ? 'success' : 'error'}
          text={s === 'online' ? '在线' : '离线'}
        />
      ),
    },
    {
      title: '风险分',
      dataIndex: 'risk_score',
      key: 'risk_score',
      width: 90,
      render: (v) => v == null ? <span style={{ color: '#999' }}>-</span> : v,
    },
    {
      title: '冲煮次数',
      key: 'brew_count',
      width: 100,
      render: (_, r) => r.sensor_data?.brew_count ?? '-',
    },
    {
      title: '蒸汽使用(秒)',
      key: 'steam',
      width: 110,
      render: (_, r) => r.sensor_data?.steam_use_time ?? '-',
    },
    {
      title: '最近清洁日期',
      key: 'clean_time',
      width: 130,
      render: (_, r) => r.sensor_data?.last_clean_time ?? '-',
    },
    { title: '备注', dataIndex: 'remark', key: 'remark' },
  ];

  return (
    <div style={{ padding: 24, background: '#f5f7fa', minHeight: '100vh' }}>
      {/* 顶部标题栏 */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Space>
            <Button
              icon={<LeftOutlined />}
              onClick={() => navigate('/')}
            >
              返回仪表盘
            </Button>
            <Title level={3} style={{ margin: 0 }}>
              <RiseOutlined style={{ color: '#1677ff', marginRight: 8 }} />
              设备清洁风险监测图
            </Title>
          </Space>
        </Col>
        <Col>
          <Space>
            <Tag icon={<InfoCircleOutlined />} color="blue">
              双Y轴组合图 · 异常散点可点击
            </Tag>
          </Space>
        </Col>
      </Row>

      {/* 筛选栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="inline"
          onFinish={handleSearch}
          style={{ flexWrap: 'wrap', rowGap: 12 }}
        >
          <Form.Item name="store_id" label="门店">
            <Select
              style={{ width: 180 }}
              placeholder="选择门店"
              allowClear
              onChange={onStoreChange}
              showSearch
              optionFilterProp="children"
            >
              {stores.map((s) => (
                <Option key={s.id} value={s.id}>
                  {s.store_name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="equipment_ids" label="设备">
            <Select
              style={{ width: 260 }}
              placeholder="选择设备（可多选）"
              mode="multiple"
              allowClear
              showSearch
              optionFilterProp="children"
              maxTagCount="responsive"
            >
              {equipments.map((e) => (
                <Option key={e.id} value={e.id}>
                  [{e.equipment_code}] {e.equipment_type}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="date_range"
            label="日期范围"
            rules={[{ required: true, message: '请选择日期范围' }]}
          >
            <RangePicker style={{ width: 280 }} allowClear={false} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SearchOutlined />}
                loading={loading}
              >
                查询
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleReset}
              >
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Spin spinning={loading} tip="数据加载中...">
        {/* 主图表 */}
        <Card style={{ marginBottom: 16 }}>
          <ReactECharts
            ref={chartRef}
            option={chartOption}
            style={{ height: 500 }}
            opts={{ renderer: 'canvas' }}
            onEvents={onChartEvents}
            notMerge={true}
          />
          <div style={{ marginTop: 12, padding: '10px 16px', background: '#fafafa', borderRadius: 6, fontSize: 12, color: '#666' }}>
            <Space wrap>
              <span><Badge status="error" /> 红色虚线：高风险阈值(70分)</span>
              <span><Badge status="warning" /> 橙色虚线：中风险阈值(50分)</span>
              <span><Badge color="#fa8c16" text="▲" /> 橙色三角：数据延迟同步标注</span>
              <span><Badge color="#ff4d4f" text="●" /> 散点：异常点（点击查看回溯详情）</span>
            </Space>
          </div>
        </Card>

        {/* Tab明细区域 */}
        <Card
          tabList={[
            {
              key: 'anomalies',
              tab: (
                <span>
                  <WarningOutlined style={{ color: '#ff4d4f' }} /> 异常点明细
                  <Badge
                    count={anomalies.length}
                    style={{ marginLeft: 6, backgroundColor: '#ff4d4f' }}
                  />
                </span>
              ),
            },
            {
              key: 'sync-delays',
              tab: (
                <span>
                  <ClockCircleOutlined style={{ color: '#fa8c16' }} /> 延迟同步标注
                  <Badge
                    count={syncDelays.length}
                    style={{ marginLeft: 6, backgroundColor: '#fa8c16' }}
                  />
                </span>
              ),
            },
            {
              key: 'device-context',
              tab: (
                <span>
                  <DashboardOutlined style={{ color: '#722ed1' }} /> 设备状态解释
                </span>
              ),
            },
          ]}
          activeTabKey={activeTab}
          onTabChange={setActiveTab}
        >
          {activeTab === 'anomalies' && (
            <div>
              {anomalies.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                  <InfoCircleOutlined style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }} />
                  <div>暂无异常点数据</div>
                </div>
              ) : (
                <Table
                  rowKey="id"
                  columns={anomalyColumns}
                  dataSource={anomalies}
                  size="small"
                  scroll={{ x: 1300 }}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `共 ${total} 条异常记录`,
                  }}
                />
              )}
            </div>
          )}

          {activeTab === 'sync-delays' && (
            <div>
              {syncDelays.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                  <ApiOutlined style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }} />
                  <div>暂无延迟同步数据</div>
                </div>
              ) : (
                <Table
                  rowKey="id"
                  columns={syncDelayColumns}
                  dataSource={syncDelays}
                  size="small"
                  scroll={{ x: 600 }}
                  pagination={{ pageSize: 10 }}
                />
              )}
            </div>
          )}

          {activeTab === 'device-context' && (
            <div>
              {!currentAnomaly ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                  <DashboardOutlined style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }} />
                  <div>请先在"异常点明细"点击"回溯"按钮，或直接点击图表上的异常散点</div>
                  <div style={{ fontSize: 12, marginTop: 8, color: '#bbb' }}>
                    系统将展示该设备异常点前后5条记录的状态上下文
                  </div>
                </div>
              ) : gapLoading ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <Spin tip="正在回溯设备状态..." />
                </div>
              ) : gapDetail ? (
                <div>
                  <Descriptions
                    title={
                      <Space>
                        <InfoCircleOutlined style={{ color: '#722ed1' }} />
                        设备：<code>{gapDetail.equipment?.equipment_code}</code> 状态上下文
                      </Space>
                    }
                    bordered
                    column={2}
                    size="small"
                    style={{ marginBottom: 16 }}
                  >
                    <Descriptions.Item label="设备型号">{gapDetail.equipment?.equipment_name}</Descriptions.Item>
                    <Descriptions.Item label="所属门店">{gapDetail.equipment?.store_name}</Descriptions.Item>
                    <Descriptions.Item label="缺口起始">{gapDetail.gap_start}</Descriptions.Item>
                    <Descriptions.Item label="缺口结束">{gapDetail.gap_end}</Descriptions.Item>
                    <Descriptions.Item label="持续时长">
                      <Tag color="purple">{gapDetail.gap_duration_minutes} 分钟</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="推断原因">
                      <Text type="warning">{gapDetail.analysis?.cause_deduction}</Text>
                    </Descriptions.Item>
                  </Descriptions>

                  <Title level={5} style={{ marginTop: 0 }}>
                    前后5条记录（缺口上下文对比）
                  </Title>
                  <Table
                    rowKey="timestamp"
                    columns={deviceContextColumns}
                    dataSource={gapDetail.context_records || []}
                    size="small"
                    pagination={false}
                    scroll={{ x: 900 }}
                  />
                </div>
              ) : null}
            </div>
          )}
        </Card>
      </Spin>

      {/* 离线缺口回溯详情弹窗 */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
            设备离线缺口回溯详情
            {currentAnomaly && (
              <Tag color="blue">{currentAnomaly.equipment_code}</Tag>
            )}
          </Space>
        }
        open={gapModalVisible}
        onCancel={() => setGapModalVisible(false)}
        onOk={() => setGapModalVisible(false)}
        width={900}
        okText="关闭"
        cancelButtonProps={{ style: { display: 'none' } }}
        maskClosable={true}
      >
        <Spin spinning={gapLoading}>
          {gapDetail && (
            <div>
              {/* 推断分析 */}
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={12}>
                  <Card size="small" title={<Space><RiseOutlined /> 影响评估</Space>}>
                    <Descriptions size="small" column={1}>
                      <Descriptions.Item label="影响时长">
                        <b style={{ color: '#722ed1' }}>
                          {gapDetail.analysis?.estimated_loss?.affected_hours} 小时
                        </b>
                      </Descriptions.Item>
                      <Descriptions.Item label="预估损失冲煮杯数">
                        <b style={{ color: '#ff4d4f' }}>
                          {gapDetail.analysis?.estimated_loss?.brew_count} 杯
                        </b>
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" title={<Space><InfoCircleOutlined /> 原因推断</Space>}>
                    <Paragraph
                      type={gapDetail.analysis?.cause_deduction ? 'warning' : 'secondary'}
                      style={{ margin: 0 }}
                    >
                      {gapDetail.analysis?.cause_deduction || '暂无推断'}
                    </Paragraph>
                    <Divider style={{ margin: '10px 0' }} />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      * 基于历史数据模式与同期门店数据对比推断
                    </Text>
                  </Card>
                </Col>
              </Row>

              <Title level={5} style={{ marginTop: 0 }}>
                缺口期间样本对比（期望 vs 实际）
              </Title>
              <Table
                rowKey="id"
                size="small"
                pagination={false}
                dataSource={gapDetail.gap_samples || []}
                columns={[
                  { title: '样本时间点', dataIndex: 'sample_time', key: 'sample_time', width: 170 },
                  {
                    title: '期望冲煮次数',
                    key: 'exp_brew',
                    width: 110,
                    render: (_, r) => (
                      <Tag color="blue">{r.expected_metrics?.brew_count}</Tag>
                    ),
                  },
                  {
                    title: '期望平均萃取(秒)',
                    key: 'exp_ext',
                    width: 130,
                    render: (_, r) => r.expected_metrics?.avg_extract_time ?? '-',
                  },
                  {
                    title: '期望清洁循环',
                    key: 'exp_clean',
                    width: 110,
                    render: (_, r) => r.expected_metrics?.clean_cycles ?? '-',
                  },
                  {
                    title: '实际接收',
                    dataIndex: 'actual_received',
                    key: 'actual',
                    render: (t) => (
                      <span style={{ color: '#ff4d4f' }}>
                        <ExclamationCircleOutlined /> {t}
                      </span>
                    ),
                  },
                  {
                    title: '状态',
                    dataIndex: 'gap_status',
                    key: 'st',
                    width: 90,
                    render: (t) => <Tag color="red">{t}</Tag>,
                  },
                ]}
                style={{ marginBottom: 16 }}
              />

              <Title level={5}>
                上下文时序（前5后5对比）
              </Title>
              <Table
                rowKey="timestamp"
                columns={deviceContextColumns}
                dataSource={gapDetail.context_records || []}
                size="small"
                pagination={false}
                scroll={{ x: 900 }}
              />
            </div>
          )}
        </Spin>
      </Modal>
    </div>
  );
};

export default RiskChart;
