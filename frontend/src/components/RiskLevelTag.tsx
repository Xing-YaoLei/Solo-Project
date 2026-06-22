import React from 'react'
import { Tag } from 'antd'
import { RiskLevel } from '../types/enums'

const riskColorMap: Record<string, string> = {
  [RiskLevel.LOW]: 'green',
  [RiskLevel.MEDIUM]: 'orange',
  [RiskLevel.HIGH]: 'red',
  [RiskLevel.CRITICAL]: '#722ed1',
}

const riskTextMap: Record<string, string> = {
  [RiskLevel.LOW]: '低风险',
  [RiskLevel.MEDIUM]: '中风险',
  [RiskLevel.HIGH]: '高风险',
  [RiskLevel.CRITICAL]: '严重风险',
}

interface RiskLevelTagProps {
  level: RiskLevel | string
}

const RiskLevelTag: React.FC<RiskLevelTagProps> = ({ level }) => {
  const color = riskColorMap[level] || 'default'
  const text = riskTextMap[level] || level
  return (
    <Tag color={color} style={{ fontWeight: 500 }}>
      {text}
    </Tag>
  )
}

export default RiskLevelTag
