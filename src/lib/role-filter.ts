import type {
  TrendDataPoint,
  GradeComposition,
  MaterialDetail,
  CampusCardRecord,
  AdvisorAnomaly,
  Role,
  RoleScope,
} from './types'

export function filterTrendData(
  data: TrendDataPoint[],
  scope: RoleScope
): TrendDataPoint[] {
  if (scope.role === 'admin') return data
  if (scope.role === 'dean') {
    const factor = scope.department === '计算机科学学院' ? 0.35
      : scope.department === '数学与统计学院' ? 0.25
      : scope.department === '经济管理学院' ? 0.22
      : 0.18
    return data.map((d) => ({
      ...d,
      count: Math.round(d.count * factor),
      riskScore: Math.round(d.riskScore * factor * 10) / 10,
    }))
  }
  if (scope.role === 'advisor') {
    return data.map((d) => ({
      ...d,
      count: Math.max(1, Math.round(d.count * 0.05)),
      riskScore: Math.round(d.riskScore * 0.05 * 10) / 10,
    }))
  }
  return data.map((d) => ({
    ...d,
    count: Math.min(d.count, 1),
    riskScore: d.riskScore > 0 ? 1 : 0,
  }))
}

export function filterGradeComposition(
  data: GradeComposition[],
  scope: RoleScope
): GradeComposition[] {
  if (scope.role === 'admin') return data
  if (scope.role === 'dean') {
    const factor = scope.department === '计算机科学学院' ? 0.3
      : scope.department === '数学与统计学院' ? 0.25
      : scope.department === '经济管理学院' ? 0.25
      : 0.2
    const filtered = data.map((d) => ({
      ...d,
      count: Math.round(d.count * factor),
    }))
    const total = filtered.reduce((s, d) => s + d.count, 0)
    return filtered.map((d) => ({
      ...d,
      percentage: Math.round((d.count / total) * 100),
    }))
  }
  if (scope.role === 'advisor') {
    const factor = 0.08
    const filtered = data.map((d) => ({
      ...d,
      count: Math.max(1, Math.round(d.count * factor)),
    }))
    const total = filtered.reduce((s, d) => s + d.count, 0)
    return filtered.map((d) => ({
      ...d,
      percentage: Math.round((d.count / total) * 100),
    }))
  }
  return data.map((d) => ({
    ...d,
    count: 1,
    percentage: 20,
  }))
}

export function filterMaterialDetails(
  data: MaterialDetail[],
  scope: RoleScope
): MaterialDetail[] {
  if (scope.role === 'admin') return data
  if (scope.role === 'dean') {
    const deptStudents = scope.department === '计算机科学学院'
      ? ['2022010001', '2022010002']
      : scope.department === '数学与统计学院'
        ? ['2022010003']
        : scope.department === '经济管理学院'
          ? ['2022010004']
          : ['2022010005', '2022010006']
    return data.filter((d) => deptStudents.includes(d.studentId))
  }
  if (scope.role === 'advisor') {
    return data.filter((d) =>
      ['2022010001', '2022010003'].includes(d.studentId)
    )
  }
  return data.filter((d) => d.studentId === '2022010001')
}

export function filterCampusCardRecords(
  data: CampusCardRecord[],
  scope: RoleScope
): CampusCardRecord[] {
  if (scope.role === 'admin') return data
  if (scope.role === 'dean') {
    const deptStudents = scope.department === '计算机科学学院'
      ? ['2022010001', '2022010002']
      : scope.department === '数学与统计学院'
        ? ['2022010003']
        : scope.department === '经济管理学院'
          ? ['2022010004']
          : ['2022010005', '2022010006']
    return data.filter((d) => deptStudents.includes(d.studentId))
  }
  if (scope.role === 'advisor') {
    return data.filter((d) =>
      ['2022010001', '2022010003'].includes(d.studentId)
    )
  }
  return data.filter((d) => d.studentId === '2022010001')
}

export function filterAdvisorAnomalies(
  data: AdvisorAnomaly[],
  scope: RoleScope
): AdvisorAnomaly[] {
  if (scope.role === 'admin') return data
  if (scope.role === 'dean') {
    return data.filter((d) => d.department === scope.department)
  }
  if (scope.role === 'advisor') {
    return data.filter((d) => d.advisorId === (scope.advisorId || 'T001'))
  }
  return []
}
