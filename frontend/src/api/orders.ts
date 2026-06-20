import client, { isBackendUnavailable } from './client'
import type { Order } from '../types'
import { mockOrders } from './mockData'

export async function getOrders(eventId?: string): Promise<Order[]> {
  try {
    const { data } = await client.get('/orders/', {
      params: eventId ? { event_id: eventId } : {},
    })
    return data
  } catch (err) {
    if (isBackendUnavailable(err)) {
      return eventId ? mockOrders.filter((o) => o.event_id === eventId) : mockOrders
    }
    throw err
  }
}
