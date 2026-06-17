import { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import type { ParkingSpot as ParkingSpotType } from '@/types';

interface ParkingSpotProps {
  spot: ParkingSpotType;
  onClick?: () => void;
}

export const ParkingSpot = ({ spot, onClick }: ParkingSpotProps) => {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  const borderRef = useRef<THREE.Mesh>(null);
  
  const getBillForSpot = useGameStore(state => state.bills.find(b => b.spotId === spot.id && !b.isPaid));
  const phase = useGameStore(state => state.phase);

  const getStatusColor = () => {
    if (spot.status === 'occupied') return '#ef4444';
    if (spot.status === 'reserved') return '#f59e0b';
    if (hovered && phase === 'access_control') return '#10b981';
    return '#1e3a5f';
  };

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const emissive = meshRef.current.material as THREE.MeshStandardMaterial;
      const pulse = Math.sin(clock.getElapsedTime() * 2) * 0.1 + 0.2;
      emissive.emissiveIntensity = hovered ? pulse : 0.1;
    }
    
    if (borderRef.current && hovered) {
      const scale = 1 + Math.sin(clock.getElapsedTime() * 4) * 0.05;
      borderRef.current.scale.set(scale, 1, scale);
    }
  });

  return (
    <group position={spot.position}>
      <RigidBody type="fixed" colliders={false}>
        <mesh
          ref={meshRef}
          position={[0, 0.01, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
        >
          <planeGeometry args={[2.5, 5]} />
          <meshStandardMaterial
            color={getStatusColor()}
            transparent
            opacity={0.8}
            emissive={getStatusColor()}
            emissiveIntensity={0.1}
          />
        </mesh>
        
        <mesh
          ref={borderRef}
          position={[0, 0.02, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[1.2, 1.3, 4]} />
          <meshBasicMaterial
            color={hovered ? '#10b981' : '#fbbf24'}
            transparent
            opacity={hovered ? 1 : 0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
        
        <CuboidCollider args={[1.25, 0.1, 2.5]} sensor />
      </RigidBody>
      
      <mesh position={[0, 0.05, 0]}>
        <planeGeometry args={[2, 0.3]} />
        <meshBasicMaterial color="#000" transparent opacity={0.7} />
      </mesh>
      
      <group position={[0, 0.15, 0]}>
        {spot.status === 'occupied' && spot.vehiclePlate && (
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[2, 1.5, 4.5]} />
            <meshStandardMaterial color="#3b82f6" metalness={0.3} roughness={0.4} />
          </mesh>
        )}
      </group>
    </group>
  );
};
