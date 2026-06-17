import React, { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import { Physics, RigidBody, CapsuleCollider, CuboidCollider } from '@react-three/rapier'
import { useGameStore, EQUIPMENT_TYPES, PATIENT_TYPES } from '../store/useGameStore'

function Floor() {
  return (
    <RigidBody type="fixed" position={[0, -0.5, 0]}>
      <CuboidCollider args={[20, 0.5, 20]} />
      <mesh receiveShadow>
        <boxGeometry args={[20, 1, 20]} />
        <meshStandardMaterial color="#2a3f5f" />
      </mesh>
    </RigidBody>
  )
}

function Walls() {
  return (
    <group>
      <mesh position={[0, 3, -10]} receiveShadow>
        <boxGeometry args={[20, 6, 0.5]} />
        <meshStandardMaterial color="#3a5070" />
      </mesh>
      <mesh position={[-10, 3, 0]} receiveShadow>
        <boxGeometry args={[0.5, 6, 20]} />
        <meshStandardMaterial color="#3a5070" />
      </mesh>
      <mesh position={[10, 3, 0]} receiveShadow>
        <boxGeometry args={[0.5, 6, 20]} />
        <meshStandardMaterial color="#3a5070" />
      </mesh>
    </group>
  )
}

function ReplayEquipment({ equipment, currentTime }) {
  const groupRef = useRef()
  
  const type = Object.values(EQUIPMENT_TYPES).find(t => t.id === equipment.type)
  const baseColor = equipment.isOccupied ? '#666666' : (type?.color || '#888888')
  const glowIntensity = equipment.isOccupied ? 0.2 : 0.8
  
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.lerp({ x: equipment.position[0], y: equipment.position[1], z: equipment.position[2] }, 0.1)
    }
  })
  
  const renderEquipmentModel = () => {
    switch (equipment.type) {
      case 'treadmill':
        return (
          <group>
            <mesh position={[0, 0.4, 0]} castShadow>
              <boxGeometry args={[1.2, 0.8, 2.5]} />
              <meshStandardMaterial color={baseColor} emissive={baseColor} emissiveIntensity={glowIntensity * 0.2} />
            </mesh>
            <mesh position={[0, 0.05, 0.3]} castShadow>
              <boxGeometry args={[1, 0.1, 1.5]} />
              <meshStandardMaterial color="#333333" />
            </mesh>
            <mesh position={[0.5, 1, -1]} castShadow>
              <cylinderGeometry args={[0.05, 0.05, 1.2]} />
              <meshStandardMaterial color="#444444" />
            </mesh>
            <mesh position={[0.5, 1.5, -1]} castShadow>
              <boxGeometry args={[0.6, 0.3, 0.1]} />
              <meshStandardMaterial color="#1a1a2e" emissive="#4facfe" emissiveIntensity={glowIntensity} />
            </mesh>
          </group>
        )
      
      case 'exercise_bike':
        return (
          <group>
            <mesh position={[0, 0.5, 0]} castShadow>
              <boxGeometry args={[0.8, 1, 1.5]} />
              <meshStandardMaterial color={baseColor} emissive={baseColor} emissiveIntensity={glowIntensity * 0.2} />
            </mesh>
            <mesh position={[0, 1.2, -0.5]} castShadow>
              <boxGeometry args={[0.6, 0.8, 0.3]} />
              <meshStandardMaterial color="#333333" />
            </mesh>
            <mesh position={[0.8, 0.8, 0]} castShadow>
              <torusGeometry args={[0.4, 0.08, 8, 16]} />
              <meshStandardMaterial color="#555555" />
            </mesh>
            <mesh position={[-0.3, 0.6, 0.6]} castShadow>
              <cylinderGeometry args={[0.03, 0.03, 1, 8]} />
              <meshStandardMaterial color="#444444" />
            </mesh>
          </group>
        )
      
      case 'dumbbell':
        return (
          <group>
            <mesh position={[0, 0.6, 0]} castShadow>
              <boxGeometry args={[1.5, 1.2, 0.5]} />
              <meshStandardMaterial color={baseColor} emissive={baseColor} emissiveIntensity={glowIntensity * 0.2} />
            </mesh>
            {[-0.4, 0, 0.4].map((x, i) => (
              <group key={i} position={[x, 0.8 + i * 0.15, 0]}>
                <mesh castShadow>
                  <cylinderGeometry args={[0.04, 0.04, 0.5]} />
                  <meshStandardMaterial color="#888888" />
                </mesh>
                <mesh position={[0, 0, 0.3]} castShadow>
                  <sphereGeometry args={[0.15, 16, 16]} />
                  <meshStandardMaterial color="#333333" />
                </mesh>
                <mesh position={[0, 0, -0.3]} castShadow>
                  <sphereGeometry args={[0.15, 16, 16]} />
                  <meshStandardMaterial color="#333333" />
                </mesh>
              </group>
            ))}
          </group>
        )
      
      case 'pulley':
        return (
          <group>
            <mesh position={[0, 2, 0]} castShadow>
              <boxGeometry args={[1.5, 0.2, 0.3]} />
              <meshStandardMaterial color={baseColor} emissive={baseColor} emissiveIntensity={glowIntensity * 0.2} />
            </mesh>
            <mesh position={[-0.6, 1, 0]} castShadow>
              <boxGeometry args={[0.2, 2, 0.3]} />
              <meshStandardMaterial color={baseColor} />
            </mesh>
            <mesh position={[0.6, 1, 0]} castShadow>
              <boxGeometry args={[0.2, 2, 0.3]} />
              <meshStandardMaterial color={baseColor} />
            </mesh>
            <mesh position={[0, 1.2, 0.2]} castShadow>
              <cylinderGeometry args={[0.02, 0.02, 1]} />
              <meshStandardMaterial color="#cccccc" />
            </mesh>
            <mesh position={[0, 0.7, 0.2]} castShadow>
              <boxGeometry args={[0.4, 0.15, 0.15]} />
              <meshStandardMaterial color="#555555" />
            </mesh>
          </group>
        )
      
      case 'parallel_bars':
        return (
          <group>
            {[-0.4, 0.4].map((x, i) => (
              <group key={i}>
                <mesh position={[x, 1.5, 0]} castShadow>
                  <boxGeometry args={[0.1, 0.1, 2.5]} />
                  <meshStandardMaterial color={baseColor} emissive={baseColor} emissiveIntensity={glowIntensity * 0.2} />
                </mesh>
                <mesh position={[x, 0.75, -1]} castShadow>
                  <boxGeometry args={[0.15, 1.5, 0.15]} />
                  <meshStandardMaterial color={baseColor} />
                </mesh>
                <mesh position={[x, 0.75, 1]} castShadow>
                  <boxGeometry args={[0.15, 1.5, 0.15]} />
                  <meshStandardMaterial color={baseColor} />
                </mesh>
              </group>
            ))}
          </group>
        )
      
      case 'ultrasound':
        return (
          <group>
            <mesh position={[0, 0.6, 0]} castShadow>
              <boxGeometry args={[1, 1.2, 0.8]} />
              <meshStandardMaterial color={baseColor} emissive={baseColor} emissiveIntensity={glowIntensity * 0.2} />
            </mesh>
            <mesh position={[0, 1.3, 0]} castShadow>
              <boxGeometry args={[0.7, 0.5, 0.5]} />
              <meshStandardMaterial color="#1a1a2e" emissive="#00CED1" emissiveIntensity={glowIntensity * 0.5} />
            </mesh>
            <mesh position={[0, 1.3, 0.1]} castShadow>
              <sphereGeometry args={[0.1, 16, 16]} />
              <meshStandardMaterial color="#00CED1" emissive="#00CED1" emissiveIntensity={glowIntensity} />
            </mesh>
          </group>
        )
      
      default:
        return (
          <mesh position={[0, 0.5, 0]} castShadow>
            <boxGeometry args={[1.5, 1, 1.5]} />
            <meshStandardMaterial color={baseColor} />
          </mesh>
        )
    }
  }
  
  return (
    <group ref={groupRef} position={equipment.position}>
      {renderEquipmentModel()}
      
      <Text
        position={[0, -0.3, 0]}
        fontSize={0.25}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        rotation={[-Math.PI / 2, 0, 0]}
      >
        {equipment.name}
      </Text>
      
      {equipment.isOccupied && (
        <Text
          position={[0, 2, 0]}
          fontSize={0.2}
          color="#ff6b6b"
          anchorX="center"
          anchorY="middle"
        >
          使用中: {Math.ceil(equipment.usageTime)}s
        </Text>
      )}
    </group>
  )
}

function ReplayPatient({ patient, currentTime }) {
  const groupRef = useRef()
  const bodyMaterialRef = useRef()
  const errorFlashRef = useRef(0)
  
  const patientType = Object.values(PATIENT_TYPES).find(t => t.id === patient.type)
  const requiredEq = Object.values(EQUIPMENT_TYPES).find(e => e.id === patient.requiredEquipment)
  
  const headColor = patientType?.color || '#ffccaa'
  
  const statusColor = {
    waiting: '#ffd93d',
    treatment: '#6bcb77',
    completed: '#4d96ff',
  }[patient.status] || '#ffffff'
  
  useFrame((_, delta) => {
    if (!groupRef.current) return
    
    let targetPos = [...patient.position]
    
    if (patient.targetEquipmentPosition) {
      targetPos = patient.targetEquipmentPosition
    }
    
    const current = groupRef.current.position
    const speed = 3
    groupRef.current.position.x += (targetPos[0] - current.x) * speed * delta
    groupRef.current.position.z += (targetPos[2] - current.z) * speed * delta
    
    if (patient.isAttemptingWrong) {
      errorFlashRef.current += delta * 8
      if (bodyMaterialRef.current) {
        const flashIntensity = (Math.sin(errorFlashRef.current) + 1) / 2
        bodyMaterialRef.current.color.setStyle(`rgb(255, ${Math.floor(107 * flashIntensity)}, ${Math.floor(107 * flashIntensity)})`)
        bodyMaterialRef.current.emissive.setStyle(`rgb(255, ${Math.floor(0)}, ${Math.floor(0)})`)
        bodyMaterialRef.current.emissiveIntensity = flashIntensity * 0.8
      }
    } else {
      if (bodyMaterialRef.current) {
        bodyMaterialRef.current.color.setStyle(statusColor)
        bodyMaterialRef.current.emissive.setStyle(statusColor)
        bodyMaterialRef.current.emissiveIntensity = 0.2
      }
    }
  })
  
  return (
    <group ref={groupRef} position={patient.position}>
      <RigidBody type="dynamic" position={[0, 1, 0]}>
        <CapsuleCollider args={[0.8, 0.3]} />
      </RigidBody>
      
      <group position={[0, 0, 0]}>
        <mesh position={[0, 1.2, 0]} castShadow>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color={headColor} />
        </mesh>
        
        <mesh position={[0, 0.6, 0]} castShadow>
          <capsuleGeometry args={[0.25, 0.8, 4, 8]} />
          <meshStandardMaterial 
            ref={bodyMaterialRef}
            color={statusColor} 
            emissive={statusColor}
            emissiveIntensity={0.2}
          />
        </mesh>
        
        <mesh position={[-0.25, 0.6, 0]} castShadow>
          <capsuleGeometry args={[0.08, 0.6, 4, 8]} />
          <meshStandardMaterial color={headColor} />
        </mesh>
        <mesh position={[0.25, 0.6, 0]} castShadow>
          <capsuleGeometry args={[0.08, 0.6, 4, 8]} />
          <meshStandardMaterial color={headColor} />
        </mesh>
        
        <mesh position={[-0.12, 0.1, 0]} castShadow>
          <capsuleGeometry args={[0.1, 0.5, 4, 8]} />
          <meshStandardMaterial color="#555555" />
        </mesh>
        <mesh position={[0.12, 0.1, 0]} castShadow>
          <capsuleGeometry args={[0.1, 0.5, 4, 8]} />
          <meshStandardMaterial color="#555555" />
        </mesh>
      </group>
      
      {patient.status === 'waiting' && (
        <mesh position={[0, 2.2, 0]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial 
            color={requiredEq?.color || '#ffffff'} 
            emissive={requiredEq?.color || '#ffffff'} 
            emissiveIntensity={0.8} 
          />
        </mesh>
      )}
      
      <Text
        position={[0, 2.5, 0]}
        fontSize={0.25}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        billboard
      >
        {patient.name}
      </Text>
      
      {patient.insuranceRisk && patient.status === 'waiting' && (
        <Text
          position={[0, -0.2, 0]}
          fontSize={0.2}
          color="#ff6b6b"
          anchorX="center"
          anchorY="middle"
          rotation={[-Math.PI / 2, 0, 0]}
        >
          ⚠医保高风险
        </Text>
      )}
    </group>
  )
}

function ReplaySceneContent() {
  const replayData = useGameStore(state => state.replayData)
  const replayTime = useGameStore(state => state.replayTime)
  const getReplayStateAtTime = useGameStore(state => state.getReplayStateAtTime)
  
  const currentState = useMemo(() => {
    if (!replayData) return { patients: [], equipment: [] }
    return getReplayStateAtTime(replayTime)
  }, [replayTime, replayData, getReplayStateAtTime])
  
  const patients = currentState?.patients || []
  const equipment = currentState?.equipment || []
  
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 15, 10]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-5, 5, -5]} intensity={0.5} color="#87CEEB" />
      <pointLight position={[5, 5, 5]} intensity={0.5} color="#FFE4B5" />
      
      <Floor />
      <Walls />
      
      <Text
        position={[0, 0.52, -9.5]}
        fontSize={0.8}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        康复中心 · 复盘回放
      </Text>
      
      {equipment.map(eq => (
        <ReplayEquipment key={eq.id} equipment={eq} currentTime={replayTime} />
      ))}
      
      {patients.map(patient => (
        <ReplayPatient key={patient.id} patient={patient} currentTime={replayTime} />
      ))}
    </>
  )
}

export default function ReplayScene() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 12, 8], fov: 50 }}
      gl={{ antialias: true }}
    >
      <Physics gravity={[0, -9.81, 0]}>
        <ReplaySceneContent />
      </Physics>
      <OrbitControls
        enablePan={false}
        minDistance={5}
        maxDistance={25}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={Math.PI / 6}
      />
      <color attach="background" args={['#1a1a2e']} />
      <fog attach="fog" args={['#1a1a2e', 15, 30]} />
    </Canvas>
  )
}
