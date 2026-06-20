import { useEffect, useState } from 'react'
import { Modal, Descriptions, Tag, Divider } from 'antd'
import { analyticsApi, MetricDefinition } from '../api/analytics'

interface Props {
  open: boolean
  metricCode: string | null
  onClose: () => void
}

const MetricDefinitionModal = ({ open, metricCode, onClose }: Props) => {
  const [metrics, setMetrics] = useState<MetricDefinition[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && metricCode) {
      setLoading(true)
      analyticsApi
        .getMetrics(metricCode)
        .then(setMetrics)
        .finally(() => setLoading(false))
    }
  }, [open, metricCode])

  const current = metrics[0]

  const categoryColor = (cat: string | null) => {
    if (!cat) return 'default'
    if (cat.includes('运营')) return 'blue'
    if (cat.includes('销售')) return 'green'
    if (cat.includes('财务')) return 'orange'
    if (cat.includes('风险')) return 'red'
    return 'default'
  }

  return (
    <Modal
      title={current ? `${current.metric_name} - 指标定义` : '指标定义'}
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
      destroyOnClose
    >
      {current && (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="指标编码">
            <code>{current.metric_code}</code>
          </Descriptions.Item>
          <Descriptions.Item label="指标名称">
            <strong>{current.metric_name}</strong>
            {current.category && (
              <Tag color={categoryColor(current.category)} style={{ marginLeft: 8 }}>
                {current.category}
              </Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="定义说明">{current.definition}</Descriptions.Item>
          {current.calculation_formula && (
            <Descriptions.Item label="计算公式">
              <code style={{ background: '#f5f5f5', padding: '4px 8px', borderRadius: 4 }}>
                {current.calculation_formula}
              </code>
            </Descriptions.Item>
          )}
          {current.unit && <Descriptions.Item label="单位">{current.unit}</Descriptions.Item>}
          {current.data_source && <Descriptions.Item label="数据来源">{current.data_source}</Descriptions.Item>}
          {current.refresh_frequency && (
            <Descriptions.Item label="刷新频率">{current.refresh_frequency}</Descriptions.Item>
          )}
          <Descriptions.Item label="版本">v{current.version}</Descriptions.Item>
        </Descriptions>
      )}
      <Divider style={{ margin: '16px 0 8px' }} />
      <p style={{ fontSize: 12, color: '#888', margin: 0 }}>
        该指标定义同步于 CSV 导出文件末尾的"指标定义"章节，确保运营经理下载数据后可追溯至统计口径。
      </p>
    </Modal>
  )
}

export default MetricDefinitionModal
