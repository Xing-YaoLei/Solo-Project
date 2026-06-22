import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Float, Environment } from '@react-three/drei';
import { Physics, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import TimeSlotCard from './TimeSlotCard';
import CaseCard from './CaseCard';
import { useGameStore } from '../store/gameStore';

function SceneContent() {
  const { currentLevel, assignments, selectedCase, selectCase, assignCase, isPlaying } = useGameStore();
  
  const slotPositions = useMemo(() => {
    if (!currentLevel) return [];
    const slots = currentLevel.timeSlots;
    const totalWidth = slots.length * 3.5 - 0.5;
    const startX = -totalWidth / 2 + 1.5;
    
    return slots.map((slot, index) => ({
      ...slot,
      position: [startX + index * 3.5, 2, 0],
    }));
  }, [currentLevel]);

  const casePositions = useMemo(() => {
    if (!currentLevel) return [];
    const cases = currentLevel.cases;
    const totalWidth = cases.length * 2.5 - 0.5;
    const startX = -totalWidth / 2 + 1;
    
    return cases.map((c, index) => ({
      ...c,
      position: [startX + index * 2.5, -2.5, 0],
    }));
  }, [currentLevel]);

  if (!currentLevel) return null;

  const getSlotCases = (slotId) => {
    return Object.entries(assignments)
      .filter(([_, sId]) => sId === slotId)
      .map(([caseId]) => currentLevel.cases.find(c => c.id === caseId))
      .filter(Boolean);
  };

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <pointLight position={[-5, 5, -5]} intensity={0.5} color="#3b82f6" />
      
      <OrbitControls 
        enablePan={false} 
        minDistance={8} 
        maxDistance={15}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2}
      />

      <Physics gravity={[0, -9.81, 0]}>
        <RigidBody type="fixed" position={[0, -5, 0]}>
          <mesh receiveShadow>
            <boxGeometry args={[30, 1, 10]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        </RigidBody>

        {slotPositions.map((slot) => (
          <TimeSlotCard
            key={slot.id}
            slot={slot}
            position={slot.position}
            assignedCases={getSlotCases(slot.id)}
            isSelected={selectedCase !== null}
            onClick={() => {
              if (selectedCase) {
                assignCase(selectedCase, slot.id);
              }
            }}
          />
        ))}

        {casePositions.map((c) => (
          <CaseCard
            key={c.id}
            caseItem={c}
            position={c.position}
            isSelected={selectedCase === c.id}
            isAssigned={!!assignments[c.id]}
            onClick={() => {
              if (assignments[c.id]) {
                useGameStore.getState().unassignCase(c.id);
              } else {
                selectCase(c.id === selectedCase ? null : c.id);
              }
            }}
          />
        ))}
      </Physics>

      <Text
        position={[0, 4.5, 0]}
        fontSize={0.8}
        color="#f1f5f9"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {currentLevel.name}
      </Text>
    </>
  );
}

export default function GameScene() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 0, 10], fov: 60 }}
      style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}
    >
      <fog attach="fog" args={['#0f172a', 15, 25]} />
      <SceneContent />
    </Canvas>
  );
}
