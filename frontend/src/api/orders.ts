import client from './client'
import type { Order } from '../types'

export async function getOrders(eventId?: string, ticketTypeId?: string): Promise<Order[]> {
  const { data } = await client.get('/orders/', {
    params: {
      ...(eventId ? { event_id: eventId } : {}),
      ...(ticketTypeId ? { ticket_type_id: ticketTypeId } : {}),
    },
  })
  return data
}

export async function getOrder(id: string): Promise<Order> {
  const { data } = await client.get(`/orders/${id}`)
  return data
}
