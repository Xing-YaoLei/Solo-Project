import { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { PatrolPoint } from '@/types';
import { usePatrol } from '@/hooks/usePatrol';

interface PatrolPointMarkerProps {
  point: PatrolPoint;
  isCurrent: boolean;
  isNext: boolean;
}

export const PatrolPointMarker = ({ point, isCurrent, isNext }: PatrolPointMarkerProps) => {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  
  const { checkAndVisitCurrentPoint, isNearTarget } = usePatrol();

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    
    const time = clock.getElapsedTime();
    const floatY = Math.sin(time * 2 + point.order) * 0.2;
    groupRef.current.position.y = 1 + floatY;
    groupRef.current.rotation.y += 0.01;
    
    if (ringRef.current && isCurrent) {
      const scale = 1 + Math.sin(time * 4) * 0.1;
      ringRef.current.scale.set(scale, 1, scale);
    }
  });

  const getColor = () => {
    if (point.isVisited) return '#10b981';
    if (isCurrent) return '#f59e0b';
    if (isNext) return '#3b82f6';
    return '#64748b';
  };

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (isCurrent && isNearTarget) {
      checkAndVisitCurrentPoint();
    }
  };

  return (
    <group 
      ref={groupRef} 
      position={[point.position[0], 1, point.position[2]]}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 1, 16]} />
        <meshBasicMaterial 
          color={getColor()} 
          transparent 
          opacity={isCurrent ? 0.8 : 0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1, 8]} />
        <meshBasicMaterial color={getColor()} />
      </mesh>
      
      <mesh position={[0, 1, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial 
          color={getColor()} 
          emissive={getColor()}
          emissiveIntensity={isCurrent ? 0.8 : 0.3}
        />
      </mesh>
      
      {point.isVisited && (
        <mesh position={[0, 1, 0]}>
          <sphereGeometry args={[0.35, 16, 16]} />
          <meshBasicMaterial color="#10b981" transparent opacity={0.3} />
        </mesh>
      )}
      
      {isCurrent && isNearTarget && (
        <mesh position={[0, 1.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.4, 0.5, 8]} />
          <meshBasicMaterial color="#10b981" transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  );
};
