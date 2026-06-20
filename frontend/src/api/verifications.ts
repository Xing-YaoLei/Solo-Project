import client, { isBackendUnavailable } from './client'
import type {
  VerificationTicket,
  CreateVerificationRequest,
  TransitionRequest,
  VerificationStatus,
  SourceType,
} from '../types'
import { mockVerifications } from './mockData'

export interface VerificationListParams {
  status?: VerificationStatus
  assignee?: string
  source?: SourceType
  event_id?: string
}

export async function getVerifications(
  params: VerificationListParams = {},
): Promise<VerificationTicket[]> {
  try {
    const { data } = await client.get('/verifications/', { params })
    return data
  } catch (err) {
    if (isBackendUnavailable(err)) {
      let list = [...mockVerifications]
      if (params.status) list = list.filter((v) => v.status === params.status)
      if (params.assignee)
        list = list.filter((v) => (v.assignee || '').includes(params.assignee!))
      if (params.source) list = list.filter((v) => v.source === params.source)
      if (params.event_id) list = list.filter((v) => v.event_id === params.event_id)
      return list
    }
    throw err
  }
}

export async function getVerification(id: string): Promise<VerificationTicket> {
  try {
    const { data } = await client.get(`/verifications/${id}`)
    return data
  } catch (err) {
    if (isBackendUnavailable(err)) {
      const found =
        mockVerifications.find((v) => v.id === id) || mockVerifications[0]
      return found
    }
    throw err
  }
}

export async function createVerification(
  payload: CreateVerificationRequest,
): Promise<VerificationTicket> {
  try {
    const { data } = await client.post('/verifications/', payload)
    return data
  } catch (err) {
    if (isBackendUnavailable(err)) {
      const newVf: VerificationTicket = {
        id: `vf-local-${Date.now()}`,
        ticket_no: payload.ticket_no || `VF-LOCAL-${Date.now()}`,
        event_id: payload.event_id,
        order_id: payload.order_id,
        seat_id: payload.seat_id || null,
        ticket_type_id: payload.ticket_type_id,
        status: 'pending',
        assignee: payload.assignee || null,
        source: payload.source || null,
        source_reference: payload.source_reference || null,
        verification_code: payload.verification_code || null,
        verified_at: null,
        closed_at: null,
        conclusion: null,
        dispute_reason: null,
        supplement_note: null,
        escalation_target: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      return newVf
    }
    throw err
  }
}

export async function transitionVerification(
  id: string,
  payload: TransitionRequest,
): Promise<VerificationTicket> {
  try {
    const { data } = await client.post(`/verifications/${id}/transition`, payload)
    return data
  } catch (err) {
    if (isBackendUnavailable(err)) {
      const base = mockVerifications.find((v) => v.id === id) || mockVerifications[0]
      return {
        ...base,
        status: payload.to_status,
        updated_at: new Date().toISOString(),
        closed_at: payload.to_status.startsWith('closed') ? new Date().toISOString() : base.closed_at,
        conclusion: payload.note || base.conclusion,
        dispute_reason: payload.dispute_reason || base.dispute_reason,
        supplement_note: payload.supplement_note || base.supplement_note,
        escalation_target: payload.escalation_target || base.escalation_target,
      }
    }
    throw err
  }
}
