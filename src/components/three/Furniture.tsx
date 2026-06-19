import * as THREE from 'three'

interface FurnitureProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
}

interface BedProps extends FurnitureProps {
  width?: number
  height?: number
  depth?: number
}

export function Bed({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  width = 2,
  height = 0.6,
  depth = 2.2,
}: BedProps) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, height * 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height * 0.8, depth]} />
        <meshStandardMaterial color="#8b6f4e" roughness={0.8} />
      </mesh>
      <mesh position={[0, height * 0.85, 0]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.95, height * 0.3, depth * 0.95]} />
        <meshStandardMaterial color="#f5e6d3" roughness={0.9} />
      </mesh>
      <mesh position={[0, height * 1.05, -depth * 0.35]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.85, height * 0.15, depth * 0.45]} />
        <meshStandardMaterial color="#e8d5b7" roughness={0.9} />
      </mesh>
      <mesh position={[0, height * 1.25, -depth * 0.48]} castShadow receiveShadow>
        <boxGeometry args={[width, height * 0.8, 0.1]} />
        <meshStandardMaterial color="#6b5344" roughness={0.7} />
      </mesh>
    </group>
  )
}

interface TableProps extends FurnitureProps {
  width?: number
  height?: number
  depth?: number
}

export function Table({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  width = 1.4,
  height = 0.75,
  depth = 0.8,
}: TableProps) {
  const legSize = 0.08
  const legOffsetX = (width - legSize) / 2
  const legOffsetZ = (depth - legSize) / 2

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, height, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, 0.06, depth]} />
        <meshStandardMaterial color="#a0826d" roughness={0.7} />
      </mesh>
      {[
        [-legOffsetX, legOffsetZ],
        [legOffsetX, legOffsetZ],
        [-legOffsetX, -legOffsetZ],
        [legOffsetX, -legOffsetZ],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, height / 2, z]} castShadow receiveShadow>
          <boxGeometry args={[legSize, height, legSize]} />
          <meshStandardMaterial color="#8b6f4e" roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

interface ChairProps extends FurnitureProps {
  color?: string
}

export function Chair({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  color = '#c9a87c',
}: ChairProps) {
  const seatHeight = 0.45
  const seatSize = 0.45
  const legSize = 0.05
  const backHeight = 0.5

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, seatHeight, 0]} castShadow receiveShadow>
        <boxGeometry args={[seatSize, 0.05, seatSize]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0, seatHeight + backHeight / 2, -seatSize / 2 + 0.025]} castShadow receiveShadow>
        <boxGeometry args={[seatSize, backHeight, 0.05]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {[
        [-seatSize / 2 + legSize / 2, seatSize / 2 - legSize / 2],
        [seatSize / 2 - legSize / 2, seatSize / 2 - legSize / 2],
        [-seatSize / 2 + legSize / 2, -seatSize / 2 + legSize / 2],
        [seatSize / 2 - legSize / 2, -seatSize / 2 + legSize / 2],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, seatHeight / 2, z]} castShadow receiveShadow>
          <boxGeometry args={[legSize, seatHeight, legSize]} />
          <meshStandardMaterial color="#6b5344" roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

interface SofaProps extends FurnitureProps {
  width?: number
}

export function Sofa({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  width = 2.2,
}: SofaProps) {
  const depth = 0.9
  const seatHeight = 0.4
  const backHeight = 0.5

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, seatHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, seatHeight, depth]} />
        <meshStandardMaterial color="#8b7355" roughness={0.85} />
      </mesh>
      <mesh position={[0, seatHeight + backHeight / 2, -depth / 2 + 0.1]} castShadow receiveShadow>
        <boxGeometry args={[width, backHeight, 0.2]} />
        <meshStandardMaterial color="#8b7355" roughness={0.85} />
      </mesh>
      <mesh position={[-width / 2 + 0.1, seatHeight + backHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.2, backHeight, depth]} />
        <meshStandardMaterial color="#8b7355" roughness={0.85} />
      </mesh>
      <mesh position={[width / 2 - 0.1, seatHeight + backHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.2, backHeight, depth]} />
        <meshStandardMaterial color="#8b7355" roughness={0.85} />
      </mesh>
      {[-0.5, 0, 0.5].map((offset, i) => (
        <mesh key={i} position={[offset * (width * 0.5), seatHeight + 0.12, 0.05]} castShadow receiveShadow>
          <boxGeometry args={[width * 0.28, 0.15, depth * 0.65]} />
          <meshStandardMaterial color="#a0826d" roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

interface LampProps extends FurnitureProps {
  color?: string
}

export function Lamp({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  color = '#ffd699',
}: LampProps) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.15, 0.18, 0.04, 16]} />
        <meshStandardMaterial color="#5a4a3a" roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.45, 8]} />
        <meshStandardMaterial color="#5a4a3a" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.55, 0]} castShadow>
        <coneGeometry args={[0.2, 0.3, 16, 1, true]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          side={THREE.DoubleSide}
          roughness={0.9}
          transparent
          opacity={0.85}
        />
      </mesh>
      <pointLight position={[0, 0.5, 0]} intensity={0.5} color={color} distance={4} decay={2} />
    </group>
  )
}

export default { Bed, Table, Chair, Sofa, Lamp }
