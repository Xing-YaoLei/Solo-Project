import client from './client'
import type { SeatingChart, Seat } from '../types'

export async function getSeatingChart(eventId: string): Promise<SeatingChart> {
  const { data } = await client.get(`/seats/chart/${eventId}`)
  return data
}

export async function getSeats(eventId: string): Promise<Seat[]> {
  const { data } = await client.get('/seats/', { params: { event_id: eventId } })
  return data
}
