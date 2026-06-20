import client, { isBackendUnavailable } from './client'
import type { TicketType } from '../types'
import { mockTicketTypes } from './mockData'

export async function getTicketTypes(eventId?: string): Promise<TicketType[]> {
  try {
    const { data } = await client.get('/ticket-types/', {
      params: eventId ? { event_id: eventId } : {},
    })
    return data
  } catch (err) {
    if (isBackendUnavailable(err)) {
      return eventId
        ? mockTicketTypes.filter((t) => t.event_id === eventId)
        : mockTicketTypes
    }
    throw err
  }
}
