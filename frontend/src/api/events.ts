import client from './client'
import type { Event } from '../types'

export async function getEvents(): Promise<Event[]> {
  const { data } = await client.get('/events/')
  return data
}

export async function getEvent(id: string): Promise<Event> {
  const { data } = await client.get(`/events/${id}`)
  return data
}
