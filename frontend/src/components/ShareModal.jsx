import React, { useState } from 'react'
import { Modal, Checkbox, Input, Button, message, Space, Form } from 'antd'
import { CopyOutlined, LinkOutlined } from '@ant-design/icons'
import { shareAPI } from '../utils/api'

const ShareModal = ({ open, onClose, chartType, chartTitle }) => {
  const [permissions, setPermissions] = useState({
    view_formula: true,
    view_raw_data: true,
    export_data: false
  })
  const [shareResult, setShareResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handlePermissionChange = (key) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleCreateShare = async () => {
    setLoading(true)
    try {
      const res = await shareAPI.createShare({
        chart_type: chartType,
        permissions: permissions,
        expire_hours: 72
      })
      setShareResult(res)
      message.success('分享链接已生成')
    } catch (err) {
      message.error('生成分享链接失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    if (shareResult) {
      const fullUrl = `${window.location.origin}/share/${shareResult.token}`
      navigator.clipboard.writeText(fullUrl)
      message.success('链接已复制到剪贴板')
    }
  }

  const handleClose = () => {
    setShareResult(null)
    onClose && onClose()
  }

  const permissionItems = [
    { key: 'view_formula', label: '显示完成率口径说明', desc: '接收方可查看完成率计算公式' },
    { key: 'view_raw_data', label: '查看明细数据', desc: '接收方可查看原始数据明细' },
    { key: 'export_data', label: '导出数据', desc: '接收方可导出图表数据' }
  ]

  return (
    <Modal
      title={`分享「${chartTitle || '图表'}」`}
      open={open}
      onCancel={handleClose}
      footer={null}
      width={480}
    >
      <div className="permission-check">
        <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>
          设置分享权限
        </div>
        {permissionItems.map(item => (
          <div key={item.key} className="check-item" style={{ marginBottom: 10 }}>
            <Checkbox
              checked={permissions[item.key]}
              onChange={() => handlePermissionChange(item.key)}
            >
              {item.label}
            </Checkbox>
            <div style={{ fontSize: 11, color: '#9ca3af', marginLeft: 24 }}>
              {item.desc}
            </div>
          </div>
        ))}
      </div>

      {!shareResult && (
        <div style={{ textAlign: 'right', marginTop: 20 }}>
          <Space>
            <Button onClick={handleClose}>取消</Button>
            <Button type="primary" onClick={handleCreateShare} loading={loading}>
              生成分享链接
            </Button>
          </Space>
        </div>
      )}

      {shareResult && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>
            分享链接
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Input
              value={`${window.location.origin}/share/${shareResult.token}`}
              readOnly
              prefix={<LinkOutlined style={{ color: '#9ca3af' }} />}
            />
            <Button type="primary" icon={<CopyOutlined />} onClick={handleCopyLink}>
              复制
            </Button>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: '#9ca3af' }}>
            链接有效期：72小时
          </div>
          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <Button type="primary" onClick={handleClose}>
              完成
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default ShareModal
