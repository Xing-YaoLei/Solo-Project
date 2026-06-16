import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Float, Environment, RoundedBox } from '@react-three/drei'
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'

function Shelf({ position, rotation = [0, 0, 0], color = '#8b6914' }) {
  return (
    <group position={position} rotation={rotation}>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2.5, 0.08, 0.6]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[-1.2, -0.5, 0]}>
          <boxGeometry args={[0.08, 1, 0.6]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[1.2, -0.5, 0]}>
          <boxGeometry args={[0.08, 1, 0.6]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
      </RigidBody>
    </group>
  )
}

function MedicineBox({ position, color, delay = 0 }) {
  const ref = useRef()
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5 + delay) * 0.1
    }
  })
  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <RigidBody type="dynamic" restitution={0.3} friction={0.8}>
        <mesh ref={ref} position={position} castShadow>
          <boxGeometry args={[0.25, 0.35, 0.18]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </RigidBody>
    </Float>
  )
}

function Counter() {
  return (
    <group position={[0, 0, 2]}>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 0.5, 0]} receiveShadow>
          <boxGeometry args={[5, 1, 1.2]} />
          <meshStandardMaterial color="#2d3748" roughness={0.4} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 1.05, 0]}>
          <boxGeometry args={[5, 0.1, 1.2]} />
          <meshStandardMaterial color="#4a5568" roughness={0.3} metalness={0.1} />
        </mesh>
      </RigidBody>
      <Text
        position={[0, 1.3, 0.62]}
        fontSize={0.25}
        color="#60a5fa"
        anchorX="center"
        anchorY="middle"
      >
        🏥 会员慢病服务中心
      </Text>
    </group>
  )
}

function Floor() {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#1a202c" />
      </mesh>
    </RigidBody>
  )
}

function Walls() {
  return (
    <group>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 3, -5]} receiveShadow>
          <boxGeometry args={[20, 6, 0.2]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[-10, 3, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
          <boxGeometry args={[12, 6, 0.2]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[10, 3, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
          <boxGeometry args={[12, 6, 0.2]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      </RigidBody>
    </group>
  )
}

function AnimatedCharacter({ position, color = '#60a5fa' }) {
  const groupRef = useRef()
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.05
    }
  })
  return (
    <group ref={groupRef} position={position}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#fcd5b5" />
      </mesh>
      <mesh position={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[0.4, 0.6, 0.25]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, -0.25, 0]} castShadow>
        <boxGeometry args={[0.35, 0.3, 0.2]} />
        <meshStandardMaterial color="#1e3a5f" />
      </mesh>
    </group>
  )
}

function TaskIndicator({ position, type, urgency }) {
  const ref = useRef()
  const color = urgency === 'danger' ? '#ef4444' : urgency === 'warning' ? '#fbbf24' : '#60a5fa'
  
  useFrame((state) => {
    if (ref.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.15
      ref.current.scale.set(scale, scale, scale)
    }
  })

  return (
    <Float speed={3} rotationIntensity={0.5} floatIntensity={0.5}>
      <group ref={ref} position={position}>
        <mesh>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={urgency === 'danger' ? 0.8 : 0.4}
            transparent
            opacity={0.8}
          />
        </mesh>
        <Text
          position={[0, 0, 0.31]}
          fontSize={0.25}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {type === 'prescription' ? '📋' : type === 'pharmacist' ? '👨‍⚕️' : '📦'}
        </Text>
      </group>
    </Float>
  )
}

function SceneContent({ currentTask, taskUrgency }) {
  const medicineColors = useMemo(() =>
    ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'],
    []
  )

  const shelfPositions = [
    { pos: [-7, 0.9, -3], rot: [0, Math.PI / 4, 0] },
    { pos: [-7, 0.2, -3], rot: [0, Math.PI / 4, 0] },
    { pos: [7, 0.9, -3], rot: [0, -Math.PI / 4, 0] },
    { pos: [7, 0.2, -3], rot: [0, -Math.PI / 4, 0] },
    { pos: [0, 0.9, -4.5], rot: [0, 0, 0] },
    { pos: [0, 0.2, -4.5], rot: [0, 0, 0] },
  ]

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-5, 4, 2]} intensity={0.8} color="#60a5fa" />
      <pointLight position={[5, 4, 2]} intensity={0.8} color="#f59e0b" />

      <Floor />
      <Walls />
      <Counter />

      {shelfPositions.map((shelf, i) => (
        <Shelf key={i} position={shelf.pos} rotation={shelf.rot} />
      ))}

      {medicineColors.map((color, i) => (
        <MedicineBox
          key={i}
          position={[
            -6.5 + (i % 4) * 0.3,
            1.2,
            -3 + Math.floor(i / 4) * 0.2,
          ]}
          color={color}
          delay={i * 0.3}
        />
      ))}

      {medicineColors.slice(0, 4).map((color, i) => (
        <MedicineBox
          key={`shelf2-${i}`}
          position={[
            6.5 - (i % 4) * 0.3,
            1.2,
            -3 + Math.floor(i / 4) * 0.2,
          ]}
          color={medicineColors[i + 4]}
          delay={i * 0.4 + 1}
        />
      ))}

      <AnimatedCharacter position={[-1.5, 0, 1]} color="#10b981" />
      <AnimatedCharacter position={[1.5, 0, 1]} color="#f59e0b" />
      <AnimatedCharacter position={[0, 0, -2]} color="#8b5cf6" />

      {currentTask && (
        <TaskIndicator
          position={[0, 2.2, 0.5]}
          type={currentTask.type}
          urgency={taskUrgency}
        />
      )}

      <OrbitControls
        enablePan={false}
        minDistance={6}
        maxDistance={15}
        maxPolarAngle={Math.PI / 2.2}
        target={[0, 1, 0]}
      />
    </>
  )
}

export default function PharmacyScene({ currentTask, taskUrgency }) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 5, 10], fov: 50 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#0f172a']} />
      <fog attach="fog" args={['#0f172a', 12, 25]} />
      <Physics gravity={[0, -9.81, 0]}>
        <SceneContent currentTask={currentTask} taskUrgency={taskUrgency} />
      </Physics>
    </Canvas>
  )
}
