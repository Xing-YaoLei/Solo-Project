import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Float } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';

export default function TimeSlotCard({ slot, position, assignedCases, isSelected, onClick }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  const capacityRatio = assignedCases.length / slot.maxCapacity;
  
  const cardColor = useMemo(() => {
    if (capacityRatio >= 1) return '#ef4444';
    if (capacityRatio >= 0.7) return '#f59e0b';
    return '#22c55e';
  }, [capacityRatio]);

  const glowIntensity = useMemo(() => {
    if (isSelected && capacityRatio < 1) return 1.5;
    return hovered ? 1.2 : 1;
  }, [isSelected, hovered, capacityRatio]);

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      const floatY = Math.sin(time * 1.5 + position[0]) * 0.05;
      meshRef.current.position.y = position[1] + floatY;
    }
  });

  return (
    <group position={position} onClick={onClick}>
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
      >
        <boxGeometry args={[2.8, 1.8, 0.3]} />
        <meshStandardMaterial
          color={isSelected && capacityRatio < 1 ? '#3b82f6' : '#1e293b'}
          emissive={isSelected && capacityRatio < 1 ? '#3b82f6' : cardColor}
          emissiveIntensity={glowIntensity * 0.2}
          metalness={0.3}
          roughness={0.5}
        />
      </mesh>

      <mesh position={[0, 0, 0.16]}>
        <boxGeometry args={[2.6, 1.6, 0.02]} />
        <meshStandardMaterial
          color="#0f172a"
          transparent
          opacity={0.8}
        />
      </mesh>

      <Text
        position={[0, 0.5, 0.18]}
        fontSize={0.4}
        color="#f1f5f9"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {slot.time}
      </Text>

      <Text
        position={[0, 0, 0.18]}
        fontSize={0.25}
        color="#94a3b8"
        anchorX="center"
        anchorY="middle"
      >
        {slot.duration}小时
      </Text>

      <group position={[0, -0.6, 0.18]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2, 0.15, 0.05]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        <mesh position={[-(2 - 2 * capacityRatio) / 2, 0, 0.03]}>
          <boxGeometry args={[2 * capacityRatio, 0.15, 0.06]} />
          <meshStandardMaterial color={cardColor} emissive={cardColor} emissiveIntensity={0.5} />
        </mesh>
      </group>

      <Text
        position={[0, -0.6, 0.22]}
        fontSize={0.2}
        color="#f1f5f9"
        anchorX="center"
        anchorY="middle"
      >
        {assignedCases.length}/{slot.maxCapacity}
      </Text>

      {assignedCases.length > 0 && (
        <group position={[0, -1.2, 0]}>
          {assignedCases.slice(0, 2).map((c, i) => (
            <mesh key={c.id} position={[(i - 0.5) * 0.6, 0, 0]}>
              <boxGeometry args={[0.5, 0.3, 0.1]} />
              <meshStandardMaterial 
                color={c.priority === 1 ? '#ef4444' : c.priority === 2 ? '#f59e0b' : '#22c55e'}
                emissive={c.priority === 1 ? '#ef4444' : c.priority === 2 ? '#f59e0b' : '#22c55e'}
                emissiveIntensity={0.3}
              />
            </mesh>
          ))}
          {assignedCases.length > 2 && (
            <Text
              position={[0.9, 0, 0.06]}
              fontSize={0.2}
              color="#94a3b8"
              anchorX="center"
              anchorY="middle"
            >
              +{assignedCases.length - 2}
            </Text>
          )}
        </group>
      )}
    </group>
  );
}
