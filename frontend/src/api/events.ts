import client, { isBackendUnavailable } from './client'
import type { Event } from '../types'
import { mockEvents } from './mockData'

export async function getEvents(): Promise<Event[]> {
  try {
    const { data } = await client.get('/events/')
    return data
  } catch (err) {
    if (isBackendUnavailable(err)) return mockEvents
    throw err
  }
}

export async function getEvent(id: string): Promise<Event> {
  try {
    const { data } = await client.get(`/events/${id}`)
    return data
  } catch (err) {
    if (isBackendUnavailable(err)) {
      return mockEvents.find((e) => e.id === id) || mockEvents[0]
    }
    throw err
  }
}
