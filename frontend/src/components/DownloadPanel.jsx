import React, { useState } from 'react'
import { Button, Modal, DatePicker, Checkbox, message, Space } from 'antd'
import { DownloadOutlined, FileTextOutlined, InfoCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { settlementApi } from '../utils/api'

const { RangePicker } = DatePicker

const DownloadPanel = ({ merchantId }) => {
  const [modalVisible, setModalVisible] = useState(false)
  const [dateRange, setDateRange] = useState([dayjs().subtract(30, 'day'), dayjs()])
  const [includeRules, setIncludeRules] = useState(true)
  const [loading, setLoading] = useState(false)
  const [rulesModalVisible, setRulesModalVisible] = useState(false)
  const [rulesText, setRulesText] = useState('')

  const handleShowRules = async () => {
    try {
      const result = await settlementApi.getSettlementRules()
      setRulesText(result.rules)
      setRulesModalVisible(true)
    } catch (error) {
      message.error('获取规则失败')
    }
  }

  const handleDownload = async () => {
    if (!dateRange || dateRange.length !== 2) {
      message.warning('请选择日期范围')
      return
    }

    setLoading(true)
    try {
      const data = await settlementApi.downloadData({
        merchant_id: merchantId,
        start_date: dateRange[0].format('YYYY-MM-DD'),
        end_date: dateRange[1].format('YYYY-MM-DD'),
        include_rules: includeRules,
      })

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `结算数据_${dateRange[0].format('YYYYMMDD')}-${dateRange[1].format('YYYYMMDD')}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      message.success('下载成功')
      setModalVisible(false)
    } catch (error) {
      message.error('下载失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="download-section">
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={() => setModalVisible(true)}
        >
          下载结算数据
        </Button>
        <Button icon={<FileTextOutlined />} onClick={handleShowRules}>
          查看回款周期计算规则
        </Button>
      </div>

      <Modal
        title="下载结算数据"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={
          <Space>
            <Button onClick={() => setModalVisible(false)}>取消</Button>
            <Button type="primary" loading={loading} onClick={handleDownload}>
              确认下载
            </Button>
          </Space>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>选择日期范围:</div>
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates)}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <Checkbox checked={includeRules} onChange={(e) => setIncludeRules(e.target.checked)}>
            附带回款周期计算规则
            <InfoCircleOutlined
              style={{ marginLeft: 6, color: '#1890ff', cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation()
                handleShowRules()
              }}
            />
          </Checkbox>
        </div>
      </Modal>

      <Modal
        title="回款周期计算规则"
        open={rulesModalVisible}
        onCancel={() => setRulesModalVisible(false)}
        width={700}
        footer={[
          <Button key="close" onClick={() => setRulesModalVisible(false)}>
            关闭
          </Button>,
        ]}
        className="rules-modal"
      >
        <div className="rules-content">{rulesText}</div>
      </Modal>
    </>
  )
}

export default DownloadPanel
