import request from '@/utils/request'
import type { WeatherForecast } from '@/types'

export function getWeatherForecast(): Promise<WeatherForecast[]> {
  return request.get('/WeatherForecast')
}
