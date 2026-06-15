import React from 'react'
import { Tooltip, Button, message } from 'antd'
import { ReloadOutlined, ShareAltOutlined, ClockCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const ChartCard = ({
  title,
  refreshTime,
  completionFormula,
  onRefresh,
  onShare,
  loading = false,
  children,
  extra = null
}) => {
  const handleShare = () => {
    if (onShare) {
      onShare()
    } else {
      message.info('分享功能开发中')
    }
  }

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div className="chart-title">{title}</div>
        <div className="chart-meta">
          {extra}
          {refreshTime && (
            <Tooltip title="最近刷新时间">
              <span className="refresh-time">
                <ClockCircleOutlined style={{ fontSize: 12 }} />
                {dayjs(refreshTime).format('MM-DD HH:mm')}
              </span>
            </Tooltip>
          )}
          {onRefresh && (
            <Tooltip title="刷新数据">
              <Button
                type="text"
                size="small"
                icon={<ReloadOutlined spin={loading} />}
                onClick={onRefresh}
              />
            </Tooltip>
          )}
          {onShare && (
            <Tooltip title="分享图表">
              <Button
                type="text"
                size="small"
                icon={<ShareAltOutlined />}
                onClick={handleShare}
              />
            </Tooltip>
          )}
        </div>
      </div>
      <div className="chart-body">{children}</div>
      {completionFormula && (
        <div className="completion-rate-note">* 完成率口径：{completionFormula}</div>
      )}
    </div>
  )
}

export default ChartCard
