import { useRef, useState } from 'react'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'

interface EvidencePointProps {
  position: [number, number, number]
  id: string
  isCorrect?: boolean
  onClick?: (id: string) => void
  radius?: number
  pulseSpeed?: number
}

export default function EvidencePoint({
  position,
  id,
  isCorrect = true,
  onClick,
  radius = 0.15,
  pulseSpeed = 2,
}: EvidencePointProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  const baseColor = isCorrect ? '#22c55e' : '#ef4444'
  const emissiveColor = isCorrect ? '#16a34a' : '#dc2626'

  useFrame((state) => {
    const time = state.clock.elapsedTime
    const pulse = 0.8 + Math.sin(time * pulseSpeed) * 0.2

    if (meshRef.current) {
      meshRef.current.scale.setScalar(pulse * (hovered ? 1.3 : 1))
      const material = meshRef.current.material as THREE.MeshStandardMaterial
      material.emissiveIntensity = 0.8 + Math.sin(time * pulseSpeed) * 0.4
    }

    if (ringRef.current) {
      ringRef.current.scale.setScalar(1 + Math.sin(time * pulseSpeed * 1.5) * 0.3)
      const material = ringRef.current.material as THREE.MeshBasicMaterial
      material.opacity = 0.6 - Math.sin(time * pulseSpeed * 1.5) * 0.3
    }
  })

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (onClick) {
      onClick(id)
    }
  }

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'auto'
        }}
      >
        <sphereGeometry args={[radius, 16, 16]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={emissiveColor}
          emissiveIntensity={1}
          roughness={0.3}
          metalness={0.5}
          transparent
          opacity={0.9}
        />
      </mesh>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius * 1.2, radius * 1.8, 32]} />
        <meshBasicMaterial
          color={baseColor}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      <pointLight color={baseColor} intensity={0.5} distance={2} decay={2} />
    </group>
  )
}
