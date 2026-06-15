import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Text } from '@react-three/drei';
import type { Student } from '../../types';
import * as THREE from 'three';

interface StudentDeskProps {
  student: Student;
  isSelected: boolean;
  onClick: () => void;
  position: [number, number, number];
}

export default function StudentDesk({ student, isSelected, onClick, position }: StudentDeskProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (groupRef.current && isSelected) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });

  const deskColor = isSelected ? '#F9A825' : hovered ? '#8D6E63' : '#5D4037';
  const chairColor = '#4E342E';

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[0.8, 0.05, 0.5]} />
        <meshStandardMaterial color={deskColor} />
      </mesh>

      <mesh position={[-0.35, 0.15, 0.15]} castShadow>
        <boxGeometry args={[0.05, 0.5, 0.05]} />
        <meshStandardMaterial color={deskColor} />
      </mesh>
      <mesh position={[0.35, 0.15, 0.15]} castShadow>
        <boxGeometry args={[0.05, 0.5, 0.05]} />
        <meshStandardMaterial color={deskColor} />
      </mesh>
      <mesh position={[-0.35, 0.15, -0.15]} castShadow>
        <boxGeometry args={[0.05, 0.5, 0.05]} />
        <meshStandardMaterial color={deskColor} />
      </mesh>
      <mesh position={[0.35, 0.15, -0.15]} castShadow>
        <boxGeometry args={[0.05, 0.5, 0.05]} />
        <meshStandardMaterial color={deskColor} />
      </mesh>

      <group position={[0, -0.1, -0.5]} rotation={[-0.2, 0, 0]}>
        <mesh position={[0, 0.3, 0]} castShadow>
          <boxGeometry args={[0.5, 0.03, 0.4]} />
          <meshStandardMaterial color={chairColor} />
        </mesh>
        <mesh position={[-0.2, 0.08, 0.1]} castShadow>
          <boxGeometry args={[0.03, 0.4, 0.03]} />
          <meshStandardMaterial color={chairColor} />
        </mesh>
        <mesh position={[0.2, 0.08, 0.1]} castShadow>
          <boxGeometry args={[0.03, 0.4, 0.03]} />
          <meshStandardMaterial color={chairColor} />
        </mesh>
        <mesh position={[-0.2, 0.08, -0.1]} castShadow>
          <boxGeometry args={[0.03, 0.4, 0.03]} />
          <meshStandardMaterial color={chairColor} />
        </mesh>
        <mesh position={[0.2, 0.08, -0.1]} castShadow>
          <boxGeometry args={[0.03, 0.4, 0.03]} />
          <meshStandardMaterial color={chairColor} />
        </mesh>
      </group>

      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        <Text
          position={[0, 0.65, 0]}
          fontSize={0.25}
          color={isSelected ? '#F9A825' : '#FAFAFA'}
          anchorX="center"
          anchorY="middle"
        >
          {student.avatar}
        </Text>
      </Float>

      {isSelected && (
        <mesh position={[0, 0.43, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.3, 0.35, 32]} />
          <meshBasicMaterial color="#F9A825" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
      )}

      {student.hasApplied && (
        <mesh position={[0.3, 0.55, 0.2]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color="#4CAF50" emissive="#4CAF50" emissiveIntensity={0.5} />
        </mesh>
      )}
    </group>
  );
}
