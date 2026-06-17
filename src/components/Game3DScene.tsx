import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier'
import { OrbitControls, Float, Text } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore } from '../store/gameStore'
import { elderlyProfiles } from '../data/elderlyProfiles'

function Pill({ position, color, scale = 1, animationEnabled, onClick }: { 
  position: [number, number, number]
  color: string
  scale?: number
  animationEnabled: boolean
  onClick?: () => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current && animationEnabled) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5
    }
  })

  return (
    <group position={position} scale={scale}>
      <RigidBody type="dynamic" colliders={false} mass={1}>
        <mesh ref={meshRef} onClick={onClick} castShadow>
          <capsuleGeometry args={[0.4, 0.8, 8, 16]} />
          <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
        </mesh>
        <CuboidCollider args={[0.4, 0.6, 0.4]} />
      </RigidBody>
    </group>
  )
}

function Heart({ position, scale = 1, isWarning = false, animationEnabled }: {
  position: [number, number, number]
  scale?: number
  isWarning?: boolean
  animationEnabled: boolean
}) {
  const groupRef = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    if (groupRef.current && animationEnabled) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1
      groupRef.current.scale.setScalar(pulse)
    }
  })

  const color = isWarning ? '#ff4757' : '#2ed573'

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <mesh>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color}
          emissiveIntensity={isWarning ? 0.5 : 0.2}
          transparent
          opacity={0.9}
        />
      </mesh>
      <mesh position={[0.15, 0.15, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color}
          emissiveIntensity={isWarning ? 0.5 : 0.2}
          transparent
          opacity={0.9}
        />
      </mesh>
      <mesh position={[-0.15, 0.15, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color}
          emissiveIntensity={isWarning ? 0.5 : 0.2}
          transparent
          opacity={0.9}
        />
      </mesh>
    </group>
  )
}

function ElderlyAvatar({ 
  position, 
  elderly, 
  status,
  animationEnabled,
  onClick 
}: {
  position: [number, number, number]
  elderly: typeof elderlyProfiles[0]
  status: 'healthy' | 'at_risk' | 'critical' | 'medication_due'
  animationEnabled: boolean
  onClick?: () => void
}) {
  const groupRef = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    if (groupRef.current && animationEnabled) {
      const bob = Math.sin(state.clock.elapsedTime * 1.5 + position[0]) * 0.05
      groupRef.current.position.y = position[1] + bob
    }
  })

  const bodyColor = status === 'critical' ? '#ff4757' : 
                   status === 'at_risk' ? '#ffa502' : 
                   status === 'medication_due' ? '#3742fa' : '#2ed573'

  const content = (
    <group position={position} onClick={onClick}>
      <group ref={groupRef}>
        <mesh position={[0, 0.8, 0]} castShadow>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshStandardMaterial color="#ffeaa7" />
        </mesh>
        
        <mesh position={[0, 0, 0]} castShadow>
          <capsuleGeometry args={[0.4, 0.8, 8, 16]} />
          <meshStandardMaterial color={bodyColor} />
        </mesh>
        
        <mesh position={[-0.15, 0.9, 0.4]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#2d3436" />
        </mesh>
        <mesh position={[0.15, 0.9, 0.4]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#2d3436" />
        </mesh>
        
        <Text
          position={[0, 1.5, 0]}
          fontSize={0.3}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {elderly.avatar} {elderly.name}
        </Text>
        
        {status === 'medication_due' && (
          <Heart position={[0.8, 0.5, 0]} isWarning animationEnabled={animationEnabled} />
        )}
        {status === 'at_risk' && (
          <Heart position={[0.8, 0.5, 0]} isWarning scale={1.2} animationEnabled={animationEnabled} />
        )}
        {status === 'critical' && (
          <Heart position={[0.8, 0.5, 0]} isWarning scale={1.5} animationEnabled={animationEnabled} />
        )}
      </group>
    </group>
  )

  return content
}

function Floor() {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.5, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#636e72" />
      </mesh>
    </RigidBody>
  )
}

function Wall({ position, rotation, size }: {
  position: [number, number, number]
  rotation: [number, number, number]
  size: [number, number]
}) {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh position={position} rotation={rotation} receiveShadow castShadow>
        <planeGeometry args={size} />
        <meshStandardMaterial color="#b2bec3" />
      </mesh>
    </RigidBody>
  )
}

function Room() {
  return (
    <group>
      <Floor />
      <Wall position={[0, 5, -15]} rotation={[0, 0, 0]} size={[30, 10]} />
      <Wall position={[-15, 5, 0]} rotation={[0, Math.PI / 2, 0]} size={[30, 10]} />
      <Wall position={[15, 5, 0]} rotation={[0, -Math.PI / 2, 0]} size={[30, 10]} />
      <Wall position={[0, 5, 15]} rotation={[0, Math.PI, 0]} size={[30, 10]} />
    </group>
  )
}

function SceneContent() {
  const { currentElderly, activeTasks, selectTaskOption } = useGameStore()
  const settings = useGameStore(state => state.settings)

  const elderlyPositions = useMemo(() => {
    const positions: [number, number, number][] = [
      [-8, 0, -5],
      [-3, 0, -8],
      [2, 0, -8],
      [7, 0, -5],
      [-5, 0, 5],
      [5, 0, 5]
    ]
    return positions
  }, [])

  const getElderlyStatus = (elderlyId: string) => {
    const task = activeTasks.find(t => t.elderlyId === elderlyId)
    if (!task) return 'healthy'
    if (task.type === 'risk_event') return 'critical'
    if (task.type === 'medication_reminder') return 'medication_due'
    return 'at_risk'
  }

  const handleElderlyClick = (elderlyId: string) => {
    const task = activeTasks.find(t => t.elderlyId === elderlyId)
    if (task) {
      selectTaskOption(task.id, task.correctOptionId)
    }
  }

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[10, 20, 10]} 
        intensity={1} 
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[-10, 10, -10]} intensity={0.5} color="#ffeaa7" />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#74b9ff" />

      <Room />

      {currentElderly.map((elderly, index) => (
        <ElderlyAvatar
          key={elderly.id}
          position={elderlyPositions[index]}
          elderly={elderly}
          status={getElderlyStatus(elderly.id)}
          animationEnabled={settings.animationEnabled}
          onClick={() => handleElderlyClick(elderly.id)}
        />
      ))}

      <Pill position={[-10, 3, 0]} color="#ff6b6b" scale={0.8} animationEnabled={settings.animationEnabled} />
      <Pill position={[10, 3, 0]} color="#4ecdc4" scale={0.8} animationEnabled={settings.animationEnabled} />
      <Pill position={[0, 3, 10]} color="#ffe66d" scale={0.8} animationEnabled={settings.animationEnabled} />

      <OrbitControls 
        enablePan={false}
        minDistance={10}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2.2}
      />
    </>
  )
}

export function Game3DScene() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 15, 20], fov: 50 }}
      gl={{ antialias: true }}
      style={{ position: 'absolute', top: 0, left: 0, zIndex: 0 }}
    >
      <color attach="background" args={['#2d3436']} />
      <fog attach="fog" args={['#2d3436', 20, 50]} />
      
      <Physics gravity={[0, -9.81, 0]} paused={false}>
        <SceneContent />
      </Physics>
    </Canvas>
  )
}
