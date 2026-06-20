import client from './client'
import type {
  VerificationTicket,
  CreateVerificationRequest,
  TransitionRequest,
  VerificationStatus,
  SourceType,
} from '../types'

export interface VerificationListParams {
  status?: VerificationStatus
  assignee?: string
  source?: SourceType
  event_id?: string
}

export async function getVerifications(
  params: VerificationListParams = {},
): Promise<VerificationTicket[]> {
  const { data } = await client.get('/verifications/', { params })
  return data
}

export async function getVerification(id: string): Promise<VerificationTicket> {
  const { data } = await client.get(`/verifications/${id}`)
  return data
}

export async function createVerification(
  payload: CreateVerificationRequest,
): Promise<VerificationTicket> {
  const { data } = await client.post('/verifications/', payload)
  return data
}

export async function transitionVerification(
  id: string,
  payload: TransitionRequest,
): Promise<VerificationTicket> {
  const { data } = await client.post(`/verifications/${id}/transition`, payload)
  return data
}
