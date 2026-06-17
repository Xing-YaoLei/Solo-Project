import React, { useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Environment } from '@react-three/drei'
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier'
import { useGameStore } from '../store/useGameStore'
import Equipment from './Equipment'
import Patient from './Patient'

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

function GameTick() {
  const tick = useGameStore(state => state.tick)
  
  useFrame((_, delta) => {
    tick(delta)
  })
  
  return null
}

function SceneContent() {
  const equipment = useGameStore(state => state.equipment)
  const patients = useGameStore(state => state.patients)
  const phase = useGameStore(state => state.phase)
  
  const isGameActive = phase === 'gameplay' || phase === 'replay'
  
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
        康复中心
      </Text>
      
      {equipment.map(eq => (
        <Equipment key={eq.id} equipment={eq} />
      ))}
      
      {patients.map(patient => (
        <Patient key={patient.id} patient={patient} />
      ))}
      
      {isGameActive && <GameTick />}
    </>
  )
}

export default function GameScene() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 12, 8], fov: 50 }}
      gl={{ antialias: true }}
    >
      <Physics gravity={[0, -9.81, 0]}>
        <SceneContent />
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
