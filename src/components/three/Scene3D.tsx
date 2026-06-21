import { useRef, useState, useMemo, useEffect } from 'react'
import { useThree, ThreeEvent } from '@react-three/fiber'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { Text, Billboard, Line, Cylinder } from '@react-three/drei'
import * as THREE from 'three'
import type { HeatPoint } from '@/types'
import { heatPoints, guideRoutes, HEAT_COLORS, GRADE_COLORS } from '@/data/gameData'
import { useGameStore } from '@/store/gameStore'

interface Scene3DProps {
  onHeatPointClick: (heatPoint: HeatPoint, screenPos: { x: number; y: number }) => void
}

function Terrain() {
  return (
    <group>
      <RigidBody type="fixed" colliders={false} position={[0, 0, 0]}>
        <CuboidCollider args={[20, 0.5, 20]} position={[0, -0.5, 0]} />
        <mesh receiveShadow position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[40, 40, 50, 50]} />
          <meshStandardMaterial
            color="#1a3a2a"
            roughness={0.9}
            metalness={0.1}
          />
        </mesh>
      </RigidBody>

      {([
        { pos: [-12, 0.5, -10] as [number, number, number], scale: [1.5, 3, 1.5] as [number, number, number], color: '#1f5136' },
        { pos: [11, 0.6, -8] as [number, number, number], scale: [1.8, 3.6, 1.8] as [number, number, number], color: '#1f5136' },
        { pos: [-10, 0.4, 12] as [number, number, number], scale: [1.2, 2.4, 1.2] as [number, number, number], color: '#235a3d' },
        { pos: [13, 0.5, 10] as [number, number, number], scale: [1.6, 3.2, 1.6] as [number, number, number], color: '#1f5136' },
        { pos: [-14, 0.5, 2] as [number, number, number], scale: [1.4, 2.8, 1.4] as [number, number, number], color: '#235a3d' },
        { pos: [15, 0.4, -2] as [number, number, number], scale: [1.3, 2.6, 1.3] as [number, number, number], color: '#1f5136' },
      ] as const).map((tree, i) => (
        <group key={`tree-${i}`} position={tree.pos}>
          <mesh position={[0, -0.2, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.25, 0.6, 6]} />
            <meshStandardMaterial color="#5c4033" roughness={1} />
          </mesh>
          <mesh position={[0, tree.scale[1] / 2, 0]} castShadow>
            <coneGeometry args={[tree.scale[0] / 1.5, tree.scale[1], 8]} />
            <meshStandardMaterial color={tree.color} roughness={0.8} />
          </mesh>
        </group>
      ))}

      {([
        { pos: [-8, 0.02, -6] as [number, number, number], size: [3, 4] as [number, number], color: '#4a7c59' },
        { pos: [6, 0.02, -5] as [number, number, number], size: [2.5, 3] as [number, number], color: '#528d66' },
        { pos: [-4, 0.02, 8] as [number, number, number], size: [2, 2.5] as [number, number], color: '#4a7c59' },
        { pos: [9, 0.02, 5] as [number, number, number], size: [3.5, 3] as [number, number], color: '#528d66' },
      ] as const).map((pond, i) => (
        <mesh key={`pond-${i}`} position={pond.pos} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[pond.size[0] / 2, 32]} />
          <meshStandardMaterial
            color={pond.color}
            roughness={0.1}
            metalness={0.3}
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}
    </group>
  )
}

function HeatPointMarker({
  heatPoint,
  onClick,
}: {
  heatPoint: HeatPoint
  onClick: (e: ThreeEvent<MouseEvent>, hp: HeatPoint) => void
}) {
  const [hovered, setHovered] = useState(false)
  const meshRef = useRef<THREE.Mesh>(null)
  const color = HEAT_COLORS[heatPoint.heatLevel]

  const scaleMultiplier = useMemo(() => {
    switch (heatPoint.heatLevel) {
      case 'low': return 1
      case 'medium': return 1.15
      case 'high': return 1.3
      case 'critical': return 1.5
    }
  }, [heatPoint.heatLevel])

  useEffect(() => {
    let frame: number
    const startTime = Date.now()
    const animate = () => {
      if (meshRef.current) {
        const elapsed = (Date.now() - startTime) / 1000
        const pulse = 1 + Math.sin(elapsed * 2) * 0.15
        meshRef.current.scale.setScalar(scaleMultiplier * pulse * (hovered ? 1.3 : 1))
      }
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [scaleMultiplier, hovered])

  return (
    <group position={heatPoint.position}>
      <mesh
        ref={meshRef}
        position={[0, 0.8, 0]}
        onClick={(e) => {
          e.stopPropagation()
          onClick(e, heatPoint)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'auto'
        }}
        castShadow
      >
        <sphereGeometry args={[0.45, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          roughness={0.3}
          metalness={0.4}
          transparent
          opacity={0.9}
        />
      </mesh>

      <Cylinder
        position={[0, 0.05, 0]}
        args={[0.5, 0.6, 0.1, 32]}
        receiveShadow
      >
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          transparent
          opacity={0.4}
        />
      </Cylinder>

      <Billboard position={[0, 1.8, 0]}>
        <Text
          fontSize={0.28}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.03}
          outlineColor="#0A1628"
          font="https://fonts.gstatic.com/s/notosanssc/v36/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaG9_FnYxNbPzS5HE.woff2"
        >
          {heatPoint.name}
        </Text>
      </Billboard>
    </group>
  )
}

function RouteLines() {
  const selectedRouteId = useGameStore((s) => s.selectedRouteId)
  const phase = useGameStore((s) => s.phase)
  const selectedRoute = guideRoutes.find((r) => r.id === selectedRouteId)

  if (!selectedRoute || (phase !== 'route-select' && phase !== 'seat-assign' && phase !== 'feedback')) {
    return null
  }

  const routeColor =
    selectedRoute.riskLevel === 'safe' ? '#22c55e'
      : selectedRoute.riskLevel === 'moderate' ? '#eab308'
        : '#ef4444'

  return (
    <group>
      <Line
        points={selectedRoute.nodePositions}
        color={routeColor}
        lineWidth={4}
        transparent
        opacity={0.6}
      />
      {selectedRoute.nodePositions.map((pos, i) => (
        <mesh key={`node-${i}`} position={pos} castShadow>
          <octahedronGeometry args={[0.18, 0]} />
          <meshStandardMaterial
            color={routeColor}
            emissive={routeColor}
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
    </group>
  )
}

function PerformanceStage() {
  const seats = useGameStore((s) => s.seats)
  const ROWS = 5
  const COLS = 8
  const seatSpacing = 0.6

  return (
    <group position={[0, 0, -7]}>
      <mesh position={[0, 0.05, -2]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 4]} />
        <meshStandardMaterial color="#2a1a3a" roughness={0.7} />
      </mesh>

      <mesh position={[0, 0.4, -3.5]} castShadow>
        <boxGeometry args={[5, 0.8, 1.5]} />
        <meshStandardMaterial color="#4a3560" roughness={0.6} />
      </mesh>

      <mesh position={[0, 1.4, -3.5]}>
        <boxGeometry args={[4.6, 1.2, 0.1]} />
        <meshStandardMaterial
          color="#FF6B35"
          emissive="#FF6B35"
          emissiveIntensity={0.4}
        />
      </mesh>

      <Billboard position={[0, 2.4, -3.5]}>
        <Text
          fontSize={0.35}
          color="#F5C542"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.04}
          outlineColor="#0A1628"
        >
          山水实景演出
        </Text>
      </Billboard>

      <group position={[-(COLS - 1) * seatSpacing / 2, 0.2, 0]}>
        {Array.from({ length: ROWS }, (_, r) =>
          Array.from({ length: COLS }, (_, c) => {
            const seat = seats[r * COLS + c]
            if (!seat) return null
            const color = GRADE_COLORS[seat.grade]
            const assigned = seat.assigned

            return (
              <group
                key={`stage-seat-${seat.seatId}`}
                position={[c * seatSpacing, 0, r * seatSpacing * 1.1]}
              >
                <mesh position={[0, 0, 0]} receiveShadow>
                  <boxGeometry args={[0.5, 0.08, 0.5]} />
                  <meshStandardMaterial
                    color={assigned ? color : '#3a3a4a'}
                    emissive={assigned ? color : '#000000'}
                    emissiveIntensity={assigned ? 0.3 : 0}
                    roughness={0.7}
                  />
                </mesh>
                <mesh position={[0, 0.25, -0.2]} receiveShadow>
                  <boxGeometry args={[0.5, 0.4, 0.1]} />
                  <meshStandardMaterial
                    color={assigned ? color : '#3a3a4a'}
                    emissive={assigned ? color : '#000000'}
                    emissiveIntensity={assigned ? 0.25 : 0}
                    roughness={0.7}
                  />
                </mesh>
              </group>
            )
          })
        )}
      </group>
    </group>
  )
}

export default function Scene3D({ onHeatPointClick }: Scene3DProps) {
  const { camera, gl } = useThree()
  const setPhase = useGameStore((s) => s.setPhase)
  const phase = useGameStore((s) => s.phase)

  const handleHeatPointClick = useMemo(() => {
    return (e: ThreeEvent<MouseEvent>, hp: HeatPoint) => {
      const rect = gl.domElement.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      onHeatPointClick(hp, { x, y })

      if (phase === 'observing') {
        setPhase('route-select')
      }
    }
  }, [gl, onHeatPointClick, phase, setPhase])

  return (
    <group>
      <Terrain />
      <PerformanceStage />

      {heatPoints.map((hp) => (
        <HeatPointMarker
          key={hp.id}
          heatPoint={hp}
          onClick={handleHeatPointClick}
        />
      ))}

      <RouteLines />

      <ambientLight intensity={0.3} />

      <primitive object={camera} />
      {null}
    </group>
  )
}
