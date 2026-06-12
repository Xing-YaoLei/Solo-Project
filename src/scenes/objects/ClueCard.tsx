import { useRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { Text } from '@react-three/drei';

interface ClueCardProps {
  position: [number, number, number];
  title: string;
  content: string;
  type: 'transaction' | 'refund' | 'benefit' | 'profile';
  isViewed: boolean;
  isSelected: boolean;
  onClick: () => void;
  importance: number;
}

const typeColors: Record<string, string> = {
  transaction: '#FFF8E1',
  refund: '#FFEBEE',
  benefit: '#E8F5E9',
  profile: '#E3F2FD',
};

const typeAccents: Record<string, string> = {
  transaction: '#FF8F00',
  refund: '#D32F2F',
  benefit: '#388E3C',
  profile: '#1976D2',
};

export function ClueCard({
  position,
  title,
  content,
  type,
  isViewed,
  isSelected,
  onClick,
  importance,
}: ClueCardProps) {
  const cardRef = useRef<RapierRigidBody>(null);
  const [hovered, setHovered] = useState(false);
  const [floatOffset, setFloatOffset] = useState(0);

  useFrame(({ clock }) => {
    setFloatOffset(Math.sin(clock.elapsedTime * 2) * 0.05);
    
    if (hovered && cardRef.current) {
      const impulse = { x: 0, y: 0.1, z: 0 };
      cardRef.current.applyImpulse(impulse, true);
    }
  });

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(false);
    document.body.style.cursor = 'auto';
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick();
  };

  const bgColor = isViewed ? '#E0E0E0' : typeColors[type];
  const accentColor = typeAccents[type];
  const scale = isSelected ? 1.1 : hovered ? 1.05 : 1;

  return (
    <RigidBody
      ref={cardRef}
      type="kinematicPosition"
      position={[position[0], position[1] + floatOffset, position[2]]}
      colliders={false}
    >
      <CuboidCollider args={[0.8, 1.1, 0.05]} />
      
      <group
        scale={[scale, scale, scale]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[1.6, 2.2, 0.1]} />
          <meshStandardMaterial
            color={bgColor}
            roughness={0.5}
            metalness={0.1}
            transparent
            opacity={0.95}
          />
        </mesh>

        <mesh position={[0, 1.05, 0.06]}>
          <boxGeometry args={[1.6, 0.15, 0.02]} />
          <meshStandardMaterial color={accentColor} roughness={0.3} />
        </mesh>

        <Text
          position={[0, 0.85, 0.07]}
          fontSize={0.12}
          color="#3E2723"
          maxWidth={1.4}
          textAlign="center"
          font="/fonts/NotoSansSC-Regular.ttf"
        >
          {title}
        </Text>

        <Text
          position={[0, 0.4, 0.07]}
          fontSize={0.08}
          color="#5D4037"
          maxWidth={1.4}
          textAlign="left"
          font="/fonts/NotoSansSC-Regular.ttf"
        >
          {content.length > 60 ? content.substring(0, 60) + '...' : content}
        </Text>

        {importance >= 4 && (
          <mesh position={[0.6, 0.85, 0.07]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color="#FF5722" emissive="#FF5722" emissiveIntensity={0.5} />
          </mesh>
        )}

        {isViewed && (
          <Text
            position={[0, -0.8, 0.07]}
            fontSize={0.08}
            color="#757575"
            font="/fonts/NotoSansSC-Regular.ttf"
          >
            ✓ 已查看
          </Text>
        )}

        {isSelected && (
          <mesh position={[0, 0, 0.06]}>
            <boxGeometry args={[1.7, 2.3, 0.01]} />
            <meshBasicMaterial color={accentColor} transparent opacity={0.3} />
          </mesh>
        )}
      </group>
    </RigidBody>
  );
}
