import * as THREE from 'three'
import { Bed, Table, Chair, Sofa, Lamp } from './Furniture'
import { CuboidCollider } from '@react-three/rapier'

interface RoomProps {
  width?: number
  depth?: number
  height?: number
  wallColor?: string
  floorColor?: string
  showColliders?: boolean
}

interface WindowProps {
  position: [number, number, number]
  width?: number
  height?: number
  rotation?: [number, number, number]
}

function WindowFrame({
  position,
  width = 1.8,
  height = 1.4,
  rotation = [0, 0, 0],
}: WindowProps) {
  const frameThickness = 0.1
  const frameDepth = 0.15

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width + frameThickness * 2, frameThickness, frameDepth]} />
        <meshStandardMaterial color="#6b5344" roughness={0.7} />
      </mesh>
      <mesh position={[0, -height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width + frameThickness * 2, frameThickness, frameDepth]} />
        <meshStandardMaterial color="#6b5344" roughness={0.7} />
      </mesh>
      <mesh position={[-width / 2 - frameThickness / 2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[frameThickness, height + frameThickness * 2, frameDepth]} />
        <meshStandardMaterial color="#6b5344" roughness={0.7} />
      </mesh>
      <mesh position={[width / 2 + frameThickness / 2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[frameThickness, height + frameThickness * 2, frameDepth]} />
        <meshStandardMaterial color="#6b5344" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[width, height, 0.02]} />
        <meshStandardMaterial
          color="#87ceeb"
          transparent
          opacity={0.4}
          roughness={0.1}
          metalness={0.1}
          emissive="#aaddff"
          emissiveIntensity={0.2}
        />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.03, height, 0.02]} />
        <meshStandardMaterial color="#6b5344" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[width, 0.03, 0.02]} />
        <meshStandardMaterial color="#6b5344" roughness={0.7} />
      </mesh>
    </group>
  )
}

interface DoorProps {
  position: [number, number, number]
  rotation?: [number, number, number]
  width?: number
  height?: number
}

function Door({
  position,
  rotation = [0, 0, 0],
  width = 0.9,
  height = 2.1,
}: DoorProps) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.15, height + 0.1, 0.15]} />
        <meshStandardMaterial color="#6b5344" roughness={0.7} />
      </mesh>
      <mesh position={[0, -0.03, 0.02]} castShadow receiveShadow>
        <boxGeometry args={[width, height, 0.06]} />
        <meshStandardMaterial color="#8b6f4e" roughness={0.8} />
      </mesh>
      <mesh position={[width * 0.35, 0, 0.06]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color="#c9a87c" roughness={0.3} metalness={0.8} />
      </mesh>
    </group>
  )
}

interface BathroomProps {
  position: [number, number, number]
  width?: number
  depth?: number
}

function Bathroom({ position, width = 2.5, depth = 2 }: BathroomProps) {
  const wallHeight = 2.8
  const wallThickness = 0.15

  return (
    <group position={position}>
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[width, 0.05, depth]} />
        <meshStandardMaterial color="#e8e8e8" roughness={0.9} />
      </mesh>
      <mesh position={[0, wallHeight / 2, -depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, wallHeight, wallThickness]} />
        <meshStandardMaterial color="#f0ebe3" roughness={0.9} />
      </mesh>
      <mesh position={[-width / 2, wallHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[wallThickness, wallHeight, depth]} />
        <meshStandardMaterial color="#f0ebe3" roughness={0.9} />
      </mesh>
      <mesh position={[width / 2 - 0.3, wallHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[wallThickness, wallHeight, depth * 0.6]} />
        <meshStandardMaterial color="#f0ebe3" roughness={0.9} />
      </mesh>
      <mesh position={[width / 2 - 0.15, wallHeight / 2, depth * 0.35]} castShadow receiveShadow>
        <boxGeometry args={[0.3, wallHeight, wallThickness]} />
        <meshStandardMaterial color="#f0ebe3" roughness={0.9} />
      </mesh>
      <mesh position={[-width * 0.3, 0.4, -depth / 2 + 0.25]} castShadow receiveShadow>
        <boxGeometry args={[0.6, 0.8, 0.4]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} />
      </mesh>
      <mesh position={[-width * 0.3, 0.85, -depth / 2 + 0.1]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.15, 0.15]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>
      <mesh position={[width * 0.25, 0.9, -depth / 2 + 0.2]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.25, 0.8, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>
      <mesh position={[width * 0.25, 1.35, -depth / 2 + 0.2]} castShadow receiveShadow>
        <cylinderGeometry args={[0.25, 0.2, 0.15, 16]} />
        <meshStandardMaterial color="#e0e0e0" roughness={0.4} />
      </mesh>
      <mesh position={[0.3, 0.08, 0.2]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.05, 0.5]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
    </group>
  )
}

export default function Room({
  width = 10,
  depth = 8,
  height = 3,
  wallColor = '#f5e6d3',
  floorColor = '#d4b896',
  showColliders = false,
}: RoomProps) {
  const wallThickness = 0.2

  return (
    <group>
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[width, 0.1, depth]} />
        <meshStandardMaterial color={floorColor} roughness={0.9} />
      </mesh>

      <mesh position={[0, height, 0]} receiveShadow>
        <boxGeometry args={[width, 0.1, depth]} />
        <meshStandardMaterial color="#fff8f0" roughness={0.95} />
      </mesh>

      <mesh position={[0, height / 2, -depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, height, wallThickness]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>
      <WindowFrame position={[-width * 0.25, height * 0.55, -depth / 2 + wallThickness / 2]} />

      <mesh position={[0, height / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, height, wallThickness]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>

      <mesh position={[-width / 2, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[wallThickness, height, depth]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>
      <Door position={[-width / 2 + wallThickness / 2, height * 0.45, depth * 0.1]} rotation={[0, 0, 0]} />

      <mesh position={[width / 2, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[wallThickness, height, depth]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>

      <Bed position={[-width * 0.3, 0.05, -depth * 0.3]} rotation={[0, 0, 0]} />
      <Table position={[width * 0.25, 0, depth * 0.1]} rotation={[0, 0, 0]} />
      <Chair position={[width * 0.25, 0, depth * 0.35]} rotation={[0, Math.PI, 0]} />
      <Chair position={[width * 0.45, 0, depth * 0.1]} rotation={[0, -Math.PI / 2, 0]} />
      <Sofa position={[-width * 0.1, 0, depth * 0.35]} width={1.8} />
      <Lamp position={[width * 0.45, 0, -depth * 0.25]} />

      <Bathroom position={[width * 0.3, 0.05, -depth * 0.2]} width={2.5} depth={2} />

      <mesh position={[-width * 0.2, 0.7, depth * 0.15]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.05, 0.35]} />
        <meshStandardMaterial color="#2d5016" roughness={0.9} />
      </mesh>
      <mesh position={[-width * 0.2, 0.4, depth * 0.15]} castShadow receiveShadow>
        <cylinderGeometry args={[0.08, 0.12, 0.7, 8]} />
        <meshStandardMaterial color="#c9a87c" roughness={0.8} />
      </mesh>
      {[
        [-0.08, 0.78, 0.08],
        [0.08, 0.75, 0],
        [-0.05, 0.82, -0.08],
      ].map((pos, i) => (
        <mesh key={i} position={[-width * 0.2 + pos[0], 0.78 + pos[1] - 0.75, depth * 0.15 + pos[2]]} castShadow>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="#4a7c23" roughness={0.9} />
        </mesh>
      ))}

      <mesh position={[width * 0.1, 0.4, -depth * 0.35]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.8, 0.5]} />
        <meshStandardMaterial color="#8b6f4e" roughness={0.7} />
      </mesh>
      <mesh position={[width * 0.1, 0.4, -depth * 0.35]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.7, 0.45]} />
        <meshStandardMaterial color="#6b5344" roughness={0.7} />
      </mesh>
      {[0, 1].map((i) => (
        <mesh key={i} position={[width * 0.1 + (i - 0.5) * 0.4, 0.65, -depth * 0.35 + 0.23]} castShadow receiveShadow>
          <boxGeometry args={[0.3, 0.25, 0.02]} />
          <meshStandardMaterial color="#c9a87c" roughness={0.8} />
        </mesh>
      ))}

      <CuboidCollider args={[width / 2, 0.05, depth / 2]} position={[0, 0, 0]} />
      <CuboidCollider args={[width / 2, height / 2, wallThickness / 2]} position={[0, height / 2, -depth / 2]} />
      <CuboidCollider args={[width / 2, height / 2, wallThickness / 2]} position={[0, height / 2, depth / 2]} />
      <CuboidCollider args={[wallThickness / 2, height / 2, depth / 2]} position={[-width / 2, height / 2, 0]} />
      <CuboidCollider args={[wallThickness / 2, height / 2, depth / 2]} position={[width / 2, height / 2, 0]} />

      <CuboidCollider args={[1, 0.3, 1.1]} position={[-width * 0.3, 0.3, -depth * 0.3]} />
      <CuboidCollider args={[0.7, 0.4, 0.4]} position={[width * 0.25, 0.38, depth * 0.1]} />
      <CuboidCollider args={[0.9, 0.45, 0.45]} position={[-width * 0.1, 0.25, depth * 0.35]} />
      <CuboidCollider args={[1.25, 1.4, 1]} position={[width * 0.3, 1.4, -depth * 0.2]} />
    </group>
  )
}
