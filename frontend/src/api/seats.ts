import client, { isBackendUnavailable } from './client'
import type { SeatingChart, Seat } from '../types'
import { mockSeatingChart } from './mockData'

export async function getSeatingChart(eventId: string): Promise<SeatingChart> {
  try {
    const { data } = await client.get(`/seats/chart/${eventId}`)
    return data
  } catch (err) {
    if (isBackendUnavailable(err)) return mockSeatingChart
    throw err
  }
}

export async function getSeats(eventId: string): Promise<Seat[]> {
  try {
    const { data } = await client.get('/seats/', { params: { event_id: eventId } })
    return data
  } catch (err) {
    if (isBackendUnavailable(err)) return []
    throw err
  }
}
