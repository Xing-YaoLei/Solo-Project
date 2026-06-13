import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox, Text } from '@react-three/drei'
import * as THREE from 'three'
import type { Technician } from '@/types'

interface HandBadgeProps {
  technician: Technician
  position: [number, number, number]
  isSelected: boolean
  isMatched?: boolean
  onPointerDown?: (e: ThreeEvent) => void
}

type ThreeEvent = THREE.Event & { stopPropagation: () => void }

export function HandBadge({ technician, position, isSelected, isMatched = false, onPointerDown }: HandBadgeProps) {
  const groupRef = useRef<THREE.Group>(null)
  const materialRef = useRef<THREE.MeshStandardMaterial>(null)

  const targetScale = isSelected ? 1.1 : 1

  useFrame((state) => {
    if (!groupRef.current) return

    if (isMatched) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.05
      groupRef.current.scale.setScalar(pulse)
    } else {
      const current = groupRef.current.scale.x
      const next = THREE.MathUtils.lerp(current, targetScale, 0.1)
      groupRef.current.scale.setScalar(next)
    }

    if (materialRef.current) {
      const targetEmissive = isSelected || isMatched ? 0.5 : 0
      materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        materialRef.current.emissiveIntensity,
        targetEmissive,
        0.1
      )
    }
  })

  return (
    <group ref={groupRef} position={position} onPointerDown={onPointerDown}>
      <RoundedBox args={[0.6, 0.8, 0.1]} radius={0.05} smoothness={4}>
        <meshStandardMaterial
          ref={materialRef}
          color="#B76E79"
          metalness={0.8}
          roughness={0.2}
          emissive="#B76E79"
          emissiveIntensity={0}
        />
      </RoundedBox>
      <Text
        position={[0, 0.55, 0.06]}
        fontSize={0.1}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {technician.name}
      </Text>
      <Text
        position={[0, -0.55, 0.06]}
        fontSize={0.08}
        color="#FFFFF0"
        anchorX="center"
        anchorY="middle"
      >
        {technician.specialty}
      </Text>
    </group>
  )
}
