import client from './client'
import type {
  EfficiencyStats,
  SourceGroupStats,
  AssigneeGroupStats,
  ConclusionGroupStats,
  SummaryFilterParams,
} from '../types'

export async function getEfficiencyStats(
  filters: SummaryFilterParams = {},
): Promise<EfficiencyStats> {
  const { data } = await client.get('/summary/efficiency', { params: filters })
  return data
}

export async function getSourceStats(
  filters: SummaryFilterParams = {},
): Promise<SourceGroupStats[]> {
  const { data } = await client.get('/summary/by-source', { params: filters })
  return data
}

export async function getAssigneeStats(
  filters: SummaryFilterParams = {},
): Promise<AssigneeGroupStats[]> {
  const { data } = await client.get('/summary/by-assignee', { params: filters })
  return data
}

export async function getConclusionStats(
  filters: SummaryFilterParams = {},
): Promise<ConclusionGroupStats[]> {
  const { data } = await client.get('/summary/by-conclusion', { params: filters })
  return data
}
