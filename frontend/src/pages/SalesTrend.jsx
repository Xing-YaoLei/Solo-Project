import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Row,
  Col,
  Card,
  Select,
  Button,
  Tag,
  Statistic,
  Table,
  App as AntApp,
  Modal,
  Form,
  Input,
  DatePicker,
  Space,
  Alert,
  Tooltip,
} from 'antd'
import {
  ReloadOutlined,
  DownloadOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import { api, EXCEPTION_LABELS } from '../api/index.js'

const EXCEPTION_KEYS = ['cashier_delay', 'member_missing', 'mi_caliber_change']

export default function SalesTrend() {
  const { message, modal } = AntApp.useApp()
  const [loading, setLoading] = useState(false)
  const [promotions, setPromotions] = useState([])
  const [selectedPromoId, setSelectedPromoId] = useState(undefined)
  const [trendData, setTrendData] = useState(null)
  const [impactRanges, setImpactRanges] = useState([])
  const [annotations, setAnnotations] = useState([])
  const [annotationModal, setAnnotationModal] = useState({ open: false, data: null })
  const [form] = Form.useForm()

  const fetchPromotions = useCallback(async () => {
    try {
      const data = await api.getPromotions()
      setPromotions(data)
      if (data.length && !selectedPromoId) {
        setSelectedPromoId(data[0].id)
      }
    } catch (e) {
      console.error(e)
    }
  }, [selectedPromoId])

  const fetchTrend = useCallback(async () => {
    if (!selectedPromoId) return
    setLoading(true)
    try {
      const [trend, impacts, anns] = await Promise.all([
        api.getSalesTrend(selectedPromoId),
        api.getDisplayImpactRanges(selectedPromoId),
        api.getAnnotations({ promotion_id: selectedPromoId }),
      ])
      setTrendData(trend)
      setImpactRanges(impacts)
      setAnnotations(anns)
    } catch (e) {
      message.error('加载销售走势失败')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [selectedPromoId, message])

  useEffect(() => {
    fetchPromotions()
  }, [fetchPromotions])

  useEffect(() => {
    fetchTrend()
  }, [fetchTrend])

  const annMap = useMemo(() => {
    const m = {}
    annotations.forEach((a) => {
      if (!m[a.annotation_date]) m[a.annotation_date] = []
      m[a.annotation_date].push(a)
    })
    return m
  }, [annotations])

  const getTrendChartOption = () => {
    if (!trendData?.daily_data?.length) {
      return { title: { text: '请先选择促销活动', left: 'center', top: 'center' } }
    }
    const dates = trendData.daily_data.map((d) => d.date)
    const sales = trendData.daily_data.map((d) => d.sales_amount)
    const targets = trendData.daily_data.map((d) => d.target_daily)
    const rates = trendData.daily_data.map((d) => d.achievement_rate)

    const markPointData = []
    const markAreaData = []
    trendData.daily_data.forEach((d, i) => {
      if (d.is_display_unqualified) {
        markPointData.push({
          name: '陈列不合格',
          coord: [i, d.sales_amount],
          value: '陈列',
          itemStyle: { color: '#ff4d4f' },
        })
      }
      d.exception_types?.forEach((t) => {
        if (EXCEPTION_KEYS.includes(t)) {
          markPointData.push({
            name: EXCEPTION_LABELS[t]?.label || t,
            coord: [i, d.sales_amount + (Math.random() * 500)],
            value: EXCEPTION_LABELS[t]?.icon || '!',
            itemStyle: { color: EXCEPTION_LABELS[t]?.color || '#999' },
          })
        }
      })
    })

    impactRanges.forEach((r) => {
      const sIdx = dates.findIndex((d) => dayjs(d).isSame(dayjs(r.start_date), 'day'))
      const eIdx = dates.findIndex((d) => dayjs(d).isSame(dayjs(r.end_date), 'day'))
      if (sIdx >= 0 && eIdx >= 0) {
        markAreaData.push([
          { xAxis: sIdx, itemStyle: { color: 'rgba(255,77,79,0.12)' } },
          { xAxis: eIdx },
        ])
      }
    })

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          const d = trendData.daily_data[params[0].dataIndex]
          const header = `<div style="font-weight:600;margin-bottom:6px">${d.date}</div>`
          const parts = [header]
          params.forEach((p) => {
            parts.push(
              `<div style="display:flex;justify-content:space-between;min-width:180px">
                <span>${p.marker} ${p.seriesName}</span>
                <b>${p.seriesName.includes('率') ? p.value + '%' : '¥' + Number(p.value).toLocaleString()}</b>
              </div>`,
            )
          })
          const tags = []
          if (d.exception_types?.length) {
            d.exception_types.forEach((t) => {
              if (EXCEPTION_LABELS[t]) {
                tags.push(
                  `<span style="display:inline-block;padding:1px 8px;margin:2px 2px 0 0;background:${EXCEPTION_LABELS[t].color}22;color:${EXCEPTION_LABELS[t].color};border-radius:10px;font-size:11px">${EXCEPTION_LABELS[t].icon} ${EXCEPTION_LABELS[t].label}</span>`,
                )
              }
            })
          }
          if (d.is_display_unqualified) {
            tags.push(
              `<span style="display:inline-block;padding:1px 8px;margin:2px 2px 0 0;background:#fff1f0;color:#cf1322;border-radius:10px;font-size:11px">📷 陈列不合格</span>`,
            )
          }
          const anns = annMap[d.date] || []
          if (anns.length) {
            parts.push(
              `<div style="margin-top:6px;padding-top:6px;border-top:1px dashed #eee;color:#52c41a">📝 复盘说明：${anns.map((a) => a.review_note || a.exception_description).join('；')}</div>`,
            )
          }
          parts.push(tags.length ? `<div style="margin-top:6px">${tags.join('')}</div>` : '')
          return parts.join('')
        },
      },
      legend: { top: 5 },
      grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
        axisLabel: { rotate: 45, fontSize: 11 },
      },
      yAxis: [
        {
          type: 'value',
          name: '金额(元)',
          axisLabel: { formatter: (v) => (v >= 1000 ? v / 1000 + 'k' : v) },
        },
        {
          type: 'value',
          name: '达成率(%)',
          max: 200,
          axisLabel: { formatter: '{value}%' },
        },
      ],
      series: [
        {
          name: '实际销售额',
          type: 'line',
          smooth: true,
          data: sales,
          itemStyle: { color: '#1677ff' },
          areaStyle: { color: 'rgba(22,119,255,0.15)' },
          markPoint: {
            symbolSize: 36,
            data: markPointData,
            label: { fontSize: 10 },
          },
          markArea: { silent: true, data: markAreaData },
        },
        {
          name: '日均目标',
          type: 'line',
          smooth: true,
          data: targets,
          lineStyle: { type: 'dashed' },
          itemStyle: { color: '#faad14' },
        },
        {
          name: '达成率',
          type: 'bar',
          yAxisIndex: 1,
          data: rates,
          barWidth: 8,
          itemStyle: {
            color: (params) => {
              const v = params.value
              return v >= 100 ? '#52c41a' : v >= 70 ? '#1677ff' : '#ff4d4f'
            },
          },
        },
      ],
    }
  }

  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      width: 110,
      fixed: 'left',
      render: (v, row) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 600 }}>{v}</span>
          {row.is_display_unqualified && (
            <Tag color="red" style={{ margin: 0, width: 'fit-content' }} size="small">
              陈列不合格
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: '销售额(元)',
      dataIndex: 'sales_amount',
      width: 120,
      sorter: (a, b) => a.sales_amount - b.sales_amount,
      render: (v) => v?.toLocaleString(),
    },
    {
      title: '销售件数',
      dataIndex: 'sales_units',
      width: 100,
      sorter: (a, b) => a.sales_units - b.sales_units,
    },
    {
      title: '日均目标(元)',
      dataIndex: 'target_daily',
      width: 120,
      render: (v) => v?.toLocaleString(),
    },
    {
      title: '当日达成率',
      dataIndex: 'achievement_rate',
      width: 150,
      sorter: (a, b) => a.achievement_rate - b.achievement_rate,
      render: (v) => {
        const color = v >= 100 ? '#52c41a' : v >= 70 ? '#1677ff' : '#ff4d4f'
        return (
          <span style={{ color, fontWeight: 600 }}>
            {v.toFixed(1)}% {v >= 100 ? '✅' : v >= 70 ? '' : '⚠️'}
          </span>
        )
      },
    },
    {
      title: '异常标记',
      dataIndex: 'exception_types',
      width: 220,
      render: (types, row) => (
        <Space size={[4, 4]} wrap>
          {types?.map((t) =>
            EXCEPTION_LABELS[t] ? (
              <Tag
                key={t}
                style={{
                  background: EXCEPTION_LABELS[t].color + '18',
                  borderColor: EXCEPTION_LABELS[t].color + '55',
                  color: EXCEPTION_LABELS[t].color,
                  margin: 0,
                }}
              >
                {EXCEPTION_LABELS[t].icon} {EXCEPTION_LABELS[t].label}
              </Tag>
            ) : null,
          )}
          {!types?.length && <span style={{ color: '#aaa' }}>无</span>}
        </Space>
      ),
    },
    {
      title: '复盘说明(与异常点联动)',
      dataIndex: 'date',
      width: 280,
      render: (d, row) => {
        const anns = annMap[d] || []
        if (!anns.length && !row.has_exception && !row.is_display_unqualified) {
          return <span style={{ color: '#aaa' }}>无</span>
        }
        return (
          <Space direction="vertical" size={4}>
            {anns.map((a) => (
              <div
                key={a.id}
                style={{
                  fontSize: 12,
                  padding: '6px 10px',
                  background: '#f6ffed',
                  borderRadius: 6,
                  border: '1px solid #b7eb8f',
                }}
              >
                <div style={{ fontWeight: 600, color: '#389e0d' }}>
                  {EXCEPTION_LABELS[a.exception_type]?.icon} {EXCEPTION_LABELS[a.exception_type]?.label || a.exception_type}
                  {a.created_by && ` · ${a.created_by}`}
                </div>
                <div style={{ color: '#1f2937' }}>{a.exception_description}</div>
                {a.review_note && (
                  <div style={{ color: '#52c41a', marginTop: 4 }}>
                    ✅ 处理({a.review_by || ''}): {a.review_note}
                  </div>
                )}
              </div>
            ))}
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              style={{ padding: 0 }}
              onClick={() =>
                setAnnotationModal({
                  open: true,
                  data: { annotation_date: d, promotion_id: selectedPromoId, hasException: row },
                })
              }
            >
              {anns.length ? '追加/编辑' : '添加复盘说明'}
            </Button>
          </Space>
        )
      },
    },
  ]

  const handleSubmitAnnotation = async (values) => {
    try {
      const payload = {
        ...values,
        annotation_date: values.annotation_date.format('YYYY-MM-DD'),
        created_by: '前端用户',
      }
      await api.createAnnotation(payload)
      message.success('复盘说明已保存')
      setAnnotationModal({ open: false, data: null })
      form.resetFields()
      fetchTrend()
    } catch (e) {
      message.error('保存失败')
    }
  }

  return (
    <div>
      {impactRanges.length > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={
            <span>
              <WarningOutlined /> 陈列不合格影响走势的时间范围（共 {impactRanges.length} 段）：
              {impactRanges.map((r, i) => (
                <Tag key={i} color="red" style={{ marginLeft: 8 }}>
                  {r.start_date} ~ {r.end_date}
                  <Tooltip
                    title={
                      <div>
                        <div>影响天数: {r.impact_days} 天</div>
                        <div>期间平均陈列得分: {r.avg_score_during_period} 分</div>
                        <div>预计损失销售额: ¥{r.estimated_loss_sales.toLocaleString()}</div>
                      </div>
                    }
                  >
                    <InfoCircleOutlined style={{ marginLeft: 6 }} />
                  </Tooltip>
                </Tag>
              ))}
            </span>
          }
        />
      )}

      <div className="card-section">
        <Row gutter={16} align="middle">
          <Col span={24}>
            <Space size="middle" wrap>
              <Select
                showSearch
                placeholder="选择促销活动"
                style={{ minWidth: 360 }}
                options={promotions.map((p) => ({
                  value: p.id,
                  label: `${p.promo_code} - ${p.promo_name}`,
                }))}
                value={selectedPromoId}
                onChange={setSelectedPromoId}
              />
              <Button icon={<ReloadOutlined />} onClick={fetchTrend}>
                刷新
              </Button>
            </Space>
            <Space style={{ float: 'right' }}>
              <Button
                icon={<PlusOutlined />}
                onClick={() =>
                  setAnnotationModal({
                    open: true,
                    data: { promotion_id: selectedPromoId },
                  })
                }
              >
                添加异常复盘
              </Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={() => {
                  api.downloadSalesTrendReport(selectedPromoId)
                  message.success('下载中，Excel包含促销汇总/每日走势(含复盘)/陈列影响/计算规则4个Sheet')
                }}
              >
                下载该促销报表
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {trendData && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={8}>
            <div className="stat-card info">
              <div className="stat-label">总目标销售额</div>
              <div className="stat-value" style={{ fontSize: 26 }}>
                ¥{trendData.total_target?.toLocaleString()}
              </div>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div className="stat-card success">
              <div className="stat-label">实际累计销售额</div>
              <div className="stat-value" style={{ fontSize: 26 }}>
                ¥{trendData.total_sales?.toLocaleString()}
              </div>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div
              className={`stat-card ${
                trendData.overall_achievement_rate >= 100
                  ? 'success'
                  : trendData.overall_achievement_rate >= 70
                  ? ''
                  : 'warning'
              }`}
            >
              <div className="stat-label">整体达成率</div>
              <div className="stat-value" style={{ fontSize: 26 }}>
                {trendData.overall_achievement_rate?.toFixed(1)}%
              </div>
            </div>
          </Col>
        </Row>
      )}

      <div className="card-section">
        <div className="section-title">
          销售每日走势（含陈列不合格影响范围高亮 + 异常标记点 + 复盘说明联动）
        </div>
        <ReactECharts
          option={getTrendChartOption()}
          style={{ height: 460 }}
          loading={loading}
          notMerge
        />
        <div style={{ marginTop: 12, padding: 12, background: '#fafafa', borderRadius: 6, fontSize: 12 }}>
          <Space size="large" wrap>
            <span>
              <span style={{ display: 'inline-block', width: 14, height: 14, background: '#1677ff', marginRight: 6, verticalAlign: 'middle' }}></span>
              实际销售额（蓝色面积线）
            </span>
            <span>
              <span style={{ display: 'inline-block', width: 14, height: 2, background: '#faad14', marginRight: 6, verticalAlign: 'middle' }}></span>
              日均目标（黄色虚线）
            </span>
            <span>
              <span style={{ display: 'inline-block', width: 14, height: 14, background: 'rgba(255,77,79,0.18)', border: '1px solid #ff4d4f', marginRight: 6, verticalAlign: 'middle' }}></span>
              陈列不合格影响范围（红色阴影）
            </span>
            <span>
              <span style={{ color: '#cf1322', marginRight: 4 }}>📷</span>
              标记点 = 陈列不合格/系统延迟/口径变化
            </span>
          </Space>
        </div>
      </div>

      <div className="card-section">
        <div className="section-title">每日明细（复盘说明与异常点不分开）</div>
        <Table
          columns={columns}
          dataSource={trendData?.daily_data || []}
          loading={loading}
          rowKey="date"
          rowClassName={(row) => (row.is_display_unqualified ? 'impact-highlight' : '')}
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 14, showSizeChanger: true }}
        />
      </div>

      <Modal
        open={annotationModal.open}
        title={annotationModal.data?.annotation_date ? `异常复盘说明 - ${annotationModal.data.annotation_date}` : '添加异常复盘说明'}
        width={560}
        onCancel={() => {
          setAnnotationModal({ open: false, data: null })
          form.resetFields()
        }}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitAnnotation}>
          <Form.Item
            label="促销活动"
            name="promotion_id"
            initialValue={annotationModal.data?.promotion_id}
            hidden
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="标注日期"
            name="annotation_date"
            rules={[{ required: true, message: '请选择日期' }]}
            initialValue={
              annotationModal.data?.annotation_date
                ? dayjs(annotationModal.data.annotation_date)
                : undefined
            }
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="异常类型"
            name="exception_type"
            rules={[{ required: true, message: '请选择异常类型' }]}
          >
            <Select
              options={[
                { value: 'cashier_delay', label: `${EXCEPTION_LABELS.cashier_delay.icon} 收银系统延迟` },
                { value: 'member_missing', label: `${EXCEPTION_LABELS.member_missing.icon} 会员记录缺失` },
                { value: 'mi_caliber_change', label: `${EXCEPTION_LABELS.mi_caliber_change.icon} 医保接口口径变化` },
                { value: 'display_unqualified', label: '📷 陈列不合格影响' },
                { value: 'other', label: '其他异常' },
              ]}
            />
          </Form.Item>
          <Form.Item
            label="异常描述 / 复盘说明"
            name="exception_description"
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <Input.TextArea rows={3} placeholder="请描述异常情况及复盘分析" />
          </Form.Item>
          <Form.Item label="处理结果 / 跟进备注" name="review_note">
            <Input.TextArea rows={2} placeholder="已如何处理，后续如何改进" />
          </Form.Item>
          <Form.Item label="处理人" name="review_by">
            <Input placeholder="请输入处理人姓名/部门" />
          </Form.Item>
          <Form.Item label="影响程度" name="impact_degree" initialValue="medium">
            <Select
              options={[
                { value: 'low', label: '低' },
                { value: 'medium', label: '中' },
                { value: 'high', label: '高' },
              ]}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setAnnotationModal({ open: false, data: null })
                  form.resetFields()
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
