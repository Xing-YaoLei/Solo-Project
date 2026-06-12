import React, { useState, useEffect } from 'react';
import {
  Tabs,
  Row,
  Col,
  Card,
  Select,
  DatePicker,
  Button,
  Space,
  Table,
  Tag,
  Input,
  Statistic,
  Empty,
  Spin,
  message,
  Modal,
  Descriptions,
} from 'antd';
import {
  SearchOutlined,
  ExportOutlined,
  ReloadOutlined,
  DiffOutlined,
  BarChartOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import axios from 'axios';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

// 门店列表（与后端mock数据保持一致）
const STORES = [
  { id: 1, store_code: 'SH001', store_name: '上海南京路店', region: '华东', city: '上海' },
  { id: 2, store_code: 'SH002', store_name: '上海陆家嘴店', region: '华东', city: '上海' },
  { id: 3, store_code: 'BJ001', store_name: '北京国贸店', region: '华北', city: '北京' },
  { id: 4, store_code: 'BJ002', store_name: '北京中关村店', region: '华北', city: '北京' },
  { id: 5, store_code: 'GZ001', store_name: '广州天河城店', region: '华南', city: '广州' },
];

// ==================== Tab1: 库存表版本对比 ====================
const InventoryCompare = () => {
  const [loading, setLoading] = useState(false);
  const [storeId, setStoreId] = useState();
  const [v1Id, setV1Id] = useState();
  const [v2Id, setV2Id] = useState();
  const [versions, setVersions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [differences, setDifferences] = useState([]);
  const [changeType, setChangeType] = useState();
  const [category, setCategory] = useState();
  const [searchKw, setSearchKw] = useState('');

  // 加载库存版本
  const loadVersions = async (sid) => {
    try {
      const params = {};
      if (sid) params.store_id = sid;
      const res = await axios.get('/api/inventory/versions', { params });
      if (res.data.code === 0) {
        setVersions(res.data.data);
      }
    } catch (err) {
      message.error('加载库存版本失败');
    }
  };

  useEffect(() => {
    loadVersions();
  }, []);

  useEffect(() => {
    loadVersions(storeId);
  }, [storeId]);

  // 执行对比
  const handleCompare = async () => {
    if (!v1Id || !v2Id) {
      message.warning('请选择两个版本进行对比');
      return;
    }
    if (v1Id === v2Id) {
      message.warning('两个版本不能相同');
      return;
    }
    setLoading(true);
    try {
      const params = {
        version_id_1: v1Id,
        version_id_2: v2Id,
      };
      if (storeId) params.store_id = storeId;
      const res = await axios.get('/api/inventory/compare', { params });
      if (res.data.code === 0) {
        setSummary(res.data.data.summary);
        setDifferences(res.data.data.differences);
      }
    } catch (err) {
      message.error('对比失败：' + (err.response?.data?.detail || err.message));
      setSummary(null);
      setDifferences([]);
    } finally {
      setLoading(false);
    }
  };

  // 导出CSV
  const handleExport = () => {
    if (!differences.length) {
      message.warning('暂无数据可导出');
      return;
    }
    const headers = [
      'SKU编码', '名称', '分类', 'V1数量', 'V2数量', '数量差异', '差异%',
      'V1金额', 'V2金额', '金额差异', '变更类型'
    ];
    const rows = filteredData.map(r => [
      r.sku_code, r.sku_name, r.category,
      r.v1_quantity ?? '', r.v2_quantity ?? '', r.qty_diff ?? '',
      r.qty_diff_pct != null ? r.qty_diff_pct + '%' : '',
      r.v1_total ?? '', r.v2_total ?? '', r.total_diff ?? '',
      changeTypeName(r.change_type),
    ]);
    const csv = [headers, ...rows].map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `库存差异对比_${dayjs().format('YYYYMMDD')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 变更类型名称
  const changeTypeName = (t) => ({
    new_in_v2: '新增', removed_in_v2: '删除', modified: '修改', unchanged: '未变化'
  }[t] || t);

  // 变更类型Tag
  const changeTypeTag = (t) => {
    const map = {
      new_in_v2: { color: 'green', text: '新增' },
      removed_in_v2: { color: 'red', text: '删除' },
      modified: { color: 'orange', text: '修改' },
      unchanged: { color: 'default', text: '未变化' },
    };
    const cfg = map[t] || { color: 'default', text: t };
    return <Tag color={cfg.color}>{cfg.text}</Tag>;
  };

  // 获取分类列表
  const categories = [...new Set(differences.map(d => d.category).filter(Boolean))];

  // 过滤后的数据
  const filteredData = differences.filter(d => {
    if (changeType && d.change_type !== changeType) return false;
    if (category && d.category !== category) return false;
    if (searchKw) {
      const kw = searchKw.toLowerCase();
      if (!d.sku_code.toLowerCase().includes(kw) && !d.sku_name.toLowerCase().includes(kw)) return false;
    }
    return true;
  });

  // 表格列
  const columns = [
    { title: 'SKU编码', dataIndex: 'sku_code', key: 'sku_code', width: 110, fixed: 'left' },
    { title: '名称', dataIndex: 'sku_name', key: 'sku_name', width: 160 },
    { title: '分类', dataIndex: 'category', key: 'category', width: 100 },
    {
      title: 'V1数量', dataIndex: 'v1_quantity', key: 'v1_quantity', width: 90, align: 'right',
      render: v => v != null ? v : <span style={{ color: '#999' }}>-</span>
    },
    {
      title: 'V2数量', dataIndex: 'v2_quantity', key: 'v2_quantity', width: 90, align: 'right',
      render: v => v != null ? v : <span style={{ color: '#999' }}>-</span>
    },
    {
      title: '数量差异', dataIndex: 'qty_diff', key: 'qty_diff', width: 90, align: 'right',
      render: v => {
        if (v == null) return <span style={{ color: '#999' }}>-</span>;
        const color = v > 0 ? '#52c41a' : v < 0 ? '#ff4d4f' : '#000';
        return <span style={{ color, fontWeight: 600 }}>{v > 0 ? '+' : ''}{v}</span>;
      }
    },
    {
      title: '差异%', dataIndex: 'qty_diff_pct', key: 'qty_diff_pct', width: 90, align: 'right',
      render: v => {
        if (v == null) return <span style={{ color: '#999' }}>-</span>;
        const color = v > 0 ? '#52c41a' : v < 0 ? '#ff4d4f' : '#000';
        return <span style={{ color }}>{v > 0 ? '+' : ''}{v}%</span>;
      }
    },
    {
      title: 'V1金额(元)', dataIndex: 'v1_total', key: 'v1_total', width: 110, align: 'right',
      render: v => v != null ? v.toFixed(2) : <span style={{ color: '#999' }}>-</span>
    },
    {
      title: 'V2金额(元)', dataIndex: 'v2_total', key: 'v2_total', width: 110, align: 'right',
      render: v => v != null ? v.toFixed(2) : <span style={{ color: '#999' }}>-</span>
    },
    {
      title: '金额差异(元)', dataIndex: 'total_diff', key: 'total_diff', width: 110, align: 'right',
      render: v => {
        if (v == null) return <span style={{ color: '#999' }}>-</span>;
        const color = v > 0 ? '#52c41a' : v < 0 ? '#ff4d4f' : '#000';
        return <span style={{ color, fontWeight: 600 }}>{v > 0 ? '+' : ''}{v.toFixed(2)}</span>;
      }
    },
    {
      title: '变更类型', dataIndex: 'change_type', key: 'change_type', width: 100, fixed: 'right',
      render: changeTypeTag
    },
  ];

  return (
    <div>
      {/* 筛选区 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col span={5}>
            <div style={{ marginBottom: 4, color: '#666' }}>门店</div>
            <Select
              placeholder="选择门店（可选）"
              style={{ width: '100%' }}
              allowClear
              value={storeId}
              onChange={setStoreId}
            >
              {STORES.map(s => (
                <Option key={s.id} value={s.id}>{s.store_name}</Option>
              ))}
            </Select>
          </Col>
          <Col span={5}>
            <div style={{ marginBottom: 4, color: '#666' }}>版本1</div>
            <Select
              placeholder="选择版本1"
              style={{ width: '100%' }}
              showSearch
              optionFilterProp="label"
              value={v1Id}
              onChange={setV1Id}
            >
              {versions.map(v => (
                <Option key={v.id} value={v.id}
                  label={`V${v.version_number} | ${v.batch_id} | ${dayjs(v.snapshot_date).format('YYYY-MM-DD')}`}>
                  <div>
                    <Tag color="blue">V{v.version_number}</Tag>
                    <span style={{ marginLeft: 4 }}>{v.batch_id}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                    {v.store_name} · 快照 {dayjs(v.snapshot_date).format('YYYY-MM-DD')}
                  </div>
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={5}>
            <div style={{ marginBottom: 4, color: '#666' }}>版本2</div>
            <Select
              placeholder="选择版本2"
              style={{ width: '100%' }}
              showSearch
              optionFilterProp="label"
              value={v2Id}
              onChange={setV2Id}
            >
              {versions.map(v => (
                <Option key={v.id} value={v.id}
                  label={`V${v.version_number} | ${v.batch_id} | ${dayjs(v.snapshot_date).format('YYYY-MM-DD')}`}>
                  <div>
                    <Tag color="blue">V{v.version_number}</Tag>
                    <span style={{ marginLeft: 4 }}>{v.batch_id}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                    {v.store_name} · 快照 {dayjs(v.snapshot_date).format('YYYY-MM-DD')}
                  </div>
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={9}>
            <Space>
              <Button type="primary" icon={<DiffOutlined />} loading={loading} onClick={handleCompare}>
                开始对比
              </Button>
              <Button icon={<ReloadOutlined />} onClick={() => {
                setSummary(null); setDifferences([]); setV1Id(); setV2Id();
              }}>重置</Button>
              <Button icon={<ExportOutlined />} onClick={handleExport} disabled={!differences.length}>
                导出差异CSV
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Spin spinning={loading}>
        {/* 汇总卡片 */}
        {summary && (
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col span={4}>
              <Card>
                <Statistic title="差异SKU数" value={summary.total_changes}
                  valueStyle={{ color: summary.total_changes ? '#faad14' : '#52c41a' }} />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic title="新增" value={summary.new_items} valueStyle={{ color: '#52c41a' }} />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic title="删除" value={summary.removed_items} valueStyle={{ color: '#ff4d4f' }} />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic title="修改" value={summary.modified_items} valueStyle={{ color: '#fa8c16' }} />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title={
                    <span>
                      金额总差异(元)
                      <Tag style={{ marginLeft: 8 }} color="blue">
                        {summary.version_1.batch_id} vs {summary.version_2.batch_id}
                      </Tag>
                    </span>
                  }
                  value={summary.total_value_diff}
                  precision={2}
                  valueStyle={{
                    color: summary.total_value_diff > 0 ? '#52c41a' :
                      summary.total_value_diff < 0 ? '#ff4d4f' : '#000'
                  }}
                  prefix={summary.total_value_diff > 0 ? '+' : ''}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* 二级筛选 */}
        {summary && (
          <Card style={{ marginBottom: 16 }} size="small">
            <Row gutter={[16, 16]} align="middle">
              <Col span={6}>
                <Select
                  placeholder="按变更类型筛选"
                  style={{ width: '100%' }}
                  allowClear
                  value={changeType}
                  onChange={setChangeType}
                >
                  <Option value="new_in_v2"><Tag color="green">新增</Tag></Option>
                  <Option value="removed_in_v2"><Tag color="red">删除</Tag></Option>
                  <Option value="modified"><Tag color="orange">修改</Tag></Option>
                  <Option value="unchanged"><Tag>未变化</Tag></Option>
                </Select>
              </Col>
              <Col span={6}>
                <Select
                  placeholder="按分类筛选"
                  style={{ width: '100%' }}
                  allowClear
                  value={category}
                  onChange={setCategory}
                >
                  {categories.map(c => <Option key={c} value={c}>{c}</Option>)}
                </Select>
              </Col>
              <Col span={8}>
                <Input
                  prefix={<SearchOutlined />}
                  placeholder="搜索SKU编码或名称"
                  value={searchKw}
                  onChange={e => setSearchKw(e.target.value)}
                  allowClear
                />
              </Col>
              <Col span={4} style={{ textAlign: 'right', color: '#666' }}>
                共 {filteredData.length} 条差异
              </Col>
            </Row>
          </Card>
        )}

        {/* 差异表格 */}
        <Card>
          {summary ? (
            filteredData.length ? (
              <Table
                columns={columns}
                dataSource={filteredData}
                rowKey="sku_code"
                scroll={{ x: 1200 }}
                pagination={{ pageSize: 20, showSizeChanger: true }}
                size="small"
              />
            ) : <Empty description="暂无符合条件的差异数据" />
          ) : (
            <Empty
              description={
                <span>
                  <DiffOutlined style={{ color: '#1677ff', fontSize: 48 }} />
                  <div style={{ marginTop: 16 }}>请选择门店和两个版本，点击「开始对比」</div>
                </span>
              }
              style={{ padding: '60px 0' }}
            />
          )}
        </Card>
      </Spin>
    </div>
  );
};

// ==================== Tab2: POS流水版本对比 ====================
const PosCompare = () => {
  const [loading, setLoading] = useState(false);
  const [storeId, setStoreId] = useState();
  const [v1Id, setV1Id] = useState(1);
  const [v2Id, setV2Id] = useState(2);
  const [versions, setVersions] = useState([]);
  const [result, setResult] = useState(null);

  // 加载POS版本
  const loadVersions = async () => {
    try {
      const res = await axios.get('/api/pos/versions');
      if (res.data.code === 0) {
        setVersions(res.data.data);
      }
    } catch (err) {
      message.error('加载POS版本失败');
    }
  };

  useEffect(() => {
    loadVersions();
  }, []);

  // 执行对比
  const handleCompare = async () => {
    if (!v1Id || !v2Id) {
      message.warning('请选择两个版本');
      return;
    }
    if (v1Id === v2Id) {
      message.warning('两个版本不能相同');
      return;
    }
    setLoading(true);
    try {
      const params = { version_id_1: v1Id, version_id_2: v2Id };
      if (storeId) params.store_id = storeId;
      const res = await axios.get('/api/pos/compare', { params });
      if (res.data.code === 0) {
        setResult(res.data.data);
      }
    } catch (err) {
      message.error('对比失败：' + (err.response?.data?.detail || err.message));
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleCompare();
  }, []);

  // 变更类型Tag
  const changeTypeTag = (t) => {
    const map = {
      new_in_v2: { color: 'green', text: '新增数据' },
      removed_in_v2: { color: 'red', text: '缺失数据' },
      modified: { color: 'orange', text: '金额变更' },
      unchanged: { color: 'default', text: '一致' },
    };
    const cfg = map[t] || { color: 'default', text: t || '-' };
    return <Tag color={cfg.color}>{cfg.text}</Tag>;
  };

  // 每日趋势图
  const getDailyChartOption = () => {
    if (!result) return {};
    const daily = result.daily_comparison || [];
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
      legend: { data: ['交易数差异', '金额差异(元)'] },
      grid: { left: 60, right: 60, bottom: 60, top: 50 },
      xAxis: {
        type: 'category',
        data: daily.map(d => d.business_date),
        axisLabel: { rotate: 45, fontSize: 11 },
      },
      yAxis: [
        { type: 'value', name: '交易数差异', position: 'left' },
        { type: 'value', name: '金额差异(元)', position: 'right' },
      ],
      series: [
        {
          name: '交易数差异',
          type: 'bar',
          data: daily.map(d => d.txn_count_diff),
          itemStyle: {
            color: params => params.value >= 0 ? '#52c41a' : '#ff4d4f'
          },
        },
        {
          name: '金额差异(元)',
          type: 'line',
          yAxisIndex: 1,
          data: daily.map(d => d.total_amount_diff),
          smooth: true,
          lineStyle: { color: '#1677ff', width: 2 },
          itemStyle: { color: '#1677ff' },
          symbol: 'circle',
          symbolSize: 6,
        },
      ],
    };
  };

  // 各门店差异横向条形图
  const getStoreChartOption = () => {
    if (!result || !result.store_breakdown?.length) return {};
    const stores = [...result.store_breakdown].sort((a, b) => b.change_count - a.change_count);
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['交易数差异', '金额差异(元)'] },
      grid: { left: 120, right: 60, bottom: 30, top: 50 },
      xAxis: [
        { type: 'value', name: '交易数差异' },
        { type: 'value', name: '金额差异(元)', position: 'top' },
      ],
      yAxis: {
        type: 'category',
        data: stores.map(s => s.store_name),
        axisLabel: { fontSize: 12 },
      },
      series: [
        {
          name: '交易数差异',
          type: 'bar',
          data: stores.map(s => s.txn_count_diff),
          itemStyle: {
            color: params => params.value >= 0 ? '#52c41a' : '#ff4d4f'
          },
          label: { show: true, position: 'right', fontSize: 11 },
        },
        {
          name: '金额差异(元)',
          type: 'bar',
          xAxisIndex: 1,
          data: stores.map(s => s.total_amount_diff),
          itemStyle: {
            color: params => params.value >= 0 ? '#1677ff' : '#722ed1'
          },
          label: { show: true, position: 'right', fontSize: 11, formatter: p => p.value.toFixed(0) },
        },
      ],
    };
  };

  // 表格列
  const columns = [
    { title: '营业日期', dataIndex: 'business_date', key: 'business_date', width: 120, fixed: 'left' },
    { title: `V${v1Id}交易数`, dataIndex: `v${v1Id}_txn_count`, key: 'v1_txn', width: 100, align: 'right' },
    { title: `V${v2Id}交易数`, dataIndex: `v${v2Id}_txn_count`, key: 'v2_txn', width: 100, align: 'right' },
    {
      title: '交易数差', dataIndex: 'txn_count_diff', key: 'txn_diff', width: 90, align: 'right',
      render: v => {
        const color = v > 0 ? '#52c41a' : v < 0 ? '#ff4d4f' : '#000';
        return <span style={{ color, fontWeight: 600 }}>{v > 0 ? '+' : ''}{v}</span>;
      }
    },
    {
      title: `V${v1Id}总金额(元)`, dataIndex: `v${v1Id}_total_amount`, key: 'v1_amt', width: 120, align: 'right',
      render: v => v?.toFixed?.(2) ?? v
    },
    {
      title: `V${v2Id}总金额(元)`, dataIndex: `v${v2Id}_total_amount`, key: 'v2_amt', width: 120, align: 'right',
      render: v => v?.toFixed?.(2) ?? v
    },
    {
      title: '金额差(元)', dataIndex: 'total_amount_diff', key: 'amt_diff', width: 110, align: 'right',
      render: v => {
        const color = v > 0 ? '#52c41a' : v < 0 ? '#ff4d4f' : '#000';
        return <span style={{ color, fontWeight: 600 }}>{v > 0 ? '+' : ''}{v.toFixed(2)}</span>;
      }
    },
    {
      title: '差异%', dataIndex: 'total_amount_diff_pct', key: 'diff_pct', width: 90, align: 'right',
      render: v => {
        if (v == null) return '-';
        const color = v > 0 ? '#52c41a' : v < 0 ? '#ff4d4f' : '#000';
        return <span style={{ color }}>{v > 0 ? '+' : ''}{v}%</span>;
      }
    },
    {
      title: '变更类型', dataIndex: 'change_type', key: 'change_type', width: 110, fixed: 'right',
      render: changeTypeTag
    },
  ];

  return (
    <div>
      {/* 筛选区 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col span={5}>
            <div style={{ marginBottom: 4, color: '#666' }}>门店</div>
            <Select
              placeholder="选择门店（可选，全部门店）"
              style={{ width: '100%' }}
              allowClear
              value={storeId}
              onChange={setStoreId}
            >
              {STORES.map(s => (
                <Option key={s.id} value={s.id}>{s.store_name}</Option>
              ))}
            </Select>
          </Col>
          <Col span={5}>
            <div style={{ marginBottom: 4, color: '#666' }}>版本1</div>
            <Select
              style={{ width: '100%' }}
              value={v1Id}
              onChange={setV1Id}
            >
              {versions.map(v => (
                <Option key={v.id} value={v.id}>
                  V{v.version_number} - {v.name}（{v.date_range_start} ~ {v.date_range_end}）
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={5}>
            <div style={{ marginBottom: 4, color: '#666' }}>版本2</div>
            <Select
              style={{ width: '100%' }}
              value={v2Id}
              onChange={setV2Id}
            >
              {versions.map(v => (
                <Option key={v.id} value={v.id}>
                  V{v.version_number} - {v.name}（{v.date_range_start} ~ {v.date_range_end}）
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={9}>
            <Space>
              <Button type="primary" icon={<BarChartOutlined />} loading={loading} onClick={handleCompare}>
                执行对比
              </Button>
              <Button icon={<ReloadOutlined />} onClick={() => {
                setStoreId(); setResult(null);
              }}>重置</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Spin spinning={loading}>
        {result ? (
          <>
            {/* 汇总统计卡片 */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="总交易差异"
                    value={result.summary.txn_count_diff}
                    valueStyle={{
                      color: result.summary.txn_count_diff !== 0 ? '#fa8c16' : '#52c41a'
                    }}
                    prefix={result.summary.txn_count_diff > 0 ? '+' : ''}
                    suffix={`笔 (V${v1Id}:${result.version_1.txn_count} → V${v2Id}:${result.version_2.txn_count})`}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="总金额差异(元)"
                    value={result.summary.total_amount_diff}
                    precision={2}
                    valueStyle={{
                      color: result.summary.total_amount_diff > 0 ? '#52c41a' :
                        result.summary.total_amount_diff < 0 ? '#ff4d4f' : '#000'
                    }}
                    prefix={result.summary.total_amount_diff > 0 ? '+' : ''}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="金额差异%"
                    value={result.summary.total_amount_diff_pct}
                    precision={2}
                    suffix="%"
                    valueStyle={{
                      color: Math.abs(result.summary.total_amount_diff_pct) > 1 ? '#fa8c16' : '#52c41a'
                    }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="涉及天数"
                    value={result.summary.changed_days}
                    suffix="天"
                    valueStyle={{ color: result.summary.changed_days > 0 ? '#1677ff' : '#52c41a' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* 每日趋势图 */}
            <Card title="每日差异趋势" style={{ marginBottom: 16 }}>
              {result.daily_comparison?.length ? (
                <ReactECharts option={getDailyChartOption()} style={{ height: 360 }} notMerge />
              ) : <Empty description="暂无每日数据" />}
            </Card>

            {/* 差异明细表格 */}
            <Card title="差异明细" style={{ marginBottom: 16 }}>
              {result.daily_comparison?.length ? (
                <Table
                  columns={columns}
                  dataSource={result.daily_comparison}
                  rowKey="business_date"
                  scroll={{ x: 1050 }}
                  pagination={{ pageSize: 15, showSizeChanger: true }}
                  size="small"
                />
              ) : <Empty />}
            </Card>

            {/* 各门店差异图 */}
            {!storeId && result.store_breakdown?.length && (
              <Card title="各门店差异横向对比">
                <ReactECharts option={getStoreChartOption()} style={{ height: 320 }} notMerge />
              </Card>
            )}
          </>
        ) : (
          <Card>
            <Empty
              description={
                <span>
                  <BarChartOutlined style={{ color: '#1677ff', fontSize: 48 }} />
                  <div style={{ marginTop: 16 }}>点击「执行对比」查看POS流水版本差异</div>
                </span>
              }
              style={{ padding: '60px 0' }}
            />
          </Card>
        )}
      </Spin>
    </div>
  );
};

// ==================== Tab3: 会员小票与POS口径冲突 ====================
const MemberPosConflicts = () => {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([dayjs('2026-05-01'), dayjs('2026-06-14')]);
  const [storeId, setStoreId] = useState();
  const [conflictTypes, setConflictTypes] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [summary, setSummary] = useState(null);
  const [details, setDetails] = useState([]);
  const [total, setTotal] = useState(0);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const conflictTypeOptions = [
    { value: 'pos_only', label: 'POS独有（会员缺失）', color: 'blue' },
    { value: 'member_only', label: '会员独有（POS缺失）', color: 'purple' },
    { value: 'amount_mismatch', label: '金额不一致', color: 'red' },
  ];

  // 查询冲突
  const loadConflicts = async () => {
    if (!dateRange?.[0] || !dateRange?.[1]) {
      message.warning('请选择日期范围');
      return;
    }
    setLoading(true);
    try {
      const params = {
        start_date: dateRange[0].format('YYYY-MM-DD'),
        end_date: dateRange[1].format('YYYY-MM-DD'),
        page,
        page_size: pageSize,
      };
      if (storeId) params.store_id = storeId;
      if (conflictTypes?.length) params.conflict_type = conflictTypes.join(',');
      const res = await axios.get('/api/pos/conflicts', { params });
      if (res.data.code === 0) {
        setSummary(res.data.data.summary);
        setDetails(res.data.data.details);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      message.error('查询失败：' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConflicts();
  }, []);

  // 冲突类型Tag
  const conflictTypeTag = (t) => {
    const map = {
      pos_only: { color: 'blue', text: 'POS独有' },
      member_only: { color: 'purple', text: '会员独有' },
      amount_mismatch: { color: 'red', text: '金额不一致' },
    };
    const cfg = map[t] || { color: 'default', text: t };
    return <Tag color={cfg.color}>{cfg.text}</Tag>;
  };

  // 金额差着色
  const renderAmountDiff = (v) => {
    if (v == null) return <span style={{ color: '#999' }}>-</span>;
    const color = v > 0 ? '#52c41a' : v < 0 ? '#ff4d4f' : '#888';
    return (
      <span style={{ color, fontWeight: 600 }}>
        {v > 0 ? '+' : ''}{v.toFixed(2)}
      </span>
    );
  };

  // 饼图配置
  const getPieOption = () => {
    if (!summary) return {};
    const data = [
      { value: summary.pos_only_count || 0, name: 'POS独有', itemStyle: { color: '#1677ff' } },
      { value: summary.member_only_count || 0, name: '会员独有', itemStyle: { color: '#722ed1' } },
      { value: summary.amount_mismatch_count || 0, name: '金额不一致', itemStyle: { color: '#ff4d4f' } },
    ].filter(d => d.value > 0);
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0 },
      series: [{
        type: 'pie',
        radius: ['45%', '70%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: true, formatter: '{b}\n{d}%' },
        data,
      }],
    };
  };

  // 导出
  const handleExport = async () => {
    if (!dateRange?.[0] || !dateRange?.[1]) {
      message.warning('请选择日期范围');
      return;
    }
    try {
      const params = {
        start_date: dateRange[0].format('YYYY-MM-DD'),
        end_date: dateRange[1].format('YYYY-MM-DD'),
        format: 'csv',
      };
      if (storeId) params.store_id = storeId;
      if (conflictTypes?.length) params.conflict_type = conflictTypes.join(',');
      const res = await axios.get('/api/pos/conflicts/export', { params, responseType: 'blob' });
      const blob = new Blob(['\uFEFF' + await res.data.text()], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `会员POS冲突明细_${dateRange[0].format('YYYYMMDD')}_${dateRange[1].format('YYYYMMDD')}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch (err) {
      message.error('导出失败：' + err.message);
    }
  };

  // 查看详情
  const handleViewDetail = (record) => {
    setSelectedRecord(record);
    setDetailVisible(true);
  };

  // 表格列
  const columns = [
    {
      title: '冲突类型', dataIndex: 'conflict_type', key: 'conflict_type', width: 130, fixed: 'left',
      render: (t, r) => (
        <span title={r.conflict_type_name}>{conflictTypeTag(t)}</span>
      )
    },
    { title: 'POS交易号', dataIndex: 'pos_txn_id', key: 'pos_txn_id', width: 160,
      render: v => v || <span style={{ color: '#999' }}>-</span> },
    { title: '会员小票号', dataIndex: 'member_receipt_no', key: 'member_receipt_no', width: 160,
      render: v => v || <span style={{ color: '#999' }}>-</span> },
    { title: 'POS会员ID', dataIndex: 'pos_member_id', key: 'pos_member_id', width: 110,
      render: v => v || <span style={{ color: '#999' }}>-</span> },
    { title: '会员ID', dataIndex: 'member_id', key: 'member_id', width: 110,
      render: v => v || <span style={{ color: '#999' }}>-</span> },
    { title: '营业日期', dataIndex: 'business_date', key: 'business_date', width: 110 },
    { title: '交易时间', dataIndex: 'txn_time', key: 'txn_time', width: 170 },
    {
      title: 'POS金额(元)', dataIndex: 'pos_total', key: 'pos_total', width: 110, align: 'right',
      render: v => v != null ? v.toFixed(2) : <span style={{ color: '#999' }}>-</span>
    },
    {
      title: '会员金额(元)', dataIndex: 'member_total', key: 'member_total', width: 110, align: 'right',
      render: v => v != null ? v.toFixed(2) : <span style={{ color: '#999' }}>-</span>
    },
    {
      title: '金额差(元)', dataIndex: 'amount_diff', key: 'amount_diff', width: 110, align: 'right',
      render: renderAmountDiff
    },
    {
      title: '描述', dataIndex: 'description', key: 'description',
      ellipsis: true,
      render: (v) => <span style={{ color: '#666' }}>{v || '-'}</span>
    },
  ];

  return (
    <div>
      {/* 筛选区 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col span={7}>
            <div style={{ marginBottom: 4, color: '#666' }}>日期范围</div>
            <RangePicker
              style={{ width: '100%' }}
              value={dateRange}
              onChange={setDateRange}
              allowClear
            />
          </Col>
          <Col span={5}>
            <div style={{ marginBottom: 4, color: '#666' }}>门店</div>
            <Select
              placeholder="全部门店"
              style={{ width: '100%' }}
              allowClear
              value={storeId}
              onChange={setStoreId}
            >
              {STORES.map(s => (
                <Option key={s.id} value={s.id}>{s.store_name}</Option>
              ))}
            </Select>
          </Col>
          <Col span={7}>
            <div style={{ marginBottom: 4, color: '#666' }}>冲突类型（多选）</div>
            <Select
              mode="multiple"
              placeholder="不选=全部类型"
              style={{ width: '100%' }}
              allowClear
              value={conflictTypes}
              onChange={setConflictTypes}
              tagRender={({ label, value, closable, onClose }) => (
                <Tag
                  color={conflictTypeOptions.find(o => o.value === value)?.color || 'default'}
                  closable={closable}
                  onClose={onClose}
                  style={{ marginRight: 3 }}
                >
                  {label}
                </Tag>
              )}
            >
              {conflictTypeOptions.map(o => (
                <Option key={o.value} value={o.value}>
                  <Tag color={o.color}>{o.label}</Tag>
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={5}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} loading={loading}
                onClick={() => { setPage(1); loadConflicts(); }}>
                查询
              </Button>
              <Button icon={<ExportOutlined />} onClick={handleExport}>导出</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Spin spinning={loading}>
        {/* 汇总统计卡片 */}
        {summary && (
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col span={4}>
              <Card>
                <Statistic title="POS交易数" value={summary.pos_txn_count} valueStyle={{ color: '#1677ff' }} />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic title="会员小票数" value={summary.member_txn_count} valueStyle={{ color: '#722ed1' }} />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="匹配数"
                  value={summary.matched_count}
                  valueStyle={{ color: '#52c41a' }}
                  suffix={`(${summary.matched_rate}%)`}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic title="POS独有" value={summary.pos_only_count} valueStyle={{ color: '#1677ff' }} />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic title="会员独有" value={summary.member_only_count} valueStyle={{ color: '#722ed1' }} />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic title="金额不一致数" value={summary.amount_mismatch_count} valueStyle={{ color: '#ff4d4f' }} />
              </Card>
            </Col>
          </Row>
        )}

        {/* 饼图 + 说明 */}
        {summary && (
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col span={10}>
              <Card title="冲突检测摘要（各类型占比）">
                {summary.total_conflict_count > 0 ? (
                  <ReactECharts option={getPieOption()} style={{ height: 300 }} notMerge />
                ) : (
                  <Empty description="暂无冲突数据 🎉" style={{ padding: '60px 0' }} />
                )}
              </Card>
            </Col>
            <Col span={14}>
              <Card title="冲突说明与处理建议">
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="日期范围">
                    {summary.date_range?.start_date} ~ {summary.date_range?.end_date}
                  </Descriptions.Item>
                  <Descriptions.Item label="门店">
                    {storeId ? STORES.find(s => s.id === storeId)?.store_name : '全部门店'}
                  </Descriptions.Item>
                  <Descriptions.Item label="POS独有 (蓝)">
                    <WarningOutlined style={{ color: '#1677ff' }} /> 会员系统缺失对应小票记录。
                    <span style={{ color: '#666', marginLeft: 8 }}>建议：检查会员系统同步日志，补录缺失小票</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="会员独有 (紫)">
                    <WarningOutlined style={{ color: '#722ed1' }} /> POS系统缺失对应交易。
                    <span style={{ color: '#666', marginLeft: 8 }}>建议：检查POS离线缓存，确认是否漏传</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="金额不一致 (红)">
                    <WarningOutlined style={{ color: '#ff4d4f' }} /> 两边系统记录金额存在差异。
                    <span style={{ color: '#666', marginLeft: 8 }}>建议：逐笔核对折扣、抹零、优惠等字段</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="总冲突量">
                    <Tag color="warning" style={{ fontSize: 14, padding: '4px 12px' }}>
                      {summary.total_conflict_count} 条待处理
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
          </Row>
        )}

        {/* 冲突明细表格 */}
        <Card
          title={
            <Space>
              <span>冲突明细</span>
              <Tag color="default">共 {total} 条</Tag>
              <span style={{ color: '#999', fontSize: 12 }}>（点击行查看详情）</span>
            </Space>
          }
        >
          {details.length ? (
            <Table
              columns={columns}
              dataSource={details}
              rowKey={(r) => `${r.pos_txn_id || ''}_${r.member_receipt_no || ''}_${r.business_date}`}
              scroll={{ x: 1500 }}
              pagination={{
                current: page,
                pageSize,
                total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: t => `共 ${t} 条`,
                onChange: (p, ps) => { setPage(p); setPageSize(ps); loadConflicts(); },
              }}
              size="small"
              onRow={(record) => ({
                onClick: () => handleViewDetail(record),
                style: { cursor: 'pointer' },
              })}
            />
          ) : (
            <Empty
              description={
                <span>
                  <WarningOutlined style={{ color: '#52c41a', fontSize: 48 }} />
                  <div style={{ marginTop: 16 }}>暂无冲突记录，数据一致性良好</div>
                </span>
              }
              style={{ padding: '60px 0' }}
            />
          )}
        </Card>

        {/* 详情弹窗 */}
        <Modal
          open={detailVisible}
          title="冲突详情"
          onCancel={() => setDetailVisible(false)}
          footer={[
            <Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>
          ]}
          width={720}
        >
          {selectedRecord && (
            <div>
              <Space style={{ marginBottom: 16 }}>
                {conflictTypeTag(selectedRecord.conflict_type)}
                <Tag>{selectedRecord.conflict_type_name}</Tag>
              </Space>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="门店" span={2}>
                  {selectedRecord.store_name || '-'} ({selectedRecord.store_code || '-'})
                </Descriptions.Item>
                <Descriptions.Item label="营业日期">{selectedRecord.business_date}</Descriptions.Item>
                <Descriptions.Item label="交易时间">{selectedRecord.txn_time}</Descriptions.Item>
                <Descriptions.Item label="POS交易号">
                  {selectedRecord.pos_txn_id || <span style={{ color: '#ff4d4f' }}>缺失</span>}
                </Descriptions.Item>
                <Descriptions.Item label="会员小票号">
                  {selectedRecord.member_receipt_no || <span style={{ color: '#ff4d4f' }}>缺失</span>}
                </Descriptions.Item>
                <Descriptions.Item label="POS会员ID">
                  {selectedRecord.pos_member_id || <span style={{ color: '#999' }}>-</span>}
                </Descriptions.Item>
                <Descriptions.Item label="会员ID">
                  {selectedRecord.member_id || <span style={{ color: '#999' }}>-</span>}
                </Descriptions.Item>
                <Descriptions.Item label="POS金额(元)" span={1}>
                  <span style={{ color: '#1677ff', fontWeight: 600 }}>
                    {selectedRecord.pos_total != null ? selectedRecord.pos_total.toFixed(2) : '-'}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="会员金额(元)" span={1}>
                  <span style={{ color: '#722ed1', fontWeight: 600 }}>
                    {selectedRecord.member_total != null ? selectedRecord.member_total.toFixed(2) : '-'}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="金额差异(元)" span={2}>
                  {renderAmountDiff(selectedRecord.amount_diff)}
                </Descriptions.Item>
                <Descriptions.Item label="冲突说明" span={2}>
                  {selectedRecord.description || '-'}
                </Descriptions.Item>
              </Descriptions>
              <Card size="small" title="关联交易明细" style={{ marginTop: 16 }}>
                <div style={{ padding: '20px 0', textAlign: 'center', color: '#999' }}>
                  （示例数据：实际可对接交易明细接口展示商品明细、优惠明细、支付明细等）
                </div>
                <Table
                  size="small"
                  pagination={false}
                  dataSource={[
                    { sku: 'ESP002', name: '拿铁咖啡', qty: 2, price: 32, subtotal: 64 },
                    { sku: 'CLD001', name: '冰美式', qty: 1, price: 22, subtotal: 22 },
                  ]}
                  columns={[
                    { title: 'SKU编码', dataIndex: 'sku', width: 100 },
                    { title: '商品名称', dataIndex: 'name' },
                    { title: '数量', dataIndex: 'qty', width: 80, align: 'right' },
                    { title: '单价(元)', dataIndex: 'price', width: 100, align: 'right' },
                    { title: '小计(元)', dataIndex: 'subtotal', width: 100, align: 'right' },
                  ]}
                />
              </Card>
            </div>
          )}
        </Modal>
      </Spin>
    </div>
  );
};

// ==================== 主组件 ====================
const DataConsistency = () => {
  const tabItems = [
    {
      key: 'inventory',
      label: (
        <span>
          <DiffOutlined /> 库存表版本对比
        </span>
      ),
      children: <InventoryCompare />,
    },
    {
      key: 'pos',
      label: (
        <span>
          <BarChartOutlined /> POS流水版本对比
        </span>
      ),
      children: <PosCompare />,
    },
    {
      key: 'conflicts',
      label: (
        <span>
          <WarningOutlined /> 会员小票与POS口径冲突
        </span>
      ),
      children: <MemberPosConflicts />,
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Card
        title={
          <Space>
            <span style={{ fontSize: 18 }}>数据一致性管理</span>
            <Tag color="blue">库存 / POS / 会员</Tag>
          </Space>
        }
        extra={
          <Space>
            <span style={{ color: '#999', fontSize: 12 }}>
              今日：{dayjs().format('YYYY-MM-DD')}
            </span>
          </Space>
        }
        bordered={false}
      >
        <Tabs
          defaultActiveKey="inventory"
          items={tabItems}
          size="large"
          style={{ marginTop: 8 }}
        />
      </Card>
    </div>
  );
};

export default DataConsistency;
