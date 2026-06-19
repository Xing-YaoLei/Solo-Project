import { useState, useMemo } from 'react'
import { ThreeEvent } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

export type TaskStatus = 'completed' | 'inProgress' | 'delayed' | 'none'

interface CalendarTask {
  date: string
  status: TaskStatus
  taskName?: string
}

interface Calendar3DProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  year?: number
  month?: number
  tasks?: CalendarTask[]
  onDateSelect?: (date: string, task?: CalendarTask) => void
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  completed: '#22c55e',
  inProgress: '#f97316',
  delayed: '#ef4444',
  none: '#f5f5f5',
}

const STATUS_EMISSIVE: Record<TaskStatus, string> = {
  completed: '#16a34a',
  inProgress: '#ea580c',
  delayed: '#dc2626',
  none: '#d4d4d4',
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

export default function Calendar3D({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  year = new Date().getFullYear(),
  month = new Date().getMonth(),
  tasks = [],
  onDateSelect,
}: Calendar3DProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)

  const calendarData = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startWeekday = firstDay.getDay()

    const days: Array<{ day: number | null; dateKey: string | null }> = []

    for (let i = 0; i < startWeekday; i++) {
      days.push({ day: null, dateKey: null })
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      days.push({ day, dateKey })
    }

    const rows = Math.ceil(days.length / 7)
    return { days, rows }
  }, [year, month])

  const taskMap = useMemo(() => {
    const map = new Map<string, CalendarTask>()
    tasks.forEach((task) => map.set(task.date, task))
    return map
  }, [tasks])

  const cellSize = 0.55
  const gap = 0.08
  const headerHeight = 0.7
  const weekdayHeaderHeight = 0.35
  const totalWidth = 7 * cellSize + 6 * gap
  const totalHeight = headerHeight + weekdayHeaderHeight + calendarData.rows * cellSize + (calendarData.rows - 1) * gap + 0.4

  const handleDateClick = (e: ThreeEvent<MouseEvent>, dateKey: string, task?: CalendarTask) => {
    e.stopPropagation()
    setSelectedDate(dateKey)
    if (onDateSelect) {
      onDateSelect(dateKey, task)
    }
  }

  const handlePointerOver = (e: ThreeEvent<PointerEvent>, dateKey: string) => {
    e.stopPropagation()
    setHoveredDate(dateKey)
    document.body.style.cursor = 'pointer'
  }

  const handlePointerOut = () => {
    setHoveredDate(null)
    document.body.style.cursor = 'auto'
  }

  const monthName = `${year}年${month + 1}月`

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, totalHeight / 2 - 0.2, -0.05]} receiveShadow>
        <boxGeometry args={[totalWidth + 0.6, totalHeight + 0.4, 0.1]} />
        <meshStandardMaterial color="#faf8f5" roughness={0.9} />
      </mesh>

      <mesh position={[0, totalHeight / 2 - 0.2, -0.08]} receiveShadow>
        <boxGeometry args={[totalWidth + 0.8, totalHeight + 0.6, 0.05]} />
        <meshStandardMaterial color="#c9a87c" roughness={0.8} />
      </mesh>

      <Text
        position={[0, totalHeight - 0.4, 0.01]}
        fontSize={0.32}
        color="#5a4a3a"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {monthName}
      </Text>

      {WEEKDAYS.map((weekday, i) => {
        const x = -totalWidth / 2 + cellSize / 2 + i * (cellSize + gap)
        const y = totalHeight - headerHeight - weekdayHeaderHeight / 2
        const isWeekend = i === 0 || i === 6
        return (
          <Text
            key={weekday}
            position={[x, y, 0.01]}
            fontSize={0.18}
            color={isWeekend ? '#dc2626' : '#5a4a3a'}
            anchorX="center"
            anchorY="middle"
          >
            {weekday}
          </Text>
        )
      })}

      {calendarData.days.map((dayData, index) => {
        if (!dayData.day || !dayData.dateKey) return null

        const row = Math.floor(index / 7)
        const col = index % 7
        const x = -totalWidth / 2 + cellSize / 2 + col * (cellSize + gap)
        const y = totalHeight - headerHeight - weekdayHeaderHeight - cellSize / 2 - row * (cellSize + gap)
        const isWeekend = col === 0 || col === 6
        const task = taskMap.get(dayData.dateKey)
        const status: TaskStatus = task?.status ?? 'none'
        const isSelected = selectedDate === dayData.dateKey
        const isHovered = hoveredDate === dayData.dateKey
        const isToday = dayData.dateKey === new Date().toISOString().split('T')[0]

        return (
          <group key={dayData.dateKey}>
            <mesh
              position={[x, y, 0]}
              onClick={(e) => handleDateClick(e, dayData.dateKey!, task)}
              onPointerOver={(e) => handlePointerOver(e, dayData.dateKey!)}
              onPointerOut={handlePointerOut}
              castShadow
            >
              <boxGeometry
                args={[
                  cellSize,
                  cellSize,
                  isSelected ? 0.12 : isHovered ? 0.08 : status !== 'none' ? 0.06 : 0.04,
                ]}
              />
              <meshStandardMaterial
                color={STATUS_COLORS[status]}
                emissive={isSelected || isHovered ? STATUS_EMISSIVE[status] : STATUS_EMISSIVE[status]}
                emissiveIntensity={isSelected ? 0.6 : isHovered ? 0.4 : status !== 'none' ? 0.2 : 0}
                roughness={0.7}
              />
            </mesh>

            {isToday && (
              <mesh position={[x, y, 0.07]}>
                <ringGeometry args={[cellSize * 0.38, cellSize * 0.44, 32]} />
                <meshBasicMaterial color="#2563eb" side={THREE.DoubleSide} />
              </mesh>
            )}

            <Text
              position={[x, y + 0.08, 0.08]}
              fontSize={0.16}
              color={isWeekend ? '#dc2626' : status !== 'none' ? '#ffffff' : '#3d3d3d'}
              anchorX="center"
              anchorY="middle"
              fontWeight={isSelected || isToday ? 'bold' : 'normal'}
            >
              {dayData.day}
            </Text>

            {task?.taskName && (
              <Text
                position={[x, y - 0.12, 0.08]}
                fontSize={0.08}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
                maxWidth={cellSize - 0.08}
                textAlign="center"
              >
                {task.taskName}
              </Text>
            )}
          </group>
        )
      })}
    </group>
  )
}
