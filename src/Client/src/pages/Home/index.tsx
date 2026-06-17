import { useState, useEffect } from 'react'
import { Card, List, Spin, message } from 'antd'
import { getWeatherForecast } from '@/services/weather'
import type { WeatherForecast } from '@/types'
import { formatDate } from '@/utils/date'

function Home() {
  const [loading, setLoading] = useState(false)
  const [weatherData, setWeatherData] = useState<WeatherForecast[]>([])

  useEffect(() => {
    fetchWeatherData()
  }, [])

  const fetchWeatherData = async () => {
    setLoading(true)
    try {
      const data = await getWeatherForecast()
      setWeatherData(data)
    } catch (error) {
      message.error('获取天气数据失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card title="天气预报">
        <Spin spinning={loading}>
          <List
            dataSource={weatherData}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={formatDate(item.date)}
                  description={`${item.summary} - ${item.temperatureC}°C / ${item.temperatureF}°F`}
                />
              </List.Item>
            )}
          />
        </Spin>
      </Card>
    </div>
  )
}

export default Home
