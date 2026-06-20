import client from './client'
import type { TicketType } from '../types'

export async function getTicketTypes(eventId?: string): Promise<TicketType[]> {
  const { data } = await client.get('/ticket-types/', {
    params: eventId ? { event_id: eventId } : {},
  })
  return data
}

export async function getTicketType(id: string): Promise<TicketType> {
  const { data } = await client.get(`/ticket-types/${id}`)
  return data
}
