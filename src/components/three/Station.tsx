import { useState, useRef } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import type { Station as StationType } from '@/types';

interface StationProps {
  station: StationType;
  status?: 'idle' | 'working' | 'occupied';
  selected?: boolean;
  onSelect?: (station: StationType) => void;
}

const STATUS_COLORS = {
  idle: '#22c55e',
  working: '#f97316',
  occupied: '#ef4444',
};

const PLATFORM_WIDTH = 3.5;
const PLATFORM_DEPTH = 5;
const PLATFORM_HEIGHT = 0.15;

export default function Station({
  station,
  status = 'idle',
  selected = false,
  onSelect,
}: StationProps) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);

  const borderColor = STATUS_COLORS[status];
  const { positionX, positionZ, name } = station;

  return (
    <group
      ref={groupRef}
      position={[positionX, 0, positionZ]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(station);
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
      <mesh position={[0, PLATFORM_HEIGHT / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[PLATFORM_WIDTH, PLATFORM_HEIGHT, PLATFORM_DEPTH]} />
        <meshStandardMaterial
          color="#334155"
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>

      <mesh position={[0, PLATFORM_HEIGHT + 0.001, 0]}>
        <boxGeometry args={[PLATFORM_WIDTH - 0.1, 0.002, PLATFORM_DEPTH - 0.1]} />
        <meshStandardMaterial
          color="#475569"
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>

      <group position={[0, PLATFORM_HEIGHT + 0.01, 0]}>
        <mesh position={[0, 0, -PLATFORM_DEPTH / 2]}>
          <boxGeometry args={[PLATFORM_WIDTH, 0.05, 0.05]} />
          <meshStandardMaterial
            color={borderColor}
            emissive={borderColor}
            emissiveIntensity={hovered || selected ? 1.5 : 0.6}
          />
        </mesh>
        <mesh position={[0, 0, PLATFORM_DEPTH / 2]}>
          <boxGeometry args={[PLATFORM_WIDTH, 0.05, 0.05]} />
          <meshStandardMaterial
            color={borderColor}
            emissive={borderColor}
            emissiveIntensity={hovered || selected ? 1.5 : 0.6}
          />
        </mesh>
        <mesh position={[-PLATFORM_WIDTH / 2, 0, 0]}>
          <boxGeometry args={[0.05, 0.05, PLATFORM_DEPTH]} />
          <meshStandardMaterial
            color={borderColor}
            emissive={borderColor}
            emissiveIntensity={hovered || selected ? 1.5 : 0.6}
          />
        </mesh>
        <mesh position={[PLATFORM_WIDTH / 2, 0, 0]}>
          <boxGeometry args={[0.05, 0.05, PLATFORM_DEPTH]} />
          <meshStandardMaterial
            color={borderColor}
            emissive={borderColor}
            emissiveIntensity={hovered || selected ? 1.5 : 0.6}
          />
        </mesh>
      </group>

      {(hovered || selected) && (
        <mesh position={[0, PLATFORM_HEIGHT + 0.02, 0]}>
          <boxGeometry args={[PLATFORM_WIDTH + 0.3, 0.01, PLATFORM_DEPTH + 0.3]} />
          <meshBasicMaterial
            color={borderColor}
            transparent
            opacity={0.15}
          />
        </mesh>
      )}

      <group position={[0, PLATFORM_HEIGHT + 1.8, 0]}>
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[2.2, 0.5, 0.08]} />
          <meshStandardMaterial
            color={selected ? '#1e3a8a' : '#1e293b'}
            metalness={0.5}
            roughness={0.5}
          />
        </mesh>

        <mesh position={[0, 0, 0.045]}>
          <boxGeometry args={[2.1, 0.4, 0.01]} />
          <meshStandardMaterial
            color={hovered || selected ? '#1e40af' : '#0f172a'}
            emissive={hovered || selected ? '#3b82f6' : '#000000'}
            emissiveIntensity={hovered || selected ? 0.3 : 0}
          />
        </mesh>

        <Text
          position={[0, 0.08, 0.06]}
          fontSize={0.16}
          color="#f1f5f9"
          anchorX="center"
          anchorY="middle"
          maxWidth={2}
        >
          {name}
        </Text>

        <Text
          position={[0, -0.12, 0.06]}
          fontSize={0.11}
          color={borderColor}
          anchorX="center"
          anchorY="middle"
        >
          {status === 'idle' ? '空闲' : status === 'working' ? '工作中' : '占用'}
        </Text>

        <mesh position={[-1.15, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 1.8, 8]} />
          <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[1.15, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 1.8, 8]} />
          <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.8, 1.85, 64]} />
        <meshBasicMaterial
          color={borderColor}
          transparent
          opacity={selected ? 0.8 : hovered ? 0.4 : 0}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
