import * as XLSX from 'xlsx'
import dayjs from 'dayjs'

const INVENTORY_RULES = [
  ['库存周转计算规则说明'],
  [''],
  ['规则项', '计算方式', '说明'],
  ['库存天数', '当前日期 - 入库日期', '车辆在库停留的自然天数'],
  ['库存周转天数', '统计期内平均库存 / 统计期内销售数量 * 统计天数', '反映库存流转效率'],
  ['库龄分级(正常)', '库存天数 ≤ 30天', '建议正常推进销售流程'],
  ['库龄分级(预警)', '30天 < 库存天数 ≤ 60天', '建议关注并优化销售策略'],
  ['库龄分级(呆滞)', '库存天数 > 60天', '建议重点处理，考虑降价或促销'],
  ['动销率', '统计期内销售数量 / 期初库存数量 * 100%', '反映库存活跃程度'],
  [''],
  ['导出时间', dayjs().format('YYYY-MM-DD HH:mm:ss')]
]

export function exportToExcel(data, fileName, sheetName = 'Sheet1', includeRules = false) {
  const wb = XLSX.utils.book_new()
  const wsData = prepareData(data)
  const ws = XLSX.utils.aoa_to_sheet(wsData)

  ws['!cols'] = calculateColumns(wsData)
  XLSX.utils.book_append_sheet(wb, ws, sheetName)

  if (includeRules) {
    const rulesWs = XLSX.utils.aoa_to_sheet(INVENTORY_RULES)
    rulesWs['!cols'] = [{ wch: 25 }, { wch: 40 }, { wch: 40 }]
    XLSX.utils.book_append_sheet(wb, rulesWs, '周转规则说明')
  }

  const timestamp = dayjs().format('YYYYMMDD_HHmmss')
  const finalName = `${fileName}_${timestamp}.xlsx`
  XLSX.writeFile(wb, finalName)
  return finalName
}

function prepareData(data) {
  if (!data || data.length === 0) return [['无数据']]
  if (Array.isArray(data[0])) return data
  const headers = Object.keys(data[0])
  const rows = data.map(item => headers.map(h => formatCell(item[h])))
  return [headers, ...rows]
}

function formatCell(value) {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return dayjs(value).format('YYYY-MM-DD HH:mm:ss')
  if (typeof value === 'object') return JSON.stringify(value)
  return value
}

function calculateColumns(data) {
  if (!data.length) return []
  const colCount = data[0].length
  const cols = []
  for (let i = 0; i < colCount; i++) {
    let maxLen = 10
    for (const row of data) {
      const cell = String(row[i] || '')
      maxLen = Math.max(maxLen, cell.length)
    }
    cols.push({ wch: Math.min(maxLen + 2, 50) })
  }
  return cols
}

export function downloadFile(url, fileName) {
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function generateShareContent(data, type = 'funnel') {
  if (type === 'funnel') {
    return {
      title: `漏斗数据报告 - ${dayjs().format('YYYY-MM-DD')}`,
      stages: data.stages,
      summary: {
        total: data.stages?.[0]?.count || 0,
        success: data.stages?.[data.stages.length - 1]?.count || 0,
        conversionRate: data.stages?.length > 1
          ? ((data.stages[data.stages.length - 1]?.count || 0) / (data.stages[0]?.count || 1) * 100).toFixed(2) + '%'
          : '0%'
      },
      exportTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }
  }
  return data
}
