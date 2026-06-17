import React, { useRef, useEffect, useState } from 'react'
import { RigidBody, CapsuleCollider } from '@react-three/rapier'
import { Text, Float } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { PATIENT_TYPES, EQUIPMENT_TYPES, useGameStore } from '../store/useGameStore'

export default function Patient({ patient }) {
  const groupRef = useRef()
  const [targetPos, setTargetPos] = useState(patient.position)
  
  const assignPatientToEquipment = useGameStore(state => state.assignPatientToEquipment)
  const equipment = useGameStore(state => state.equipment)
  
  const patientType = Object.values(PATIENT_TYPES).find(t => t.id === patient.type)
  const requiredEq = Object.values(EQUIPMENT_TYPES).find(t => t.id === patient.requiredEquipment)
  
  useFrame((state, delta) => {
    if (!groupRef.current) return
    
    let target = [...patient.position]
    
    if (patient.status === 'treatment') {
      const eq = equipment.find(e => e.occupiedBy === patient.id)
      if (eq) {
        target = [eq.position[0], 0, eq.position[2] + 1]
      }
    } else if (patient.status === 'completed') {
      target = [patient.position[0], 0, 8]
    }
    
    const current = groupRef.current.position
    const speed = 2
    groupRef.current.position.x += (target[0] - current.x) * speed * delta
    groupRef.current.position.z += (target[2] - current.z) * speed * delta
    
    if (target[2] !== current.z || target[0] !== current.x) {
      groupRef.current.rotation.y = Math.atan2(target[0] - current.x, target[2] - current.z)
    }
  })
  
  const statusColor = {
    waiting: '#ffd93d',
    treatment: '#6bcb77',
    completed: '#4d96ff',
  }[patient.status] || '#ffffff'
  
  const headColor = patientType?.color || '#ffccaa'
  
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
          <meshStandardMaterial color={statusColor} />
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
        <Float speed={3} rotationIntensity={0} floatIntensity={0.5}>
          <mesh position={[0, 2.2, 0]}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial 
              color={requiredEq?.color || '#ffffff'} 
              emissive={requiredEq?.color || '#ffffff'} 
              emissiveIntensity={0.8} 
            />
          </mesh>
        </Float>
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
