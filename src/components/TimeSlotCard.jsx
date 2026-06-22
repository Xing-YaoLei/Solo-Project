import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Float } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';

export default function TimeSlotCard({ slot, position, assignedCases, isSelected, onClick }) {
  const meshRef = useRef();
  const borderRef = useRef();
  const [hovered, setHovered] = useState(false);

  const capacityRatio = assignedCases.length / slot.maxCapacity;
  const isFull = capacityRatio >= 1;
  const isWarning = capacityRatio >= 0.7 && !isFull;
  
  const cardColor = useMemo(() => {
    if (isFull) return '#ef4444';
    if (isWarning) return '#f59e0b';
    return '#22c55e';
  }, [isFull, isWarning]);

  const glowIntensity = useMemo(() => {
    if (isSelected && !isFull) return 1.5;
    if (isFull) return 2;
    return hovered ? 1.2 : 1;
  }, [isSelected, hovered, isFull]);

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      const floatY = Math.sin(time * 1.5 + position[0]) * 0.05;
      meshRef.current.position.y = position[1] + floatY;
    }
    if (borderRef.current && isFull) {
      const time = state.clock.getElapsedTime();
      const pulse = 0.8 + Math.sin(time * 6) * 0.4;
      borderRef.current.material.emissiveIntensity = pulse;
      borderRef.current.scale.setScalar(1 + Math.sin(time * 6) * 0.02);
    }
  });

  return (
    <group position={position} onClick={onClick}>
      {isFull && (
        <mesh ref={borderRef} position={[0, 0, -0.05]}>
          <boxGeometry args={[2.9, 1.9, 0.1]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#ef4444"
            emissiveIntensity={1}
            transparent
            opacity={0.6}
          />
        </mesh>
      )}
      
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
      >
        <boxGeometry args={[2.8, 1.8, 0.3]} />
        <meshStandardMaterial
          color={isSelected && !isFull ? '#3b82f6' : isFull ? '#7f1d1d' : '#1e293b'}
          emissive={isSelected && !isFull ? '#3b82f6' : cardColor}
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
        color={isFull ? '#fecaca' : '#f1f5f9'}
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {slot.time}
      </Text>

      <Text
        position={[0, 0, 0.18]}
        fontSize={0.25}
        color={isFull ? '#fca5a5' : '#94a3b8'}
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
          <meshStandardMaterial color={cardColor} emissive={cardColor} emissiveIntensity={isFull ? 1 : 0.5} />
        </mesh>
      </group>

      <Text
        position={[0, -0.6, 0.22]}
        fontSize={0.2}
        color={isFull ? '#fecaca' : '#f1f5f9'}
        anchorX="center"
        anchorY="middle"
        fontWeight={isFull ? 'bold' : 'normal'}
      >
        {assignedCases.length}/{slot.maxCapacity}
      </Text>

      {isFull && (
        <Text
          position={[0, 1.1, 0.2]}
          fontSize={0.25}
          color="#ef4444"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          ⚠️ 已满
        </Text>
      )}

      {isWarning && !isFull && (
        <Text
          position={[0, 1.1, 0.2]}
          fontSize={0.22}
          color="#f59e0b"
          anchorX="center"
          anchorY="middle"
        >
          接近满载
        </Text>
      )}

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
