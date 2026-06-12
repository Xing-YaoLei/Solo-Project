import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, Row, Col, Statistic, DatePicker, Button, Space, Alert, Tag, Progress, message, Spin, Typography, Divider } from 'antd'
import { ExportOutlined, ReloadOutlined, InfoCircleOutlined, CheckCircleOutlined, ClockCircleOutlined, WarningOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import ReactECharts from 'echarts-for-react'
import { reportApi } from '../api'
import { DeliveryPerformance, TrendData } from '../types'

const { RangePicker } = DatePicker
const { Text } = Typography

export default function ReportPage() {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ])
  const [exportTaskId, setExportTaskId] = useState<string | null>(null)
  const [exportStatus, setExportStatus] = useState<string>('')
  const [exportProgress, setExportProgress] = useState(0)

  const params = {
    start_date: dateRange[0].format('YYYY-MM-DD'),
    end_date: dateRange[1].format('YYYY-MM-DD'),
  }

  const { data: performance, isLoading, refetch } = useQuery({
    queryKey: ['delivery-performance', params],
    queryFn: () => reportApi.getDeliveryPerformance(params),
  })

  const { data: trendData } = useQuery({
    queryKey: ['delivery-trend', params],
    queryFn: () => reportApi.getDeliveryTrend(params),
  })

  const exportMutation = useMutation({
    mutationFn: () => reportApi.exportExcel(params),
    onSuccess: (data) => {
      setExportTaskId(data.task_id)
      setExportStatus('PENDING')
      setExportProgress(0)
      message.info('报表导出任务已提交，正在生成...')
    },
  })

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (exportTaskId && exportStatus !== 'SUCCESS' && exportStatus !== 'FAILURE') {
      interval = setInterval(async () => {
        try {
          const status = await reportApi.getExportStatus(exportTaskId)
          setExportStatus(status.state)
          if (status.state === 'SUCCESS') {
            setExportProgress(100)
            message.success('报表生成成功！')
            const result = status.result
            const downloadPath = result?.download_url || result?.file_path
            if (downloadPath) {
              window.open(downloadPath, '_blank')
            } else if (result) {
              console.warn('导出任务完成但未找到下载路径:', result)
            }
            clearInterval(interval)
          } else if (status.state === 'FAILURE') {
            message.error('报表生成失败')
            clearInterval(interval)
          } else {
            setExportProgress((prev) => Math.min(prev + 20, 90))
          }
        } catch (e) {
          console.error('检查导出状态失败', e)
        }
      }, 2000)
    }
    return () => clearInterval(interval)
  }, [exportTaskId, exportStatus])

  const handleExport = () => {
    exportMutation.mutate()
  }

  const handleRefresh = () => {
    refetch()
    message.success('数据已刷新')
  }

  const getTrendChartOption = (data: TrendData[]) => {
    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const item = params[0]
          const trend = data[item.dataIndex]
          return `${trend.date}<br/>履约准时率: ${trend.rate.toFixed(1)}%<br/>团单数: ${trend.total}<br/>准时团单: ${trend.on_time}`
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: data.map((d) => d.date),
        axisLabel: { rotate: 45 },
      },
      yAxis: [
        {
          type: 'value',
          name: '准时率(%)',
          min: 0,
          max: 100,
          axisLabel: { formatter: '{value}%' },
        },
        {
          type: 'value',
          name: '团单数',
          min: 0,
        },
      ],
      series: [
        {
          name: '履约准时率',
          type: 'line',
          smooth: true,
          data: data.map((d) => d.rate),
          itemStyle: { color: '#52c41a' },
          lineStyle: { width: 3 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(82, 196, 26, 0.3)' },
                { offset: 1, color: 'rgba(82, 196, 26, 0.05)' },
              ],
            },
          },
        },
        {
          name: '团单数',
          type: 'bar',
          yAxisIndex: 1,
          data: data.map((d) => d.total),
          itemStyle: { color: '#1890ff' },
          barWidth: 20,
        },
      ],
      legend: {
        data: ['履约准时率', '团单数'],
      },
    }
  }

  const getExceptionChartOption = (perf: DeliveryPerformance) => {
    const totalExceptions = perf.summary.total_exceptions
    const closedExceptions = perf.summary.closed_exceptions
    const pendingExceptions = totalExceptions - closedExceptions

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
      },
      series: [
        {
          name: '异常单处理情况',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: false,
            position: 'center',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 20,
              fontWeight: 'bold',
            },
          },
          labelLine: {
            show: false,
          },
          data: [
            { value: closedExceptions, name: '已结案', itemStyle: { color: '#52c41a' } },
            { value: pendingExceptions, name: '待处理', itemStyle: { color: '#faad14' } },
          ],
        },
      ],
    }
  }

  const getShortageChartOption = (perf: DeliveryPerformance) => {
    const shortageRate = perf.summary.shortage_rate

    return {
      series: [
        {
          type: 'gauge',
          startAngle: 180,
          endAngle: 0,
          min: 0,
          max: 20,
          splitNumber: 4,
          radius: '90%',
          axisLine: {
            lineStyle: {
              width: 30,
              color: [
                [0.3, '#52c41a'],
                [0.7, '#faad14'],
                [1, '#ff4d4f'],
              ],
            },
          },
          pointer: {
            icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
            length: '60%',
            width: 12,
            offsetCenter: [0, '-35%'],
            itemStyle: {
              color: 'auto',
            },
          },
          axisTick: {
            length: 8,
            lineStyle: {
              color: 'auto',
              width: 2,
            },
          },
          splitLine: {
            length: 20,
            lineStyle: {
              color: 'auto',
              width: 4,
            },
          },
          axisLabel: {
            color: '#666',
            fontSize: 14,
            distance: -40,
            formatter: '{value}%',
          },
          title: {
            offsetCenter: [0, '20%'],
            fontSize: 16,
            color: '#666',
          },
          detail: {
            fontSize: 28,
            offsetCenter: [0, '0%'],
            valueAnimation: true,
            formatter: '{value}%',
            color: 'auto',
          },
          data: [
            {
              value: Number(shortageRate.toFixed(1)),
              name: '到货短少率',
            },
          ],
        },
      ],
    }
  }

  const caliberText = performance?.caliber || ''

  const caliberItems = caliberText.split('\n').filter((item) => item.trim())

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">履约数据报表</h1>
        <Space>
          <RangePicker
            value={dateRange}
            onChange={(dates) => dates && setDateRange([dates[0]!, dates[1]!])}
          />
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
            刷新
          </Button>
          <Button
            type="primary"
            icon={<ExportOutlined />}
            onClick={handleExport}
            loading={exportMutation.isPending || (exportStatus === 'PENDING' || exportStatus === 'STARTED')}
          >
            导出Excel
          </Button>
        </Space>
      </div>

      {exportTaskId && exportStatus !== 'SUCCESS' && exportStatus !== 'FAILURE' && (
        <Alert
          message="正在生成报表"
          description={
            <div>
              <Progress percent={exportProgress} showInfo status="active" />
              <Text type="secondary">任务ID: {exportTaskId}</Text>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Spin spinning={isLoading}>
        {performance && (
          <>
            <Card style={{ marginBottom: 16 }}>
              <Row gutter={24}>
                <Col xs={24} sm={12} md={6}>
                  <Card bordered={false} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <Statistic
                      title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>总团单数</span>}
                      value={performance.summary.total_batches}
                      valueStyle={{ color: '#fff' }}
                      prefix={<CheckCircleOutlined style={{ color: '#fff' }} />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card bordered={false} style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
                    <Statistic
                      title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>履约准时率</span>}
                      value={performance.summary.on_time_rate}
                      precision={1}
                      suffix="%"
                      valueStyle={{ color: '#fff' }}
                      prefix={<CheckCircleOutlined style={{ color: '#fff' }} />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card bordered={false} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                    <Statistic
                      title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>到货短少率</span>}
                      value={performance.summary.shortage_rate}
                      precision={1}
                      suffix="%"
                      valueStyle={{ color: '#fff' }}
                      prefix={<WarningOutlined style={{ color: '#fff' }} />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card bordered={false} style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                    <Statistic
                      title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>异常处理率</span>}
                      value={performance.summary.exception_resolve_rate}
                      precision={1}
                      suffix="%"
                      valueStyle={{ color: '#fff' }}
                      prefix={<ClockCircleOutlined style={{ color: '#fff' }} />}
                    />
                  </Card>
                </Col>
              </Row>
            </Card>

            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col xs={24} md={12}>
                <Card title="履约准时率趋势" extra={<Tag color="blue">{dateRange[0].format('MM-DD')} ~ {dateRange[1].format('MM-DD')}</Tag>}>
                  {trendData && trendData.length > 0 ? (
                    <ReactECharts option={getTrendChartOption(trendData)} style={{ height: 350 }} />
                  ) : (
                    <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                      暂无数据
                    </div>
                  )}
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Row gutter={16}>
                  <Col xs={24} style={{ marginBottom: 16 }}>
                    <Card title="异常单处理情况">
                      <ReactECharts option={getExceptionChartOption(performance)} style={{ height: 160 }} />
                    </Card>
                  </Col>
                  <Col xs={24}>
                    <Card title="到货短少率">
                      <ReactECharts option={getShortageChartOption(performance)} style={{ height: 160 }} />
                    </Card>
                  </Col>
                </Row>
              </Col>
            </Row>

            <Card title="详细统计数据" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col xs={24} sm={8}>
                  <Card size="small">
                    <Statistic
                      title="准时团单"
                      value={performance.summary.on_time_batches}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card size="small">
                    <Statistic
                      title="延迟团单"
                      value={performance.summary.delayed_batches}
                      valueStyle={{ color: '#faad14' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card size="small">
                    <Statistic
                      title="平均延迟时长"
                      value={performance.summary.avg_delay_hours}
                      precision={1}
                      suffix="小时"
                      valueStyle={{ color: '#faad14' }}
                    />
                  </Card>
                </Col>
              </Row>
              <Divider />
              <Row gutter={16}>
                <Col xs={24} sm={8}>
                  <Card size="small">
                    <Statistic
                      title="应到货商品总数"
                      value={performance.summary.total_expected_qty}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card size="small">
                    <Statistic
                      title="实际到货商品总数"
                      value={performance.summary.total_actual_qty}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card size="small">
                    <Statistic
                      title="短少商品总数"
                      value={performance.summary.total_shortage_qty}
                      valueStyle={{ color: '#ff4d4f' }}
                    />
                  </Card>
                </Col>
              </Row>
              <Divider />
              <Row gutter={16}>
                <Col xs={24} sm={8}>
                  <Card size="small">
                    <Statistic
                      title="异常单总数"
                      value={performance.summary.total_exceptions}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card size="small">
                    <Statistic
                      title="已结案异常单"
                      value={performance.summary.closed_exceptions}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card size="small">
                    <Statistic
                      title="未处理异常单"
                      value={performance.summary.total_exceptions - performance.summary.closed_exceptions}
                      valueStyle={{ color: '#faad14' }}
                    />
                  </Card>
                </Col>
              </Row>
            </Card>

            <Card
              title={
                <Space>
                  <InfoCircleOutlined />
                  <span>统计口径说明</span>
                </Space>
              }
              type="inner"
            >
              <Alert
                message="以下统计口径与导出Excel报表中的口径说明完全一致"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <div style={{ background: '#fafafa', padding: 16, borderRadius: 8 }}>
                {caliberItems.map((item, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 8 }}>
                    <Tag color="blue" style={{ marginRight: 8, flexShrink: 0 }}>{index + 1}</Tag>
                    <Text>{item}</Text>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </Spin>
    </div>
  )
}
