import client, { isBackendUnavailable } from './client'
import type {
  EfficiencyStats,
  SourceGroupStats,
  AssigneeGroupStats,
  ConclusionGroupStats,
  SummaryFilterParams,
} from '../types'
import {
  mockEfficiency,
  mockSourceStats,
  mockAssigneeStats,
  mockConclusionStats,
} from './mockData'

export async function getEfficiencyStats(
  _filters: SummaryFilterParams = {},
): Promise<EfficiencyStats> {
  try {
    const { data } = await client.get('/summary/efficiency', { params: _filters })
    return data
  } catch (err) {
    if (isBackendUnavailable(err)) return mockEfficiency
    throw err
  }
}

export async function getSourceStats(
  _filters: SummaryFilterParams = {},
): Promise<SourceGroupStats[]> {
  try {
    const { data } = await client.get('/summary/by-source', { params: _filters })
    return data
  } catch (err) {
    if (isBackendUnavailable(err)) return mockSourceStats
    throw err
  }
}

export async function getAssigneeStats(
  _filters: SummaryFilterParams = {},
): Promise<AssigneeGroupStats[]> {
  try {
    const { data } = await client.get('/summary/by-assignee', { params: _filters })
    return data
  } catch (err) {
    if (isBackendUnavailable(err)) return mockAssigneeStats
    throw err
  }
}

export async function getConclusionStats(
  _filters: SummaryFilterParams = {},
): Promise<ConclusionGroupStats[]> {
  try {
    const { data } = await client.get('/summary/by-conclusion', { params: _filters })
    return data
  } catch (err) {
    if (isBackendUnavailable(err)) return mockConclusionStats
    throw err
  }
}
