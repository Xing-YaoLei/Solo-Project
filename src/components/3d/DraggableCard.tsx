import { useRef, useState, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox, Text } from '@react-three/drei'
import * as THREE from 'three'
import { useDrag } from '@/hooks/useDrag'
import type { ConsumptionRecord } from '@/types'

interface BadgePosition {
  technicianId: string
  position: [number, number, number]
}

interface DraggableCardProps {
  record: ConsumptionRecord
  position: [number, number, number]
  badgePositions: BadgePosition[]
  onMatch: (recordId: string, technicianId: string) => void
}

const MATCH_THRESHOLD = 1.2
const WRONG_FLASH_DURATION = 0.5

export function DraggableCard({ record, position, badgePositions, onMatch }: DraggableCardProps) {
  const groupRef = useRef<THREE.Group>(null)
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null)
  const [wrongFlash, setWrongFlash] = useState(false)
  const wrongTimerRef = useRef(0)
  const basePosition = useRef(new THREE.Vector3(...position))
  const dragPosition = useRef(new THREE.Vector3(...position))
  const isDraggingRef = useRef(false)

  const isMatched = record.status === 'matched'
  const isWrong = record.status === 'wrong'

  const handleDrag = useCallback((pos: THREE.Vector3) => {
    dragPosition.current.copy(pos)
  }, [])

  const handleDragEnd = useCallback((pos: THREE.Vector3) => {
    let closestDist = Infinity
    let closestTechId = ''

    for (const bp of badgePositions) {
      const dx = pos.x - bp.position[0]
      const dz = pos.z - bp.position[2]
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist < closestDist) {
        closestDist = dist
        closestTechId = bp.technicianId
      }
    }

    if (closestDist < MATCH_THRESHOLD && closestTechId) {
      onMatch(record.id, closestTechId)
    } else {
      dragPosition.current.copy(basePosition.current)
    }
  }, [badgePositions, onMatch, record.id])

  const { bind, isDragging } = useDrag({
    onDrag: handleDrag,
    onDragEnd: handleDragEnd,
  })

  useFrame((state, delta) => {
    if (!groupRef.current) return
    isDraggingRef.current = isDragging

    if (!isDragging && !isMatched) {
      const bob = Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.05
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, basePosition.current.x, 0.1)
      groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, basePosition.current.z, 0.1)
      groupRef.current.position.y = basePosition.current.y + bob
    } else if (isDragging) {
      groupRef.current.position.x = dragPosition.current.x
      groupRef.current.position.y = dragPosition.current.y + 0.3
      groupRef.current.position.z = dragPosition.current.z
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 10) * 0.02
    }

    if (!isDragging) {
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, 0.1)
    }

    if (isMatched && materialRef.current) {
      materialRef.current.opacity = THREE.MathUtils.lerp(materialRef.current.opacity, 0, 0.05)
      groupRef.current.scale.x = THREE.MathUtils.lerp(groupRef.current.scale.x, 0.8, 0.1)
      groupRef.current.scale.y = THREE.MathUtils.lerp(groupRef.current.scale.y, 0.8, 0.1)
    }

    if (isWrong && !wrongFlash) {
      setWrongFlash(true)
      wrongTimerRef.current = WRONG_FLASH_DURATION
    }

    if (wrongFlash) {
      wrongTimerRef.current -= delta
      if (wrongTimerRef.current <= 0) {
        setWrongFlash(false)
      }
    }
  })

  const cardColor = wrongFlash ? '#ff4444' : '#FFFFF0'
  const opacity = isMatched ? 0.15 : 0.85

  return (
    <group
      ref={groupRef}
      position={position}
      {...bind}
    >
      <RoundedBox args={[0.9, 1.2, 0.03]} radius={0.06} smoothness={4}>
        <meshPhysicalMaterial
          ref={materialRef}
          color={cardColor}
          transparent
          opacity={opacity}
          roughness={0.1}
          metalness={0.1}
          transmission={0.3}
          thickness={0.05}
          clearcoat={0.3}
        />
      </RoundedBox>
      <Text position={[0, 0.4, 0.02]} fontSize={0.11} color="#3E2723" anchorX="center" anchorY="middle" fontWeight="bold">
        {record.customerName}
      </Text>
      <Text position={[0, 0.1, 0.02]} fontSize={0.085} color="#B76E79" anchorX="center" anchorY="middle">
        {record.service}
      </Text>
      <Text position={[0, -0.25, 0.02]} fontSize={0.12} color="#FFBF00" anchorX="center" anchorY="middle" fontWeight="bold">
        {`¥${record.amount}`}
      </Text>
      <Text position={[0, -0.48, 0.02]} fontSize={0.06} color="#3E272388" anchorX="center" anchorY="middle">
        拖动匹配技师
      </Text>
    </group>
  )
}
