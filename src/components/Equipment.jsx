import React, { useRef } from 'react'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { Text, Float } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { EQUIPMENT_TYPES } from '../store/useGameStore'

export default function Equipment({ equipment }) {
  const meshRef = useRef()
  const type = EQUIPMENT_TYPES[equipment.type.toUpperCase().replace(/-/g, '_')] || 
               Object.values(EQUIPMENT_TYPES).find(t => t.id === equipment.type)
  
  useFrame(() => {
    if (meshRef.current && equipment.isOccupied) {
    }
  })
  
  const baseColor = equipment.isOccupied ? '#666666' : (type?.color || '#888888')
  const glowIntensity = equipment.isOccupied ? 0.2 : 0.8
  
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
    <group position={equipment.position}>
      <RigidBody type="fixed" position={[0, 0, 0]}>
        <CuboidCollider args={[1, 1, 1]} />
      </RigidBody>
      <Float speed={equipment.isOccupied ? 0 : 1.5} rotationIntensity={0} floatIntensity={equipment.isOccupied ? 0 : 0.3}>
        {renderEquipmentModel()}
      </Float>
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
