import { useState } from 'react'
import { exportApi, ExportCaliber } from '../../api/export'

interface ExportType {
  key: string
  title: string
  description: string
  icon: string
}

const exportTypes: ExportType[] = [
  { key: 'elders', title: '老人档案', description: '导出所有在院/离院老人的基本信息、健康状况、护理等级等完整档案数据', icon: '👴' },
  { key: 'medications', title: '用药清单', description: '导出每位老人的用药明细，包括药品名称、剂量、频次、用药时间等', icon: '💊' },
  { key: 'visits', title: '探访记录', description: '导出家属探访记录，包括探访人、探访时间、探访内容等', icon: '👨‍👩‍👧' },
  { key: 'activities', title: '活动签到', description: '导出康复活动签到数据，统计每位老人的活动参与情况', icon: '🏃' },
  { key: 'risks', title: '风险事件', description: '导出跌倒、压疮等风险事件记录，包含事件类型、发生时间、处理措施', icon: '⚠️' },
  { key: 'incidents', title: '异常单', description: '导出严重事件异常单，包含影响范围、责任归属、处理结果等完整信息', icon: '📋' },
]

export default function ExportPage() {
  const [expandedCaliber, setExpandedCaliber] = useState<string | null>(null)
  const [caliberData, setCaliberData] = useState<Record<string, ExportCaliber>>({})
  const [loadingCaliber, setLoadingCaliber] = useState<string | null>(null)
  const [exporting, setExporting] = useState<string | null>(null)

  const handleToggleCaliber = async (exportType: string) => {
    if (expandedCaliber === exportType) {
      setExpandedCaliber(null)
      return
    }

    if (!caliberData[exportType]) {
      try {
        setLoadingCaliber(exportType)
        const res = await exportApi.getCaliber(exportType)
        setCaliberData((prev) => ({ ...prev, [exportType]: res.data }))
      } catch (err) {
        console.error('获取口径说明失败', err)
      } finally {
        setLoadingCaliber(null)
      }
    }

    setExpandedCaliber(exportType)
  }

  const handleExport = async (exportType: string, title: string) => {
    try {
      setExporting(exportType)
      const res = await exportApi.exportExcel(exportType)
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${title}_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('导出失败', err)
      alert('导出失败，请稍后重试')
    } finally {
      setExporting(null)
    }
  }

  const formatCaliberContent = (caliber: string, columns: string[]) => {
    return (
      <>
        <p style={{ marginBottom: '12px' }}>{caliber}</p>
        <p style={{ fontWeight: '600', marginBottom: '8px' }}>包含字段：</p>
        <ul style={{ marginLeft: '20px', lineHeight: '1.8' }}>
          {columns.map((col, index) => (
            <li key={index}>{col}</li>
          ))}
        </ul>
      </>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">数据导出</h1>
      </div>

      <div className="caliber-box">
        <div className="caliber-title">📌 关于数据口径</div>
        <div className="caliber-content">
          所有导出数据均按照统一标准统计，确保数据一致性和可追溯性。
          点击每张卡片下方的"查看口径"可了解详细的数据统计范围和字段说明，
          便于围绕护理达标向团队解释数据变化。
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        {exportTypes.map((item) => (
          <div key={item.key} className="card">
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.6', marginBottom: '16px' }}>
                  {item.description}
                </p>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleExport(item.key, item.title)}
                    disabled={exporting === item.key}
                  >
                    {exporting === item.key ? '导出中...' : '📥 导出 Excel'}
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => handleToggleCaliber(item.key)}
                    disabled={loadingCaliber === item.key}
                  >
                    {loadingCaliber === item.key
                      ? '加载中...'
                      : expandedCaliber === item.key
                      ? '收起口径'
                      : '📖 查看口径'}
                  </button>
                </div>
              </div>
            </div>

            {expandedCaliber === item.key && caliberData[item.key] && (
              <div
                className="caliber-box"
                style={{ marginTop: '16px', marginBottom: 0 }}
              >
                <div className="caliber-title">
                  📊 {caliberData[item.key].title} - 数据口径说明
                </div>
                <div className="caliber-content">
                  {formatCaliberContent(caliberData[item.key].caliber, caliberData[item.key].columns)}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
