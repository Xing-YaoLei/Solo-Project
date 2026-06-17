import type {
  SettlementTrend,
  SettlementSummary,
  AssessmentScale,
  TrainingPrescription,
  TreatmentCalendarDay,
  TreatmentSession,
  EquipmentRecord,
  RejectionRecord,
  SavedView,
  ViewFilters,
} from '@/types'

const API_BASE = 'http://localhost:8000'

function delay<T>(data: T, ms = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms))
}

async function apiGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const query = new URLSearchParams()
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === '') continue
      query.append(k, String(v))
    }
  }
  const qs = query.toString()
  const full = `${API_BASE}${url}${qs ? `?${qs}` : ''}`
  const res = await fetch(full)
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

async function apiPost<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

async function apiPut<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

function toCamel<T>(obj: any): T {
  if (Array.isArray(obj)) {
    return obj.map(toCamel) as unknown as T
  }
  if (obj && typeof obj === 'object') {
    const out: any = {}
    for (const [k, v] of Object.entries(obj)) {
      const key = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
      out[key] = v && typeof v === 'object' ? toCamel<any>(v) : v
    }
    return out as T
  }
  return obj as T
}

function buildQueryParams(filters?: ViewFilters) {
  const params: Record<string, unknown> = {}
  let start = filters?.dateRange?.[0]
  let end = filters?.dateRange?.[1]
  if (start && new Date(start) > new Date('2025-12-31')) {
    start = '2025-01-01'
  }
  if (end && new Date(end) > new Date('2025-12-31')) {
    end = '2025-12-31'
  }
  if (start) params.start_date = start
  if (end) params.end_date = end
  if (filters?.department) params.department = filters.department
  if (filters?.therapist) params.therapist = filters.therapist
  if (filters?.rejectionStatus) params.rejection_status = filters.rejectionStatus
  if (filters?.completionRateRange) {
    params.completion_rate_min = filters.completionRateRange[0]
    params.completion_rate_max = filters.completionRateRange[1]
  }
  return params
}

export async function getSettlementTrend(
  granularity: 'month' | 'quarter' = 'month',
  filters?: ViewFilters,
): Promise<SettlementTrend[]> {
  try {
    const raw = await apiGet<any[]>(
      '/api/settlement/trend',
      {
        ...buildQueryParams(filters),
        granularity: granularity === 'quarter' ? 'quarterly' : 'monthly',
      },
    )
    return delay(toCamel<SettlementTrend[]>(raw))
  } catch (e) {
    console.warn('settlement trend API failed, using fallback calc', e)
    return delay([])
  }
}

export async function getSettlementSummary(
  filters?: ViewFilters,
): Promise<SettlementSummary> {
  try {
    const raw = await apiGet<any>('/api/settlement/summary', buildQueryParams(filters))
    const c = toCamel<any>(raw)
    return delay({
      totalSettled: c.totalSettled || 0,
      totalInsurance: c.totalInsurance || 0,
      totalSelfPaid: c.totalSelfPaid || 0,
      totalCount: c.totalCount || 0,
      avgPerCase: c.avgPerCase || 0,
      totalAmount: c.totalSettled || c.totalAmount || 0,
      rejectedAmount: c.rejectedAmount || 0,
      rejectedPendingAmount: c.rejectedPendingAmount || 0,
      rejectedProcessingAmount: c.rejectedProcessingAmount || 0,
      rejectedResolvedAmount: c.rejectedResolvedAmount || 0,
      rejectionRate: c.rejectionRate || 0,
      completionRate: c.completionRate || 0,
      totalAmountChange: c.totalAmountChange || 0,
      rejectedAmountChange: c.rejectedAmountChange || 0,
      rejectionRateChange: c.rejectionRateChange || 0,
      completionRateChange: c.completionRateChange || 0,
    })
  } catch (e) {
    console.warn('summary API failed', e)
    return delay({
      totalSettled: 0, totalInsurance: 0, totalSelfPaid: 0, totalCount: 0, avgPerCase: 0,
      totalAmount: 0, rejectedAmount: 0, rejectionRate: 0, completionRate: 0,
      rejectedPendingAmount: 0, rejectedProcessingAmount: 0, rejectedResolvedAmount: 0,
      totalAmountChange: 0, rejectedAmountChange: 0,
      rejectionRateChange: 0, completionRateChange: 0,
    })
  }
}

export async function getTrainingCompletion(
  filters?: ViewFilters,
): Promise<TrainingPrescription[]> {
  try {
    const params = buildQueryParams(filters)
    const raw = await apiGet<any[]>('/api/drilldown/prescriptions', params)
    const items = toCamel<any[]>(raw)
    return delay(items.map((p) => ({
      ...p,
      id: String(p.id),
      patientId: String(p.patientId),
      assessmentId: p.assessmentId ? String(p.assessmentId) : undefined,
    })))
  } catch (e) {
    console.warn('prescriptions API failed', e)
    return delay([])
  }
}

export async function getAssessmentScales(
  patientId?: string,
): Promise<AssessmentScale[]> {
  try {
    const params: Record<string, unknown> = {}
    if (patientId) params.patient_id = parseInt(patientId)
    const raw = await apiGet<any[]>('/api/drilldown/assessments', params)
    const items = toCamel<any[]>(raw)
    return delay(items.map((a) => ({
      ...a,
      id: String(a.id),
      patientId: String(a.patientId),
    })))
  } catch (e) {
    console.warn('assessments API failed', e)
    return delay([])
  }
}

export async function getTrainingPrescription(
  id: string,
): Promise<TrainingPrescription | undefined> {
  try {
    const pid = parseInt(id)
    const all = await apiGet<any[]>('/api/drilldown/prescriptions')
    const items = toCamel<any[]>(all)
    const found = items.find((p) => p.id === pid)
    if (!found) return delay(undefined)
    return delay({
      ...found,
      id: String(found.id),
      patientId: String(found.patientId),
      assessmentId: found.assessmentId ? String(found.assessmentId) : undefined,
    })
  } catch (e) {
    console.warn('prescription detail API failed', e)
    return delay(undefined)
  }
}

export async function getTreatmentCalendar(
  patientId: string,
  month: string,
  prescriptionId?: string,
): Promise<TreatmentCalendarDay[]> {
  try {
    const [y, m] = month.split('-').map(Number)
    const params: Record<string, unknown> = { year: y, month: m }
    if (patientId) params.patient_id = parseInt(patientId)
    if (prescriptionId) params.prescription_id = parseInt(prescriptionId)
    const raw = await apiGet<any[]>('/api/drilldown/calendar', params)
    const days = toCamel<any[]>(raw)
    return delay(days.map((d) => ({
      date: d.date,
      scheduledCount: d.scheduledCount || d.sessionCount || 0,
      completedCount: d.completedCount || 0,
      missedCount: d.missedCount || 0,
      rejectedCount: d.rejectedCount || 0,
      details: (d.details || []).map((s: any) => ({
        ...s,
        id: String(s.id),
        prescriptionId: s.prescriptionId ? String(s.prescriptionId) : undefined,
        equipmentRecords: (s.equipmentRecords || []).map((e: any) => ({
          ...e,
          id: String(e.id),
        })),
      })),
    })))
  } catch (e) {
    console.warn('calendar API failed', e)
    return delay([])
  }
}

function parseSessionIdToInt(sid: string): number | undefined {
  if (!sid) return undefined
  const pure = sid.replace(/^TS[_-]*/, '')
  const n = parseInt(pure, 10)
  return isNaN(n) ? undefined : n
}

export async function getPrescriptionSessions(
  prescriptionId: string,
  rangeStart: string,
  rangeEnd: string,
): Promise<TreatmentSession[]> {
  try {
    const pid = parseInt(prescriptionId)
    const startY = parseInt(rangeStart.slice(0, 4))
    const startM = parseInt(rangeStart.slice(5, 7))
    const endY = parseInt(rangeEnd.slice(0, 4))
    const endM = parseInt(rangeEnd.slice(5, 7))

    const all: TreatmentSession[] = []
    let y = startY
    let m = startM
    while (y < endY || (y === endY && m <= endM)) {
      const raw = await apiGet<any[]>('/api/drilldown/calendar', {
        year: y,
        month: m,
        prescription_id: pid,
      })
      const days = toCamel<any[]>(raw)
      for (const d of days) {
        for (const s of (d.details || [])) {
          all.push({
            ...s,
            id: String(s.id),
            prescriptionId: s.prescriptionId ? String(s.prescriptionId) : prescriptionId,
            equipmentRecords: (s.equipmentRecords || []).map((e: any) => ({
              ...e,
              id: String(e.id),
            })),
          })
        }
      }
      m++
      if (m > 12) { m = 1; y++ }
    }
    return delay(all)
  } catch (e) {
    console.warn('prescription sessions API failed', e)
    return delay([])
  }
}

export async function getEquipmentRecord(
  recordId: string,
): Promise<EquipmentRecord | undefined> {
  try {
    const sid = parseSessionIdToInt(recordId)
    const params: Record<string, unknown> = {}
    if (sid) params.session_id = sid
    const raw = await apiGet<any[]>('/api/drilldown/equipment', Object.keys(params).length ? params : undefined)
    const items = toCamel<any[]>(raw)
    const exactBySession = sid ? items.find((r) => parseSessionIdToInt(String(r.sessionId)) === sid) : undefined
    const first = exactBySession || items[0]
    if (!first) return delay(undefined)
    return delay({
      ...first,
      id: String(first.id),
      sessionId: first.sessionId ? String(first.sessionId) : recordId,
      parameters: first.parameters || null,
      recordDate: first.recordDate || first.treatmentDate || '',
    })
  } catch (e) {
    console.warn('equipment API failed', e)
    return delay(undefined)
  }
}

export async function getRejectionRecords(
  filters?: ViewFilters,
): Promise<RejectionRecord[]> {
  try {
    const params = buildQueryParams(filters)
    if (filters?.rejectionStatus) params.status = filters.rejectionStatus
    const raw = await apiGet<any[]>('/api/rejection/list', params)
    const items = toCamel<any[]>(raw)
    return delay(items.map((r) => ({
      ...r,
      id: String(r.id),
      settlementId: r.settlementId ? String(r.settlementId) : undefined,
      patientId: String(r.patientId),
      remarkTask: r.remarkTask ? {
        ...r.remarkTask,
        id: String(r.remarkTask.id),
        rejectionId: String(r.remarkTask.rejectionId),
      } : undefined,
    })))
  } catch (e) {
    console.warn('rejection list API failed', e)
    return delay([])
  }
}

export async function getRejectionReasons(
  filters?: ViewFilters,
): Promise<Array<{ name: string; value: number; count: number; pendingAmount: number; processingAmount: number; resolvedAmount: number }>> {
  try {
    const params = buildQueryParams(filters)
    if (filters?.rejectionStatus) params.status = filters.rejectionStatus
    const raw = await apiGet<any[]>('/api/rejection/reasons', params)
    const camel = toCamel<any[]>(raw)
    return delay(camel.map((r) => ({
      name: r.name || r.reason || '',
      value: r.value || r.totalAmount || 0,
      count: r.count || 0,
      pendingAmount: r.pendingAmount || 0,
      processingAmount: r.processingAmount || 0,
      resolvedAmount: r.resolvedAmount || 0,
    })))
  } catch (e) {
    console.warn('rejection reasons API failed', e)
    return delay([])
  }
}

export async function upsertRemarkTask(
  data: { rejectionId: string; content: string; assignedTo?: string; assignee?: string; status?: 'pending' | 'processing' | 'resolved' },
): Promise<RejectionRecord | undefined> {
  try {
    const rid = parseInt(data.rejectionId)
    const raw = await apiPost<any>('/api/rejection/remark-task', {
      rejection_id: rid,
      content: data.content,
      assigned_to: data.assignedTo || data.assignee || '当前用户',
      assignee: data.assignee || data.assignedTo || '当前用户',
      status: data.status || 'processing',
    })
    const r = toCamel<any>(raw)
    return delay({
      ...r,
      id: String(r.id),
      settlementId: r.settlementId ? String(r.settlementId) : undefined,
      patientId: String(r.patientId),
      remarkTask: r.remarkTask ? {
        ...r.remarkTask,
        id: String(r.remarkTask.id),
        rejectionId: String(r.remarkTask.rejectionId),
        assignee: r.remarkTask.assignee || r.remarkTask.assignedTo,
        assignedTo: r.remarkTask.assignedTo || r.remarkTask.assignee,
      } : undefined,
    })
  } catch (e) {
    console.warn('upsert remark task API failed', e)
    return delay(undefined)
  }
}

export async function createRemarkTask(
  rejectionId: string,
  data: { assignee: string; remark?: string },
): Promise<RejectionRecord> {
  const rid = parseInt(rejectionId)
  const raw = await apiPost<any>(`/api/rejection/${rid}/remark`, {
    remark: data.remark || '核实费用并补充材料',
    assignee: data.assignee,
  })
  const r = toCamel<any>(raw)
  return delay({
    ...r,
    id: String(r.id),
    settlementId: r.settlementId ? String(r.settlementId) : undefined,
    patientId: String(r.patientId),
    remarkTask: r.remarkTask ? {
      ...r.remarkTask,
      id: String(r.remarkTask.id),
      rejectionId: String(r.remarkTask.rejectionId),
    } : undefined,
  })
}

export async function updateConclusion(
  rejectionId: string,
  conclusion: string,
): Promise<RejectionRecord> {
  const rid = parseInt(rejectionId)
  const raw = await apiPut<any>(`/api/rejection/${rid}/conclusion`, { conclusion })
  const r = toCamel<any>(raw)
  return delay({
    ...r,
    id: String(r.id),
    settlementId: r.settlementId ? String(r.settlementId) : undefined,
    patientId: String(r.patientId),
    remarkTask: r.remarkTask ? {
      ...r.remarkTask,
      id: String(r.remarkTask.id),
      rejectionId: String(r.remarkTask.rejectionId),
    } : undefined,
  })
}

export async function getSavedViews(): Promise<SavedView[]> {
  try {
    const raw = await apiGet<any[]>('/api/views')
    const items = toCamel<any[]>(raw)
    const demoFilters = {
      dateRange: ['2025-01-01', '2025-12-31'],
    } as ViewFilters
    if (items.length === 0) {
      return delay([
        { id: 'SV_DEMO_1', name: '月度结算总览', owner: '当前用户', isShared: true, filters: demoFilters, createdAt: '2025-01-15' },
        { id: 'SV_DEMO_2', name: '神经康复-早会视图', owner: '张明远', isShared: true, filters: { ...demoFilters, department: '神经康复科' }, createdAt: '2025-02-01' },
        { id: 'SV_DEMO_3', name: '训练完成率看板', owner: '当前用户', isShared: false, filters: demoFilters, createdAt: '2025-02-10' },
      ])
    }
    return delay(items.map((v) => {
      const filters = v.filters || {
        dateRange: ['2025-01-01', '2025-12-31'],
      }
      return {
        id: String(v.id),
        name: v.name,
        owner: v.owner || '当前用户',
        isShared: !!v.isShared,
        filters,
        createdAt: v.createdAt ? String(v.createdAt).slice(0, 10) : '2025-01-01',
      }
    }))
  } catch (e) {
    console.warn('views list API failed, returning demo', e)
    return delay([
      { id: 'SV_DEMO_1', name: '月度结算总览', owner: '当前用户', isShared: true, filters: { dateRange: ['2025-01-01', '2025-12-31'] }, createdAt: '2025-01-15' },
      { id: 'SV_DEMO_2', name: '神经康复-早会视图', owner: '张明远', isShared: true, filters: { dateRange: ['2025-01-01', '2025-12-31'], department: '神经康复科' }, createdAt: '2025-02-01' },
    ])
  }
}

export async function saveView(view: SavedView): Promise<SavedView> {
  try {
    const config = JSON.stringify({ filters: view.filters })
    const raw = await apiPost<any>('/api/views', {
      name: view.name,
      config,
      owner: view.owner,
      is_shared: view.isShared,
    })
    const v = toCamel<any>(raw)
    return delay({
      ...view,
      id: String(v.id || view.id),
      createdAt: v.createdAt ? String(v.createdAt).slice(0, 10) : view.createdAt,
    })
  } catch (e) {
    console.warn('save view API failed, returning local', e)
    return delay(view)
  }
}

export async function loadView(id: string): Promise<SavedView | undefined> {
  try {
    const vid = parseInt(id)
    if (isNaN(vid)) {
      const all = await getSavedViews()
      return delay(all.find((v) => v.id === id))
    }
    const raw = await apiGet<any>(`/api/views/${vid}`)
    const v = toCamel<any>(raw)
    const filters = v.filters || { dateRange: ['2025-01-01', '2025-12-31'] }
    return delay({
      id: String(v.id),
      name: v.name,
      owner: v.owner || '当前用户',
      isShared: !!v.isShared,
      filters,
      createdAt: v.createdAt ? String(v.createdAt).slice(0, 10) : '2025-01-01',
    })
  } catch (e) {
    console.warn('load view API failed', e)
    return delay(undefined)
  }
}
